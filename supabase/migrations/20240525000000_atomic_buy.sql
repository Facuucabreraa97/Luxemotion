-- Atomic Buy Transaction RPC
create or replace function buy_talent(
  p_talent_id bigint,
  p_buyer_id uuid
) returns json as $$
declare
  v_talent record;
  v_buyer_credits int;
  v_price int;
  v_seller_id uuid;
  v_commission int;
  v_seller_earnings int;
begin
  -- Lock talent row
  select * into v_talent from talents where id = p_talent_id for update;

  if not found then
    return json_build_object('success', false, 'message', 'Talent not found');
  end if;

  if v_talent.for_sale = false then
    return json_build_object('success', false, 'message', 'Talent not for sale');
  end if;

  if v_talent.user_id = p_buyer_id then
    return json_build_object('success', false, 'message', 'Cannot buy your own talent');
  end if;

  v_price := v_talent.price;
  v_seller_id := v_talent.user_id;

  -- Check buyer credits
  select credits into v_buyer_credits from profiles where id = p_buyer_id for update;

  if v_buyer_credits < v_price then
    return json_build_object('success', false, 'message', 'Insufficient credits');
  end if;

  -- Calculate earnings (10% commission)
  v_commission := floor(v_price * 0.1);
  v_seller_earnings := v_price - v_commission;

  -- Deduct from buyer
  update profiles set credits = credits - v_price where id = p_buyer_id;

  -- Add to seller
  update profiles set credits = credits + v_seller_earnings where id = v_seller_id;

  -- Transfer ownership
  update talents set
    user_id = p_buyer_id,
    for_sale = false,
    is_public = false,
    price = null
  where id = p_talent_id;

  return json_build_object('success', true, 'message', 'Purchase successful', 'price', v_price);
exception when others then
  return json_build_object('success', false, 'message', SQLERRM);
end;
$$ language plpgsql security definer;
