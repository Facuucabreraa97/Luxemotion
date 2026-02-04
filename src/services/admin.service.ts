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
        // Get generations with user profile join for email
        const { data, error } = await supabase
            .from('generations')
            .select(`
                id,
                user_id,
                prompt,
                status,
                created_at,
                profiles!generations_user_id_fkey (
                    email
                )
            `)
            .not('prompt', 'is', null)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching generations:', error);
            return [];
        }

        // Map to flatten the profile email
        return (data || []).map((g: Record<string, unknown>) => ({
            id: g.id as string,
            user_id: g.user_id as string,
            prompt: g.prompt as string,
            status: g.status as string,
            created_at: g.created_at as string,
            user_email: (g.profiles as { email?: string } | null)?.email || 'Unknown'
        }));
    }
};
