import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

export const UserService = {
  async checkWhitelist(email: string) {
    // [SECURE] Validate via Edge Function
    // DEBUG: Logging to see why login fails
    console.log('Checking whitelist for:', email);
    const { data, error } = await supabase.functions.invoke('check-whitelist', {
      body: { email },
    });

    if (error) {
      console.error('Whitelist Check Error:', error);
      return 'pending';
    }

    console.log('Whitelist Response:', data);
    if (!data) return 'pending';
    return data.status;
  },

  // Obtener perfil completo
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error) {
      console.warn('Error fetching profile:', error);
      return null;
    }
    return data as UserProfile;
  },

  // Actualizar perfil
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);

    if (error) throw error;
  },

  // Obtener Créditos (Vital para la monetización)
  async getCredits(userId: string): Promise<number> {
    const { data } = await supabase.from('profiles').select('credits').eq('id', userId).single();

    return data?.credits || 0;
  },

  // [SECURE] Gestionar Créditos (Agregar/Quitar) via Edge Function
  async manageCredits(amount: number, reason: string) {
    const { data, error } = await supabase.functions.invoke('manage-credits', {
      body: {
        targetUserId: (await supabase.auth.getUser()).data.user?.id,
        amount,
        type: reason,
      },
    });

    if (error) throw error;
    return data;
  },
};
