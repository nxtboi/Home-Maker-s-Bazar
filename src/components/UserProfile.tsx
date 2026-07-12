import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Heart, Package, LogOut, ChevronRight, 
  ShoppingCart, Star, Clock, MapPin, Phone, RefreshCw, Trash2, ArrowRight,
  CornerDownLeft, AlertCircle, CheckCircle2, X, LifeBuoy, Edit2, ShieldAlert
} from 'lucide-react';
import { Product, Order, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import HelpSupport from './HelpSupport';

interface UserProfileProps {
  currentUser: User | null;
  onLogout: () => void;
  products: Product[];
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (p: Product) => void;
  wishlistIds: string[];
  initialSubTab?: 'profile' | 'orders' | 'wishlist' | 'support';
  onNavigateToTab: (tab: 'shop' | 'tracker' | 'admin' | 'auth' | 'profile' | 'support') => void;
  onViewProductDetails: (p: Product) => void;
  onTrackOrder: (orderId: string) => void;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function UserProfile({
  currentUser,
  onLogout,
  products,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
  initialSubTab = 'profile',
  onNavigateToTab,
  onViewProductDetails,
  onTrackOrder,
  onUserUpdate,
}: UserProfileProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'orders' | 'wishlist' | 'support'>(initialSubTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const { t, language } = useLanguage();

  // Edit Details States
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!editName.trim()) {
      setEditError(language === 'en' ? 'Name cannot be empty.' : 'Naam khali nahi ho sakta.');
      return;
    }
    
    setIsSavingDetails(true);
    setEditError('');
    setEditSuccess('');

    try {
      const res = await fetch(`/api/users/${currentUser.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          password: editPassword.trim() ? editPassword.trim() : undefined,
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        setEditSuccess(language === 'en' ? 'Details updated successfully!' : 'Aapki details safalata-purvak update ho gayi hain!');
        setTimeout(() => {
          setIsEditingDetails(false);
          setEditSuccess('');
          setEditPassword('');
        }, 1500);
      } else {
        const errData = await res.json();
        setEditError(errData.error || (language === 'en' ? 'Failed to update details.' : 'Details update karne mein samasya aayi.'));
      }
    } catch (err) {
      console.error(err);
      setEditError(language === 'en' ? 'Server error occurred.' : 'Server connection issue.');
    } finally {
      setIsSavingDetails(false);
    }
  };


  // Return Order States
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');
  const [returnErrorMsg, setReturnErrorMsg] = useState('');

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnOrder) return;
    setIsSubmittingReturn(true);
    setReturnSuccessMsg('');
    setReturnErrorMsg('');
    try {
      const res = await fetch(`/api/orders/${selectedReturnOrder.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: returnReason }),
      });
      if (res.ok) {
        setReturnSuccessMsg(t('return_success_msg'));
        fetchUserOrders();
        setTimeout(() => {
          setSelectedReturnOrder(null);
          setReturnReason('');
          setReturnSuccessMsg('');
        }, 3000);
      } else {
        const errData = await res.json();
        setReturnErrorMsg(errData.error || t('return_error_msg'));
      }
    } catch (err) {
      console.error(err);
      setReturnErrorMsg(t('return_server_error'));
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Keep active subtab in sync if prop changes
  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  // Fetch user orders when orders sub-tab is loaded
  useEffect(() => {
    if (activeSubTab === 'orders' && currentUser) {
      fetchUserOrders();
    }
  }, [activeSubTab, currentUser]);

  const fetchUserOrders = async () => {
    if (!currentUser) return;
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res = await fetch(`/api/users/${currentUser.username}/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        setOrdersError('Orders fetch karne mein samasya aayi.');
      }
    } catch (err) {
      console.error(err);
      setOrdersError('Server connect karne mein issue aaya.');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Map wishlist IDs to actual product objects
  const wishlistedProducts = products.filter(p => wishlistIds.includes(p.id));

  // If user is not logged in
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in" id="profile-not-logged-in">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg max-w-md mx-auto">
          <div className="p-4 bg-teal-500/10 text-[#0f766e] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <UserIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800">
            {language === 'en' ? 'Account Access Required' : 'Account Access Required'}
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-2 leading-relaxed">
            {language === 'en' 
              ? 'Please log in or register to view your orders, track deliveries, and manage your wishlist.' 
              : 'Apne orders ko dekhne, track karne aur wishlist manage karne ke liye kripya log in ya register karein.'}
          </p>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => onNavigateToTab('auth')}
              className="w-full py-3 bg-[#0f766e] hover:bg-[#0f766e]/95 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {t('login_register_btn')}
            </button>
            <button
              onClick={() => onNavigateToTab('shop')}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {language === 'en' ? 'Go to Shop' : 'Dukaan par Wapas Jayein'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="user-profile-workspace">
      {/* Page Heading */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <span>{t('user_profile_title')}</span>
            <span className="text-xs bg-[#f59e0b] text-white px-2.5 py-0.5 rounded-full uppercase font-black">
              User Dashboard
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {t('hi_welcome')}, {currentUser.name}! {t('personal_dashboard_subtitle')}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-1.5 px-4 py-2 bg-red-50 hover:bg-red-100/80 text-red-600 border border-red-200 rounded-xl text-xs font-black transition-all cursor-pointer"
          id="profile-sign-out-btn"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('logout_btn')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT COLUMN: Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center space-x-3.5 mb-2">
            <div className="h-11 w-11 bg-teal-500/10 text-[#0f766e] font-black rounded-full flex items-center justify-center uppercase text-sm border border-teal-500/15">
              {currentUser.name.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">
                {language === 'en' ? 'Logged In As' : 'Logged In As'}
              </span>
              <p className="text-sm font-black text-slate-800 truncate mt-1">{currentUser.name}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-xs">
            <nav className="divide-y divide-slate-100">
              <button
                onClick={() => setActiveSubTab('profile')}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-xs font-bold transition-all text-left cursor-pointer ${
                  activeSubTab === 'profile'
                    ? 'bg-teal-50/70 text-[#0f766e] font-black border-l-4 border-[#0f766e]'
                    : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                }`}
                id="sidebar-subtab-profile"
              >
                <div className="flex items-center space-x-2.5">
                  <UserIcon className="h-4 w-4 text-[#0f766e]" />
                  <span>{t('profile_tab')}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSubTab('orders')}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-xs font-bold transition-all text-left cursor-pointer ${
                  activeSubTab === 'orders'
                    ? 'bg-teal-50/70 text-[#0f766e] font-black border-l-4 border-[#0f766e]'
                    : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                }`}
                id="sidebar-subtab-orders"
              >
                <div className="flex items-center space-x-2.5">
                  <Package className="h-4 w-4 text-[#0f766e]" />
                  <span>{t('orders_tab')}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSubTab('wishlist')}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-xs font-bold transition-all text-left cursor-pointer ${
                  activeSubTab === 'wishlist'
                    ? 'bg-teal-50/70 text-[#0f766e] font-black border-l-4 border-[#0f766e]'
                    : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                }`}
                id="sidebar-subtab-wishlist"
              >
                <div className="flex items-center space-x-2.5">
                  <Heart className="h-4 w-4 text-rose-500 fill-rose-500/10" />
                  <span>{t('wishlist_tab')} ({wishlistIds.length})</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSubTab('support')}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-xs font-bold transition-all text-left cursor-pointer ${
                  activeSubTab === 'support'
                    ? 'bg-teal-50/70 text-[#0f766e] font-black border-l-4 border-[#0f766e]'
                    : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                }`}
                id="sidebar-subtab-support"
              >
                <div className="flex items-center space-x-2.5">
                  <LifeBuoy className="h-4 w-4 text-amber-500" />
                  <span>{language === 'en' ? 'Help & Support' : 'Sahayata & Support'}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </nav>
          </div>
        </div>

        {/* RIGHT COLUMN: Content Panes */}
        <div className="lg:col-span-3">
          
          {/* SUB-PANEL 1: Mera Profile */}
          {activeSubTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6 animate-fade-in" id="panel-profile">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black text-slate-800">
                  {language === 'en' ? 'Personal Profile Information' : 'Personal Profile Information'}
                </h2>
                {!isEditingDetails && (
                  <button
                    onClick={() => {
                      setEditName(currentUser.name);
                      setEditPassword('');
                      setEditError('');
                      setEditSuccess('');
                      setIsEditingDetails(true);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 text-[#0f766e] rounded-xl text-xs font-black transition-all cursor-pointer border border-teal-100"
                    id="edit-profile-trigger"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>{language === 'en' ? 'Edit Details' : 'Details Badlein'}</span>
                  </button>
                )}
              </div>
              
              {isEditingDetails ? (
                <form onSubmit={handleSaveDetails} className="space-y-4 max-w-xl" id="edit-details-form">
                  {editError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl font-bold flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>{editError}</span>
                    </div>
                  )}

                  {editSuccess && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl font-bold flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{editSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                        {language === 'en' ? 'Full Name' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl py-2.5 px-3.5 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-[#0f766e]"
                        placeholder="Apna poora naam likhein"
                        id="edit-name-input"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                        {language === 'en' ? 'Username (Cannot be changed)' : 'Username (Cannot be changed)'}
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`@${currentUser.username}`}
                        className="w-full bg-slate-100 border border-slate-200 text-xs rounded-xl py-2.5 px-3.5 text-slate-400 font-mono font-bold cursor-not-allowed"
                        id="edit-username-disabled"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                        {language === 'en' ? 'New Password (Optional)' : 'Naya Password (Optional)'}
                      </label>
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl py-2.5 px-3.5 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-[#0f766e]"
                        placeholder={language === 'en' ? "Leave empty to keep same" : "Same rakhne ke liye khali chodein"}
                        id="edit-password-input"
                      />
                    </div>

                    <div className="flex items-end justify-start space-x-2 pt-2 md:pt-0">
                      <button
                        type="button"
                        onClick={() => setIsEditingDetails(false)}
                        className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer"
                        id="cancel-edit-btn"
                      >
                        {t('cancel_btn')}
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingDetails}
                        className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#0c615a] text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                        id="save-edit-btn"
                      >
                        {isSavingDetails ? (language === 'en' ? 'Saving...' : 'Saving...') : (language === 'en' ? 'Save Changes' : 'Badlav Safe Karein')}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {language === 'en' ? 'Full Name' : 'Full Name'}
                    </span>
                    <div className="mt-1.5 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl font-bold text-slate-800">
                      {currentUser.name}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {t('username_lbl')}
                    </span>
                    <div className="mt-1.5 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl font-mono text-slate-700 font-bold">
                      @{currentUser.username}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {language === 'en' ? 'Account Role' : 'Account Role'}
                    </span>
                    <div className="mt-1.5 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl font-bold text-teal-800 flex items-center space-x-1.5 capitalize">
                      <span className="h-2 w-2 rounded-full bg-teal-500 inline-block"></span>
                      <span>{currentUser.role} Account</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {language === 'en' ? 'Country & Regional Currency' : 'Country & Regional Currency'}
                    </span>
                    <div className="mt-1.5 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl font-bold text-slate-800">
                      India (INR, ₹)
                    </div>
                  </div>
                </div>
              )}

              {/* Shopping Quick Metrics */}
              <div className="pt-6 border-t border-slate-100">
                <span className="text-xs font-black text-slate-700 block mb-4">
                  {language === 'en' ? 'Quick Account Stats' : 'Quick Account Stats'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl text-center">
                    <span className="text-2xl font-black text-[#0f766e] block">{wishlistIds.length}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">
                      {language === 'en' ? 'Wishlist Items' : 'Wishlist Items'}
                    </span>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center">
                    <span className="text-2xl font-black text-amber-700 block">INR (₹)</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">
                      {language === 'en' ? 'Default Currency' : 'Default Currency'}
                    </span>
                  </div>

                  <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-center">
                    <span className="text-2xl font-black text-purple-700 block">
                      {language === 'en' ? 'Active' : 'Active'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">Status</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-PANEL 2: Mere Orders */}
          {activeSubTab === 'orders' && (
            <div className="space-y-6 animate-fade-in" id="panel-orders">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-black text-slate-800">
                    {language === 'en' ? 'Order Purchase History' : 'Order Purchase History'}
                  </h2>
                  <button
                    onClick={fetchUserOrders}
                    className="p-2 hover:bg-slate-100 rounded-lg text-[#0f766e] transition-colors"
                    title="Refresh orders list"
                  >
                    <RefreshCw className={`h-4 w-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-16 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="h-7 w-7 text-[#0f766e] animate-spin" />
                    <p className="text-xs text-slate-500 font-bold">
                      {language === 'en' ? 'Loading your orders...' : 'Aapke orders fetch ho rahe hain...'}
                    </p>
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-12 text-red-600 font-bold text-xs">
                    {ordersError}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80 mt-6">
                    <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">{t('no_orders')}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'en' 
                        ? 'Check out our amazing deals and start shopping!' 
                        : "Home Maker's Bazar ke amazing deals check karein aur shopping karein!"}
                    </p>
                    <button
                      onClick={() => onNavigateToTab('shop')}
                      className="mt-4 px-5 py-2 bg-[#0f766e] hover:bg-[#0f766e]/90 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      {language === 'en' ? 'Browse Deals' : 'Deals Dekhein'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    {orders.map((ord) => (
                      <div 
                        key={ord.id} 
                        className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 hover:border-teal-500/40 transition-all shadow-xs"
                        id={`user-order-${ord.id}`}
                      >
                        {/* Order info row */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/60 pb-3 mb-4 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold block">ORDER ID</span>
                            <span className="text-sm font-black text-[#0f766e] font-mono">{ord.id}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block text-left sm:text-right">
                              {language === 'en' ? 'PURCHASE DATE' : 'KHARIDARI DATE'}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block text-left sm:text-right">
                              {language === 'en' ? 'TRACKING STATUS' : 'TRACKING STATUS'}
                            </span>
                            <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase mt-1 ${
                              ord.status === 'delivered' 
                                ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/20' 
                                : ord.status === 'shipped' 
                                ? 'bg-teal-500/15 text-teal-800 border border-teal-500/20'
                                : ord.status === 'returned'
                                ? 'bg-rose-500/15 text-rose-800 border border-rose-500/20'
                                : 'bg-amber-500/15 text-amber-800 border border-amber-500/20'
                            }`}>
                              {ord.status}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3 mb-4">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-b-0">
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-200" 
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 line-clamp-1">{item.name}</span>
                                  <span className="text-slate-400 text-[10px] block font-bold mt-0.5">
                                    {language === 'en' ? 'Qty:' : 'Quantity:'} {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                              <span className="font-black text-slate-900">
                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order summary and tracking CTA */}
                        <div className="bg-white/80 rounded-xl p-3 border border-slate-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
                          <div className="space-y-1">
                            <div className="text-xs text-slate-600 flex items-center space-x-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-500 truncate max-w-[250px]" title={ord.customerAddress}>
                                {ord.customerAddress}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 flex items-center space-x-1">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-mono text-slate-500">{ord.customerPhone}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-4">
                            <div className="text-right pr-2">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">
                                {t('total_amount_lbl')}
                              </span>
                              <span className="text-base font-black text-slate-900 font-mono">
                                ₹{ord.totalAmount.toLocaleString('en-IN')}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Return Order option - Enabled only after status of order is set to delivered */}
                              {ord.status === 'returned' ? (
                                <span className="px-3.5 py-2 bg-rose-50 border border-rose-200/60 text-rose-600 text-xs font-black rounded-xl">
                                  {t('returned_successfully')}
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedReturnOrder(ord);
                                    setReturnReason('');
                                    setReturnSuccessMsg('');
                                    setReturnErrorMsg('');
                                  }}
                                  disabled={ord.status !== 'delivered'}
                                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs border flex items-center space-x-1 ${
                                    ord.status === 'delivered'
                                      ? 'bg-rose-50 hover:bg-rose-100/90 text-rose-600 border-rose-200 cursor-pointer'
                                      : 'bg-slate-100/60 text-slate-400 border-slate-200/50 cursor-not-allowed'
                                  }`}
                                  title={ord.status !== 'delivered' ? (language === 'en' ? 'Return available only after order is delivered' : 'Order delivered hone ke baad hi return available hoga') : 'Return order request karein'}
                                  id={`user-order-return-btn-${ord.id}`}
                                >
                                  <CornerDownLeft className="h-3.5 w-3.5" />
                                  <span>{t('return_order_btn')}</span>
                                </button>
                              )}

                              <button
                                onClick={() => onTrackOrder(ord.id)}
                                className="px-4 py-2 bg-[#0f766e] hover:bg-[#08534d] text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer flex items-center space-x-1"
                                id={`user-order-track-btn-${ord.id}`}
                              >
                                <span>{t('track_button_small')}</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-PANEL 3: Meri Wish List */}
          {activeSubTab === 'wishlist' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs animate-fade-in" id="panel-wishlist">
              <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">
                {language === 'en' ? 'My Saved Wish List' : 'Meri Wish List'}
              </h2>

              {wishlistedProducts.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80">
                  <Heart className="h-10 w-10 text-rose-300 fill-rose-100 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-bold text-slate-700">{t('wishlist_empty')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('wishlist_help')}</p>
                  <button
                    onClick={() => onNavigateToTab('shop')}
                    className="mt-4 px-5 py-2 bg-[#0f766e] hover:bg-[#0f766e]/90 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    {language === 'en' ? 'Browse Catalog' : 'Catalog Browse Karein'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="profile-wishlist-grid">
                  {wishlistedProducts.map((p) => {
                    const isOutOfStock = p.stock <= 0;
                    return (
                      <div 
                        key={p.id} 
                        className="bg-white rounded-2xl border border-slate-200/80 hover:border-teal-500/40 p-4 transition-all hover:shadow-md flex flex-col h-full justify-between"
                        id={`wishlist-item-${p.id}`}
                      >
                        <div>
                          {/* Image and delete button overlay */}
                          <div className="relative pt-[65%] rounded-xl overflow-hidden bg-slate-100/50 border border-slate-200 mb-3">
                            <img 
                              src={p.image} 
                              alt={p.name} 
                              className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => onViewProductDetails(p)}
                              referrerPolicy="no-referrer"
                            />
                            <button
                              onClick={() => onToggleWishlist(p)}
                              className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 hover:text-red-700 p-1.5 rounded-full shadow-xs transition-colors cursor-pointer border border-slate-200"
                              title={language === 'en' ? 'Remove from Wishlist' : 'Wishlist se hatayein'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <span className="absolute bottom-2 left-2 bg-white/90 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200/60 shadow-xs">
                              {p.category}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex items-center space-x-1 text-amber-500 text-xs mb-1">
                            <Star className="h-3.5 w-3.5 fill-amber-500" />
                            <span className="font-bold text-slate-700">{p.rating > 0 ? p.rating : 'N/A'}</span>
                          </div>

                          <h4 
                            onClick={() => onViewProductDetails(p)}
                            className="text-sm font-black text-slate-800 hover:text-[#0f766e] cursor-pointer transition-colors line-clamp-1 leading-tight mb-1"
                          >
                            {p.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-4">{p.description}</p>
                        </div>

                        {/* CTA and price */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold">{t('price')}</span>
                            <span className="text-sm font-black text-slate-800">₹{p.price.toLocaleString('en-IN')}</span>
                          </div>

                          <button
                            onClick={() => onAddToCart(p)}
                            disabled={isOutOfStock}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center space-x-1 ${
                              isOutOfStock
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-[#0f766e] text-white hover:bg-[#0c615a] cursor-pointer shadow-xs'
                            }`}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            <span>{t('add_btn')}</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          )}

          {/* SUB-PANEL 4: Help & Support Seva Kendra inside Profile */}
          {activeSubTab === 'support' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-2 md:p-4 shadow-xs animate-fade-in" id="panel-support">
              <HelpSupport 
                currentUser={currentUser} 
                onNavigateToTab={(tab) => {
                  if (tab === 'tracker') {
                    onNavigateToTab('tracker');
                  } else {
                    setActiveSubTab('profile');
                  }
                }}
                onTrackOrder={onTrackOrder}
              />
            </div>
          )}

        </div>
      </div>

      {/* Return Order Modal */}
      {selectedReturnOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="return-order-modal">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedReturnOrder(null)}></div>
          
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-md border border-slate-100 p-6 z-10 animate-fade-in">
              <button
                onClick={() => setSelectedReturnOrder(null)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-base font-black text-slate-800 flex items-center space-x-2 mb-2">
                <CornerDownLeft className="h-5 w-5 text-rose-500" />
                <span>{t('return_modal_title')}</span>
              </h3>
              <p className="text-xs text-slate-500 font-bold mb-4">
                {language === 'en' ? 'Start a return request for Order ID:' : 'ke liye return request start karein.'} <span className="font-mono text-[#0f766e] font-black">#{selectedReturnOrder.id}</span>
              </p>

              {returnSuccessMsg && (
                <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-3 py-2.5 rounded-xl font-bold flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{returnSuccessMsg}</span>
                </div>
              )}

              {returnErrorMsg && (
                <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs px-3 py-2.5 rounded-xl font-bold flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{returnErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleReturnSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('return_reason_lbl')}
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder={t('return_reason_placeholder')}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl py-2.5 px-3 text-slate-800 focus:outline-none focus:bg-white focus:border-[#0f766e] resize-none font-semibold"
                    id="return-reason-input"
                  ></textarea>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReturnOrder(null)}
                    className="w-1/2 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    {t('cancel_btn')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReturn || !returnReason.trim()}
                    className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReturn ? (language === 'en' ? 'Processing...' : 'Processing...') : t('submit_return_btn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
