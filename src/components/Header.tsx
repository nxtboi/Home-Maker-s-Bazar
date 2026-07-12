import React from 'react';
import { ShoppingCart, Search, ShieldCheck, Truck, Store, LogOut, User as UserIcon, ChevronDown, Heart, Languages, LifeBuoy } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  activeTab: 'shop' | 'tracker' | 'admin' | 'auth' | 'profile' | 'support';
  setActiveTab: (tab: 'shop' | 'tracker' | 'admin' | 'auth' | 'profile' | 'support') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  currentUser: User | null;
  onLogout: () => void;
  setProfileSubTab?: (subTab: 'profile' | 'orders' | 'wishlist' | 'support') => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  cartCount,
  onOpenCart,
  currentUser,
  onLogout,
  setProfileSubTab,
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0f766e]/80 backdrop-blur-lg text-white border-b border-white/15 shadow-md" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Flipkart style Logo */}
          <div 
            className="flex flex-col cursor-pointer select-none justify-center hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200" 
            onClick={() => setActiveTab('shop')}
            id="logo-container"
          >
            <div className="flex items-center space-x-1">
              <span className="text-xl font-display font-black tracking-wider uppercase">
                Home Maker's<span className="text-[#f59e0b] ml-1">{t('logo_sub')}</span>
              </span>
            </div>
          </div>

          {/* Flipkart-like Central Search Bar */}
          {activeTab === 'shop' && (
            <div className="flex-1 max-w-xl mx-6 hidden md:block" id="search-container">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/20 text-white placeholder-teal-100 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:bg-white/95 focus:text-slate-800 focus:placeholder-slate-400 border border-white/20 focus:border-white transition-all shadow-inner"
                  id="search-input"
                />
                <button className="absolute right-0 top-0 bottom-0 px-4 text-white hover:text-[#f59e0b] flex items-center justify-center transition-colors">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Navigation & Controls */}
          <div className="flex items-center space-x-2 md:space-x-4" id="navigation-controls">

            <button
              onClick={() => setActiveTab('shop')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${
                activeTab === 'shop'
                  ? 'bg-white/20 border-white/25 text-white shadow-xs'
                  : 'border-transparent text-white/90 hover:bg-white/10 hover:text-white'
              }`}
              id="nav-shop-btn"
            >
              <Store className="h-4 w-4" />
              <span>{t('nav_shop')}</span>
            </button>

            {/* My Account Dropdown */}
            <div className="relative" ref={dropdownRef} id="my-account-dropdown-container">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border cursor-pointer ${
                  isDropdownOpen || activeTab === 'tracker' || activeTab === 'auth' || activeTab === 'admin' || activeTab === 'profile'
                    ? 'bg-white/20 border-white/25 text-white shadow-xs'
                    : 'border-transparent text-white/90 hover:bg-white/10 hover:text-white'
                }`}
                id="my-account-btn"
              >
                <UserIcon className="h-4 w-4" />
                <span>
                  {currentUser ? `${t('namaste')}, ${currentUser.name.split(' ')[0]}` : t('my_account')}
                </span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-2 text-slate-800 z-50 animate-fade-in"
                  id="my-account-dropdown-menu"
                >
                  {/* Account Info / Status */}
                  {currentUser && (
                    <div className="px-4 py-2 border-b border-slate-100 mb-1" id="dropdown-user-info">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">{t('logged_in_as')}</p>
                      <p className="text-xs font-black text-[#0f766e] mt-1 truncate">{currentUser.name}</p>
                    </div>
                  )}

                  {/* My Profile */}
                  <button
                    onClick={() => {
                      if (currentUser) {
                        if (setProfileSubTab) setProfileSubTab('profile');
                        setActiveTab('profile');
                      } else {
                        setActiveTab('auth');
                      }
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all text-left hover:bg-slate-50 cursor-pointer ${
                      activeTab === 'profile' ? 'text-[#0f766e] bg-teal-50/50' : 'text-slate-700'
                    }`}
                    id="dropdown-profile-btn"
                  >
                    <UserIcon className="h-4 w-4 text-[#0f766e]" />
                    <span>{t('my_profile')}</span>
                  </button>

                  {/* My Orders Option */}
                  <button
                    onClick={() => {
                      if (currentUser) {
                        if (setProfileSubTab) setProfileSubTab('orders');
                        setActiveTab('profile');
                      } else {
                        setActiveTab('auth');
                      }
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all text-left hover:bg-slate-50 cursor-pointer text-slate-700"
                    id="dropdown-my-orders-btn"
                  >
                    <Truck className="h-4 w-4 text-[#0f766e]" />
                    <span>{t('my_orders')}</span>
                  </button>

                  {/* Wish List Option */}
                  <button
                    onClick={() => {
                      if (setProfileSubTab) setProfileSubTab('wishlist');
                      setActiveTab('profile');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all text-left hover:bg-slate-50 cursor-pointer text-slate-700"
                    id="dropdown-wishlist-btn"
                  >
                    <Heart className="h-4 w-4 text-rose-500 fill-rose-500/10" />
                    <span>{t('wish_list')}</span>
                  </button>

                  {/* Track Order Option */}
                  <button
                    onClick={() => {
                      setActiveTab('tracker');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all text-left hover:bg-slate-50 cursor-pointer border-t border-slate-100/60 ${
                      activeTab === 'tracker' ? 'text-[#0f766e] bg-teal-50/50' : 'text-slate-700'
                    }`}
                    id="dropdown-track-order-btn"
                  >
                    <Truck className="h-4 w-4 text-[#0f766e]" />
                    <span>{t('track_order_by_id')}</span>
                  </button>

                  {/* Help & Support Option */}
                  <button
                    onClick={() => {
                      if (setProfileSubTab) setProfileSubTab('support');
                      setActiveTab('profile');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all text-left hover:bg-slate-50 cursor-pointer border-t border-slate-100/60 ${
                      activeTab === 'profile' ? 'text-[#0f766e] bg-teal-50/50' : 'text-slate-700'
                    }`}
                    id="dropdown-support-btn"
                  >
                    <LifeBuoy className="h-4 w-4 text-amber-500" />
                    <span>{language === 'en' ? 'Help & Support' : 'Sahayata & Support'}</span>
                  </button>

                  {/* Admin Panel Option (If user is Admin) */}
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all text-left hover:bg-slate-50 cursor-pointer ${
                        activeTab === 'admin' ? 'text-[#0f766e] bg-teal-50/50' : 'text-slate-700'
                      }`}
                      id="dropdown-admin-btn"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#0f766e]" />
                      <span>{t('admin_panel')}</span>
                    </button>
                  )}

                  {/* Login or Logout Option */}
                  {currentUser ? (
                    <button
                      onClick={() => {
                        onLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50/50 transition-all text-left border-t border-slate-100 mt-1 cursor-pointer"
                      id="dropdown-logout-btn"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('log_out')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveTab('auth');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all text-left hover:bg-slate-50 border-t border-slate-100 mt-1 cursor-pointer ${
                        activeTab === 'auth' ? 'text-[#0f766e] bg-teal-50/50' : 'text-slate-700'
                      }`}
                      id="dropdown-login-btn"
                    >
                      <UserIcon className="h-4 w-4 text-[#0f766e]" />
                      <span>{t('login_register')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Cart Button with Flipkart Styling */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-1.5 px-3 py-1.5 text-white hover:bg-white/10 rounded-lg font-bold text-sm cursor-pointer transition-all border border-transparent hover:border-white/10"
              id="cart-trigger-btn"
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5 text-white fill-white/10" />
                {cartCount > 0 && (
                  <span className="absolute -top-2.5 -right-2 bg-[#ff1212] border border-white text-white text-[9px] font-black rounded-full h-4.5 w-4.5 flex items-center justify-center animate-bounce">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline">{t('cart')}</span>
            </button>

            {/* Language Switcher on Right Most Side */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 transition-all text-xs font-black select-none cursor-pointer"
              id="language-toggle-btn"
              title={language === 'en' ? "Switch to Hinglish" : "Switch to English"}
            >
              <Languages className="h-3.5 w-3.5 text-amber-400" />
              <span className="tracking-wider">{language === 'en' ? 'ENGLISH' : 'HINGLISH'}</span>
            </button>

          </div>
        </div>

        {/* Mobile Search Bar */}
        {activeTab === 'shop' && (
          <div className="pb-3 md:hidden" id="mobile-search-container">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={t('search_items_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/25 text-white placeholder-blue-100 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none border border-white/15"
                id="mobile-search-input"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-100">
                <Search className="h-4 w-4" />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
