
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface LoginPageProps {
  onLogin?: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Supabase Kayıt
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });
        if (error) throw error;
        if (data.user) {
            alert("Kayıt başarılı! Lütfen giriş yapınız.");
            setIsSignUp(false);
        }
      } else {
        // Supabase Giriş
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (error) throw error;
      }

    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "Giriş işlemi sırasında bir hata oluştu.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 relative overflow-hidden font-display">
      {/* Arka plan süslemeleri */}
      <div className="absolute top-[-10%] left-[-5%] size-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] size-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse delay-700"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center mb-10">
          <div className="size-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-primary/30 mb-4 transform hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-[36px]">dataset</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark tracking-tight">TextileManager</h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium mt-1">
            {isSignUp ? 'Yeni hesap oluşturun (Supabase)' : 'Sisteme Hoş Geldiniz'}
          </p>
        </div>

        <div className="bg-white/80 dark:bg-card-dark/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg animate-in fade-in duration-300">
                <p className="text-xs font-bold text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">E-Posta Adresi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-primary focus:border-primary dark:text-white transition-all"
                  placeholder="ornek@kenza.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">Şifre</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-primary focus:border-primary dark:text-white transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full h-12 text-white rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed ${isSignUp ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-primary hover:bg-blue-600 shadow-primary/20'}`}
            >
              {isLoading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? 'Hesap Oluştur' : 'Oturum Aç'}</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    {isSignUp ? 'person_add' : 'login'}
                  </span>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <button 
               type="button"
               onClick={() => {
                 setIsSignUp(!isSignUp);
                 setError('');
               }}
               className="text-xs font-bold text-primary hover:text-blue-700 transition-colors"
             >
               {isSignUp ? 'Zaten hesabınız var mı? Giriş Yapın' : 'Hesabınız yok mu? Kayıt Olun'}
             </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-bold text-text-secondary-light dark:text-text-secondary-dark/40 uppercase tracking-[2px]">
          &copy; 2024 KENZA'A TEKSTİL İMALAT LTD. ŞTİ.
        </p>
      </div>
    </div>
  );
};
