import { supabase } from '../lib/supabase'; // Ruta relativa segura
import { Asset } from '../types';
import { UserService } from './user.service';

export const MarketService = {
  // [SECURE] ACUÑAR (MINT) via Edge Function
  async mintAsset(assetData: Partial<Asset>, userId: string) {
    const { data, error } = await supabase.functions.invoke('mint-assets', {
      body: { assetData, userId },
    });

    if (error) throw error;
    return data.asset;
  },

  // LISTAR (Actualización de metadatos segura si RLS permite al dueño)
  async listAsset(assetId: string, price: number) {
    const { error } = await supabase
      .from('talents')
      .update({ for_sale: true, price: price })
      .eq('id', assetId);
    if (error) throw error;
  },

  // [SECURE] COMPRAR ACTIVO via Edge Function
  async buyAsset(assetId: string, buyerId: string) {
    const { error } = await supabase.functions.invoke('execute-purchase', {
      body: { assetId, buyerId },
    });

    if (error) throw error;
    return { success: true };
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

  // GUARDAR BORRADOR (DRAFT) - Sigue siendo cliente xq no gasta créditos
  async saveDraft(assetData: Partial<Asset>, userId: string) {
    const { data, error } = await supabase
      .from('talents')
      .insert([
        {
          ...assetData,
          creator_id: userId,
          owner_id: userId,
          for_sale: false,
          is_draft: true,
          supply_total: 1,
          supply_sold: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // FINALIZAR MINTEO (Convertir Draft a Asset Real)
  async finalizeMint(assetId: string, price: number) {
    // 1. Cobrar Fee de Minteo de forma segura (Backend)
    const fee = -50;
    await UserService.manageCredits(fee, 'MINT_FEE');

    // 2. Activar Asset
    const { data, error } = await supabase
      .from('talents')
      .update({
        is_draft: false,
        for_sale: true,
        price: price,
      })
      .eq('id', assetId)
      .select()
      .single();

    if (error) {
      // Rollback credits if update fails (Manual compensation)
      await UserService.manageCredits(-fee, 'MINT_REFUND');
      throw error;
    }
    return data;
  },

  // HISTORIAL DE TRANSACCIONES (Solo Lectura)
  async getTransactions(userId: string) {
    const { data } = await supabase
      .from('market_transactions') // Asegurar que esta vista/tabla exista
      .select('*, talent:talents(name)')
      .or(`user_id.eq.${userId},metadata->to.eq.${userId}`)
      .order('created_at', { ascending: false });
    return data || [];
  },
};
