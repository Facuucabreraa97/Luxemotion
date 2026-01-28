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
        // Calling V2 function to bypass cache issues
        const { error } = await supabase.rpc('admin_update_credits_v2', {
            target_email: email,
            credit_amount: amount
        });
        if (error) throw error;
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
    }
};
