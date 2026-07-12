import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, ShieldAlert, BadgePercent, Star, ArrowRight, Sparkles, AlertCircle, RefreshCw, Home, Store, Truck, User as UserIcon, LifeBuoy } from 'lucide-react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import CartDrawer from './components/CartDrawer';
import OrderTracker from './components/OrderTracker';
import AdminPanel from './components/AdminPanel';
import DealBanner from './components/DealBanner';
import AuthPage from './components/AuthPage';
import UserProfile from './components/UserProfile';
import HelpSupport from './components/HelpSupport';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import { Product, OrderItem, User } from './types';
import { INITIAL_PRODUCTS } from './data/products';

export default function App() {
  const [activeTab, setActiveTabState] = useState<'shop' | 'tracker' | 'admin' | 'auth' | 'profile' | 'support' | 'privacy' | 'terms'>(() => {
    const validTabs = ['shop', 'tracker', 'admin', 'auth', 'profile', 'support', 'privacy', 'terms'];
    
    // 1. Check pathname
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    if (validTabs.includes(path)) {
      return path as any;
    }
    
    // 2. Check query parameter '?page=...' or '?tab=...'
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page') || params.get('tab');
    if (pageParam && validTabs.includes(pageParam.toLowerCase())) {
      return pageParam.toLowerCase() as any;
    }
    
    // 3. Check localStorage fallback
    const saved = localStorage.getItem('ab_active_tab');
    if (saved && validTabs.includes(saved)) {
      return saved as any;
    }
    
    return 'shop';
  });

  const setActiveTab = (tab: 'shop' | 'tracker' | 'admin' | 'auth' | 'profile' | 'support' | 'privacy' | 'terms') => {
    setActiveTabState(tab);
    localStorage.setItem('ab_active_tab', tab);
    
    // Update the URL path to match the separate page URL
    const newPath = '/' + tab;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ tab }, '', newPath + window.location.search);
    }
  };

  // Sync state with browser navigation events (Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      const validTabs = ['shop', 'tracker', 'admin', 'auth', 'profile', 'support', 'privacy', 'terms'];
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      
      if (validTabs.includes(path)) {
        setActiveTabState(path as any);
      } else {
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page') || params.get('tab');
        if (pageParam && validTabs.includes(pageParam.toLowerCase())) {
          setActiveTabState(pageParam.toLowerCase() as any);
        } else {
          setActiveTabState('shop');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Redirect root / or index.html to /shop for clean initial URL
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    if (path === '' || path === 'index.html') {
      window.history.replaceState({ tab: 'shop' }, '', '/shop' + window.location.search);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  const [profileSubTab, setProfileSubTab] = useState<'profile' | 'orders' | 'wishlist' | 'support'>('profile');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem('ab_products');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRODUCTS;
  });
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Tracking navigation state
  const [autoTrackOrderId, setAutoTrackOrderId] = useState('');
  const [recentOrderId, setRecentOrderId] = useState('');
  const [orderNotification, setOrderNotification] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  // Load products and local caches from API
  useEffect(() => {
    let hasLocal = false;
    const savedProducts = localStorage.getItem('ab_products');
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIsLoading(false);
          hasLocal = true;
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchProducts(!hasLocal);

    // Load cached cart if any
    const savedCart = localStorage.getItem('ab_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }
    // Load cached user if any
    const savedUser = localStorage.getItem('ab_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    // Load cached wishlist if any
    const savedWishlist = localStorage.getItem('ab_wishlist');
    if (savedWishlist) {
      try {
        setWishlistIds(JSON.parse(savedWishlist));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleToggleWishlist = (product: Product) => {
    setWishlistIds(prev => {
      const isSaved = prev.includes(product.id);
      const updated = isSaved 
        ? prev.filter(id => id !== product.id)
        : [...prev, product.id];
      localStorage.setItem('ab_wishlist', JSON.stringify(updated));
      return updated;
    });
  };

  const fetchProducts = async (forceLoading = false) => {
    let hasLocal = false;
    try {
      const savedProducts = localStorage.getItem('ab_products');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          hasLocal = true;
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (forceLoading || !hasLocal) {
      setIsLoading(true);
    }
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        localStorage.setItem('ab_products', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      if (!hasLocal) {
        const savedProducts = localStorage.getItem('ab_products');
        if (savedProducts) {
          try {
            setProducts(JSON.parse(savedProducts));
          } catch (e) {
            setProducts(INITIAL_PRODUCTS);
          }
        } else {
          setProducts(INITIAL_PRODUCTS);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => {
      const updated = [newProduct, ...prev];
      localStorage.setItem('ab_products', JSON.stringify(updated));
      return updated;
    });
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setProducts(prev => {
      const updated = prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      localStorage.setItem('ab_products', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== productId);
      localStorage.setItem('ab_products', JSON.stringify(updated));
      return updated;
    });
  };

  const saveCartToStorage = (items: OrderItem[]) => {
    localStorage.setItem('ab_cart', JSON.stringify(items));
  };

  // Cart Management
  const handleAddToCart = (product: Product) => {
    const existingIdx = cartItems.findIndex(item => item.productId === product.id);
    let updated: OrderItem[] = [];

    if (existingIdx !== -1) {
      updated = [...cartItems];
      updated[existingIdx].quantity += 1;
    } else {
      updated = [
        ...cartItems,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        }
      ];
    }
    setCartItems(updated);
    saveCartToStorage(updated);
    
    // Quick pop-up animation notice
    setOrderNotification(`${product.name} successfully cart mein joda gaya!`);
    setTimeout(() => setOrderNotification(''), 3000);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    const updated = cartItems.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    );
    setCartItems(updated);
    saveCartToStorage(updated);
  };

  const handleRemoveItem = (productId: string) => {
    const updated = cartItems.filter(item => item.productId !== productId);
    setCartItems(updated);
    saveCartToStorage(updated);
  };

  const handleClearCart = () => {
    setCartItems([]);
    localStorage.removeItem('ab_cart');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ab_user');
    setActiveTab('shop');
    setOrderNotification('Aap successfully logout ho chuke hain.');
    setTimeout(() => setOrderNotification(''), 3000);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ab_user', JSON.stringify(user));
    setOrderNotification(`Namaste, ${user.name}! Aapka login safal raha.`);
    setTimeout(() => setOrderNotification(''), 4000);
    
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('shop');
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('ab_user', JSON.stringify(updatedUser));
    setOrderNotification(`Details updated successfully, ${updatedUser.name}!`);
    setTimeout(() => setOrderNotification(''), 4000);
  };

  const handleOrderPlaced = (orderId: string) => {
    setRecentOrderId(orderId);
    setAutoTrackOrderId(orderId);
    // Switch to tracker and load order ID
    setActiveTab('tracker');
    
    // Popup banner congratulating user
    setOrderNotification(`Congratulations! Aapka order successfully place ho gaya hai. Order ID: ${orderId}`);
    setTimeout(() => setOrderNotification(''), 6000);
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 font-sans flex flex-col justify-between relative" id="app-root">
      
      {/* Ambient Decorative Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-teal-200/40 blur-[80px] animate-float-slow"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-amber-100/40 blur-[90px] animate-float-delayed"></div>
        <div className="absolute top-[50%] left-[45%] w-[300px] h-[300px] rounded-full bg-emerald-100/30 blur-[75px] animate-float-slow" style={{ animationDelay: '-4s' }}></div>
      </div>
      
      {/* Header with Flipkart Vibe */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        setProfileSubTab={setProfileSubTab}
      />

      {/* Real-time Toast Notifications */}
      {orderNotification && (
        <div className="fixed bottom-5 left-5 z-50 bg-[#0f766e] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-white/20 animate-bounce flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-[#f59e0b]" />
          <span>{orderNotification}</span>
        </div>
      )}

      {/* ---------------- Main View Router ---------------- */}
      <main className="flex-grow pb-24 md:pb-16">
        
        {/* VIEW 1: Shop */}
        {activeTab === 'shop' && (
          <div className="space-y-6 animate-fade-in">
            {/* Category selection and Deal Slider banner */}
            <DealBanner 
              onSelectCategory={setSelectedCategory} 
              selectedCategory={selectedCategory} 
            />

            {/* Product Catalog Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
              
              {/* Filter feedback title */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg md:text-xl font-display font-black text-slate-800 flex items-center space-x-2">
                  <span>{selectedCategory === 'All' ? 'Trending Loot Deals' : `${selectedCategory} Collection`}</span>
                  <span className="bg-[#f59e0b] text-white text-xs px-2.5 py-0.5 rounded-full font-black shadow-xs">
                    {filteredProducts.length} items
                  </span>
                </h2>
                {selectedCategory !== 'All' && (
                  <button 
                    onClick={() => setSelectedCategory('All')} 
                    className="text-xs text-[#0f766e] font-bold hover:underline"
                  >
                    Show All
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-24 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="h-8 w-8 text-[#0f766e] animate-spin" />
                  <p className="text-sm font-bold text-slate-500">Home Maker's Bazar live catalogue update ho raha hai...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Koi item nahi mila.</p>
                  <p className="text-xs text-slate-400 mt-1">Naye terms search karein ya categories change karein.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6" id="shop-catalog-grid">
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={handleAddToCart}
                      onViewDetails={(p) => setSelectedProduct(p)}
                      isWishlisted={wishlistIds.includes(p.id)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Flipkart-like Trust Badges strip */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
              <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-1">
                  <span className="text-lg font-extrabold text-slate-800 block">⚡ Free & Tez Delivery</span>
                  <p className="text-xs text-slate-400">Super Fast 7-15 days delivery</p>
                </div>
                <div className="space-y-1 md:border-x md:border-slate-100 md:px-6">
                  <span className="text-lg font-extrabold text-slate-800 block">🔒 100% Safe Payments</span>
                  <p className="text-xs text-slate-400">Super safe payments with Razor Pay</p>
                </div>
                <div className="space-y-1">
                  <span className="text-lg font-extrabold text-slate-800 block">🔄 Easy Returns</span>
                  <p className="text-xs text-slate-400">No questions asked, straightforward 7 days exchange policy.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Order Tracker (Real-time updates) */}
        {activeTab === 'tracker' && (
          <div className="animate-fade-in">
            <OrderTracker initialOrderId={autoTrackOrderId} />
          </div>
        )}

        {/* VIEW 3: Admin Management Console */}
        {activeTab === 'admin' && (
          <div className="animate-fade-in">
            {currentUser?.role === 'admin' ? (
              <AdminPanel 
                onRefreshProducts={fetchProducts} 
                products={products} 
                onAddProduct={handleAddProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            ) : (
              <AuthPage
                onLoginSuccess={handleLoginSuccess}
                onBackToShop={() => setActiveTab('shop')}
                forcedAdminMessage={
                  currentUser
                    ? "Aap abhi normal user ke taur par logged in hain. Kripya Admin Account ('sanju1234') se log in karein."
                    : "Seller Admin Panel ko access karne ke liye kripya Admin credentials se log in karein."
                }
              />
            )}
          </div>
        )}

        {/* VIEW 4: Authentication Gateway */}
        {activeTab === 'auth' && (
          <div className="animate-fade-in">
            <AuthPage
              onLoginSuccess={handleLoginSuccess}
              onBackToShop={() => setActiveTab('shop')}
            />
          </div>
        )}

        {/* VIEW 5: User Profile & Personal Dashboard */}
        {activeTab === 'profile' && (
          <UserProfile
            currentUser={currentUser}
            onLogout={handleLogout}
            products={products}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            initialSubTab={profileSubTab}
            onNavigateToTab={setActiveTab}
            onViewProductDetails={(p) => setSelectedProduct(p)}
            onTrackOrder={(orderId) => {
              setAutoTrackOrderId(orderId);
              setActiveTab('tracker');
            }}
            onUserUpdate={handleUserUpdate}
          />
        )}

        {/* VIEW 6: Help & Support Seva Kendra */}
        {activeTab === 'support' && (
          <HelpSupport 
            currentUser={currentUser} 
            onNavigateToTab={setActiveTab}
            onTrackOrder={(orderId) => {
              setAutoTrackOrderId(orderId);
              setActiveTab('tracker');
            }}
          />
        )}

        {/* VIEW 7: Privacy Policy */}
        {activeTab === 'privacy' && (
          <PrivacyPolicy />
        )}

        {/* VIEW 8: Terms of Use */}
        {activeTab === 'terms' && (
          <TermsOfUse />
        )}

      </main>

      {/* ---------------- Drawers & Overlays ---------------- */}
      
      {/* 1. Flipkart Sliding Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        currentUser={currentUser}
      />

      {/* 2. Product Details & Live Review Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          isWishlisted={wishlistIds.includes(selectedProduct.id)}
          onToggleWishlist={handleToggleWishlist}
          currentUser={currentUser}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-800 mt-auto pb-24 md:pb-8" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-extrabold text-[#f59e0b] text-sm">Home Maker's Bazar E-Commerce Private Limited</p>
            <p className="mt-1">© 2026 Home Maker's Bazar. Build by House maker for House makers.</p>
          </div>
          <div className="flex space-x-6 text-[11px] font-semibold">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); setActiveTab('privacy'); }} className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" onClick={(e) => { e.preventDefault(); setActiveTab('terms'); }} className="hover:text-white transition-colors">Terms of Use</a>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden px-2 py-2 flex justify-around items-center" id="mobile-bottom-nav">
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex flex-col items-center space-y-1 py-1 px-3.5 rounded-xl transition-all ${
            activeTab === 'shop' ? 'text-[#0f766e]' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="mobile-nav-shop"
        >
          <Home className={`h-5 w-5 ${activeTab === 'shop' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-black tracking-wider uppercase">
            {localStorage.getItem('ab_lang') === 'hi' ? 'Bazar' : 'Shop'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex flex-col items-center space-y-1 py-1 px-3.5 rounded-xl transition-all ${
            activeTab === 'tracker' ? 'text-[#0f766e]' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="mobile-nav-tracker"
        >
          <Truck className={`h-5 w-5 ${activeTab === 'tracker' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-black tracking-wider uppercase">
            {localStorage.getItem('ab_lang') === 'hi' ? 'Track' : 'Tracker'}
          </span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center space-y-1 py-1 px-3.5 rounded-xl transition-all text-slate-500 relative"
          id="mobile-nav-cart"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartItems.reduce((sum, i) => sum + i.quantity, 0) > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center">
                {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black tracking-wider uppercase">
            {localStorage.getItem('ab_lang') === 'hi' ? 'Cart' : 'Cart'}
          </span>
        </button>

        <button
          onClick={() => {
            if (currentUser) {
              setProfileSubTab('profile');
              setActiveTab('profile');
            } else {
              setActiveTab('auth');
            }
          }}
          className={`flex flex-col items-center space-y-1 py-1 px-3.5 rounded-xl transition-all ${
            activeTab === 'profile' || activeTab === 'auth' ? 'text-[#0f766e]' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="mobile-nav-profile"
        >
          <UserIcon className={`h-5 w-5 ${activeTab === 'profile' || activeTab === 'auth' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-black tracking-wider uppercase">
            {localStorage.getItem('ab_lang') === 'hi' ? 'Profile' : 'Account'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`flex flex-col items-center space-y-1 py-1 px-3.5 rounded-xl transition-all ${
            activeTab === 'support' ? 'text-[#0f766e]' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="mobile-nav-support"
        >
          <LifeBuoy className={`h-5 w-5 ${activeTab === 'support' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-black tracking-wider uppercase">
            {localStorage.getItem('ab_lang') === 'hi' ? 'Madaat' : 'Support'}
          </span>
        </button>
      </div>

    </div>
  );
}
