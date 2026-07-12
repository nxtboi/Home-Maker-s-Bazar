import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquareCode, Send, Calendar, Heart } from 'lucide-react';
import { Product, Review, User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (p: Product) => void;
  currentUser?: User | null;
  onNavigateToTab?: (tab: 'shop' | 'tracker' | 'admin' | 'auth' | 'profile') => void;
}

export default function ProductDetailsModal({ 
  product, 
  onClose, 
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
  currentUser,
  onNavigateToTab
}: ProductDetailsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { t } = useLanguage();

  // Fetch reviews when modal opens or product changes
  useEffect(() => {
    fetchReviews();
  }, [product.id]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Error fetching reviews from API, falling back to local storage:', err);
    }

    // Local storage fallback
    try {
      const savedReviewsRaw = localStorage.getItem('ab_reviews') || '[]';
      const localReviews = JSON.parse(savedReviewsRaw);
      const productReviews = localReviews.filter((r: any) => r.productId === product.id);
      setReviews(productReviews);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      return;
    }
    const authorName = currentUser.name;
    if (!authorName.trim() || !comment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: authorName, rating, comment }),
      });

      if (res.ok) {
        setComment('');
        setRating(5);
        setSuccessMsg(t('review_success'));
        fetchReviews();
        setTimeout(() => setSuccessMsg(''), 4000);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn('Review submission API failed, falling back to local storage:', err);
    }

    // Local storage fallback review submission
    try {
      const savedReviewsRaw = localStorage.getItem('ab_reviews') || '[]';
      const localReviews = JSON.parse(savedReviewsRaw);
      const newReview = {
        id: `rev-${Date.now()}`,
        productId: product.id,
        userName: authorName,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };
      localReviews.unshift(newReview);
      localStorage.setItem('ab_reviews', JSON.stringify(localReviews));

      setComment('');
      setRating(5);
      setSuccessMsg(t('review_success'));
      
      // Update local state directly
      const productReviews = localReviews.filter((r: any) => r.productId === product.id);
      setReviews(productReviews);

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="product-details-modal">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={onClose}></div>

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="relative transform overflow-y-auto rounded-3xl glass-panel text-left shadow-2xl transition-all sm:my-8 w-full max-w-5xl border border-white/50 flex flex-col max-h-[92vh] z-10">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white/40 hover:bg-white/60 text-slate-800 hover:text-slate-900 p-2 rounded-full transition-all cursor-pointer border border-white/30 shadow-xs"
            id="close-modal-btn"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Top Section: Product Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8">
            {/* Image Column */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex flex-col justify-center">
              <div className="relative pt-[100%] rounded-xl overflow-hidden bg-white/50 border border-white/30">
                <img
                  src={product.image}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Info Column */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="inline-block bg-emerald-500/15 border border-emerald-500/20 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  {product.category}
                </span>

                <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
                  {product.name}
                </h2>

                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4.5 w-4.5 ${
                          star <= Math.floor(product.rating)
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    {product.rating > 0 ? `${product.rating} / 5` : t('no_ratings')}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    ({reviews.length} {t('ratings_count')})
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {product.description}
                </p>
              </div>

              <div className="pt-6 border-t border-white/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">{t('total_price')}</span>
                  <span className="text-2xl font-black text-slate-900">₹{product.price.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {onToggleWishlist && (
                    <button
                      onClick={() => onToggleWishlist(product)}
                      className="p-3 rounded-2xl border border-teal-500/20 bg-white/40 hover:bg-white text-slate-800 hover:text-rose-500 transition-all cursor-pointer shadow-xs flex items-center justify-center"
                      title={isWishlisted ? "Wishlist se hatayein" : "Wishlist mein jodein"}
                      id="modal-wishlist-toggle-btn"
                    >
                      <Heart className={`h-5 w-5 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onAddToCart(product);
                      onClose();
                    }}
                    disabled={product.stock <= 0}
                    className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center space-x-2 ${
                      product.stock <= 0
                        ? 'bg-slate-300/40 text-slate-400 cursor-not-allowed border border-white/20'
                        : 'glass-button-emerald text-white cursor-pointer shadow-lg'
                    }`}
                    id="modal-add-to-cart-btn"
                  >
                    <span>{t('add_to_cart')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Grahak Reviews & Feedback */}
          <div className="p-6 md:p-8 border-t border-white/30 bg-white/10 rounded-b-3xl">
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2 mb-4">
              <MessageSquareCode className="h-5 w-5 text-[#0f766e]" />
              <span>{t('reviews_heading')}</span>
            </h3>

            {/* Success Notification */}
            {successMsg && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs px-3 py-2.5 rounded-xl font-medium animate-fade-in">
                {successMsg}
              </div>
            )}

            {/* Review List */}
            <div className="space-y-4 mb-6" id="review-list">
              {isLoading ? (
                <p className="text-xs text-slate-400 text-center py-4">{t('reviews_load')}</p>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 bg-white/25 rounded-2xl border border-dashed border-white/40">
                  <p className="text-sm text-slate-500 font-bold">{t('no_reviews')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('be_first_reviewer')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-white/40 p-4 rounded-2xl border border-white/40 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-xs font-bold text-slate-800">{rev.userName}</span>
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= rev.rating ? 'fill-amber-500' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 mt-3 pt-2 border-t border-white/20">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a Review Form - Only logged in users */}
            {currentUser ? (
              <form onSubmit={handleSubmitReview} className="border-t border-white/30 pt-6 mt-6">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">{t('write_review')}</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('your_name')}</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.name}
                      className="w-full bg-slate-200/40 border border-white/35 text-xs rounded-xl py-2 px-3 text-slate-500 font-bold focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('rating_label')}</label>
                    <div className="flex items-center space-x-1 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`h-5 w-5 ${star <= rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('comment_label')}</label>
                  <textarea
                    required
                    rows={2}
                    placeholder={t('feedback_placeholder')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-white/30 border border-white/45 text-xs rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:bg-white/70 focus:border-[#0f766e] resize-none font-semibold"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900/85 hover:bg-slate-900 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{t('submit_review')}</span>
                </button>
              </form>
            ) : (
              <div className="border-t border-white/30 pt-6 mt-6 text-center bg-white/10 p-5 rounded-2xl border border-dashed border-white/20">
                <p className="text-xs text-slate-600 font-bold">{t('login_to_review')}</p>
                {onNavigateToTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab('auth');
                    }}
                    className="mt-3 px-4 py-2 bg-[#0f766e] hover:bg-[#0a5c56] text-white text-xs font-black rounded-xl transition-colors cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>{t('login_register_btn')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
