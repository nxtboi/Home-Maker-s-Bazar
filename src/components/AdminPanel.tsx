import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, CheckCircle, Package, Truck, Calendar, Sparkles, FolderPlus, DollarSign, ListOrdered, Save, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown, MessageSquare } from 'lucide-react';
import { Product, Order, OrderStatus, SupportTicket } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AdminPanelProps {
  onRefreshProducts: () => void;
  products: Product[];
  onAddProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
}

export default function AdminPanel({
  onRefreshProducts,
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: AdminPanelProps) {
  const [adminTab, setAdminTabState] = useState<'products' | 'orders' | 'tickets'>(() => {
    const saved = localStorage.getItem('ab_admin_tab');
    if (saved) {
      return saved as any;
    }
    return 'products';
  });

  const setAdminTab = (tab: 'products' | 'orders' | 'tickets') => {
    setAdminTabState(tab);
    localStorage.setItem('ab_admin_tab', tab);
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const { t, language } = useLanguage();
  
  // Product Form states
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodCategory, setProdCategory] = useState('Accessories');
  const [prodStock, setProdStock] = useState('');

  // Status updates states for order dispatching
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('placed');
  const [customNote, setCustomNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Payment status states
  const [newPaymentStatus, setNewPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'processing'>('processing');
  const [isUpdatingPaymentStatus, setIsUpdatingPaymentStatus] = useState(false);

  // Sorting states
  const [sortField, setSortField] = useState<'date' | 'customer' | 'status' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Product deletion confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      setNewStatus(selectedOrder.status);
      setNewPaymentStatus(selectedOrder.paymentStatus || 'processing');
    }
  }, [selectedOrder]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        return;
      }
    } catch (err) {
      console.warn('Error fetching orders from API, trying local storage:', err);
    }

    // Local storage fallback lookup
    try {
      const savedOrdersRaw = localStorage.getItem('ab_orders') || '[]';
      const localOrders = JSON.parse(savedOrdersRaw);
      setOrders(localOrders);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        return;
      }
    } catch (err) {
      console.warn('Error fetching tickets from API, trying local storage:', err);
    }

    // Local storage fallback lookup
    try {
      const savedTicketsRaw = localStorage.getItem('ab_tickets') || '[]';
      const localTickets = JSON.parse(savedTicketsRaw);
      setTickets(localTickets);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplyTicket = async (ticketId: string) => {
    if (!ticketReply.trim()) return;
    setIsSubmittingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: ticketReply.trim(),
          status: 'resolved'
        })
      });
      if (res.ok) {
        const updatedTicket = await res.json();
        setTicketReply('');
        setSelectedTicket(updatedTicket);
        fetchTickets();
        setIsSubmittingReply(false);
        return;
      }
    } catch (err) {
      console.warn('Error replying ticket via API, falling back to local storage:', err);
    }

    // Local storage fallback ticket reply
    try {
      const savedTicketsRaw = localStorage.getItem('ab_tickets') || '[]';
      const localTickets = JSON.parse(savedTicketsRaw);
      const ticketIdx = localTickets.findIndex((t: any) => t.id === ticketId);
      if (ticketIdx !== -1) {
        localTickets[ticketIdx].status = 'resolved';
        localTickets[ticketIdx].reply = ticketReply.trim();
        localStorage.setItem('ab_tickets', JSON.stringify(localTickets));
        setTicketReply('');
        setSelectedTicket(localTickets[ticketIdx]);
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSort = (field: 'date' | 'customer' | 'status' | 'amount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (field: 'date' | 'customer' | 'status' | 'amount') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-[#0f766e]" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-[#0f766e]" />
    );
  };

  const sortedOrders = [...orders].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'date') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      comparison = dateA - dateB;
    } else if (sortField === 'customer') {
      comparison = (a.customerName || '').localeCompare(b.customerName || '');
    } else if (sortField === 'status') {
      comparison = (a.status || '').localeCompare(b.status || '');
    } else if (sortField === 'amount') {
      comparison = (a.totalAmount || 0) - (b.totalAmount || 0);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleAddProductClick = () => {
    setIsEditing(false);
    setEditId('');
    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setProdImage('');
    setProdCategory('Accessories');
    setProdStock('10');
    setIsFormOpen(true);
  };

  const handleEditProductClick = (product: Product) => {
    setIsEditing(true);
    setEditId(product.id);
    setProdName(product.name);
    setProdDesc(product.description);
    setProdPrice(product.price.toString());
    setProdImage(product.image);
    setProdCategory(product.category);
    setProdStock(product.stock.toString());
    setIsFormOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice.trim() || !prodCategory.trim()) {
      alert(language === 'en' ? 'Please fill in name, price and category.' : 'Kripya name, price aur category fill karein.');
      return;
    }

    const payload = {
      name: prodName,
      description: prodDesc,
      price: parseFloat(prodPrice),
      image: prodImage || undefined,
      category: prodCategory,
      stock: parseInt(prodStock || '10'),
    };

    try {
      const url = isEditing ? `/api/products/${editId}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      let success = false;
      let savedProduct: Product | null = null;

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          savedProduct = await res.json();
          success = true;
        }
      } catch (apiErr) {
        console.warn('API request failed, falling back to local storage:', apiErr);
      }

      if (success && savedProduct) {
        setIsFormOpen(false);
        if (isEditing) {
          onEditProduct?.(savedProduct);
        } else {
          onAddProduct?.(savedProduct);
        }
      } else {
        // Fallback to local-only update
        const localProduct: Product = {
          id: isEditing ? editId : `prod-${Date.now()}`,
          name: payload.name,
          description: payload.description,
          price: payload.price,
          image: payload.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          category: payload.category,
          rating: isEditing ? (products.find(p => p.id === editId)?.rating || 0) : 0,
          stock: payload.stock,
        };

        setIsFormOpen(false);
        if (isEditing) {
          onEditProduct?.(localProduct);
        } else {
          onAddProduct?.(localProduct);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (apiErr) {
      console.warn('API request failed, falling back to local storage:', apiErr);
    }

    onDeleteProduct?.(id);
    setDeletingId(null);
  };

  const handleUpdateOrderStatus = async (orderId: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: customNote.trim() || undefined
        }),
      });

      if (res.ok) {
        setCustomNote('');
        setSelectedOrder(null);
        fetchOrders();
        alert(language === 'en' ? 'Order status updated successfully!' : 'Order status successfully update ho gaya hai!');
        setIsUpdatingStatus(false);
        return;
      }
    } catch (err) {
      console.warn('API request to update order status failed, using local fallback:', err);
    }

    // Local storage fallback order status update
    try {
      const savedOrdersRaw = localStorage.getItem('ab_orders') || '[]';
      const localOrders = JSON.parse(savedOrdersRaw);
      const orderIdx = localOrders.findIndex((o: any) => o.id === orderId);
      if (orderIdx !== -1) {
        localOrders[orderIdx].status = newStatus;
        if (!localOrders[orderIdx].trackingUpdates) {
          localOrders[orderIdx].trackingUpdates = [];
        }
        localOrders[orderIdx].trackingUpdates.push({
          status: newStatus,
          timestamp: new Date().toISOString(),
          note: customNote.trim() || `Order status updated to ${newStatus}.`
        });
        localStorage.setItem('ab_orders', JSON.stringify(localOrders));
        setCustomNote('');
        setSelectedOrder(null);
        fetchOrders();
        alert(language === 'en' ? 'Order status updated successfully (offline mode)!' : 'Order status offline mode mein update ho gaya hai!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string) => {
    setIsUpdatingPaymentStatus(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payment-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setSelectedOrder(updatedOrder);
        fetchOrders();
        alert(language === 'en' ? 'Payment status updated successfully!' : 'Payment status successfully update ho gaya hai!');
        setIsUpdatingPaymentStatus(false);
        return;
      }
    } catch (err) {
      console.warn('API request to update payment status failed, using local fallback:', err);
    }

    // Local storage fallback payment status update
    try {
      const savedOrdersRaw = localStorage.getItem('ab_orders') || '[]';
      const localOrders = JSON.parse(savedOrdersRaw);
      const orderIdx = localOrders.findIndex((o: any) => o.id === orderId);
      if (orderIdx !== -1) {
        localOrders[orderIdx].paymentStatus = newPaymentStatus;
        localStorage.setItem('ab_orders', JSON.stringify(localOrders));
        setSelectedOrder(localOrders[orderIdx]);
        fetchOrders();
        alert(language === 'en' ? 'Payment status updated successfully (offline mode)!' : 'Payment status offline mode mein update ho gaya hai!');
      }
    } catch (e) {
      console.error(e);
      alert(language === 'en' ? 'Failed to update payment status.' : 'Payment status update karne mein error aayi.');
    } finally {
      setIsUpdatingPaymentStatus(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-panel">
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/30 pb-5 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-purple-600 fill-purple-100 animate-pulse" />
            <span>{language === 'en' ? 'Seller Admin Dashboard' : 'Seller Admin Dashboard'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-bold">{t('admin_subtitle')}</p>
        </div>

        {/* Admin Tabs */}
        <div className="flex space-x-1 bg-white/30 border border-white/40 p-1.5 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setAdminTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              adminTab === 'products'
                ? 'bg-[#0f766e] text-white shadow-md'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/20'
            }`}
          >
            {language === 'en' ? 'Manage Products' : 'Manage Products'}
          </button>
          <button
            onClick={() => setAdminTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              adminTab === 'orders'
                ? 'bg-[#0f766e] text-white shadow-md'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/20'
            }`}
          >
            {language === 'en' ? `Manage Orders (${orders.length})` : `Manage Orders (${orders.length})`}
          </button>
          <button
            onClick={() => setAdminTab('tickets')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              adminTab === 'tickets'
                ? 'bg-[#0f766e] text-white shadow-md'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/20'
            }`}
          >
            {language === 'en' ? `Support Tickets (${tickets.length})` : `Support Tickets (${tickets.length})`}
          </button>
        </div>
      </div>

      {/* ---------------- Tab 1: Product Management ---------------- */}
      {adminTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-wider">
              {language === 'en' ? `Active Inventory (${products.length})` : `Active Inventory (${products.length})`}
            </h2>
            <button
              onClick={handleAddProductClick}
              className="bg-[#0f766e] hover:bg-teal-800 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1 cursor-pointer shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>{t('add_product_submit')}</span>
            </button>
          </div>

          {/* Form Modal overlay */}
          {isFormOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto" id="product-form-modal">
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setIsFormOpen(false)}></div>
              <div className="flex min-h-full items-center justify-center p-4 z-10 relative">
                <div className="relative rounded-3xl shadow-2xl w-full max-w-lg p-6 bg-white border border-slate-200 transform transition-all">
                  <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b border-slate-100">
                    {isEditing 
                      ? (language === 'en' ? 'Update Product Information' : 'Product Info Update Karein') 
                      : t('add_product_title')}
                  </h3>

                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">{t('product_name_lbl')} *</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Apple iPhone 15 Pro"
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">{t('desc_lbl')}</label>
                      <textarea
                        rows={3}
                        placeholder={language === 'en' ? 'Write product key features and specifications...' : 'Product ke key features aur specifications likhein...'}
                        value={prodDesc}
                        onChange={(e) => setProdDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:bg-white focus:border-teal-500 resize-none font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">{t('price_lbl')} *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="84999"
                          value={prodPrice}
                          onChange={(e) => setProdPrice(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">{t('category_lbl')} *</label>
                        <select
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                        >
                          <option value="Accessories">Accessories</option>
                          <option value="Furniture">Furniture</option>
                          <option value="Kitchenware">Kitchenware</option>
                          <option value="Fashion">Fashion</option>
                          <option value="Home Decoration">Home Decoration</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">{t('stock_lbl')} *</label>
                        <input
                          type="number"
                          required
                          min={0}
                          placeholder="25"
                          value={prodStock}
                          onChange={(e) => setProdStock(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">{t('image_url_lbl')}</label>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={prodImage}
                          onChange={(e) => setProdImage(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:bg-white focus:border-teal-500 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl cursor-pointer border border-slate-200 shadow-xs"
                      >
                        {t('cancel_btn')}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#0f766e] hover:bg-teal-800 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
                      >
                        {t('save_stock_btn')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Product Cards Management Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="admin-product-grid">
            {/* Quick Add Product Card Option */}
            <div 
              onClick={handleAddProductClick}
              className="bg-white/35 hover:bg-white/60 border border-dashed border-teal-500/40 hover:border-teal-500 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] group transition-all"
              id="admin-quick-add-product-card"
            >
              <div className="p-3 bg-teal-500/10 text-teal-700 rounded-full group-hover:bg-[#0f766e] group-hover:text-white transition-all duration-300 mb-2">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-black text-slate-800">{t('add_product_submit')}</span>
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                {language === 'en' ? 'Click to add a new item to your inventory.' : 'Naya item inventory mein add karne ke liye click karein.'}
              </p>
            </div>

            {products.map((p) => (
              <div key={p.id} className="bg-white/40 backdrop-blur-xs rounded-2xl border border-white/50 p-4 shadow-sm flex space-x-4 animate-fade-in">
                <div className="w-20 h-20 bg-white/60 p-2 rounded-xl border border-white/40 flex items-center justify-center flex-shrink-0">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 truncate">{p.name}</h3>
                    <p className="text-[11px] text-slate-500 font-bold">{p.category}</p>
                    <div className="flex items-center space-x-3 mt-1.5">
                      <span className="text-xs font-black text-slate-900">₹{p.price.toLocaleString('en-IN')}</span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        p.stock <= 0 
                          ? 'bg-red-500/15 text-red-800 border border-red-500/20' 
                          : p.stock < 5 
                          ? 'bg-amber-500/15 text-amber-800 border border-amber-500/20 animate-pulse'
                          : 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/20'
                      }`}>
                        {language === 'en' ? 'Stock:' : 'Stock:'} {p.stock}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 border-t border-white/30 mt-2">
                    {deletingId === p.id ? (
                      <div className="flex items-center space-x-1.5 w-full justify-between">
                        <span className="text-[10px] font-extrabold text-red-600 animate-pulse">
                          {language === 'en' ? 'Are you sure?' : 'Kya aap sure hain?'}
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-2 py-1 rounded-md cursor-pointer transition-all shadow-xs"
                          >
                            {language === 'en' ? 'Confirm' : 'Ha'}
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-black px-2 py-1 rounded-md cursor-pointer transition-all border border-slate-300"
                          >
                            {language === 'en' ? 'Cancel' : 'Nahi'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditProductClick(p)}
                          className="text-teal-600 hover:text-teal-800 text-[11px] font-black transition-colors flex items-center space-x-0.5 cursor-pointer bg-teal-500/10 hover:bg-teal-500/20 px-2 py-1 rounded-lg border border-teal-500/10"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>{language === 'en' ? 'Edit' : 'Edit'}</span>
                        </button>
                        <button
                          onClick={() => setDeletingId(p.id)}
                          className="text-red-600 hover:text-red-800 text-[11px] font-black transition-colors flex items-center space-x-0.5 cursor-pointer bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg border border-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{language === 'en' ? 'Delete' : 'Delete'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Tab 2: Order Dispatch Control ---------------- */}
      {adminTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/20 p-3 rounded-2xl border border-white/45">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">{t('live_orders_tab')} ({orders.length})</h2>
              <button onClick={fetchOrders} className="p-1.5 bg-white/40 border border-white/45 hover:bg-white/60 rounded-full transition-colors text-slate-700 cursor-pointer shadow-xs" title="Refresh Orders">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            
            {/* Sort controls */}
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <span>{language === 'en' ? 'Sort By:' : 'Sort Karein:'}</span>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortField(field as any);
                  setSortOrder(order as any);
                }}
                className="bg-white/60 border border-white/50 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-black text-slate-800 cursor-pointer shadow-xs"
              >
                <option value="date-desc">{language === 'en' ? 'Date (Newest First)' : 'Date (Naya Pehle)'}</option>
                <option value="date-asc">{language === 'en' ? 'Date (Oldest First)' : 'Date (Purana Pehle)'}</option>
                <option value="customer-asc">{language === 'en' ? 'Customer Name (A-Z)' : 'Grahak Naam (A-Z)'}</option>
                <option value="customer-desc">{language === 'en' ? 'Customer Name (Z-A)' : 'Grahak Naam (Z-A)'}</option>
                <option value="status-asc">{language === 'en' ? 'Status (A-Z)' : 'Status (A-Z)'}</option>
                <option value="status-desc">{language === 'en' ? 'Status (Z-A)' : 'Status (Z-A)'}</option>
                <option value="amount-desc">{language === 'en' ? 'Amount (High to Low)' : 'Amount (Jyada se Kam)'}</option>
                <option value="amount-asc">{language === 'en' ? 'Amount (Low to High)' : 'Amount (Kam se Jyada)'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="admin-orders-workspace">
            
            {/* Orders list in Table format */}
            <div className="lg:col-span-2">
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-white/30 rounded-2xl border border-dashed border-white/45">
                  <p className="text-sm text-slate-500 font-bold">
                    {language === 'en' ? 'No orders yet.' : 'Koi orders nahi hain.'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'en' ? 'Waiting for customers to place orders.' : 'Grahakon ke order place karne ka wait karein.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/50 overflow-hidden shadow-xs">
                  {/* Mobile Order Cards */}
                  <div className="block sm:hidden space-y-4 p-4" id="mobile-admin-orders">
                    {sortedOrders.map((ord) => {
                      const isSelected = selectedOrder?.id === ord.id;
                      return (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrder(ord)}
                          className={`bg-white/80 p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-[#0f766e] ring-2 ring-teal-500/10 shadow-xs' 
                              : 'border-slate-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-mono font-black text-xs text-teal-700">{ord.id}</span>
                              <span className="block text-[10px] text-slate-500 font-bold mt-0.5">
                                {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                              ord.status === 'delivered' 
                                ? 'bg-emerald-500/15 text-emerald-800' 
                                : ord.status === 'shipped' 
                                ? 'bg-teal-500/15 text-teal-800'
                                : ord.status === 'returned'
                                ? 'bg-rose-500/15 text-rose-800'
                                : 'bg-amber-500/15 text-amber-800'
                            }`}>
                              {ord.status}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-xs text-slate-700">
                            <p className="font-bold">Grahak: <span className="font-black text-slate-900">{ord.customerName}</span></p>
                            <p className="font-medium text-[11px]">Phone: <span className="font-bold font-mono">{ord.customerPhone}</span></p>
                            <p className="font-medium text-[11px]">Items: <span className="font-bold">{ord.items.length} ({ord.items.length === 1 ? 'item' : 'items'})</span></p>
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100">
                            <div className="text-[10px]">
                              <span className="text-slate-400 block font-bold leading-none uppercase">Payment</span>
                              <span className={`inline-block font-black mt-1 text-[8px] px-1.5 py-0.5 rounded border ${
                                ord.paymentStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>{ord.paymentStatus || 'processing'}</span>
                            </div>
                            <span className="text-sm font-black text-slate-900">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Order Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-250/50 text-left text-xs">
                      <thead className="bg-[#0f766e]/10 text-[#0f766e] font-black uppercase tracking-wider text-[10px]">
                        <tr>
                          <th 
                            onClick={() => handleSort('date')}
                            className="px-4 py-3 cursor-pointer hover:bg-[#0f766e]/20 transition-colors group select-none"
                          >
                            <div className="flex items-center space-x-1">
                              <span>{language === 'en' ? 'Order ID / Date' : 'Order ID / Date'}</span>
                              {renderSortIcon('date')}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('customer')}
                            className="px-4 py-3 cursor-pointer hover:bg-[#0f766e]/20 transition-colors group select-none"
                          >
                            <div className="flex items-center space-x-1">
                              <span>{language === 'en' ? 'Customer' : 'Customer'}</span>
                              {renderSortIcon('customer')}
                            </div>
                          </th>
                          <th className="px-4 py-3 select-none">{t('phone_lbl')}</th>
                          <th className="px-4 py-3 select-none">{language === 'en' ? 'Items' : 'Items'}</th>
                          <th 
                            onClick={() => handleSort('amount')}
                            className="px-4 py-3 cursor-pointer hover:bg-[#0f766e]/20 transition-colors group select-none text-right"
                          >
                            <div className="flex items-center justify-end space-x-1">
                              <span>{language === 'en' ? 'Amount' : 'Amount'}</span>
                              {renderSortIcon('amount')}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center select-none">{language === 'en' ? 'Payment' : 'Payment'}</th>
                          <th 
                            onClick={() => handleSort('status')}
                            className="px-4 py-3 cursor-pointer hover:bg-[#0f766e]/20 transition-colors group select-none text-center"
                          >
                            <div className="flex items-center justify-center space-x-1">
                              <span>{language === 'en' ? 'Status' : 'Status'}</span>
                              {renderSortIcon('status')}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center select-none">{language === 'en' ? 'Action' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/40 bg-white/20">
                        {sortedOrders.map((ord) => {
                          const isSelected = selectedOrder?.id === ord.id;
                          return (
                            <tr 
                              key={ord.id} 
                              onClick={() => setSelectedOrder(ord)}
                              className={`hover:bg-teal-50/40 transition-all cursor-pointer ${
                                isSelected ? 'bg-teal-50/60 font-semibold' : ''
                              }`}
                            >
                              <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-800">
                                <span className="text-[#0f766e]">{ord.id}</span>
                                <span className="block text-[10px] font-bold text-slate-500 font-sans mt-0.5">
                                  {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900">
                                {ord.customerName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-bold font-mono">
                                {ord.customerPhone}
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-bold">
                                {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right font-black text-teal-700">
                                ₹{ord.totalAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                                  ord.paymentStatus === 'success'
                                    ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/20'
                                    : ord.paymentStatus === 'failed'
                                    ? 'bg-rose-500/15 text-rose-800 border border-rose-500/20'
                                    : ord.paymentStatus === 'processing'
                                    ? 'bg-blue-500/15 text-blue-800 border border-blue-500/20'
                                    : 'bg-amber-500/15 text-amber-800 border border-amber-500/20'
                                }`}>
                                  {ord.paymentStatus || 'processing'}
                                </span>
                                <span className="block text-[8px] text-slate-400 font-bold mt-0.5 font-mono">{ord.paymentMethod}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${
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
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(ord);
                                  }}
                                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-[#0f766e] text-white shadow-xs' 
                                      : 'bg-white/60 border border-slate-200 text-slate-700 hover:border-teal-500 hover:text-[#0f766e]'
                                  }`}
                                >
                                  {isSelected ? (language === 'en' ? 'Selected' : 'Selected') : (language === 'en' ? 'Manage' : 'Manage')}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Status updater workspace panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit sticky top-24">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 pb-1 border-b border-slate-100">
                {language === 'en' ? 'Order Delivery Roadmapping' : 'Order Delivery Roadmapping'}
              </h3>

              {selectedOrder ? (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3 mb-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      {language === 'en' ? 'Active Order' : 'Active Order'}
                    </span>
                    <span className="text-base font-black text-[#0f766e] font-mono">{selectedOrder.id}</span>
                    <p className="text-xs text-slate-700 mt-1 font-bold">
                      Customer: <span className="font-black text-slate-900">{selectedOrder.customerName}</span>
                    </p>
                    <p className="text-xs text-slate-700 mt-0.5 font-bold">
                      Phone: <span className="font-mono text-slate-900 font-black">{selectedOrder.customerPhone}</span>
                    </p>
                  </div>

                  {/* Payment Status Manager */}
                  <div className="bg-teal-50/40 border border-teal-500/10 p-3.5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        {language === 'en' ? 'Payment Status' : 'Payment Status'}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                        selectedOrder.paymentStatus === 'success'
                          ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/20'
                          : selectedOrder.paymentStatus === 'failed'
                          ? 'bg-rose-500/15 text-rose-800 border-rose-500/20'
                          : selectedOrder.paymentStatus === 'processing'
                          ? 'bg-blue-500/15 text-blue-800 border border-blue-500/20'
                          : 'bg-amber-500/15 text-amber-800 border-amber-500/20'
                      }`}>
                        {selectedOrder.paymentStatus || 'processing'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <select
                        value={newPaymentStatus}
                        onChange={(e) => setNewPaymentStatus(e.target.value as any)}
                        className="flex-1 bg-white border border-slate-200 text-xs rounded-lg py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold text-slate-800 cursor-pointer"
                      >
                        <option value="processing">Processing</option>
                        <option value="pending">Pending</option>
                        <option value="success">Success / Paid</option>
                        <option value="failed">Failed</option>
                      </select>
                      <button
                        onClick={() => handleUpdatePaymentStatus(selectedOrder.id)}
                        disabled={isUpdatingPaymentStatus}
                        className="bg-[#0f766e] hover:bg-teal-800 disabled:opacity-50 text-white font-black px-3 py-1.5 rounded-lg text-[10px] uppercase transition-colors cursor-pointer"
                      >
                        {isUpdatingPaymentStatus ? 'Saving...' : 'Update'}
                      </button>
                    </div>
                  </div>

                  {/* Order Status Manager */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        {t('order_status_update_lbl')}
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold text-slate-800"
                      >
                        <option value="placed">{language === 'en' ? 'Placed (Order Received)' : 'Placed (Order Received)'}</option>
                        <option value="processing">{language === 'en' ? 'Processing (Pack & Ready)' : 'Processing (Pack & Ready)'}</option>
                        <option value="shipped">{language === 'en' ? 'Shipped (BlueDart Dispatched)' : 'Shipped (BlueDart Dispatched)'}</option>
                        <option value="delivered">{language === 'en' ? 'Delivered' : 'Delivered'}</option>
                        <option value="returned">{language === 'en' ? 'Returned' : 'Returned'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        {language === 'en' ? 'Custom Note / Tracking Code' : 'Custom Note / Tracking Code'}
                      </label>
                      <textarea
                        rows={3}
                        placeholder="E.g. Dispatched via BlueDart. Tracking ID: BD91240182"
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none text-slate-700 font-bold"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        {language === 'en' 
                          ? 'Add a custom note here to show on the user real-time tracker.' 
                          : 'Yahan custom note daalein jo customer ko real-time tracker par visual steps mein dikhegi.'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id)}
                      disabled={isUpdatingStatus}
                      className="w-full bg-[#ea580c] hover:bg-orange-700 text-white py-2 px-4 rounded-xl text-xs font-black uppercase transition-colors cursor-pointer flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <span>{language === 'en' ? 'Save Status' : 'Status Save Karein'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <ListOrdered className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">
                    {language === 'en' ? 'Select an Order' : 'Koi order select karein'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {language === 'en' 
                      ? 'Click on any order from the left list to manage, dispatch, or deliver.' 
                      : 'Left side ke orders list mein se kisi order card par click karein use dispatch ya deliver karne ke liye.'}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ---------------- Tab 3: Support Tickets Management ---------------- */}
      {adminTab === 'tickets' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/20 p-3 rounded-2xl border border-white/45">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
              {language === 'en' ? `Customer Support Tickets (${tickets.length})` : `Customer Support Tickets (${tickets.length})`}
            </h2>
            <button onClick={fetchTickets} className="p-1.5 bg-white/40 border border-white/45 hover:bg-white/60 rounded-full transition-colors text-slate-700 cursor-pointer shadow-xs" title="Refresh Tickets">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="admin-tickets-workspace">
            {/* Left 2 cols: Tickets list */}
            <div className="lg:col-span-2 space-y-4">
              {tickets.length === 0 ? (
                <div className="bg-white/30 rounded-2xl border border-white/40 p-12 text-center text-slate-400">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold">No tickets found.</p>
                  <p className="text-xs text-slate-400 mt-1">Customers have not raised any support tickets yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {tickets.map((ticket) => {
                    const isSelected = selectedTicket?.id === ticket.id;
                    return (
                      <div 
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setTicketReply(ticket.reply || '');
                        }}
                        className={`cursor-pointer transition-all p-4 rounded-2xl border text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                          isSelected 
                            ? 'bg-white/70 border-teal-500 shadow-md ring-1 ring-teal-500' 
                            : 'bg-white/30 hover:bg-white/50 border-white/50 shadow-xs'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                              {ticket.id}
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                              ticket.category === 'order' 
                                ? 'bg-indigo-100 text-indigo-700'
                                : ticket.category === 'delivery'
                                ? 'bg-amber-100 text-amber-700'
                                : ticket.category === 'refund'
                                ? 'bg-[#0f766e]/10 text-[#0f766e]'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {ticket.category}
                            </span>
                            <span className="text-[11px] text-slate-400 font-bold">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h3 className="text-sm font-black text-slate-800 truncate">{ticket.subject}</h3>
                          <p className="text-xs font-bold text-slate-500 truncate">{ticket.message}</p>
                          <p className="text-[10px] text-slate-400 font-black">
                            By: {ticket.name} ({ticket.email})
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 self-end md:self-auto">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                            ticket.status === 'open'
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                            {ticket.status === 'open' ? (language === 'en' ? 'Open' : 'Chalu') : (language === 'en' ? 'Resolved' : 'Resolved')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right column: Ticket reply editor */}
            <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 p-6 shadow-sm min-h-[380px]" id="admin-ticket-details-sidebar">
              {selectedTicket ? (
                <div className="space-y-5 text-left">
                  <div className="border-b border-white/40 pb-4">
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider block w-max">
                      {selectedTicket.id}
                    </span>
                    <h3 className="text-base font-black text-slate-800 mt-2">{selectedTicket.subject}</h3>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                      Submitted: {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-bold text-slate-600 bg-white/20 p-3.5 rounded-xl border border-white/40">
                    <p className="text-slate-400 uppercase tracking-wider text-[10px] font-black">Customer Details</p>
                    <p className="text-slate-700">Name: <span className="font-black text-slate-900">{selectedTicket.name}</span></p>
                    <p className="text-slate-700">Email: <span className="font-black text-slate-900">{selectedTicket.email}</span></p>
                    {selectedTicket.phone && <p className="text-slate-700">Phone: <span className="font-black text-slate-900">{selectedTicket.phone}</span></p>}
                    {selectedTicket.orderId && <p className="text-slate-700 font-black">Order ID: <span className="text-[#0f766e] underline">{selectedTicket.orderId}</span></p>}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-slate-400 uppercase tracking-wider text-[10px] font-black">Customer Message</p>
                    <p className="text-xs font-semibold text-slate-800 bg-white p-3.5 rounded-xl border border-slate-150 leading-relaxed shadow-xs">
                      {selectedTicket.message}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/40">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      {language === 'en' ? 'Reply & Support Response' : 'Reply & Support Response'}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={language === 'en' ? "Write your helpful support message here..." : "Yahan support message likhein jo user dekh sake..."}
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 font-bold"
                    />
                    <button
                      onClick={() => handleReplyTicket(selectedTicket.id)}
                      disabled={isSubmittingReply || !ticketReply.trim()}
                      className="w-full bg-[#0f766e] hover:bg-teal-800 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-xs font-black uppercase transition-colors cursor-pointer flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <span>{language === 'en' ? 'Send Reply & Resolve' : 'Response Dein & Resolve Karein'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center">
                  <MessageSquare className="h-10 w-10 mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">
                    {language === 'en' ? 'Select a Support Ticket' : 'Support Ticket Select Karein'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
                    {language === 'en' 
                      ? 'Click on any customer ticket from the left list to review and send a helpful response.' 
                      : 'Left side ki tickets list mein se kisi ticket par click karein reply karne ke liye.'}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
