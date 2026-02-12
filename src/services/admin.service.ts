import { supabase } from '@/lib/supabase';

export interface AdminStats {
    total_users: number;
    pending_requests: number;
    total_credits: number;
    active_users_24h: number;
}

export interface AdminUserView {
    user_id: string | null;
    email: string;
    whitelist_status: 'pending' | 'approved' | 'rejected';
    applied_at: string;
    last_sign_in_at: string | null;
    credits: number;
    avatar_url: string | null;
}

export interface AdminGeneration {
    id: string;
    user_id: string;
    prompt: string;
    status: string;
    created_at: string;
    user_email?: string;
}

export const AdminService = {
    async getStats(): Promise<AdminStats | null> {
        const { data, error } = await supabase.rpc('get_admin_stats');
        if (error) {
            console.error('Error fetching admin stats:', error);
            return null;
        }
        return data as AdminStats;
    },

    async getUsers(): Promise<AdminUserView[]> {
        const { data, error } = await supabase
            .from('admin_users_view')
            .select('*')
            .order('applied_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }
        return data as AdminUserView[];
    },

    async updateCredits(email: string, amount: number) {
        // DIRECT UPDATE STRATEGY (Bypassing RPC)
        
        // 1. Get current user ID and credits (Fetch by ID is safest for updates)
        const { data: user, error: fetchError } = await supabase
            .from('profiles')
            .select('id, credits')
            .eq('email', email)
            .single();
            
        if (fetchError) throw new Error(`User not found: ${fetchError.message}`);
        if (!user) throw new Error('User data is null');
        
        const currentCredits = user.credits || 0;
        const newBalance = Math.floor(currentCredits + amount); // Force Integer
        
        // 2. Update using Primary Key (ID) - The source of truth
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits: newBalance })
            .eq('id', user.id); // <--- Crucial Change: Update by ID
            
        if (updateError) throw updateError;
    },

    async toggleBan(email: string, ban: boolean) {
        const { error } = await supabase.rpc('admin_toggle_ban', {
            target_email: email,
            ban: ban
        });
        if (error) throw error;
    },

    async deleteUser(email: string) {
        const { error } = await supabase.rpc('admin_delete_user', {
            target_email: email
        });
        if (error) throw error;
    },

    async getAllGenerations(limit: number = 200): Promise<AdminGeneration[]> {
        // Step 1: Fetch generations (no FK join to avoid PGRST200)
        const { data: gens, error } = await supabase
            .from('generations')
            .select('id, user_id, prompt, status, created_at')
            .not('prompt', 'is', null)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching generations:', error);
            return [];
        }

        if (!gens || gens.length === 0) return [];

        // Step 2: Batch-fetch emails from profiles for all unique user_ids
        const uniqueUserIds = [...new Set(gens.map(g => g.user_id).filter(Boolean))];
        const emailMap: Record<string, string> = {};

        if (uniqueUserIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email')
                .in('id', uniqueUserIds);

            (profiles || []).forEach((p: { id: string; email: string }) => {
                emailMap[p.id] = p.email;
            });
        }

        // Step 3: Merge
        return gens.map((g) => ({
            id: g.id as string,
            user_id: g.user_id as string,
            prompt: g.prompt as string,
            status: g.status as string,
            created_at: g.created_at as string,
            user_email: emailMap[g.user_id] || 'Unknown'
        }));
    },

    async sendWelcomeEmail(email: string) {
        const { data, error } = await supabase.functions.invoke('send-welcome-email', {
            body: { email },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data;
    },

    async approveAndNotify(email: string) {
        // Step 1: Approve in DB
        await AdminService.toggleBan(email, false);
        // Step 2: Send welcome email (best-effort, don't block approval)
        try {
            await AdminService.sendWelcomeEmail(email);
        } catch (emailErr) {
            console.warn('Welcome email failed (user still approved):', emailErr);
            throw new Error('Approved but email failed. Use Re-send Invite.');
        }
    },
};
