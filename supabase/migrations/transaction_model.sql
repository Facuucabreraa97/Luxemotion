-- Add columns to talents if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'talents' AND column_name = 'original_creator_id') THEN
        ALTER TABLE talents ADD COLUMN original_creator_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'talents' AND column_name = 'sales_count') THEN
        ALTER TABLE talents ADD COLUMN sales_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id),
    seller_id UUID REFERENCES auth.users(id),
    talent_id BIGINT,
    talent_id_text TEXT,
    price NUMERIC,
    platform_fee NUMERIC,
    creator_royalty NUMERIC,
    seller_revenue NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to handle the atomic purchase
CREATE OR REPLACE FUNCTION buy_talent(p_talent_id BIGINT, p_buyer_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_talent RECORD;
    v_buyer_balance INTEGER;
    v_price INTEGER;
    v_fee NUMERIC;
    v_total_cost NUMERIC;
    v_royalty NUMERIC := 0;
    v_seller_revenue NUMERIC;
    v_admin_id UUID;
    v_original_creator_id UUID;
BEGIN
    -- 1. Get Talent Details
    SELECT * INTO v_talent FROM talents WHERE id = p_talent_id;

    IF v_talent IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Talent not found');
    END IF;

    IF v_talent.for_sale IS NOT TRUE THEN
        RETURN json_build_object('success', false, 'message', 'Item is not for sale');
    END IF;

    IF v_talent.user_id = p_buyer_id THEN
        RETURN json_build_object('success', false, 'message', 'Cannot buy your own item');
    END IF;

    v_price := v_talent.price;
    v_original_creator_id := v_talent.original_creator_id;

    -- If original_creator_id is null, assume the current owner (seller) is the creator if sales_count is 0
    IF v_original_creator_id IS NULL AND v_talent.sales_count = 0 THEN
       v_original_creator_id := v_talent.user_id;
    END IF;

    -- 2. Validate Buyer Balance
    SELECT credits INTO v_buyer_balance FROM profiles WHERE id = p_buyer_id;

    IF v_buyer_balance IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Buyer profile not found');
    END IF;

    -- 3. Calculations
    v_fee := v_price * 0.025;
    v_total_cost := v_price + v_fee;

    IF v_buyer_balance < v_total_cost THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient funds');
    END IF;

    -- Royalty Logic
    -- Only if seller is NOT the creator AND sales_count < 5
    IF v_talent.user_id != v_original_creator_id AND v_talent.sales_count < 5 THEN
        v_royalty := v_price * 0.10;
    END IF;

    v_seller_revenue := v_price - v_royalty;

    -- Get Admin ID for Master Wallet (Just pick one admin)
    SELECT id INTO v_admin_id FROM profiles WHERE is_admin = true LIMIT 1;

    -- 4. Execute Transaction (Atomic)

    -- Debit Buyer
    UPDATE profiles SET credits = credits - v_total_cost WHERE id = p_buyer_id;

    -- Credit Seller
    UPDATE profiles SET credits = credits + v_seller_revenue WHERE id = v_talent.user_id;

    -- Credit Platform (Admin)
    IF v_admin_id IS NOT NULL THEN
        UPDATE profiles SET credits = credits + v_fee WHERE id = v_admin_id;
    END IF;

    -- Credit Creator (Royalty)
    IF v_royalty > 0 AND v_original_creator_id IS NOT NULL THEN
        UPDATE profiles SET credits = credits + v_royalty WHERE id = v_original_creator_id;
    END IF;

    -- Update Talent Ownership
    UPDATE talents
    SET user_id = p_buyer_id, -- New Owner
        sales_count = COALESCE(sales_count, 0) + 1,
        for_sale = false,
        price = NULL,
        -- Ensure original_creator_id is set if it wasn't
        original_creator_id = COALESCE(original_creator_id, v_original_creator_id)
    WHERE id = p_talent_id;

    -- Log Transaction
    INSERT INTO transactions (buyer_id, seller_id, talent_id_text, price, platform_fee, creator_royalty, seller_revenue)
    VALUES (p_buyer_id, v_talent.user_id, p_talent_id::text, v_price, v_fee, v_royalty, v_seller_revenue);

    RETURN json_build_object('success', true, 'message', 'Purchase successful');

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;
