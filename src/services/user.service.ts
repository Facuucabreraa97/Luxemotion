import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

export const UserService = {
    async checkWhitelist(email: string) {
        const { data, error } = await supabase
            .from('whitelist')
            .select('status')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !data) return 'pending'; // Default to pending if not found (or rejected/error)
        return data.status;
    },

    // Obtener perfil completo
    async getProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.warn('Error fetching profile:', error);
            return null;
        }
        return data as UserProfile;
    },

    // Actualizar perfil
    async updateProfile(userId: string, updates: Partial<UserProfile>) {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;
    },

    // Obtener Créditos (Vital para la monetización)
    async getCredits(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        return data?.credits || 0;
    }
};
