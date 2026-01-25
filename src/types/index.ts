export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    credits: number;
}

export interface NFTAsset {
    id: string;
    owner_id: string;
    title: string;
    description?: string;
    preview_url: string;
    supply_total: number;
    price: number;
    is_for_sale: boolean;
    created_at: string;
    history?: any[];
}

export interface TransactionHistory {
    id: string;
    asset_id: string;
    buyer_id: string;
    seller_id: string;
    price: number;
    date: string;
}