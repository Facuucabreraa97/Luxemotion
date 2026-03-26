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

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon_url: string;
  xp_reward: number;
}

export interface Quest {
  id: string;
  code: string;
  frequency: 'DAILY' | 'WEEKLY' | 'EPIC';
  title: string;
  target_count: number;
  xp_reward: number;
  credits_reward: number;
}

export interface UserQuestProgress {
  user_id: string;
  quest_id: string;
  current_count: number;
  is_completed: boolean;
  is_claimed: boolean;
  cycle_start: string;
}

export interface UserGamificationStats {
  xp: number;
  level: number;
  current_streak: number;
  achievements: string[]; // List of Achievement IDs
}
