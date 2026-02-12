import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────
export interface PaymentMethodConfig {
    id: string;
    label: string;
    enabled: boolean;
    data: {
        alias?: string;
        cvu?: string;
        qr_url?: string;
        wallet_address?: string;
        network?: string;
        instructions?: string;
    };
    display_order: number;
    updated_at: string;
    support_whatsapp_number?: string;
}

export interface PendingPayment {
    id: string;
    user_id: string;
    amount: number;
    description: string;
    payment_method: string;
    proof_url: string | null;
    tx_hash: string | null;
    review_status: string;
    created_at: string;
    user_email?: string;
    plan_tier?: string | null;
    billing_cycle?: string | null;
}

// ── Service ────────────────────────────────────────────────
export const PaymentService = {

    // ── Public: Get enabled payment methods ──
    async getPaymentMethods(): Promise<PaymentMethodConfig[]> {
        const { data, error } = await supabase
            .from('payment_methods_config')
            .select('*')
            .eq('enabled', true)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching payment methods:', error);
            return [];
        }
        return data as PaymentMethodConfig[];
    },

    // ── Admin: Get ALL payment methods (including disabled) ──
    async getAllPaymentMethods(): Promise<PaymentMethodConfig[]> {
        const { data, error } = await supabase
            .from('payment_methods_config')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching all payment methods:', error);
            return [];
        }
        return data as PaymentMethodConfig[];
    },

    // ── Admin: Update payment method config ──
    async updatePaymentMethod(id: string, updates: Partial<PaymentMethodConfig>): Promise<void> {
        const { error } = await supabase
            .from('payment_methods_config')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    // ── Admin: Create new payment method ──
    async createPaymentMethod(method: Omit<PaymentMethodConfig, 'updated_at'>): Promise<void> {
        const { error } = await supabase
            .from('payment_methods_config')
            .insert([{ ...method, updated_at: new Date().toISOString() }]);

        if (error) throw error;
    },

    // ── User: Submit a manual payment ──
    async submitPayment(
        amount: number,
        paymentMethod: string,
        proofFile?: File,
        txHash?: string,
        description?: string,
        planTier?: string,
        billingCycle?: string
    ): Promise<{ success: boolean; message: string }> {

        let proofUrl: string | null = null;

        // Upload proof image if provided
        if (proofFile) {
            const fileName = `${Date.now()}_${proofFile.name}`;
            const filePath = `payment-proofs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('payments')
                .upload(filePath, proofFile);

            if (uploadError) {
                console.error('Error uploading proof:', uploadError);
                return { success: false, message: 'Failed to upload payment proof' };
            }

            const { data: urlData } = supabase.storage
                .from('payments')
                .getPublicUrl(filePath);

            proofUrl = urlData.publicUrl;
        }

        const rpcParams: Record<string, unknown> = {
            p_amount: amount,
            p_payment_method: paymentMethod,
            p_proof_url: proofUrl,
            p_tx_hash: txHash || null,
            p_description: description || 'Credit Purchase'
        };
        if (planTier) rpcParams.p_plan_tier = planTier;
        if (billingCycle) rpcParams.p_billing_cycle = billingCycle;

        // Call RPC
        const { data, error } = await supabase.rpc('submit_manual_payment', rpcParams);

        if (error) {
            console.error('Error submitting payment:', error);
            return { success: false, message: error.message };
        }

        return data as { success: boolean; message: string };
    },

    // ── Admin: Get pending payments ──
    async getPendingPayments(): Promise<PendingPayment[]> {
        const { data: txs, error } = await supabase
            .from('transactions')
            .select('id, user_id, amount, description, payment_method, proof_url, tx_hash, review_status, created_at, plan_tier, billing_cycle')
            .eq('review_status', 'pending_review')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending payments:', error);
            return [];
        }

        if (!txs || txs.length === 0) return [];

        // Batch fetch emails
        const userIds = [...new Set(txs.map(t => t.user_id).filter(Boolean))];
        const emailMap: Record<string, string> = {};

        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email')
                .in('id', userIds);

            (profiles || []).forEach((p: { id: string; email: string }) => {
                emailMap[p.id] = p.email;
            });
        }

        return txs.map(tx => ({
            ...tx,
            user_email: emailMap[tx.user_id] || 'Unknown'
        })) as PendingPayment[];
    },

    // ── Admin: Get all reviewed payments ──
    async getReviewedPayments(limit = 50): Promise<PendingPayment[]> {
        const { data: txs, error } = await supabase
            .from('transactions')
            .select('id, user_id, amount, description, payment_method, proof_url, tx_hash, review_status, created_at, plan_tier, billing_cycle')
            .in('review_status', ['approved', 'rejected'])
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching reviewed payments:', error);
            return [];
        }

        if (!txs || txs.length === 0) return [];

        const userIds = [...new Set(txs.map(t => t.user_id).filter(Boolean))];
        const emailMap: Record<string, string> = {};

        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email')
                .in('id', userIds);

            (profiles || []).forEach((p: { id: string; email: string }) => {
                emailMap[p.id] = p.email;
            });
        }

        return txs.map(tx => ({
            ...tx,
            user_email: emailMap[tx.user_id] || 'Unknown'
        })) as PendingPayment[];
    },

    // ── Anti-fraud: Check if tx_hash already exists ──
    async checkDuplicateTxHash(txHash: string): Promise<boolean> {
        if (!txHash.trim()) return false;
        const { data, error } = await supabase
            .from('transactions')
            .select('id')
            .eq('tx_hash', txHash.trim())
            .limit(1);

        if (error) {
            console.error('Error checking duplicate tx_hash:', error);
            return false;
        }
        return (data?.length ?? 0) > 0;
    },

    // ── User: Get sum of pending credits ──
    async getPendingCredits(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('review_status', 'pending_review');

        if (error) {
            console.error('Error fetching pending credits:', error);
            return 0;
        }
        return (data || []).reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0);
    },

    // ── Admin: Approve or reject a payment (with optional bonus) ──
    async reviewPayment(
        transactionId: string,
        decision: 'approved' | 'rejected',
        overrideAmount?: number,
        planTier?: string,
        billingCycle?: string
    ): Promise<{ success: boolean; message: string }> {
        const params: Record<string, unknown> = {
            p_transaction_id: transactionId,
            p_decision: decision
        };
        if (overrideAmount !== undefined && overrideAmount > 0) {
            params.p_override_amount = overrideAmount;
        }
        if (planTier) params.p_plan_tier = planTier;
        if (billingCycle) params.p_billing_cycle = billingCycle;

        const { data, error } = await supabase.rpc('review_payment', params);

        if (error) {
            console.error('Error reviewing payment:', error);
            return { success: false, message: error.message };
        }

        return data as { success: boolean; message: string };
    }
};
