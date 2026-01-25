import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

export const UserService = {
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
