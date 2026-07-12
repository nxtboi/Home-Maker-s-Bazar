import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CreditCard, Send, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Landmark, Wallet, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    id: string;
    amount: number;
    currency: string;
    key_id: string;
    isMock: boolean;
  } | null;
  customerDetails: {
    name: string;
    phone: string;
    address: string;
    email?: string;
  };
  cartItems: any[];
  username?: string;
  onPaymentSuccess: (orderId: string) => void;
  onPaymentError: (errorMsg: string) => void;
}

type ScreenType = 'options' | 'card' | 'upi' | 'netbanking' | 'wallet' | 'processing' | 'success';

export default function RazorpayModal({
  isOpen,
  onClose,
  orderData,
  customerDetails,
  cartItems,
  username,
  onPaymentSuccess,
  onPaymentError,
}: RazorpayModalProps) {
  const { language } = useLanguage();
  const [screen, setScreen] = useState<ScreenType>('options');
  
  // Card Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(customerDetails.name);
  
  // UPI Inputs
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'other' | null>(null);
  
  // Netbanking / Wallet selection
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  
  // Process status
  const [statusMessage, setStatusMessage] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setScreen('options');
      setLocalError('');
      // Reset inputs
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setUpiId('');
      setSelectedUpiApp(null);
      setSelectedBank('');
      setSelectedWallet('');
    }
  }, [isOpen]);

  if (!isOpen || !orderData) return null;

  const totalRupees = orderData.amount / 100;

  // Handles simulated Razorpay verification
  const handleSimulatedPayment = async () => {
    setScreen('processing');
    setLocalError('');
    setStatusMessage(
      language === 'en' 
        ? 'Connecting with Razorpay secure servers...' 
        : 'Razorpay surakshit server se connect ho raha hai...'
    );

    // Step 1: Simulate bank authorization network lag
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setStatusMessage(
      language === 'en' 
        ? 'Authorizing transaction with your provider...' 
        : 'Bank aur payment provider ke sath badlav verify ho raha hai...'
    );

    await new Promise(resolve => setTimeout(resolve, 1200));

    // Step 2: Register payment and create order via server API
    try {
      const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      let data;
      let ok = false;

      try {
        const response = await fetch('/api/razorpay/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems,
            totalAmount: totalRupees,
            customerName: customerDetails.name,
            customerPhone: customerDetails.phone,
            customerAddress: customerDetails.address,
            username,
            razorpay_payment_id: mockPaymentId,
            razorpay_order_id: orderData.id,
            isMock: true
          })
        });

        if (response.ok) {
          data = await response.json();
          ok = true;
        } else {
          const apiErrData = await response.json().catch(() => ({}));
          if (response.status !== 404) {
            throw new Error(apiErrData.error || 'Verification endpoint returned an error.');
          }
        }
      } catch (apiErr) {
        console.warn('Payment verification API failed, processing locally:', apiErr);
      }

      if (!ok) {
        // Fallback local order creation
        const localOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        const localOrder = {
          id: localOrderId,
          items: cartItems,
          totalAmount: totalRupees,
          status: 'placed',
          customerName: customerDetails.name,
          customerPhone: customerDetails.phone,
          customerAddress: customerDetails.address,
          paymentMethod: 'Simulated Card/UPI (Local Fallback)',
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
        data = { id: localOrderId };
      }

      setScreen('success');
      await new Promise(resolve => setTimeout(resolve, 1500));
      onPaymentSuccess(data.id);
    } catch (err: any) {
      console.error(err);
      setLocalError(err.message || 'Verification failed. Please try again.');
      setScreen('options');
    }
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setLocalError(language === 'en' ? 'Please enter a valid 16-digit card number.' : 'Kripya 16-digit card number daalein.');
      return;
    }
    if (cardExpiry.length < 5) {
      setLocalError(language === 'en' ? 'Please enter a valid expiry (MM/YY).' : 'Kripya expiry date (MM/YY) daalein.');
      return;
    }
    if (cardCvv.length < 3) {
      setLocalError(language === 'en' ? 'Please enter a valid 3-digit CVV.' : 'Kripya valid 3-digit CVV daalein.');
      return;
    }
    handleSimulatedPayment();
  };

  const handleUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId || !upiId.includes('@')) {
      setLocalError(language === 'en' ? 'Please enter a valid UPI ID (e.g. name@okhdfc).' : 'Kripya valid UPI ID enter karein.');
      return;
    }
    handleSimulatedPayment();
  };

  const selectQuickUpiApp = (app: 'gpay' | 'phonepe' | 'paytm') => {
    setSelectedUpiApp(app);
    const suffix = app === 'gpay' ? '@okaxis' : app === 'phonepe' ? '@ybl' : '@paytm';
    const cleanPhone = customerDetails.phone.replace(/\D/g, '') || '9876543210';
    setUpiId(`${cleanPhone}${suffix}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 md:p-6" id="razorpay-portal-wrapper">
      {/* Dark backdrop blur */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />

      {/* Razorpay Authentic Pop-up Container */}
      <div className="bg-slate-950/20 w-full max-w-[430px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 z-10 flex flex-col relative h-[560px] font-sans">
        
        {/* Razorpay Styled Header */}
        <div className="bg-[#121a36] text-white p-5 flex justify-between items-start flex-shrink-0 border-b border-white/10 relative">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-black tracking-wider uppercase border border-blue-500/30">
                Sandbox Mode
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Razorpay Secure</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center space-x-1.5">
              <span>Home Maker's Bazar</span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold line-clamp-1">
              Build by House makers for House makers
            </p>
          </div>
          
          <div className="text-right flex flex-col justify-between h-full min-h-[50px]">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Amount to Pay</p>
              <p className="text-xl font-extrabold text-blue-400 tracking-tight">₹{totalRupees.toLocaleString('en-IN')}</p>
            </div>
          </div>
          
          {/* Secure lock absolute badge */}
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 bg-[#121a36] border border-white/10 text-[10px] px-3 py-0.5 rounded-full text-emerald-400 font-bold flex items-center space-x-1 shadow-md">
            <Shield className="h-3 w-3 fill-emerald-500/10" />
            <span>100% SSL SECURED PAYMENT</span>
          </div>
        </div>

        {/* Dynamic Screen Content */}
        <div className="flex-1 overflow-y-auto p-5 pt-8 bg-slate-50/50 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {/* 1. PAYMENT METHOD SELECTION */}
            {screen === 'options' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 flex-1 flex flex-col justify-between"
                key="screen-options"
              >
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Preferred Payment Options</span>
                    <span className="text-[10px] text-slate-500 font-semibold">Select one to pay</span>
                  </div>

                  {localError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3 rounded-2xl flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                      <span className="font-semibold">{localError}</span>
                    </div>
                  )}

                  {/* Cards Option */}
                  <button
                    onClick={() => setScreen('card')}
                    className="w-full bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-black text-slate-800">Card (Credit/Debit)</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Visa, MasterCard, RuPay, Maestro</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-blue-600 group-hover:translate-x-1 transition-transform">➔</span>
                  </button>

                  {/* UPI Option */}
                  <button
                    onClick={() => setScreen('upi')}
                    className="w-full bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                        <Send className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-black text-slate-800">UPI / QR Payment</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Google Pay, PhonePe, Paytm, BHIM</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-blue-600 group-hover:translate-x-1 transition-transform">➔</span>
                  </button>

                  {/* Netbanking Option */}
                  <button
                    onClick={() => {
                      setScreen('netbanking');
                      setLocalError('');
                    }}
                    className="w-full bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-black text-slate-800">Netbanking</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">SBI, HDFC, ICICI, Axis, Kotak, etc.</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-blue-600 group-hover:translate-x-1 transition-transform">➔</span>
                  </button>

                  {/* Wallets Option */}
                  <button
                    onClick={() => {
                      setScreen('wallet');
                      setLocalError('');
                    }}
                    className="w-full bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-black text-slate-800">Popular Wallets</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Mobikwik, Freecharge, Airtel Money</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-blue-600 group-hover:translate-x-1 transition-transform">➔</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    <span>Razorpay SSL 256-bit safe checkout</span>
                  </span>
                  <button 
                    onClick={onClose}
                    className="text-red-500 hover:underline font-black cursor-pointer"
                  >
                    Cancel Payment
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. CARD PAYMENT VIEW */}
            {screen === 'card' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 flex-1 flex flex-col justify-between"
                key="screen-card"
              >
                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => setScreen('options')}
                      className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 font-bold"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Pay with Card</span>
                  </div>

                  {localError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3 rounded-xl flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                      <span className="font-semibold">{localError}</span>
                    </div>
                  )}

                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Poora naam likhein"
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl py-2 px-3 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Card Number (Simulated)</label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="4312 8920 1289 4501"
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                          setCardNumber(v);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl py-2 px-3 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Expiry</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, '');
                            if (v.length > 2) {
                              v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
                            }
                            setCardExpiry(v);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl py-2 px-3 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-blue-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">CVV</label>
                        <input
                          type="password"
                          required
                          maxLength={3}
                          placeholder="***"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl py-2 px-3 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <span>PAY SECURELY ₹{totalRupees.toLocaleString('en-IN')}</span>
                  </button>
                </form>
              </motion.div>
            )}

            {/* 3. UPI PAYMENT VIEW */}
            {screen === 'upi' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 flex-1 flex flex-col justify-between"
                key="screen-upi"
              >
                <form onSubmit={handleUpiSubmit} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => setScreen('options')}
                      className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 font-bold"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Pay with UPI</span>
                  </div>

                  {localError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3 rounded-xl flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                      <span className="font-semibold">{localError}</span>
                    </div>
                  )}

                  {/* Quick autofills */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Quick Select App</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => selectQuickUpiApp('gpay')}
                        className={`p-3 bg-white border rounded-xl flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                          selectedUpiApp === 'gpay' ? 'border-[#121a36] bg-slate-50 font-black' : 'border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-extrabold text-blue-600">Google Pay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => selectQuickUpiApp('phonepe')}
                        className={`p-3 bg-white border rounded-xl flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                          selectedUpiApp === 'phonepe' ? 'border-[#121a36] bg-slate-50 font-black' : 'border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-extrabold text-purple-600">PhonePe</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => selectQuickUpiApp('paytm')}
                        className={`p-3 bg-white border rounded-xl flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                          selectedUpiApp === 'paytm' ? 'border-[#121a36] bg-slate-50 font-black' : 'border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-extrabold text-teal-600">Paytm</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Enter UPI ID (VPA)</label>
                      <input
                        type="text"
                        required
                        value={upiId}
                        onChange={(e) => {
                          setUpiId(e.target.value);
                          setSelectedUpiApp('other');
                        }}
                        placeholder="apnabazar@okhdfc"
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl py-2.5 px-3 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <span>PAY SECURELY ₹{totalRupees.toLocaleString('en-IN')}</span>
                  </button>
                </form>
              </motion.div>
            )}

            {/* 4. NETBANKING VIEW */}
            {screen === 'netbanking' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 flex-1 flex flex-col justify-between"
                key="screen-netbanking"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => setScreen('options')}
                      className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 font-bold"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Netbanking</span>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Bank</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Yes Bank'].map((bank) => (
                        <button
                          key={bank}
                          onClick={() => setSelectedBank(bank)}
                          className={`p-3.5 bg-white border rounded-2xl text-left text-[11px] font-black transition-all cursor-pointer ${
                            selectedBank === bank ? 'border-blue-600 bg-blue-50/20 text-blue-700' : 'border-slate-200/80 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSimulatedPayment}
                  disabled={!selectedBank}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <span>{selectedBank ? `PAY VIA ${selectedBank.toUpperCase()}` : 'CHOOSE A BANK'}</span>
                </button>
              </motion.div>
            )}

            {/* 5. WALLET VIEW */}
            {screen === 'wallet' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 flex-1 flex flex-col justify-between"
                key="screen-wallet"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => setScreen('options')}
                      className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 font-bold"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Wallets</span>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Wallet</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {['Mobikwik', 'Freecharge', 'Airtel Money', 'JioMoney', 'PhonePe Wallet'].map((wallet) => (
                        <button
                          key={wallet}
                          onClick={() => setSelectedWallet(wallet)}
                          className={`p-3.5 bg-white border rounded-2xl text-left text-[11px] font-black transition-all cursor-pointer ${
                            selectedWallet === wallet ? 'border-blue-600 bg-blue-50/20 text-blue-700' : 'border-slate-200/80 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {wallet}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSimulatedPayment}
                  disabled={!selectedWallet}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <span>{selectedWallet ? `PAY VIA ${selectedWallet.toUpperCase()}` : 'CHOOSE A WALLET'}</span>
                </button>
              </motion.div>
            )}

            {/* 6. PROCESSING TRANSACTION LOADING WINDOW */}
            {screen === 'processing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-12"
                key="screen-processing"
              >
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                  <Shield className="h-6 w-6 text-blue-600 absolute top-5 left-5" />
                </div>
                <div className="space-y-2 max-w-[280px]">
                  <h4 className="font-black text-slate-800 text-sm">Securing Payment Channel...</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    {statusMessage}
                  </p>
                </div>
                <p className="text-[10px] text-amber-600 font-extrabold animate-pulse bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                  ⚠️ DO NOT CLOSE OR REFRESH THIS WINDOW
                </p>
              </motion.div>
            )}

            {/* 7. TRANSACTION SUCCESSFUL WINDOW */}
            {screen === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-5 py-12"
                key="screen-success"
              >
                <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-100">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-black text-emerald-800 text-base">Payment Successful!</h4>
                  <p className="text-xs text-slate-500 font-bold">
                    Order ID: <span className="font-mono text-[#121a36] bg-slate-100 px-1.5 py-0.5 rounded">{orderData.id}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Redirecting you to Order Tracker...
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
