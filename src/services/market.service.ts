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

  // LISTAR (Actualización de metadatos segura si RLS permite al dueño)
  async listAsset(assetId: string, price: number) {
    const { error } = await supabase
      .from('talents')
      .update({ for_sale: true, price: price })
      .eq('id', assetId);
    if (error) throw error;
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

    // 2. Check balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.credits || 0) < MINT_FEE) {
      throw new Error(`Insufficient credits. Minting costs ${MINT_FEE} CR.`);
    }

    // 3. Deduct fee via RPC (atomic, no admin required)
    const { error: deductError } = await supabase.rpc('decrease_credits', {
      user_id: user.id,
      amount: MINT_FEE,
    });
    if (deductError) throw new Error('Failed to deduct mint fee: ' + deductError.message);

    // 4. Activate Asset
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
};
