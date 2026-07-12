import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, UserPlus, ShieldAlert, ArrowLeft, Eye, EyeOff, Sparkles, User as UserIcon, Lock } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  onBackToShop: () => void;
  initialTab?: 'login' | 'register';
  forcedAdminMessage?: string;
}

export default function AuthPage({
  onLoginSuccess,
  onBackToShop,
  initialTab = 'login',
  forcedAdminMessage,
}: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const { t, language } = useLanguage();
  
  // Login Form states
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register Form states
  const [regName, setRegName] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) return;

    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUser.trim(),
          password: loginPass,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data);
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status !== 404) {
          setLoginError(data.error || (language === 'en' ? 'Your username or password is incorrect.' : 'Aapka username ya password ghalat hai.'));
          setLoginLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API connection failed, trying local storage validation:', err);
    }

    // Local Storage Fallback Validation
    try {
      const localUsersRaw = localStorage.getItem('ab_users');
      let localUsers = [];
      if (localUsersRaw) {
        try {
          localUsers = JSON.parse(localUsersRaw);
        } catch (e) {
          console.error(e);
        }
      }
      
      // Default admin account
      if (!localUsers.some((u: any) => u.username === 'sanju1234')) {
        localUsers.push({
          username: 'sanju1234',
          passwordHash: 'sanju1234',
          name: 'Sanju Admin',
          role: 'admin',
        });
        localStorage.setItem('ab_users', JSON.stringify(localUsers));
      }

      const match = localUsers.find(
        (u: any) => u.username === loginUser.trim().toLowerCase() && u.passwordHash === loginPass
      );

      if (match) {
        onLoginSuccess({
          username: match.username,
          name: match.name,
          role: match.role,
        });
      } else {
        setLoginError(language === 'en' ? 'Your username or password is incorrect.' : 'Aapka username ya password ghalat hai.');
      }
    } catch (err) {
      console.error(err);
      setLoginError(language === 'en' ? 'Failed to connect to server. Please try again.' : 'Server connect karne mein problem aa rahi hai. Dobara try karein.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUser.trim() || !regPass.trim()) {
      setRegError(language === 'en' ? 'Please fill in all fields correctly.' : 'Kripya saare fields sahi tareeqe se fill karein.');
      return;
    }

    setRegLoading(true);
    setRegError('');
    setRegSuccess('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          username: regUser.trim().toLowerCase(),
          password: regPass,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRegSuccess(t('register_success'));
        // Fill login username
        setLoginUser(data.username);
        // Switch tab to login after 2s
        setTimeout(() => {
          setActiveTab('login');
          setRegSuccess('');
          setRegName('');
          setRegUser('');
          setRegPass('');
        }, 2000);
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status !== 404) {
          setRegError(data.error || (language === 'en' ? 'Failed to create account.' : 'Account create karne mein issue aaya.'));
          setRegLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API registration failed, trying local storage registration:', err);
    }

    // Local Storage Fallback Registration
    try {
      const localUsersRaw = localStorage.getItem('ab_users');
      let localUsers = [];
      if (localUsersRaw) {
        try {
          localUsers = JSON.parse(localUsersRaw);
        } catch (e) {
          console.error(e);
        }
      }

      // Default admin account
      if (!localUsers.some((u: any) => u.username === 'sanju1234')) {
        localUsers.push({
          username: 'sanju1234',
          passwordHash: 'sanju1234',
          name: 'Sanju Admin',
          role: 'admin',
        });
      }

      const normalizedUsername = regUser.trim().toLowerCase();
      const exists = localUsers.some((u: any) => u.username === normalizedUsername);

      if (exists) {
        setRegError(language === 'en' ? 'Username is already taken.' : 'Username pehle se liya ja chuka hai.');
      } else {
        const newUser = {
          username: normalizedUsername,
          passwordHash: regPass,
          name: regName.trim(),
          role: normalizedUsername === 'sanju1234' ? 'admin' : 'user',
        };
        localUsers.push(newUser);
        localStorage.setItem('ab_users', JSON.stringify(localUsers));

        setRegSuccess(t('register_success'));
        setLoginUser(normalizedUsername);
        setTimeout(() => {
          setActiveTab('login');
          setRegSuccess('');
          setRegName('');
          setRegUser('');
          setRegPass('');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setRegError(language === 'en' ? 'Server connection error. Please try again.' : 'Server connect karne mein problem aa rahi hai.');
    } finally {
      setRegLoading(false);
    }
  };

  const autofillAdmin = () => {
    setLoginUser('sanju1234');
    setLoginPass('sanju1234');
    setActiveTab('login');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12" id="auth-container">
      {/* Back to shop */}
      <button
        onClick={onBackToShop}
        className="flex items-center text-xs font-bold text-[#0f766e] hover:underline mb-6 cursor-pointer space-x-1"
        id="auth-back-btn"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{language === 'en' ? 'Back to Shop' : 'Dukaan par wapas jayein'}</span>
      </button>

      {/* Auth Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Banner header with Flipkart style look */}
        <div className="bg-[#0f766e] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-10">
            <Sparkles className="h-24 w-24 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight flex items-center justify-center space-x-1">
            <span>Home Maker's</span>
            <span className="text-[#f59e0b]">Bazar</span>
            <span>Gateway</span>
          </h2>
          <p className="text-xs text-blue-100 mt-1.5 font-medium">
            {activeTab === 'login' ? t('auth_subtitle_login') : t('auth_subtitle_register')}
          </p>
        </div>

        {forcedAdminMessage && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-xs text-amber-800 font-semibold flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>{forcedAdminMessage}</span>
          </div>
        )}

        {/* Tabs switcher */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all text-center border-b-2 cursor-pointer ${
              activeTab === 'login'
                ? 'border-[#0f766e] text-[#0f766e] bg-teal-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-login-btn"
          >
            {t('login_submit')}
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setRegError('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all text-center border-b-2 cursor-pointer ${
              activeTab === 'register'
                ? 'border-[#0f766e] text-[#0f766e] bg-teal-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-register-btn"
          >
            {language === 'en' ? 'CREATE ACCOUNT' : 'ACCOUNT BANAYEIN'}
          </button>
        </div>

        {/* Tab contents */}
        <div className="p-6">
          {activeTab === 'login' ? (
            <motion.form
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleLoginSubmit}
              className="space-y-4"
              id="login-form"
            >
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {language === 'en' ? 'Username / Account ID *' : 'Username / Phone *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={language === 'en' ? 'Enter username...' : 'Username enter karein...'}
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg py-2.5 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                    id="login-username-input"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-600">{t('password_input')} *</label>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    placeholder="Enter password..."
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg py-2.5 pl-9 pr-10 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                    id="login-password-input"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-start space-x-1.5">
                  <span>⚠️</span>
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#0f766e] hover:bg-teal-700 text-white font-extrabold py-3 rounded-lg text-xs tracking-wider transition-colors uppercase shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                id="login-submit-btn"
              >
                {loginLoading ? (
                  <span>{language === 'en' ? 'Authenticating...' : 'Authenticating...'}</span>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>{t('login_submit')}</span>
                  </>
                )}
              </button>

              {/* Removed Admin credentials testing section */}
            </motion.form>
          ) : (
            <motion.form
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleRegisterSubmit}
              className="space-y-4"
              id="register-form"
            >
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{t('fullname_input')} *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={language === 'en' ? 'Enter your name...' : 'Apna naam enter karein...'}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg py-2.5 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                    id="register-name-input"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {language === 'en' ? 'Desired Username *' : 'Desired Username *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={language === 'en' ? 'Enter unique username...' : 'Unique username enter karein...'}
                    value={regUser}
                    onChange={(e) => setRegUser(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg py-2.5 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                    id="register-username-input"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {language === 'en' ? 'Choose Password *' : 'Choose Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters recommended..."
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg py-2.5 pl-9 pr-10 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                    id="register-password-input"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showRegPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {regError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-start space-x-1.5">
                  <span>⚠️</span>
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex items-start space-x-1.5">
                  <span>✅</span>
                  <span>{regSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading}
                className="w-full bg-[#ea580c] hover:bg-orange-700 text-white font-extrabold py-3 rounded-lg text-xs tracking-wider transition-colors uppercase shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                id="register-submit-btn"
              >
                {regLoading ? (
                  <span>{language === 'en' ? 'Registering...' : 'Registering...'}</span>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>{t('register_submit')}</span>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}
