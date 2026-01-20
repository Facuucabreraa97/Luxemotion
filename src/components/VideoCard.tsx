import React from 'react';
import { Download, Globe, Trash2, ShoppingBag, Settings, Eye, Lock, Loader2, Play, Sparkles } from 'lucide-react';
import { useMode } from '../context/ModeContext';
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
  const isVelvet = mode === 'velvet';

  // --- ABSOLUTE LOCK LOGIC ---
  const isForSale = item.for_sale || item.is_for_sale;
  const salesCount = item.sales_count || 0;

  // Sold if marked is_sold OR (not for sale anymore but has sales) OR LOCKED (Source Video of a Sold Talent)
  const isSold = item.locked === true || item.is_sold === true || (!isForSale && salesCount > 0);

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
      statusBadge = `FOR SALE${item.price ? ` (${item.price} CR)` : ''}`;
      statusColor = "bg-green-500 text-white shadow-green-500/20";
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

  // Download: Always allowed if provided (unless specifically restricted, but prompt says "view/download" ok for sold)
  const showDownload = !!onDownload;

  return (
    <div className={`rounded-[30px] overflow-hidden group relative hover:-translate-y-2 transition-all ${isVelvet ? S.panel : 'bg-white shadow-lg border border-gray-100'}`}>
        {/* Media Container */}
        <div className={`relative ${aspectRatioClass} w-full bg-black/5`}>
             {isVideoAsset ? (
                <video
                    src={assetUrl}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                    playsInline
                    crossOrigin="anonymous"
                />
             ) : (
                <img src={assetUrl} className="w-full h-full object-cover" alt={item.name || 'Asset'} />
             )}

             {/* Status Badge */}
             {statusBadge && (
                 <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg z-10 ${statusColor} animate-in fade-in slide-in-from-top-2`}>
                     {statusBadge}
                 </div>
             )}

             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
        </div>

        {/* Content & Actions */}
        <div className={`p-5 flex justify-between items-center ${isVelvet?'bg-[#0a0a0a]':'bg-white'}`}>
            <div className="flex flex-col gap-1 min-w-0 pr-4">
                 <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${isVelvet?'text-white':'text-gray-900'}`}>
                    {item.name || (item.prompt ? item.prompt.slice(0, 15) + '...' : 'Untitled')}
                 </p>
                 <span className={`text-[9px] font-bold uppercase tracking-widest ${isVelvet?'text-white/40':'text-gray-400'}`}>
                    {item.date || (isModel ? 'Model' : 'Video')}
                 </span>
            </div>

            <div className="flex gap-2 shrink-0 items-center">
                {/* Visual Badge (Status) - Text in Action Bar */}
                {isSold && (
                    <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest mr-2">SOLD</span>
                )}

                {/* View Details */}
                {showViewDetails && (
                    <button
                        onClick={() => onViewDetails ? onViewDetails(item) : null}
                        className={`p-2 rounded-full transition-all ${isVelvet?'bg-white/5 text-white hover:text-[#C6A649]':'bg-gray-100 text-gray-500 hover:text-black'}`}
                        title="View Details"
                    >
                        <Eye size={14}/>
                    </button>
                )}

                {/* Remix */}
                {showRemix && (
                    <button
                        onClick={() => onRemix && onRemix(item)}
                        className={`p-2 rounded-full transition-all ${isVelvet?'bg-white/5 text-white hover:text-[#C6A649]':'bg-gray-100 text-gray-500 hover:text-black'}`}
                        title="Remix"
                    >
                        <Sparkles size={14}/>
                    </button>
                )}

                {/* Manage (Active Sale) */}
                {showManage && (onManage || onSell) && (
                    <button
                        onClick={() => (onManage ? onManage(item.id) : onSell?.(item.id))}
                        className={`p-2 rounded-full transition-all ${isVelvet?'bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white':'bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white'}`}
                        title="Manage Listing"
                    >
                        <Settings size={14}/>
                    </button>
                )}

                {/* Sell (Draft/Create Model) */}
                {showSell && (
                     <button
                        onClick={() => onSell && onSell(item.id)}
                        className={`p-2 rounded-full transition-all ${isVelvet?'bg-white/5 text-white/50 hover:text-[#C6A649] hover:bg-white/10':'bg-gray-100 text-gray-500 hover:text-black hover:bg-gray-200'}`}
                        title="Sell Asset"
                     >
                        <ShoppingBag size={14}/>
                     </button>
                )}

                {/* Publish (Video) */}
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
                        {publishing ? <Loader2 size={14} className="animate-spin"/> : <Globe size={14}/>}
                     </button>
                )}

                {/* Download */}
                {showDownload && (
                     <a
                        href={assetUrl}
                        download
                        onClick={(e) => { if(onDownload) { e.preventDefault(); onDownload(assetUrl); } }}
                        className={`p-2 rounded-full transition-all ${isVelvet?'bg-white/5 text-[#C6A649] hover:bg-[#C6A649] hover:text-black':'bg-gray-100 text-black hover:bg-black hover:text-white'}`}
                        title="Download"
                     >
                        <Download size={14}/>
                     </a>
                )}

                {/* Delete */}
                {showDelete && (
                    <button
                        onClick={() => onDelete && onDelete(item.id)}
                        className={`p-2 rounded-full transition-all ${isVelvet?'bg-white/5 text-red-400/50 hover:text-red-500 hover:bg-red-500/10':'bg-gray-100 text-gray-400 hover:text-red-500'}`}
                        title="Delete"
                    >
                        <Trash2 size={14}/>
                    </button>
                )}
            </div>
        </div>
        {children}
    </div>
  );
};
