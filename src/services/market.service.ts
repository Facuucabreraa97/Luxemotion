
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
    },

    // OBTENER LISTADOS (MARKETPLACE)
    async getAllListings() {
        const { data } = await supabase
            .from('talents')
            .select('*')
            .eq('for_sale', true)
            .order('created_at', { ascending: false });
        return data || [];
    },

    // COMPRAR ACTIVO
    async buyAsset(assetId: string, buyerId: string) {
        // 1. Obtener Activo
        const { data: asset, error: assetError } = await supabase
            .from('talents')
            .select('*')
            .eq('id', assetId)
            .single();

        if (assetError) throw new Error("Asset not found");
        if (!asset.for_sale) throw new Error("Asset not for sale");
        if (asset.owner_id === buyerId) throw new Error("Cannot buy your own asset");

        const price = asset.price;
        const royaltyFee = price * 0.10; // 10% Royalty
        const platformFee = price * 0.05; // 5% Platform
        const sellerRevenue = price - royaltyFee - platformFee;

        // 2. Verificar Fondos Comprador (Simulado o Call RPC)
        // Por simplicidad, asumimos chequeo en UI o RPC, aquí registramos las transacciones

        // 3. Ejecutar Transferencias (Logica de DB idealmente en RPC 'execute_purchase')

        // Cobrar al Comprador
        await this.recordTransaction({
            user_id: buyerId,
            type: 'BUY',
            amount: -price,
            asset_id: asset.id,
            metadata: { to: asset.owner_id }
        });

        // Pagar al Vendedor
        await this.recordTransaction({
            user_id: asset.owner_id,
            type: 'DEPOSIT',
            amount: sellerRevenue,
            asset_id: asset.id,
            metadata: { from: buyerId, type: 'SALE' }
        });

        // Pagar Royalty al Creador
        if (asset.creator_id) {
            await this.recordTransaction({
                user_id: asset.creator_id,
                type: 'DEPOSIT',
                amount: royaltyFee,
                asset_id: asset.id,
                metadata: { from: buyerId, type: 'ROYALTY' }
            });
        }

        // 4. Transferir Propiedad
        const { error: updateError } = await supabase
            .from('talents')
            .update({
                owner_id: buyerId,
                for_sale: false,
                price: 0,
                supply_sold: (asset.supply_sold || 0) + 1
            })
            .eq('id', assetId);

        if (updateError) throw updateError;

        return { success: true };
    },

    // GUARDAR BORRADOR (DRAFT)
    async saveDraft(assetData: Partial<Asset>, userId: string) {
        const { data, error } = await supabase
            .from('talents')
            .insert([{
                ...assetData,
                creator_id: userId,
                owner_id: userId,
                for_sale: false,
                is_draft: true,
                supply_total: 1, // Locked Supply
                supply_sold: 0
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // FINALIZAR MINTEO (Convertir Draft a Asset Real)
    async finalizeMint(assetId: string, price: number, userId: string) {
        // 1. Cobrar Fee de Minteo
        await this.recordTransaction({
            user_id: userId,
            type: 'MINT',
            amount: -50,
            asset_id: assetId,
            metadata: { action: 'Asset Minting' }
        });

        // 2. Activar Asset
        const { data, error } = await supabase
            .from('talents')
            .update({
                is_draft: false,
                for_sale: true, // Auto-list implies meant for market, or false if just collection
                price: price
            })
            .eq('id', assetId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // HISTORIAL DE TRANSACCIONES
    async getTransactions(userId: string) {
        const { data } = await supabase
            .from('market_transactions')
            .select('*, talent:talents(name)')
            .or(`user_id.eq.${userId},metadata->to.eq.${userId}`)
            .order('created_at', { ascending: false });
        return data || [];
    }
};
