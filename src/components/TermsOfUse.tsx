import React from 'react';
import { Scale, FileText, ShoppingBag, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function TermsOfUse() {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 animate-fade-in" id="terms-of-use-container">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-xs space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-100">
          <div className="mx-auto w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
            <Scale className="h-6 w-6 text-amber-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            {language === 'en' ? 'Terms of Use' : 'Upyog Ki Shartein (Terms of Use)'}
          </h1>
          <p className="text-xs text-slate-400 font-bold tracking-wide uppercase">
            {language === 'en' ? 'Last Updated: July 2026' : 'Aakhri Badlav: July 2026'}
          </p>
        </div>

        {/* Introduction */}
        <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed space-y-4">
          <p className="font-medium text-slate-700">
            {language === 'en' 
              ? "By accessing and using Home Maker's Bazar, you agree to comply with and be bound by the following terms and conditions. Please read these terms carefully before placing an order or using our features."
              : "Home Maker's Bazar ko use karke aap hamari sharton (Terms and Conditions) ko accept karte hain. Kripya apna order place karne ya hamari website use karne se pehle in sharton ko dhyan se padhein."}
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6 pt-4">
          
          <div className="space-y-2">
            <h2 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">1</span>
              <span>{language === 'en' ? 'User Accounts & Registration' : 'User Account aur Suraksha'}</span>
            </h2>
            <p className="text-xs text-slate-600 pl-7 leading-relaxed">
              {language === 'en' 
                ? 'To place orders and trace shipping status, you must create an account. You are solely responsible for keeping your login credentials confidential and secure.'
                : 'Orders place karne aur delivery status dekhne ke liye aapko account banana hoga. Apne account ka login credentials (username, password) surakshit rakhna aapki hi zimmedari hai.'}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">2</span>
              <span>{language === 'en' ? 'Orders, Pricing & Payments' : 'Orders aur Payments'}</span>
            </h2>
            <p className="text-xs text-slate-600 pl-7 leading-relaxed">
              {language === 'en' 
                ? 'All prices listed on the shop are in Indian Rupees (₹). We reserve the right to cancel orders in case of wrong prices, stock unavailability, or suspicious fraudulent behavior.'
                : 'Hamari website par dikhaye gaye sabhi prices Indian Rupees (₹) mein hain. Kisi bhi galat rate listing, stock khatam hone, ya suspicious activity par order cancel karne ka adhikar humare paas hai.'}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">3</span>
              <span>{language === 'en' ? 'Shipping, Cancellations & Easy Returns' : 'Delivery aur Easy Returns'}</span>
            </h2>
            <p className="text-xs text-slate-600 pl-7 leading-relaxed">
              {language === 'en' 
                ? 'We provide fast regional shipping across major cities. You can easily initiate returns for qualified items directly through the Order History panel under My Profile.'
                : 'Hum sabhi major cities mein fast express delivery provide karte hain. Agar aapko delivered product pasand nahi aata, toh aap My Profile ke andar order list se aasaani se Return request file kar sakte hain.'}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">4</span>
              <span>{language === 'en' ? 'Prohibited Activities' : 'Ban Kiye Gaye Kaam'}</span>
            </h2>
            <p className="text-xs text-slate-600 pl-7 leading-relaxed">
              {language === 'en' 
                ? 'You must not abuse our support ticketing system, flood ratings/reviews with false information, or attempt to exploit any security flaws in the application.'
                : 'Aap ticket system ka galat use nahi kar sakte, products par fake feedback spam nahi kar sakte, ya application security ke sath koi chhedchhad nahi kar sakte.'}
            </p>
          </div>

        </div>

        {/* Footer info box */}
        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start space-x-3">
          <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-slate-800">
              {language === 'en' ? 'Need any clarification?' : 'Koi sawal ya confusion hai?'}
            </h4>
            <p className="text-[11px] text-slate-600 leading-normal">
              {language === 'en' 
                ? "Our terms are designed to maintain a clean, secure marketplace for house makers. For more help, contact Home Maker's Bazar support."
                : 'Yeh shartein isliye hain taaki sabhi house makers ke liye bazar safe aur trusted rahe. Adhik jaankari ke liye help section visit karein.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
