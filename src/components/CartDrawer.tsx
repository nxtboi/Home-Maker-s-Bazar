import React, { useState, useEffect } from 'react';
import { X, Trash2, Shield, Plus, Minus, CreditCard, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Product, OrderItem, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import RazorpayModal from './RazorpayModal';

interface CartItem extends OrderItem {}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (orderId: string) => void;
  currentUser: User | null;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  currentUser,
}: CartDrawerProps) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'payment'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod] = useState<'Razorpay'>('Razorpay');
  const { t, language } = useLanguage();
  
  // Razorpay Integration States
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [rzpOrderData, setRzpOrderData] = useState<{
    id: string;
    amount: number;
    currency: string;
    key_id: string;
    isMock: boolean;
  } | null>(null);

  // Auto-populate logged-in user details
  useEffect(() => {
    if (currentUser) {
      setCustomerName(prev => prev || currentUser.name);
    }
  }, [currentUser]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  if (!isOpen) return null;

  // Price calculations
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalMRP = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryCharges = totalMRP > 1500 ? 0 : 40;
  const discount = 0; // Discount removed as per user request
  const totalAmount = totalMRP + deliveryCharges;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert(language === 'en' ? 'Please fill in all details correctly.' : 'Kripya saari details sahi se fill karein.');
      return;
    }
    if (customerPhone.replace(/\D/g, '').length < 10) {
      alert(language === 'en' ? 'Please enter a valid 10-digit phone number.' : 'Kripya valid 10-digit phone number daalein.');
      return;
    }
    setStep('payment');
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    setIsProcessing(true);

    // Razorpay payment flow
    try {
      let orderData;
      let orderResOk = false;
      try {
        const orderRes = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: totalAmount })
        });
        
        if (orderRes.ok) {
          orderData = await orderRes.json();
          orderResOk = true;
        }
      } catch (apiErr) {
        console.warn('Razorpay order creation API failed, falling back to client-side simulation:', apiErr);
      }

      if (!orderResOk) {
        // Create offline mock order data
        orderData = {
          id: `order_local_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          amount: totalAmount * 100,
          currency: 'INR',
          key_id: 'rzp_test_local',
          isMock: true
        };
      }

      setRzpOrderData(orderData);

      if (orderData.isMock) {
        // Open simulated high-fidelity Razorpay Modal in sandbox
        setIsRazorpayModalOpen(true);
        setIsProcessing(false);
      } else {
        // Open REAL Razorpay Web Checkout!
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load Razorpay payment SDK. Please check your internet connection.');
        }

        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Home Maker's Bazar",
          description: "Build by House makers for House makers",
          order_id: orderData.id,
          prefill: {
            name: customerName,
            contact: customerPhone,
            email: currentUser ? `${currentUser.username}@homemakersbazar.com` : 'customer@homemakersbazar.com'
          },
          theme: {
            color: "#121a36"
          },
          handler: async function (response: any) {
            try {
              setIsProcessing(true);
              let verifiedData;
              let verifyResOk = false;

              try {
                const verifyRes = await fetch('/api/razorpay/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    items: cartItems,
                    totalAmount,
                    customerName,
                    customerPhone,
                    customerAddress,
                    username: currentUser ? currentUser.username : undefined,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    isMock: false
                  })
                });

                if (verifyRes.ok) {
                  verifiedData = await verifyRes.json();
                  verifyResOk = true;
                }
              } catch (verifyErr) {
                console.warn('Payment verification API failed, processing locally:', verifyErr);
              }

              if (!verifyResOk) {
                // Fallback local order creation
                const localOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
                const localOrder = {
                  id: localOrderId,
                  items: cartItems,
                  totalAmount,
                  status: 'placed',
                  customerName,
                  customerPhone,
                  customerAddress,
                  paymentMethod: 'Razorpay Gateway (Local Fallback)',
                  paymentStatus: 'success',
                  createdAt: new Date().toISOString(),
                  trackingUpdates: [
                    {
                      status: 'placed',
                      timestamp: new Date().toISOString(),
                      note: "Order successfully placed on Home Maker's Bazar."
                    }
                  ]
                };

                const savedOrdersRaw = localStorage.getItem('ab_orders') || '[]';
                let localOrders = [];
                try {
                  localOrders = JSON.parse(savedOrdersRaw);
                } catch (e) {
                  console.error(e);
                }
                localOrders.unshift(localOrder);
                localStorage.setItem('ab_orders', JSON.stringify(localOrders));
                verifiedData = { id: localOrderId };
              }

              // Success
              onClearCart();
              onOrderPlaced(verifiedData.id);
              setStep('cart');
              setCustomerName('');
              setCustomerPhone('');
              setCustomerAddress('');
              onClose();
            } catch (err: any) {
              setPaymentError(err.message || 'Signature verification failed.');
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function() {
              setIsProcessing(false);
            }
          }
        };

        const rzpInstance = new (window as any).Razorpay(options);
        rzpInstance.open();
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to initialize Razorpay checkout.');
      setIsProcessing(false);
    }
  };

  const handleSimulatedSuccess = (serverOrderId: string) => {
    setIsRazorpayModalOpen(false);
    onClearCart();
    onOrderPlaced(serverOrderId);
    setStep('cart');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 w-full sm:max-w-md flex">
        <div className="w-full bg-white/95 sm:bg-white/30 sm:backdrop-blur-xl flex flex-col shadow-2xl h-full sm:border-l border-white/30">
          
          {/* Header */}
          <div className="bg-[#0f766e]/85 backdrop-blur-md text-white p-4 flex justify-between items-center border-b border-white/20">
            <h2 className="text-lg font-black tracking-tight flex items-center space-x-2">
              <span>
                {step === 'cart' 
                  ? t('cart') 
                  : step === 'checkout' 
                  ? (language === 'en' ? 'Delivery Address' : 'Delivery Address') 
                  : (language === 'en' ? 'Secure Payment' : 'Secure Payment')}
              </span>
              <span className="bg-[#f59e0b] text-white text-xs px-2 py-0.5 rounded-full font-black shadow-sm">
                {step === 'cart' ? totalItemsCount : 'Checkout'}
              </span>
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer border border-transparent hover:border-white/20">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Cart Content */}
          {step === 'cart' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-transparent">
                  <div className="p-6 bg-white/35 rounded-3xl border border-white/40 shadow-md mb-6 max-w-xs">
                    <img 
                      src="https://png.pngtree.com/png-vector/20241116/ourlarge/pngtree-side-view-empty-shopping-cart-png-image_14433430.png" 
                      alt="Empty Cart" 
                      className="w-40 mx-auto object-contain drop-shadow-md"
                    />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">{t('cart_empty')}!</h3>
                  <p className="text-xs text-slate-600 mt-2 max-w-xs font-semibold leading-relaxed">{t('cart_empty_sub')}</p>
                  <button 
                    onClick={onClose}
                    className="mt-6 bg-[#ea580c] hover:bg-orange-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg transition-all cursor-pointer hover:scale-105"
                  >
                    {t('cart_start_shopping')}
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="bg-white/40 backdrop-blur-xs p-4 rounded-2xl border border-white/50 flex space-x-4 shadow-sm relative">
                        <div className="w-20 h-20 bg-white/60 p-2 rounded-xl border border-white/40 flex items-center justify-center flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-contain rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-black text-slate-900 truncate">{item.name}</h4>
                            <span className="text-xs text-slate-600 font-bold block mt-0.5">₹{item.price.toLocaleString('en-IN')}</span>
                          </div>
                          
                          {/* Quantity selector */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-white/50 bg-white/45 rounded-xl overflow-hidden p-0.5 shadow-xs">
                              <button 
                                onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                                className="p-1 text-slate-700 hover:bg-white/40 rounded-lg transition-colors cursor-pointer"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-3 text-xs font-black text-slate-800">{item.quantity}</span>
                              <button 
                                onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                                className="p-1 text-slate-700 hover:bg-white/40 rounded-lg transition-colors cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            
                            <button 
                              onClick={() => onRemoveItem(item.productId)}
                              className="text-red-500 hover:text-red-700 text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 rounded-xl border border-red-500/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{language === 'en' ? 'Remove' : 'Hataein'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-white/35 backdrop-blur-md border-t border-white/40 p-4 shadow-xl mt-auto">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                      {language === 'en' ? 'Price Details' : 'Price Details (Flipkart Special)'}
                    </h3>
                    <div className="space-y-2 text-sm border-b border-dashed border-white/50 pb-3">
                      <div className="flex justify-between text-slate-700 font-semibold">
                        <span>{language === 'en' ? `Price (${totalItemsCount} Items)` : `Price (${totalItemsCount} Items)`}</span>
                        <span>₹{totalMRP.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-700 font-semibold">
                        <span>{t('shipping_lbl')}</span>
                        <span>{deliveryCharges === 0 ? <span className="text-emerald-700 font-black">{t('free_shipping')}</span> : `₹${deliveryCharges}`}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 font-bold text-base text-slate-900 mb-4">
                      <span className="font-extrabold text-slate-800">{t('total_lbl')}</span>
                      <span className="text-xl font-black text-slate-950">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <button 
                      onClick={() => setStep('checkout')}
                      className="w-full bg-[#ea580c] hover:bg-orange-700 text-white py-3.5 rounded-2xl font-black text-sm tracking-wider shadow-lg transition-all cursor-pointer uppercase flex items-center justify-center space-x-1 hover:scale-[1.02]"
                    >
                      <span>{language === 'en' ? 'PLACE ORDER' : 'ORDER PLACE KAREIN'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Checkout Address Details */}
          {step === 'checkout' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-transparent p-6">
              <h3 className="text-base font-black text-slate-800 mb-4 pb-2 border-b border-white/45">
                {language === 'en' ? 'Where should we deliver?' : 'Kahan deliver karna hai?'}
              </h3>
              <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      {t('full_name_lbl')}
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Rohit Mehra"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white/30 border border-white/45 text-sm rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:bg-white/75 focus:border-[#0f766e]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      {t('phone_lbl')}
                    </label>
                    <input 
                      type="tel" 
                      required
                      placeholder="9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-white/30 border border-white/45 text-sm rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:bg-white/75 focus:border-[#0f766e]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      {t('address_lbl')}
                    </label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Flat/House No, Building, Street, Area, City, Pin Code"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full bg-white/30 border border-white/45 text-sm rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:bg-white/75 focus:border-[#0f766e] resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/40 mt-auto">
                  <div className="flex justify-between items-center text-sm font-semibold mb-4">
                    <span className="text-slate-600 font-bold">
                      {language === 'en' ? 'Checkout Amount:' : 'Kharidari Amount:'}
                    </span>
                    <span className="text-lg font-black text-slate-950">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button" 
                      onClick={() => setStep('cart')}
                      className="w-full bg-white/40 hover:bg-white/65 text-slate-700 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer border border-white/40 shadow-xs"
                    >
                      {language === 'en' ? 'Back To Cart' : 'Back To Cart'}
                    </button>
                    <button 
                      type="submit" 
                      className="w-full bg-[#ea580c] hover:bg-orange-700 text-white py-3 rounded-xl font-bold text-xs uppercase cursor-pointer flex items-center justify-center space-x-1 shadow-md"
                    >
                      <span>{language === 'en' ? 'PROCEED TO PAYMENT' : 'PAISA PAYMENT KAREIN'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Secure Payment System */}
          {step === 'payment' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-transparent p-6">
              <div className="flex items-center space-x-2 text-[#0f766e] font-black border-b border-white/45 pb-3 mb-4">
                <Shield className="h-5 w-5 fill-teal-100" />
                <span className="text-sm">
                  {language === 'en' ? 'Razorpay Payment Gateway' : 'Razorpay Secure Payment Gateway'}
                </span>
              </div>

              {paymentError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-800 text-xs p-3 rounded-xl mb-4 flex items-center space-x-2 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="flex-1 flex flex-col justify-between">
                <div className="space-y-5">
                  {/* Razorpay Option Details */}
                  <div className="bg-[#121a36]/5 p-5 border border-[#121a36]/10 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex items-center space-x-2 pb-2 border-b border-[#121a36]/10">
                      <img 
                        src="https://newcastlepartysales.com/wp-content/uploads/2025/02/png-transparent-razorpay-logo-tech-companies-thumbnail.png" 
                        alt="Razorpay" 
                        className="h-6 w-6 object-contain"
                      />
                      <span className="text-xs font-black text-[#121a36]">Razorpay Secure Payment</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                      {language === 'en' 
                        ? 'Pay quickly and securely using your Credit/Debit cards, UPI apps (GPay, PhonePe, Paytm), Netbanking, or mobile Wallets.' 
                        : 'Apne Credit/Debit Card, UPI Apps (GPay, PhonePe, Paytm), ya Netbanking se aasaani se safely pay karein.'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase">Cards</span>
                      <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase">UPI</span>
                      <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase">Netbanking</span>
                      <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase">Wallets</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/40 mt-auto">
                  <div className="flex justify-between items-center text-sm font-semibold mb-4">
                    <span className="text-slate-600 font-bold">
                      {language === 'en' ? 'Payable Amount:' : 'Payable Amount:'}
                    </span>
                    <span className="text-lg font-black text-slate-950">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button" 
                      onClick={() => setStep('checkout')}
                      disabled={isProcessing}
                      className="w-full bg-white/40 hover:bg-white/65 text-slate-700 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer border border-white/40 shadow-xs"
                    >
                      {language === 'en' ? 'Back' : 'Back'}
                    </button>
                    <button 
                      type="submit" 
                      disabled={isProcessing}
                      className="w-full bg-[#ea580c] hover:bg-orange-700 text-white py-3 rounded-xl font-bold text-xs uppercase cursor-pointer flex items-center justify-center space-x-1 shadow-md"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{language === 'en' ? 'Please wait...' : 'Wait karein...'}</span>
                        </>
                      ) : (
                        <span>{language === 'en' ? 'MAKE PAYMENT' : 'BHUGTAN KAREIN'}</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Razorpay Authentic Overlay Modal */}
      <RazorpayModal
        isOpen={isRazorpayModalOpen}
        onClose={() => setIsRazorpayModalOpen(false)}
        orderData={rzpOrderData}
        customerDetails={{
          name: customerName,
          phone: customerPhone,
          address: customerAddress
        }}
        cartItems={cartItems}
        username={currentUser ? currentUser.username : undefined}
        onPaymentSuccess={handleSimulatedSuccess}
        onPaymentError={(err) => setPaymentError(err)}
      />
    </div>
  );
}
