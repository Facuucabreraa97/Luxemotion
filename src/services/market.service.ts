import { supabase } from '../lib/supabase'; // Ruta relativa segura
import { Asset } from '../types';

export const MarketService = {
  // [SECURE] ACUÑAR (MINT) via Edge Function
  async mintAsset(assetData: Partial<Asset>, userId: string) {
    const { data, error } = await supabase.functions.invoke('mint-asset', {
      body: { assetData, userId },
    });

    if (error) throw error;
    return data.asset;
  },

  // LISTAR — ownership verified
  async listAsset(assetId: string, price: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data, error } = await supabase
      .from('talents')
      .update({ for_sale: true, price: price })
      .eq('id', assetId)
      .eq('owner_id', user.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error('Asset not found or you are not the owner');
  },

  // [SECURE] COMPRAR ACTIVO via ACID RPC (atomic transaction)
  async buyAsset(assetId: string, buyerId: string) {
    const { data, error } = await supabase.rpc('buy_talent', {
      p_talent_id: parseInt(assetId),
      p_buyer_id: buyerId,
    });

    if (error) throw error;
    if (data && !data.success) throw new Error(data.message);
    return data;
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
          user_id: userId, // Required by DB constraint
          for_sale: false,
          is_draft: true,
          supply_total: 1,
          supply_sold: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('SAVE DRAFT ERROR:', error instanceof Error ? error.message : 'Unknown');
      throw error;
    }
    return data;
  },

  // FINALIZAR MINTEO (Convertir Draft a Asset Real)
  async finalizeMint(assetId: string, price: number) {
    const MINT_FEE = 50;

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    // 2. Deduct fee via RPC (atomic — handles balance check internally, no TOCTOU)
    const { error: deductError } = await supabase.rpc('decrease_credits', {
      p_user_id: user.id,
      p_amount: MINT_FEE,
    });
    if (deductError) throw new Error('Failed to deduct mint fee: ' + deductError.message);

    // 4. Activate Asset (with ownership check)
    const { data, error } = await supabase
      .from('talents')
      .update({
        is_draft: false,
        for_sale: true,
        price: price,
      })
      .eq('id', assetId)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) {
      // Rollback: refund credits
      await supabase.rpc('increase_credits', { user_id: user.id, amount: MINT_FEE });
      throw error;
    }
    return data;
  },

  // HISTORIAL DE TRANSACCIONES (Solo Lectura)
  async getTransactions(userId: string) {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data || [];
  },

  // RENAME ASSET — ownership verified, blocked if listed
  async renameAsset(assetId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) throw new Error('Name cannot be empty');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data, error } = await supabase
      .from('talents')
      .update({ name: trimmed })
      .eq('id', assetId)
      .eq('owner_id', user.id)
      .eq('for_sale', false)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error('Asset not found, not owned by you, or currently listed');
  },
};
