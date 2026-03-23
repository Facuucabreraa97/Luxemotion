-- Atomic credit decrement: returns remaining credits or -1 if insufficient
CREATE OR REPLACE FUNCTION decrement_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount
  RETURNING credits INTO v_remaining;

  IF NOT FOUND THEN
    RETURN -1; -- Insufficient credits
  END IF;

  RETURN v_remaining;
END;
$$;

-- Atomic credit increment
CREATE OR REPLACE FUNCTION increment_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_remaining;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN v_remaining;
END;
$$;

-- Atomic purchase: locks row, verifies, transfers credits, updates ownership
CREATE OR REPLACE FUNCTION atomic_buy(
  p_buyer_id UUID,
  p_asset_id UUID,
  p_cost INTEGER,
  p_asset_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table TEXT;
  v_item RECORD;
  v_seller_id UUID;
  v_buyer_credits INTEGER;
  v_buyer_is_admin BOOLEAN;
  v_remaining INTEGER;
BEGIN
  v_table := CASE WHEN p_asset_type IN ('model', 'talent') THEN 'talents' ELSE 'generations' END;

  -- Lock the asset row
  IF v_table = 'talents' THEN
    SELECT * INTO v_item FROM talents WHERE id = p_asset_id FOR UPDATE;
  ELSE
    SELECT * INTO v_item FROM generations WHERE id = p_asset_id FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Asset not found');
  END IF;

  v_seller_id := v_item.user_id;

  -- Prevent self-purchase
  IF p_buyer_id = v_seller_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot purchase your own asset');
  END IF;

  -- Check buyer balance
  SELECT credits, COALESCE(is_admin, false) INTO v_buyer_credits, v_buyer_is_admin
  FROM profiles WHERE id = p_buyer_id;

  IF NOT v_buyer_is_admin AND v_buyer_credits < p_cost THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient credits');
  END IF;

  -- Deduct from buyer (atomic)
  IF NOT v_buyer_is_admin THEN
    UPDATE profiles SET credits = credits - p_cost WHERE id = p_buyer_id AND credits >= p_cost;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'Insufficient credits (concurrent modification)');
    END IF;
  END IF;

  -- Credit seller
  UPDATE profiles SET credits = credits + p_cost WHERE id = v_seller_id;

  -- Transfer ownership
  IF v_table = 'talents' THEN
    UPDATE talents SET
      user_id = p_buyer_id,
      is_for_sale = false,
      for_sale = false,
      is_sold = true,
      sold = true,
      sales_count = COALESCE(sales_count, 0) + 1
    WHERE id = p_asset_id;

    -- Lock source generation if talent has one
    IF v_item.source_generation_id IS NOT NULL THEN
      UPDATE generations SET locked = true WHERE id = v_item.source_generation_id;
    END IF;
  ELSE
    UPDATE generations SET
      user_id = p_buyer_id,
      is_for_sale = false,
      locked = true
    WHERE id = p_asset_id;
  END IF;

  -- Get updated buyer credits
  SELECT credits INTO v_remaining FROM profiles WHERE id = p_buyer_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Purchase successful',
    'remainingCredits', v_remaining
  );
END;
$$;
