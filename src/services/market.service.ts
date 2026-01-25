import { supabase } from '@/lib/supabase';
import { NFTAsset, TransactionHistory } from '@/types';

export const MarketService = {
    // ACUÑAR (MINT) UN NUEVO ASSET
    // Esta es la función crítica del Studio.
    async mintAsset(asset: Omit<NFTAsset, 'id' | 'history'>) {
        // 1. Insertar el activo
        const { data, error } = await supabase
            .from('assets')
            .insert([asset])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // OBTENER ASSETS DE UN USUARIO (Para el Perfil/Galería)
    async getUserAssets(userId: string): Promise<NFTAsset[]> {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // OBTENER EL FEED DEL MARKETPLACE (Explore)
    async getMarketplaceFeed(): Promise<NFTAsset[]> {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .eq('is_for_sale', true)
            .order('created_at', { ascending: false })
            .limit(50); // Paginación simple inicial

        if (error) throw error;
        return data || [];
    },

    // REGISTRAR TRANSACCIÓN (Ledger Inmutable)
    async recordTransaction(tx: Omit<TransactionHistory, 'date'>) {
        const { error } = await supabase
            .from('transactions')
            .insert([{
                ...tx,
                date: new Date().toISOString()
            }]);

        if (error) throw error;
    }
};
