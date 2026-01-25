
import { supabase } from '../lib/supabase'; // Ruta relativa segura
import { Asset, Transaction } from '../types';

export const MarketService = {
    // ACUÑAR (MINT)
    async mintAsset(assetData: Partial<Asset>, userId: string) {
        const { data, error } = await supabase
            .from('talents')
            .insert([{
                ...assetData,
                creator_id: userId,
                owner_id: userId,
                for_sale: false,
                supply_sold: 0
            }])
            .select()
            .single();

        if (error) throw error;

        // Registrar Gasto en Ledger
        await this.recordTransaction({
            user_id: userId,
            type: 'MINT',
            amount: -50, // Costo fijo por ahora
            asset_id: data.id,
            metadata: { action: 'Asset Creation' }
        });

        return data;
    },

    // LISTAR
    async listAsset(assetId: string, price: number) {
        const { error } = await supabase
            .from('talents')
            .update({ for_sale: true, price: price })
            .eq('id', assetId);
        if (error) throw error;
    },

    // REGISTRAR TRANSACCIÓN
    async recordTransaction(tx: any) {
        const { error } = await supabase.from('transactions').insert([tx]);
        if (error) console.error("Error logging tx:", error);
    },

    // OBTENER MIS ACTIVOS
    async getMyAssets(userId: string) {
        const { data } = await supabase.from('talents').select('*').eq('owner_id', userId);
        return data || [];
    }
};
