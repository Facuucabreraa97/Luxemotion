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
        description?: string
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

        // Call RPC
        const { data, error } = await supabase.rpc('submit_manual_payment', {
            p_amount: amount,
            p_payment_method: paymentMethod,
            p_proof_url: proofUrl,
            p_tx_hash: txHash || null,
            p_description: description || 'Credit Purchase'
        });

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
            .select('id, user_id, amount, description, payment_method, proof_url, tx_hash, review_status, created_at')
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
            .select('id, user_id, amount, description, payment_method, proof_url, tx_hash, review_status, created_at')
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

    // ── Admin: Approve or reject a payment ──
    async reviewPayment(transactionId: string, decision: 'approved' | 'rejected'): Promise<{ success: boolean; message: string }> {
        const { data, error } = await supabase.rpc('review_payment', {
            p_transaction_id: transactionId,
            p_decision: decision
        });

        if (error) {
            console.error('Error reviewing payment:', error);
            return { success: false, message: error.message };
        }

        return data as { success: boolean; message: string };
    }
};
