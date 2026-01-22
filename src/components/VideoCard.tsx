import React from 'react';
import { Download, Globe, Trash2, ShoppingBag, Settings, Eye, Lock, Loader2, Play, Sparkles, Crown } from 'lucide-react';
import { useMode } from '../context/ModeContext';
import { useTranslation } from 'react-i18next';
import { S } from '../styles';

interface VideoCardProps {
    item: any;
    type: 'video' | 'model';
    isOwner?: boolean;
    onPublish?: (item: any) => void;
    onDelete?: (id: string) => void;
    onSell?: (id: string) => void;
    onManage?: (id: string) => void;
    onRemix?: (item: any) => void;
    onDownload?: (url: string) => void;
    onViewDetails?: (item: any) => void;
    publishing?: boolean;
    children?: React.ReactNode;
}

export const VideoCard: React.FC<VideoCardProps> = ({
    item,
    type,
    isOwner = false,
    onPublish,
    onDelete,
    onSell,
    onManage,
    onRemix,
    onDownload,
    onViewDetails,
    publishing = false,
    children
}) => {
    const { mode } = useMode();
    const { t } = useTranslation();
    const isVelvet = mode === 'velvet';

    // --- ABSOLUTE LOCK LOGIC ---
    const { is_sold } = item; // Explicit destructuring as requested
    const isForSale = item.for_sale || item.is_for_sale;
    const salesCount = item.sales_count || 0;

    // Sold if marked is_sold OR (not for sale anymore but has sales) OR LOCKED (Source Video of a Sold Talent)
    const isSold = item.locked === true || is_sold === true || (!isForSale && salesCount > 0);

    // Commercialized = Sold or Listed
    const isCommercialized = isSold || isForSale;

    // Interaction Rule: Only allow destructive/creative actions if "clean"
    // This ignores isOwner. Status dictates the lock.
    const canInteract = !isCommercialized;

    // Read-only Logic (Legacy intent + Commercial lock)
    // If commercialized, or not owner, we treat as read-only for detailed views
    const isReadOnly = !isOwner || isCommercialized;
    // ---------------------------

    const isModel = type === 'model';
    const assetUrl = isModel ? item.image_url : (item.video_url || item.url);
    const isVideoAsset = type === 'video' || assetUrl?.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i);
    const aspectRatioClass = isModel ? 'aspect-[3/4]' : 'aspect-[9/16]';

    // Badge Logic (Visual Feedback)
    let statusBadge = null;
    let statusColor = '';

    if (isSold) {
        statusBadge = "SOLD";
        statusColor = "bg-red-600 text-white shadow-red-500/20";
    } else if (isForSale) {
        // Strict User Request: Green "FOR SALE" badge
        statusBadge = `${item.price ? ` (${item.price} CR)` : ''}`; // Just price or logic? previous was `FOR SALE...`
        // Wait, text was hardcoded before? I should use t() if possible but existing code has hardcoded logic mixed.
        // Actually, previous code: statusBadge = `FOR SALE...`
        // I should probably keep it compatible or use Translation if I added key?
        // Let's stick to adding the NEW badge logic for Acquired.
        statusBadge = `FOR SALE${item.price ? ` (${item.price} CR)` : ''}`;
        statusColor = "bg-green-500 text-white shadow-green-500/20";
    } else if (item.source_generation_id && !isOwner) { // Logic check: If I am owner, I might have cloned it? But wait, if I bought it, I AM owner.
        // If I am owner and it has source_generation_id, it is acquired (or remixed).
        // If I am NOT owner, I shouldn't see it in my studio usually?
        // Gallery shows everything.
        // Let's refine: If `isOwner` AND `source_generation_id`.
    }

    // NEW ACQUIRED LOGIC
    // If I own it, and it has a source (it was cloned/bought), show ACQUIRED.
    // Remixes also have source? If so, this might label remixes as acquired. Acceptable for now.
    if (isOwner && item.source_generation_id && !isSold && !isForSale) {
        statusBadge = t('badges.acquired');
        statusColor = "bg-[#C6A649]/20 text-[#C6A649] shadow-[#C6A649]/10";
    }

    // Action Buttons Logic

    // View Details: Show if read-only (not owner or commercialized) or explicitly requested
    const showViewDetails = onViewDetails && (isReadOnly || isSold);

    // Manage: Owner can manage active sale (Cancel Sale), but NOT if already sold
    const showManage = isOwner && isForSale && !isSold;

    // Sell: Can only sell if interactable (not already sold/selling) and provided
    const showSell = canInteract && onSell;

    // Remix & Publish: Only if interactable (not commercialized)
    const showRemix = canInteract && onRemix;

    // Publish: Standard check (interactable + owner + not model + provided)
    const showPublish = canInteract && onPublish && isOwner && !isModel;

    // Delete: Only if interactable
    const showDelete = canInteract && onDelete;

    // Download: Always allowed if provided AND NOT SOLD (Prompt req)
    const showDownload = !!onDownload && !isSold;

    return (
        <div className={`rounded-[30px] overflow-hidden group relative hover:-translate-y-2 transition-all ${isVelvet ? S.panel : 'bg-white shadow-lg border border-gray-100'} ${isSold ? 'grayscale opacity-75 pointer-events-none' : ''}`}>
            { }
            <div className={`relative ${aspectRatioClass} w-full bg-black/5`}>
                {isVideoAsset ? (
                    <video
                        src={assetUrl}
                        className={`w-full h-full object-cover ${isSold ? 'blur-sm' : ''}`}
                        controls={!isSold} // Disable controls if sold (visual only)
                        preload="metadata"
                        playsInline
                        crossOrigin="anonymous"
                    />
                ) : (
                    <img src={assetUrl} className={`w-full h-full object-cover ${isSold ? 'blur-sm' : ''}`} alt={item.name || 'Asset'} />
                )}

                { }
                {isSold && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2">
                            <Lock size={12} className="text-white/70" />
                            <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase">{t('badges.sold')}</span>
                        </div>
                    </div>
                )}

                { }
                {statusBadge && (
                    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg z-10 ${statusColor} animate-in fade-in slide-in-from-top-2`}>
                        {statusBadge}
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>

            { }
            <div className={`p-5 flex justify-between items-center ${isVelvet ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                <div className="flex flex-col gap-1 min-w-0 pr-4">
                    <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${isVelvet ? 'text-white' : 'text-gray-900'}`}>
                        {item.name || (item.prompt ? item.prompt.slice(0, 15) + '...' : 'Untitled')}
                    </p>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isVelvet ? 'text-white/40' : 'text-gray-400'}`}>
                        {item.date || (isModel ? 'Model' : 'Video')}
                    </span>

                    { }
                    {isSold && (
                        <div className="flex items-center gap-1.5 mt-1 text-amber-500 animate-pulse">
                            <Crown size={10} />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Royalty Asset</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 shrink-0 items-center">
                    { }
                    {isSold && (
                        <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest mr-2">SOLD</span>
                    )}

                    { }
                    {showViewDetails && (
                        <button
                            onClick={() => onViewDetails ? onViewDetails(item) : null}
                            className={`p-2 rounded-full transition-all ${isVelvet ? 'bg-white/5 text-white hover:text-[#C6A649]' : 'bg-gray-100 text-gray-500 hover:text-black'}`}
                            title="View Details"
                        >
                            <Eye size={14} />
                        </button>
                    )}

                    { }
                    {showRemix && (
                        <button
                            onClick={() => onRemix && onRemix(item)}
                            className={`p-2 rounded-full transition-all ${isVelvet ? 'bg-white/5 text-white hover:text-[#C6A649]' : 'bg-gray-100 text-gray-500 hover:text-black'}`}
                            title="Remix"
                        >
                            <Sparkles size={14} />
                        </button>
                    )}

                    { }
                    {showManage && (onManage || onSell) && (
                        <button
                            onClick={() => (onManage ? onManage(item.id) : onSell?.(item.id))}
                            className={`p-2 rounded-full transition-all ${isVelvet ? 'bg-[#C6A649]/20 text-[#C6A649] hover:bg-[#C6A649] hover:text-black' : 'bg-gray-100 text-gray-600 hover:bg-black hover:text-white'}`}
                            title="Manage Listing"
                        >
                            <Settings size={14} />
                        </button>
                    )}

                    { }
                    {showSell && (
                        <button
                            onClick={() => onSell && onSell(item.id)}
                            className={`p-2 rounded-full transition-all ${isVelvet ? 'bg-white/5 text-white/50 hover:text-[#C6A649] hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:text-black hover:bg-gray-200'}`}
                            title="Sell Asset"
                        >
                            <ShoppingBag size={14} />
                        </button>
                    )}

                    { }
                    {showPublish && (
                        <button
                            onClick={() => onPublish && onPublish(item)}
                            disabled={publishing}
                            className={`p-2 rounded-full transition-all
                            ${isVelvet
                                    ? (item.is_public ? 'bg-[#C6A649] text-black hover:bg-white hover:text-black' : 'bg-white/5 text-gray-400 hover:text-[#C6A649]')
                                    : (item.is_public ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 text-gray-500 hover:text-black')}`}
                            title={item.is_public ? 'Unpublish' : 'Publish'}
                        >
                            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                        </button>
                    )}

                    { }
                    {showDownload && (
                        <a
                            href={assetUrl}
                            download
                            onClick={(e) => { if (onDownload) { e.preventDefault(); onDownload(assetUrl); } }}
                            className={`p-2 rounded-full transition-all ${isVelvet ? 'bg-white/5 text-[#C6A649] hover:bg-[#C6A649] hover:text-black' : 'bg-gray-100 text-black hover:bg-black hover:text-white'}`}
                            title="Download"
                        >
                            <Download size={14} />
                        </a>
                    )}

                    { }
                    {showDelete && (
                        <button
                            onClick={() => onDelete && onDelete(item.id)}
                            className={`p-2 rounded-full transition-all ${isVelvet ? 'bg-white/5 text-red-400/50 hover:text-red-500 hover:bg-red-500/10' : 'bg-gray-100 text-gray-400 hover:text-red-500'}`}
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
};
