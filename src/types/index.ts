
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
}

export interface Transaction {
    id: number;
    created_at: string;
    type: 'MINT' | 'BUY' | 'GENERATE' | 'DEPOSIT';
    amount: number;
    metadata?: any;
}