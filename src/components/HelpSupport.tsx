import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  FileText, 
  Clock, 
  Truck, 
  RotateCcw, 
  CreditCard, 
  Info,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { User, SupportTicket } from '../types';

interface HelpSupportProps {
  currentUser: User | null;
  onNavigateToTab?: (tab: 'shop' | 'tracker' | 'admin' | 'auth' | 'profile') => void;
  onTrackOrder?: (orderId: string) => void;
}

export default function HelpSupport({ currentUser, onNavigateToTab, onTrackOrder }: HelpSupportProps) {
  const { language } = useLanguage();
  const [activeFaqCategory, setActiveFaqCategory] = useState<'all' | 'delivery' | 'returns' | 'payment'>('all');
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Form states
  const [formName, setFormName] = useState(currentUser?.name || '');
  const [formEmail, setFormEmail] = useState(currentUser?.username ? (currentUser.username.includes('@') ? currentUser.username : `${currentUser.username}@apnabazar.com`) : '');
  const [formPhone, setFormPhone] = useState('');
  const [formCategory, setFormCategory] = useState<'order' | 'refund' | 'delivery' | 'other'>('order');
  const [formOrderId, setFormOrderId] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Ticket Lookup States
  const [lookupEmail, setLookupEmail] = useState('');
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [isSearchingTickets, setIsSearchingTickets] = useState(false);
  const [searched, setSearched] = useState(false);

  // Update form values if user changes
  useEffect(() => {
    if (currentUser) {
      setFormName(currentUser.name);
      const emailVal = currentUser.username.includes('@') ? currentUser.username : `${currentUser.username}@apnabazar.com`;
      setFormEmail(emailVal);
      setLookupEmail(emailVal);
      fetchUserTickets(emailVal);
    }
  }, [currentUser]);

  const fetchUserTickets = async (emailToFetch: string) => {
    if (!emailToFetch) return;
    setIsSearchingTickets(true);
    setSearched(true);
    try {
      const response = await fetch(`/api/support/tickets?email=${encodeURIComponent(emailToFetch)}`);
      if (response.ok) {
        const data = await response.json();
        setUserTickets(data);
        setIsSearchingTickets(false);
        return;
      }
    } catch (err) {
      console.warn('Error fetching user tickets from API, falling back to local storage:', err);
    }

    // Local storage fallback
    try {
      const savedTicketsRaw = localStorage.getItem('ab_tickets') || '[]';
      const localTickets = JSON.parse(savedTicketsRaw);
      const userFiltered = localTickets.filter(
        (t: any) => t.email.trim().toLowerCase() === emailToFetch.trim().toLowerCase()
      );
      setUserTickets(userFiltered);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingTickets(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formSubject || !formMessage) {
      setSubmitError(language === 'en' ? 'Please fill in all required fields.' : 'Kripya sabhi zaroori fields ko fill karein.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    const payload = {
      name: formName,
      email: formEmail,
      phone: formPhone,
      category: formCategory,
      subject: formSubject,
      message: formMessage,
      orderId: formOrderId
    };

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormSubject('');
        setFormMessage('');
        setFormOrderId('');
        fetchUserTickets(formEmail);
        setIsSubmitting(false);
        return;
      } else {
        const errData = await response.json().catch(() => ({}));
        if (response.status !== 404) {
          setSubmitError(errData.error || (language === 'en' ? 'Something went wrong.' : 'Kuch galat ho gaya.'));
          setIsSubmitting(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Ticket submission API failed, falling back to local storage:', err);
    }

    // Local storage fallback submission
    try {
      const localTicket = {
        id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        ...payload,
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      const savedTicketsRaw = localStorage.getItem('ab_tickets') || '[]';
      let localTickets = [];
      try {
        localTickets = JSON.parse(savedTicketsRaw);
      } catch (e) {
        console.error(e);
      }
      localTickets.unshift(localTicket);
      localStorage.setItem('ab_tickets', JSON.stringify(localTickets));

      setSubmitSuccess(true);
      setFormSubject('');
      setFormMessage('');
      setFormOrderId('');
      
      // Refresh listing
      const userFiltered = localTickets.filter(
        (t: any) => t.email.trim().toLowerCase() === formEmail.trim().toLowerCase()
      );
      setUserTickets(userFiltered);
    } catch (errFallback) {
      console.error(errFallback);
      setSubmitError(language === 'en' ? 'Server error. Please try again.' : 'Server issue. Kripya dobara try karein.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // FAQ List
  const faqs = [
    {
      q_en: 'How can I track my order?',
      q_hi: 'Main apna order kaise track kar sakta hoon?',
      a_en: 'You can track your order using the "Track Order" tab in the header. Enter your unique Order ID (e.g., ORD-9876) to view the live dispatch and delivery stage.',
      a_hi: 'Aap header mein "Track Order" par click karke apna unique Order ID (Jaise: ORD-9876) daal kar live status track kar sakte hain.',
      category: 'delivery'
    },
    {
      q_en: "What is the return policy of Home Maker's Bazar?",
      q_hi: "Home Maker's Bazar ki return policy kya hai?",
      a_en: 'We offer a straightforward 7 days no-questions-asked exchange and return policy. Simply go to "My Orders" in your profile dashboard and tap "Return Order" on any delivered package.',
      a_hi: 'Hum 7 dinon ki aasan return policy dete hain. Bas apne Profile mein "Mere Orders" section mein jaakar delivered order par "Return Order" click karein.',
      category: 'returns'
    },
    {
      q_en: 'When will I receive my refund?',
      q_hi: 'Mera refund kab tak aayega?',
      a_en: 'Once our support agent approves your return request, the refund is processed immediately. It usually takes 2-3 business days to credit back to your UPI or bank account.',
      a_hi: 'Return request approve hone ke baad refund turant start kar diya jata hai. Bank account ya UPI mein credit hone mein aamtaur par 2-3 working days lagte hain.',
      category: 'returns'
    },
    {
      q_en: "Does Home Maker's Bazar offer Cash on Delivery (COD)?",
      q_hi: "Kya Home Maker's Bazar COD (Cash on Delivery) offer karta hai?",
      a_en: 'Yes, we offer secure Cash on Delivery (COD) as well as cards and instant UPI payment methods for a smooth checkout experience.',
      a_hi: 'Haan! Hum cash on delivery (COD), credit/debit card, aur instant UPI payments sabhi secure options provide karte hain.',
      category: 'payment'
    },
    {
      q_en: 'How can I modify or cancel my order?',
      q_hi: 'Kya main apna order change ya cancel kar sakta hoon?',
      a_en: 'Orders can be cancelled before they transition to the "Shipped" status. You can initiate cancellation or request modifications by submitting a support ticket on this page with your Order ID.',
      a_hi: 'Order tab tak cancel kiya ja sakta hai jab tak woh "Shipped" na ho jaye. Cancel karne ya badalne ke liye is page par support form ke dwara ticket create karein.',
      category: 'delivery'
    },
    {
      q_en: 'Are my payment details secure?',
      q_hi: 'Kya mere payment transactions safe hain?',
      a_en: 'Absolutely. We utilize industry-standard 256-bit encryption for all UPI and Card transactions. Your credential details are never stored on our servers directly.',
      a_hi: 'Bilkul safe hain! Hum standard 256-bit encryption use karte hain. Aapki card details server par store nahi hoti hain.',
      category: 'payment'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const qText = language === 'en' ? faq.q_en.toLowerCase() : faq.q_hi.toLowerCase();
    const aText = language === 'en' ? faq.a_en.toLowerCase() : faq.a_hi.toLowerCase();
    const matchesSearch = qText.includes(faqSearch.toLowerCase()) || aText.includes(faqSearch.toLowerCase());
    const matchesCategory = activeFaqCategory === 'all' || faq.category === activeFaqCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="help-support-section">
      
      {/* Title section */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center space-x-2 bg-teal-50 border border-teal-200 text-[#0f766e] px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase mb-3">
          <HelpCircle className="h-4 w-4" />
          <span>{language === 'en' ? '24/7 SUPPORT DESK' : '24/7 SEVA KENDRA'}</span>
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          {language === 'en' ? 'How can we help you today?' : 'Hum aapki kya madad kar sakte hain?'}
        </h1>
        <p className="text-sm font-bold text-slate-500 mt-2">
          {language === 'en' 
            ? 'Browse common FAQs, check your submitted tickets, or launch a direct resolution request below.' 
            : 'Faq padhein, apni support tickets check karein ya direct naya inquiry ticket file karein.'}
        </p>
      </div>

      {/* Main Grid: FAQ Left (2/3) + Form Right (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: FAQs & Search */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-[#0f766e]" />
              <span>{language === 'en' ? 'Frequently Asked Questions (FAQs)' : 'Sawaal aur Jawab (FAQs)'}</span>
            </h2>

            {/* Centralized FAQ Search Bar */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder={language === 'en' ? "Search for answers (e.g. refund, return)..." : "Ans khojein (Jaise: refund, return)..."}
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-teal-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all shadow-inner"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            </div>

            {/* Category selection bar */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => { setActiveFaqCategory('all'); setOpenFaqIndex(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeFaqCategory === 'all' 
                    ? 'bg-[#0f766e] text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {language === 'en' ? 'All Topics' : 'Sabhi Topics'}
              </button>
              <button
                onClick={() => { setActiveFaqCategory('delivery'); setOpenFaqIndex(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1 ${
                  activeFaqCategory === 'delivery' 
                    ? 'bg-[#0f766e] text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <Truck className="h-3 w-3" />
                <span>{language === 'en' ? 'Delivery & Orders' : 'Delivery aur Orders'}</span>
              </button>
              <button
                onClick={() => { setActiveFaqCategory('returns'); setOpenFaqIndex(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1 ${
                  activeFaqCategory === 'returns' 
                    ? 'bg-[#0f766e] text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <RotateCcw className="h-3 w-3" />
                <span>{language === 'en' ? 'Returns & Refund' : 'Returns aur Refund'}</span>
              </button>
              <button
                onClick={() => { setActiveFaqCategory('payment'); setOpenFaqIndex(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1 ${
                  activeFaqCategory === 'payment' 
                    ? 'bg-[#0f766e] text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <CreditCard className="h-3 w-3" />
                <span>{language === 'en' ? 'Payments' : 'Payments'}</span>
              </button>
            </div>

            {/* Accordion FAQ List */}
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">
                  {language === 'en' ? 'No FAQs found matching your search term.' : 'Aapki search se milta-julta koi FAQ nahi mila.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border-t border-slate-100 mt-2">
                {filteredFaqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={index} className="py-4">
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full flex justify-between items-center text-left focus:outline-none group"
                      >
                        <span className="text-sm font-black text-slate-700 group-hover:text-[#0f766e] transition-colors leading-snug">
                          {language === 'en' ? faq.q_en : faq.q_hi}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-[#0f766e] flex-shrink-0 ml-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0 ml-4" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="mt-2.5 text-xs font-bold text-slate-500 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100 animate-slide-down">
                          {language === 'en' ? faq.a_en : faq.a_hi}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Ticket Status Lookup (Highly Professional) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-lg font-extrabold text-slate-800 mb-2 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-amber-500" />
              <span>{language === 'en' ? 'Track Support Tickets' : 'Support Ticket Status Check'}</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4 font-bold">
              {language === 'en' 
                ? 'Enter your email below to fetch and track your previous tickets and our responses.'
                : 'Apna registered email niche daal kar support tickets aur humare responses track karein.'}
            </p>

            <div className="flex gap-2 max-w-md">
              <input
                type="email"
                placeholder="your-email@example.com"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                className="flex-1 bg-slate-50 text-slate-800 border border-slate-200 focus:border-teal-500 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                onClick={() => fetchUserTickets(lookupEmail)}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer select-none flex items-center space-x-1"
                disabled={isSearchingTickets}
              >
                {isSearchingTickets ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <span>{language === 'en' ? 'Search' : 'Search'}</span>
                )}
              </button>
            </div>

            {/* List User Tickets */}
            {searched && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-600">
                    {language === 'en' ? 'Found Support Tickets' : 'Mili Hui Support Tickets'} ({userTickets.length})
                  </span>
                  <button 
                    onClick={() => fetchUserTickets(lookupEmail)} 
                    className="text-[10px] text-[#0f766e] font-black hover:underline flex items-center space-x-0.5"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>{language === 'en' ? 'Refresh' : 'Refresh'}</span>
                  </button>
                </div>

                {userTickets.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold py-2">
                    {language === 'en' ? 'No tickets found under this email.' : 'Is email ke under koi support ticket nahi mili.'}
                  </p>
                ) : (
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {userTickets.map((ticket) => (
                      <div key={ticket.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full mr-2">
                              {ticket.id}
                            </span>
                            <span className="text-xs font-black text-slate-700">{ticket.subject}</span>
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            ticket.status === 'open' 
                              ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {ticket.status === 'open' ? (language === 'en' ? 'Open' : 'Chalu') : (language === 'en' ? 'Resolved' : 'Hal Hua')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400">
                          <div>
                            <span>{language === 'en' ? 'Category: ' : 'Category: '}</span>
                            <span className="text-slate-600 capitalize">{ticket.category}</span>
                          </div>
                          <div>
                            <span>{language === 'en' ? 'Created: ' : 'Created: '}</span>
                            <span className="text-slate-600">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                          {ticket.orderId && (
                            <div className="col-span-2">
                              <span>{language === 'en' ? 'Referenced Order: ' : 'Order ID Ref: '}</span>
                              <button 
                                onClick={() => onTrackOrder && onTrackOrder(ticket.orderId!)}
                                className="text-[#0f766e] hover:underline font-black cursor-pointer"
                              >
                                {ticket.orderId}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="text-xs font-semibold text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 mb-1">
                            {language === 'en' ? 'Your Message:' : 'Aapka Sandesh:'}
                          </p>
                          {ticket.message}
                        </div>

                        {/* Admin reply panel */}
                        {ticket.reply ? (
                          <div className="text-xs font-semibold text-slate-700 bg-teal-50 border border-teal-100 p-2.5 rounded-lg">
                            <p className="text-[10px] font-black text-[#0f766e] mb-1 flex items-center space-x-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{language === 'en' ? "Home Maker's Bazar Support Team Response:" : "Home Maker's Bazar Support Team Response:"}</span>
                            </p>
                            {ticket.reply}
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-amber-600 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{language === 'en' ? 'Waiting for executive response...' : 'Executive response ka intezar hai...'}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: direct ticket submission form */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs sticky top-20">
            <h2 className="text-lg font-extrabold text-slate-800 mb-2 flex items-center space-x-2">
              <Send className="h-5 w-5 text-[#0f766e]" />
              <span>{language === 'en' ? 'Submit a Ticket' : 'Naya Ticket Submit Karein'}</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4 font-bold">
              {language === 'en' 
                ? 'Can\'t find answers in FAQs? Fill the form below and our executive will reach out within 24 hours.'
                : 'FAQs mein answer nahi mila? Support Form fill karein, humare expert 24 ghante mein response karenge.'}
            </p>

            {submitSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-3 animate-fade-in">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-black text-emerald-800">
                  {language === 'en' ? 'Ticket Submitted Successfully!' : 'Ticket successfully register hua!'}
                </h3>
                <p className="text-xs font-bold text-slate-500">
                  {language === 'en' 
                    ? 'We have received your ticket. You can look it up in the tracker on the left.' 
                    : 'Aapka query humein mil gaya hai. Aap left side tracker se iska status follow kar sakte hain.'}
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="w-full bg-[#0f766e] hover:bg-[#0d645e] text-white text-xs font-black py-2 rounded-xl transition-colors shadow-sm cursor-pointer select-none"
                >
                  {language === 'en' ? 'Submit Another Query' : 'Naya Ticket Likhein'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl flex items-center space-x-1.5">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                    {language === 'en' ? 'Full Name *' : 'Aapka Naam *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Rohit Mehra"
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-teal-500 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                    {language === 'en' ? 'Email Address *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. rohit@gmail.com"
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-teal-500 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                      {language === 'en' ? 'Phone (Optional)' : 'Phone (Zaroori Nahi)'}
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-teal-500 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                      {language === 'en' ? 'Order ID (Optional)' : 'Order ID (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={formOrderId}
                      onChange={(e) => setFormOrderId(e.target.value)}
                      placeholder="e.g. ORD-9876"
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-teal-500 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                    {language === 'en' ? 'Query Category *' : 'Kaun Sa Issue Hai? *'}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-teal-500 rounded-xl px-2 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="order">{language === 'en' ? 'Order Issue' : 'Order Issue'}</option>
                    <option value="delivery">{language === 'en' ? 'Delivery Delay' : 'Delivery Delay'}</option>
                    <option value="refund">{language === 'en' ? 'Refund & Payment' : 'Refund & Payment'}</option>
                    <option value="other">{language === 'en' ? 'Other Inquiry' : 'Kuch aur help chahiye'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                    {language === 'en' ? 'Subject *' : 'Subject *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder={language === 'en' ? "e.g. Delivery status not updating" : "e.g. Refund kab aayega"}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-teal-500 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                    {language === 'en' ? 'Detailed Message *' : 'Apni Samasya Likhein *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder={language === 'en' ? "Explain your problem clearly..." : "Apni problem yahan detail mein likhein..."}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 focus:border-teal-500 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0f766e] hover:bg-[#0d645e] text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer select-none"
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>{language === 'en' ? 'SUBMIT SUPPORT TICKET' : 'SUPPORT TICKET SUBMIT KAREIN'}</span>
                    </>
                  )}
                </button>

              </form>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
