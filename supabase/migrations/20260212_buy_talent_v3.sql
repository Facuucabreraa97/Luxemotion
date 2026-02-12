-- ═══════════════════════════════════════════════════════════════
-- UPDATE buy_talent: set owner_id + 10% platform fee
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION buy_talent(p_talent_id BIGINT, p_buyer_id UUID) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_talent RECORD;
v_buyer_balance INTEGER;
v_price INTEGER;
v_fee NUMERIC;
v_total_cost NUMERIC;
v_royalty NUMERIC := 0;
v_seller_revenue NUMERIC;
v_admin_id UUID;
v_original_creator_id UUID;
BEGIN -- 1. Lock & Get Talent (FOR UPDATE prevents race conditions)
SELECT * INTO v_talent
FROM talents
WHERE id = p_talent_id FOR
UPDATE;
IF v_talent IS NULL THEN RETURN json_build_object('success', false, 'message', 'Talent not found');
END IF;
IF v_talent.for_sale IS NOT TRUE THEN RETURN json_build_object(
    'success',
    false,
    'message',
    'Item is not for sale'
);
END IF;
-- Anti-self-dealing
IF v_talent.user_id = p_buyer_id
OR v_talent.owner_id = p_buyer_id THEN RETURN json_build_object(
    'success',
    false,
    'message',
    'Cannot buy your own item'
);
END IF;
v_price := v_talent.price;
v_original_creator_id := COALESCE(
    v_talent.original_creator_id,
    v_talent.creator_id
);
-- If no creator tracked, assume current owner is creator on first sale
IF v_original_creator_id IS NULL
AND COALESCE(v_talent.sales_count, 0) = 0 THEN v_original_creator_id := COALESCE(v_talent.user_id, v_talent.owner_id);
END IF;
-- 2. Lock & Validate Buyer Balance
SELECT credits INTO v_buyer_balance
FROM profiles
WHERE id = p_buyer_id FOR
UPDATE;
IF v_buyer_balance IS NULL THEN RETURN json_build_object(
    'success',
    false,
    'message',
    'Buyer profile not found'
);
END IF;
-- 3. Calculations (10% platform fee)
v_fee := FLOOR(v_price * 0.10);
v_total_cost := v_price + v_fee;
IF v_buyer_balance < v_total_cost THEN RETURN json_build_object(
    'success',
    false,
    'message',
    'Insufficient funds. Need ' || v_total_cost || ' CR (price + 10% fee)'
);
END IF;
-- Royalty: 10% for original creator if seller != creator AND < 5 resales
IF COALESCE(v_talent.user_id, v_talent.owner_id) != v_original_creator_id
AND COALESCE(v_talent.sales_count, 0) < 5 THEN v_royalty := FLOOR(v_price * 0.10);
END IF;
v_seller_revenue := v_price - v_royalty;
-- Get Admin ID for Platform Wallet
SELECT id INTO v_admin_id
FROM profiles
WHERE is_admin = true
LIMIT 1;
-- 4. Execute Transaction (All-or-nothing)
-- Debit Buyer (price + fee)
UPDATE profiles
SET credits = credits - v_total_cost
WHERE id = p_buyer_id;
-- Credit Seller
UPDATE profiles
SET credits = credits + v_seller_revenue
WHERE id = COALESCE(v_talent.user_id, v_talent.owner_id);
-- Credit Platform (Admin gets the fee)
IF v_admin_id IS NOT NULL THEN
UPDATE profiles
SET credits = credits + v_fee
WHERE id = v_admin_id;
END IF;
-- Credit Creator (Royalty)
IF v_royalty > 0
AND v_original_creator_id IS NOT NULL THEN
UPDATE profiles
SET credits = credits + v_royalty
WHERE id = v_original_creator_id;
END IF;
-- Transfer Ownership (set BOTH user_id and owner_id for consistency)
UPDATE talents
SET user_id = p_buyer_id,
    owner_id = p_buyer_id,
    sales_count = COALESCE(sales_count, 0) + 1,
    for_sale = false,
    price = NULL,
    original_creator_id = COALESCE(original_creator_id, v_original_creator_id)
WHERE id = p_talent_id;
-- Log Transaction
INSERT INTO transactions (
        buyer_id,
        seller_id,
        talent_id_text,
        price,
        platform_fee,
        creator_royalty,
        seller_revenue
    )
VALUES (
        p_buyer_id,
        COALESCE(v_talent.user_id, v_talent.owner_id),
        p_talent_id::text,
        v_price,
        v_fee,
        v_royalty,
        v_seller_revenue
    );
RETURN json_build_object(
    'success',
    true,
    'message',
    'Purchase successful',
    'price',
    v_price,
    'fee',
    v_fee,
    'royalty',
    v_royalty,
    'seller_revenue',
    v_seller_revenue
);
EXCEPTION
WHEN OTHERS THEN RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;