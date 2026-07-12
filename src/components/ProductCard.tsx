import React, { useState } from 'react';
import { Star, ShoppingCart, AlertCircle, Heart, Share2, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch (fallbackErr) {
      console.error('Fallback copy failed', fallbackErr);
      return false;
    }
  }
};

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (p: Product) => void;
  onViewDetails: (p: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (p: Product) => void;
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onViewDetails,
  isWishlisted = false,
  onToggleWishlist
}: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const { t, language } = useLanguage();
  const [showToast, setShowToast] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/?product=${product.id}`;
    const copied = await copyToClipboard(shareUrl);
    if (copied) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
  };

  return (
    <div 
      className="glass-card glass-card-hover rounded-2xl flex flex-col h-full overflow-hidden group relative"
      id={`product-card-${product.id}`}
    >
      {/* Share button overlay */}
      <button
        onClick={handleShare}
        className={`absolute top-3 z-10 bg-white/75 backdrop-blur-md p-2 rounded-full border border-white/40 hover:bg-white hover:scale-110 transition-all cursor-pointer shadow-xs text-slate-600 hover:text-teal-600 ${
          onToggleWishlist ? 'right-[52px]' : 'right-3'
        }`}
        title={language === 'en' ? 'Share Product' : 'Product Share Karein'}
        id={`product-share-btn-${product.id}`}
      >
        <Share2 className="h-4.5 w-4.5 transition-colors" />
      </button>

      {/* Wishlist Heart Icon overlay */}
      {onToggleWishlist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className="absolute top-3 right-3 z-10 bg-white/75 backdrop-blur-md p-2 rounded-full border border-white/40 hover:bg-white hover:scale-110 transition-all cursor-pointer shadow-xs"
          title={isWishlisted ? "Wishlist se hatayein" : "Wishlist mein jodein"}
          id={`product-wishlist-btn-${product.id}`}
        >
          <Heart 
            className={`h-4.5 w-4.5 transition-colors ${
              isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-600 hover:text-rose-500'
            }`} 
          />
        </button>
      )}

      {/* Product Image */}
      <div 
        className="relative pt-[100%] bg-slate-200/20 overflow-hidden cursor-pointer"
        onClick={() => onViewDetails(product)}
        id={`product-image-container-${product.id}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          id={`product-image-${product.id}`}
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider uppercase text-[#0f766e] border border-teal-500/10 shadow-xs">
          {product.category}
        </div>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center">
            <div className="bg-red-600/90 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center space-x-1 shadow-md">
              <AlertCircle className="h-4 w-4" />
              <span>{t('out_of_stock')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        <div className="flex items-center space-x-1 text-amber-500 mb-1 sm:mb-2">
          <Star className="h-3 sm:h-4 w-3 sm:w-4 fill-amber-500" />
          <span className="text-[10px] sm:text-xs font-bold text-slate-700">
            {product.rating > 0 ? product.rating : 'N/A'}
          </span>
        </div>

        <h3 
          className="text-sm sm:text-base font-bold text-slate-800 hover:text-teal-600 cursor-pointer transition-colors line-clamp-1 mb-1 sm:mb-1.5"
          onClick={() => onViewDetails(product)}
          id={`product-title-${product.id}`}
        >
          {product.name}
        </h3>

        <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-2 mb-2 sm:mb-4 flex-grow">
          {product.description}
        </p>

        <div className="flex flex-col xs:flex-row xs:items-center justify-between pt-2 sm:pt-3 border-t border-slate-200/60 mt-auto gap-2">
          <div>
            <span className="text-[9px] text-slate-400 font-mono block uppercase">{t('price')}</span>
            <span className="text-sm sm:text-lg font-black text-slate-900">₹{product.price.toLocaleString('en-IN')}</span>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-extrabold transition-all flex items-center justify-center space-x-1 sm:space-x-1.5 ${
              isOutOfStock
                ? 'bg-slate-300/40 text-slate-400 cursor-not-allowed border border-slate-200/20'
                : 'glass-button-emerald text-white cursor-pointer w-full xs:w-auto'
            }`}
            id={`product-add-btn-${product.id}`}
          >
            <ShoppingCart className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            <span>{t('add_btn')}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-4 right-4 z-25 bg-[#0f766e]/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-2.5 rounded-xl shadow-lg border border-teal-400/20 flex items-center justify-center space-x-1.5"
            id={`product-share-toast-${product.id}`}
          >
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-center leading-tight">
              {t('copied_toast')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
