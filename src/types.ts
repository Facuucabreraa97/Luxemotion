export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  credits: number;
  is_admin?: boolean;
}

export interface Asset {
  id: string;
  created_at: string;
  name: string;
  description?: string;
  image_url: string;
  video_url?: string;
  price: number;
  currency: string;
  royalty_percent: number;
  creator_id: string;
  owner_id: string;
  for_sale: boolean;
  supply_total: number;
  supply_sold: number;
  is_draft?: boolean;

  // Remix / GenAI Fields
  seed?: number; // Int8 in DB, number in JS (safe up to 2^53)
  generation_config?: Record<string, unknown>;
  prompt_structure?: {
    user_prompt: string;
    system_prompt?: string;
    full_prompt: string;
  };
  is_public?: boolean;
}

export interface Transaction {
  id: number;
  created_at: string;
  type: 'MINT' | 'BUY' | 'GENERATE' | 'DEPOSIT';
  amount: number;
  metadata?: Record<string, unknown>;
}
