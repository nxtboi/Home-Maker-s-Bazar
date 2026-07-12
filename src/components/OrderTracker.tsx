import React, { useState, useEffect } from 'react';
import { Search, MapPin, Package, Truck, CheckCircle2, Clock, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface OrderTrackerProps {
  initialOrderId?: string;
}

export default function OrderTracker({ initialOrderId = '' }: OrderTrackerProps) {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (initialOrderId) {
      setOrderIdInput(initialOrderId);
      fetchOrderDetails(initialOrderId);
    }
  }, [initialOrderId]);

  const fetchOrderDetails = async (id: string) => {
    if (!id.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/${id.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Order fetch API failed, falling back to local storage:', err);
    }

    // Local storage fallback lookup
    try {
      const savedOrdersRaw = localStorage.getItem('ab_orders');
      if (savedOrdersRaw) {
        const localOrders = JSON.parse(savedOrdersRaw);
        const match = localOrders.find((o: any) => o.id.trim().toUpperCase() === id.trim().toUpperCase());
        if (match) {
          setOrder(match);
          setIsLoading(false);
          return;
        }
      }
      setErrorMsg(t('order_not_found'));
    } catch (err) {
      console.error(err);
      setErrorMsg(t('server_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrderDetails(orderIdInput);
  };

  const statusSteps: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
    {
      status: 'placed',
      label: t('step_placed_title'),
      desc: t('step_placed_desc'),
      icon: Clock,
    },
    {
      status: 'processing',
      label: t('step_processing_title'),
      desc: t('step_processing_desc'),
      icon: Package,
    },
    {
      status: 'shipped',
      label: t('step_shipped_title'),
      desc: t('step_shipped_desc'),
      icon: Truck,
    },
    {
      status: 'delivered',
      label: t('step_delivered_title'),
      desc: t('step_delivered_desc'),
      icon: CheckCircle2,
    },
  ];

  // Helper to check if a step is active or completed
  const getStepStatus = (stepStatus: OrderStatus) => {
    if (!order) return 'upcoming';
    const statusOrder: OrderStatus[] = ['placed', 'processing', 'shipped', 'delivered'];
    const currentIdx = statusOrder.indexOf(order.status);
    const stepIdx = statusOrder.indexOf(stepStatus);

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="order-tracker">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          {language === 'en' ? (
            <>Real-Time <span className="text-teal-700">Order Tracking</span></>
          ) : (
            <>Real-Time <span className="text-teal-700">Order Tracking</span></>
          )}
        </h1>
        <p className="text-xs text-slate-600 mt-2 font-bold">{t('track_subtitle')}</p>
      </div>

      {/* Tracker Input Box */}
      <div className="bg-white/30 backdrop-blur-md p-6 rounded-2xl border border-white/45 shadow-sm mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('enter_order_id')}
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value.toUpperCase())}
              className="w-full bg-white/40 border border-white/50 text-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:bg-white/70 focus:border-teal-500 font-mono font-black placeholder-slate-500"
              id="tracker-search-input"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4.5 w-4.5" />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#0f766e] hover:bg-teal-800 text-white font-black px-8 py-3 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center space-x-1 shadow-md"
          >
            {isLoading ? t('tracking_loader') : t('track_button')}
          </button>
        </form>

        {errorMsg && (
          <p className="text-xs text-red-700 font-black mt-3 flex items-center space-x-1">
            <span>⚠️</span> <span>{errorMsg}</span>
          </p>
        )}
      </div>

      {/* Tracking Results */}
      {order ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="tracker-result-panel">
          
          {/* Left Column: Vertical Stepper Tracker */}
          <div className="md:col-span-2 bg-white/30 backdrop-blur-md p-6 rounded-2xl border border-white/45 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-white/40 pb-4 mb-6">
                <div>
                  <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider">{t('order_id_lbl')}</span>
                  <span className="text-lg font-black text-slate-900 font-mono">{order.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider">{t('current_status_lbl')}</span>
                  <span className={`inline-block text-xs font-black px-3 py-1 rounded-full uppercase ${
                    order.status === 'delivered' 
                      ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/20' 
                      : order.status === 'shipped' 
                      ? 'bg-teal-500/15 text-teal-800 border border-teal-500/20'
                      : 'bg-amber-500/15 text-amber-800 border border-amber-500/20'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Vertical Stepper UI */}
              <div className="space-y-8 relative before:absolute before:inset-0 before:left-4.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/30">
                {statusSteps.map((step) => {
                  const stepStatus = getStepStatus(step.status);
                  const StepIcon = step.icon;

                  // Find exact custom update update details from order history
                  const historyMatch = order.trackingUpdates.find(u => u.status === step.status);
                  const matchedTime = historyMatch ? new Date(historyMatch.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
                  const matchedDate = historyMatch ? new Date(historyMatch.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

                  return (
                    <div key={step.status} className="flex space-x-4 relative z-10">
                      {/* Left side indicator */}
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        stepStatus === 'completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                          : stepStatus === 'current'
                          ? 'bg-[#0f766e] border-[#0f766e] text-white animate-pulse shadow-md shadow-teal-500/20'
                          : 'bg-white/50 border-white/60 text-slate-450'
                      }`}>
                        <StepIcon className="h-4.5 w-4.5" />
                      </div>

                      {/* Right side updates */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className={`text-sm font-black ${
                            stepStatus === 'upcoming' ? 'text-slate-400' : 'text-slate-900'
                          }`}>
                            {step.label}
                          </h4>
                          {historyMatch && (
                            <span className="text-[10px] text-slate-500 font-mono font-bold">
                              {matchedTime}, {matchedDate}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 leading-relaxed ${
                          stepStatus === 'upcoming' ? 'text-slate-400' : 'text-slate-700 font-medium'
                        }`}>
                          {historyMatch ? historyMatch.note : step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Safety Indicator */}
            <div className="mt-8 pt-4 border-t border-white/30 flex items-center space-x-2 text-slate-600 text-xs font-bold">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
              <span>{t('guarantee_lbl')}</span>
            </div>
          </div>

          {/* Right Column: Customer & Item Summary */}
          <div className="space-y-6">
            
            {/* Customer Details Box */}
            <div className="bg-white/30 backdrop-blur-md p-5 rounded-2xl border border-white/45 shadow-xs">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">{t('delivery_address_lbl')}</h3>
              <div className="space-y-2 text-xs">
                <p className="text-slate-900 font-black text-sm">{order.customerName}</p>
                <p className="text-slate-700 font-bold">📞 {order.customerPhone}</p>
                <div className="flex items-start space-x-1.5 text-slate-700 mt-1">
                  <MapPin className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <p className="leading-normal font-medium">{order.customerAddress}</p>
                </div>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="bg-white/30 backdrop-blur-md p-5 rounded-2xl border border-white/45 shadow-xs">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">{t('items_summary_lbl')}</h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 border-b border-white/30 pb-2 last:border-0 last:pb-0">
                    <div className="w-10 h-10 bg-white/60 rounded-lg p-1 border border-white/40 flex items-center justify-center flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-600 font-bold">{language === 'en' ? 'Qty:' : 'Quantity:'} {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/30 pt-3 mt-3 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">{t('paid_amount_lbl')}:</span>
                <span className="text-base font-black text-teal-700">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Empty/Helpful Tips */
        <div className="bg-white/30 backdrop-blur-md rounded-2xl p-8 border border-white/45 text-center max-w-xl mx-auto shadow-sm">
          <Truck className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-black text-slate-800">{t('no_active_order')}</h4>
          <p className="text-xs text-slate-600 font-bold mt-2 leading-relaxed">
            {t('order_help_desc')}
          </p>
        </div>
      )}
    </div>
  );
}
