import React from 'react';
import { ShieldCheck, Lock, Eye, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PrivacyPolicy() {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 animate-fade-in" id="privacy-policy-container">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-xs space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-100">
          <div className="mx-auto w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100">
            <ShieldCheck className="h-6 w-6 text-[#0f766e]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            {language === 'en' ? 'Privacy Policy' : 'Nijata Neeti (Privacy Policy)'}
          </h1>
          <p className="text-xs text-slate-400 font-bold tracking-wide uppercase">
            {language === 'en' ? 'Last Updated: July 2026' : 'Aakhri Badlav: July 2026'}
          </p>
        </div>

        {/* Introduction */}
        <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed space-y-4">
          <p className="font-medium text-slate-700">
            {language === 'en' 
              ? "Welcome to Home Maker's Bazar. We value your trust and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and share your data when you visit our store or use our services."
              : "Home Maker's Bazar mein aapka swagat hai. Hum aapke vishwas ka samman karte hain aur aapki personal details ko surakshit rakhne ke liye committed hain. Yeh Privacy Policy batati hai ki jab aap hamari dukaan par aate hain toh hum aapka data kaise collect aur use karte hain."}
          </p>
        </div>

        {/* Key Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
            <Lock className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-xs text-slate-800">
              {language === 'en' ? 'Secure Encryption' : 'Poori Tarah Surakshit'}
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              {language === 'en' ? 'Your passwords and payment details are strictly encrypted.' : 'Aapke passwords aur payment details poori tarah encrypted rehte hain.'}
            </p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
            <Eye className="h-5 w-5 text-[#0f766e]" />
            <h3 className="font-bold text-xs text-slate-800">
              {language === 'en' ? 'No Spam' : 'No Spam Guarantee'}
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              {language === 'en' ? 'We do not sell your personal contacts or send annoying spam.' : 'Hum aapka personal data kisi ko nahi bechte aur faltu spam messages nahi bhejte.'}
            </p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-xs text-slate-800">
              {language === 'en' ? 'Full Control' : 'Aapka Poora Control'}
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              {language === 'en' ? 'You can update your personal details or delete your cache anytime.' : 'Aap jab chahein apni personal profile details ko edit ya update kar sakte hain.'}
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6 pt-4 border-t border-slate-100">
          
          <div className="space-y-2">
            <h2 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-[#0f766e] text-[10px] font-bold">1</span>
              <span>{language === 'en' ? 'Information We Collect' : 'Kaunsi Information Hum Collect Karte Hain'}</span>
            </h2>
            <p className="text-xs text-slate-600 pl-7 leading-relaxed">
              {language === 'en' 
                ? 'We collect your name, phone number, delivery address, and login credentials to deliver your items and provide tracking status.'
                : 'Hum aapka naam, phone number, delivery address, aur login details collect karte hain taaki aapke orders safely deliver kiye ja sakein aur aapko status mil sake.'}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-[#0f766e] text-[10px] font-bold">2</span>
              <span>{language === 'en' ? 'How We Use Your Data' : 'Aapke Data Ka Use Kaise Hota Hai'}</span>
            </h2>
            <p className="text-xs text-slate-600 pl-7 leading-relaxed">
              {language === 'en' 
                ? 'Your data is solely used to process orders, manage accounts, prevent fraud, and provide support via our support ticketing system.'
                : 'Aapke data ka use sirf orders process karne, account manage karne, fraud se bachne, aur support tickets resolve karne ke liye hota hai.'}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-[#0f766e] text-[10px] font-bold">3</span>
              <span>{language === 'en' ? 'Cookies & Local Storage' : 'Cookies aur Local Storage'}</span>
            </h2>
            <p className="text-xs text-slate-600 pl-7 leading-relaxed">
              {language === 'en' 
                ? 'We use browser localStorage to keep you logged in and to temporarily save items in your shopping cart.'
                : 'Hum browser ke localStorage ka use karte hain taaki aap logged-in rahein aur aapki cart ke items delete na hon.'}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-[#0f766e] text-[10px] font-bold">4</span>
              <span>{language === 'en' ? 'Contact Support' : 'Support se Sampark Karein'}</span>
            </h2>
            <p className="text-xs text-slate-600 pl-7 leading-relaxed">
              {language === 'en' 
                ? 'If you have any questions about your privacy, feel free to raise a ticket in the Help & Support section under My Profile.'
                : 'Agar nijata (privacy) ko lekar koi sawal hai, toh aap My Profile ke andar Help & Support section mein ticket raise kar sakte hain.'}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
