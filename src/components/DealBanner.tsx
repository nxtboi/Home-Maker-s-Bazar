import React, { useState } from 'react';
import { Sparkles, ArrowRight, Zap, Gift, Smartphone, Tv, Armchair, ShoppingBag, ShieldCheck, Palette } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DealBannerProps {
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
}

export default function DealBanner({ onSelectCategory, selectedCategory }: DealBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage();

  const slides = [
    {
      title: t('top_selling_product'),
      desc: t('deal_banner_subtitle_1'),
      discount: 'UP TO 50% OFF',
      tag: t('deal_banner_tag_1'),
      bg: 'bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900',
      textColor: 'text-white',
      badgeBg: 'bg-[#f59e0b] text-white',
      image: 'https://i.ibb.co/BKB8Pfc6/Gemini-Generated-Image-7xlaj37xlaj37xla.png',
    },
    {
      title: 'FURNITURE & DECOR FESTIVAL',
      desc: t('deal_banner_subtitle_2'),
      discount: 'FLAT 40% OFF',
      tag: t('deal_banner_tag_2'),
      bg: 'bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900',
      textColor: 'text-white',
      badgeBg: 'bg-[#f59e0b] text-white',
      image: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    }
  ];

  const categories = [
    { name: t('all_products'), value: 'All', icon: ShoppingBag, color: 'text-[#0f766e]' },
    { name: t('accessories'), value: 'Accessories', icon: Zap, color: 'text-amber-600' },
    { name: t('furniture'), value: 'Furniture', icon: Armchair, color: 'text-emerald-600' },
    { name: t('kitchenware'), value: 'Kitchenware', icon: Gift, color: 'text-orange-500' },
    { name: t('home_decoration'), value: 'Home Decoration', icon: Palette, color: 'text-[#ec4899]' },
  ];

  return (
    <div className="space-y-6" id="deal-banner-wrapper">
      
      {/* 1. Flipkart-style Horizontal Category Strip */}
      <div className="glass-panel border border-white/30 shadow-md py-4 rounded-2xl max-w-7xl mx-auto mt-4" id="category-strip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 md:space-x-12 overflow-x-auto justify-start md:justify-center py-2 scrollbar-none">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = selectedCategory === cat.value;

              return (
                <div
                  key={cat.value}
                  onClick={() => onSelectCategory(cat.value)}
                  className="flex flex-col items-center space-y-1.5 cursor-pointer flex-shrink-0 group select-none"
                  id={`cat-strip-item-${cat.value}`}
                >
                  <div className={`p-3 rounded-full transition-all duration-300 border ${
                    isSelected 
                      ? 'bg-teal-500/15 border-teal-500 ring-2 ring-teal-500/20 scale-105' 
                      : 'bg-white/30 border-white/45 group-hover:bg-white/45 group-hover:scale-105'
                  }`}>
                    <IconComp className={`h-6 w-6 ${isSelected ? 'text-[#0f766e]' : 'text-slate-700 group-hover:text-teal-500'}`} />
                  </div>
                  <span className={`text-xs font-black tracking-wide ${
                    isSelected ? 'text-[#0f766e]' : 'text-slate-600 group-hover:text-teal-600'
                  }`}>
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive Promos Carousel (Flipkart Billboard Vibe) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="deal-carousel">
        <div className={`relative overflow-hidden rounded-2xl ${slides[currentSlide].bg} border border-white/20 backdrop-blur-md shadow-lg text-white p-6 sm:p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between`}>
          
          {/* Glass Overlay */}
          <div className="absolute inset-0 bg-white/5 pointer-events-none" />

          {/* Slide Text Content */}
          <div className="max-w-lg space-y-4 text-center md:text-left z-10 flex-1">
            <span className={`inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${slides[currentSlide].badgeBg}`}>
              {slides[currentSlide].tag}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold tracking-tight leading-none text-white">
              {slides[currentSlide].title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-100 font-medium">
              {slides[currentSlide].desc}
            </p>
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0 pt-2">
              <span className="text-xs text-white/90 font-bold italic flex items-center space-x-1">
                <span>✓ {t('secure_payment')}</span>
                <span>• {t('easy_returns')}</span>
              </span>
            </div>
          </div>

          {/* Slide Image Panel */}
          <div className="mt-6 md:mt-0 md:ml-8 relative w-48 sm:w-56 h-48 sm:h-56 bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-white/25 shadow-xl flex-shrink-0">
            <img 
              src={slides[currentSlide].image} 
              alt="Promo Product" 
              className="w-full h-full object-cover rounded-xl shadow-lg transform hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Manual Slider Navigation dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 w-2.5 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? 'bg-white w-6' : 'bg-white/40'
                }`}
                id={`carousel-dot-${idx}`}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
