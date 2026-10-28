import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { saveCustomCompany, slugifyCompanyId, CompanyAccount } from '../lib/companyManager';
import { safeStorage } from '../lib/safeStorage';

interface LoginPageProps {
  onLogin?: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const [mode, setMode] = useState<'login' | 'new_company'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Yeni Şirket Kaydı state'leri
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Lütfen e-posta ve şifre alanlarını doldurun.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);

    try {
      safeStorage.removeItem('override_admin_email');

      // Özel tanımlı hesapların şifre doğrulaması
      const knownCredentials: Record<string, { pwd: string; role: 'admin' | 'user'; companyId: string; companyName: string }> = {
        'mixemir@gmail.com': { pwd: '144742', role: 'admin', companyId: 'default', companyName: 'TextileManager' },
        'modeller@gmail.com': { pwd: 'desenler', role: 'admin', companyId: 'default', companyName: 'TextileManager' },
        'mustafa@gmail.com': { pwd: '123456', role: 'admin', companyId: 'haza_triko', companyName: 'Haza Triko' },
        'haza@gmail.com': { pwd: '654321', role: 'user', companyId: 'haza_triko', companyName: 'Haza Triko' },
      };

      const matchedKnown = knownCredentials[trimmedEmail];
      if (matchedKnown && password !== matchedKnown.pwd) {
        throw new Error('E-posta veya şifre hatalı.');
      }

      // Supabase Giriş
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      // mixemir@gmail.com yeni şifre (144742) doğrulama yedeği
      if (signInError && trimmedEmail === 'mixemir@gmail.com' && password === '144742') {
        safeStorage.setItem('override_admin_email', 'mixemir@gmail.com');
        const fallback = await supabase.auth.signInWithPassword({
          email: 'modeller@gmail.com',
          password: 'desenler',
        });
        signInError = fallback.error;
      }

      // Diğer tanımlı şirket hesapları için otomatik yedek kayıt/giriş doğrulaması
      if (signInError && matchedKnown && password === matchedKnown.pwd) {
        await supabase.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: {
            data: {
              role: matchedKnown.role,
              company_id: matchedKnown.companyId,
              company_name: matchedKnown.companyName,
            },
          },
        });
        const retry = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });
        signInError = retry.error;
      }

      if (signInError) {
        throw new Error('E-posta veya şifre hatalı.');
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err.message || 'Giriş işlemi sırasında bir hata oluştu.');
      setIsLoading(false);
    }
  };

  const handleNewCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedCompany = companyName.trim();
    const trimmedAdminEmail = adminEmail.trim().toLowerCase();
    const trimmedUserEmail = userEmail.trim().toLowerCase();

    if (!trimmedCompany) {
      setError('Lütfen şirket adını girin.');
      return;
    }
    if (!trimmedAdminEmail || !adminPassword) {
      setError('Lütfen şirket yönetici (admin) e-posta ve şifresini girin.');
      return;
    }
    if (adminPassword.length < 6) {
      setError('Yönetici şifresi en az 6 karakter olmalıdır.');
      return;
    }
    if (trimmedUserEmail && userPassword.length < 6) {
      setError('Kullanıcı şifresi en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);

    try {
      const companyId = slugifyCompanyId(trimmedCompany);
      const accounts: CompanyAccount[] = [
        { email: trimmedAdminEmail, role: 'admin' },
      ];
      const knownUserIds: string[] = [];

      // 1. Eğer kullanıcı hesabı da girildiyse önce onu oluştur
      if (trimmedUserEmail && userPassword) {
        accounts.push({ email: trimmedUserEmail, role: 'user' });
        const userRes = await supabase.auth.signUp({
          email: trimmedUserEmail,
          password: userPassword,
          options: {
            data: {
              role: 'user',
              company_id: companyId,
              company_name: trimmedCompany,
            },
          },
        });
        if (userRes.data?.user?.id) {
          knownUserIds.push(userRes.data.user.id);
        }
        // Oturum açıldıysa kapatıp admini oluşturacağız
        await supabase.auth.signOut();
      }

      // 2. Yönetici (Admin) hesabını oluştur
      const adminRes = await supabase.auth.signUp({
        email: trimmedAdminEmail,
        password: adminPassword,
        options: {
          data: {
            role: 'admin',
            company_id: companyId,
            company_name: trimmedCompany,
          },
        },
      });

      if (adminRes.error) {
        throw adminRes.error;
      }

      if (adminRes.data?.user?.id) {
        knownUserIds.push(adminRes.data.user.id);
      }

      // 3. Şirket yapılandırmasını kaydet
      saveCustomCompany({
        id: companyId,
        name: trimmedCompany,
        accounts,
        knownUserIds,
      });

      setSuccessMsg(`${trimmedCompany} şirket kaydı oluşturuldu! Yönetici hesabıyla giriş yapabilirsiniz.`);
      setEmail(trimmedAdminEmail);
      setPassword(adminPassword);
      setMode('login');
    } catch (err: any) {
      console.error('Company Registration Error:', err);
      setError(err.message || 'Şirket kaydı oluşturulurken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 relative overflow-hidden font-display">
      {/* Arka plan süslemeleri */}
      <div className="absolute top-[-10%] left-[-5%] size-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] size-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse delay-700"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-primary/30 mb-4 transform hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-[36px]">apartment</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark tracking-tight">
            Şirket Giriş Portalı
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium mt-1 text-sm text-center">
            {mode === 'login'
              ? 'Şirket hesabınızla giriş yaparak kendi kayıtlarınıza erişin'
              : 'Yeni şirket ve yetkili hesaplarını tanımlayın'}
          </p>
        </div>

        <div className="bg-white/90 dark:bg-card-dark/90 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-7 md:p-9">
          {/* Sekme Seçici */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-6 border border-slate-200/70 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white dark:bg-card-dark text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              Şirket Girişi
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('new_company');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                mode === 'new_company'
                  ? 'bg-white dark:bg-card-dark text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">domain_add</span>
              Yeni Şirket Kaydı
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl animate-in fade-in duration-300">
              <p className="text-xs font-bold text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 rounded-r-xl animate-in fade-in duration-300">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{successMsg}</p>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">
                  Şirket E-Posta Adresi
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-primary focus:border-primary dark:text-white transition-all"
                    placeholder="ornek@sirket.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">
                    Şifre
                  </label>
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
                className="w-full h-12 bg-primary hover:bg-blue-600 shadow-primary/20 text-white rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Şirket Oturumu Aç</span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                      login
                    </span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleNewCompanySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">
                  Şirket Adı
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">business</span>
                  </div>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="block w-full pl-10 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-emerald-500 focus:border-emerald-500 dark:text-white transition-all"
                    placeholder="Örn: Haza Triko"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                <p className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  Şirket Yöneticisi (Admin)
                </p>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="block w-full px-3.5 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                  placeholder="Yönetici E-Posta (örn: mustafa@gmail.com)"
                />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="block w-full px-3.5 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                  placeholder="Yönetici Şifresi (en az 6 karakter)"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <p className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  Şirket Kullanıcısı (İsteğe Bağlı)
                </p>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="block w-full px-3.5 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-primary focus:border-primary dark:text-white"
                  placeholder="Kullanıcı E-Posta (örn: haza@gmail.com)"
                />
                <input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="block w-full px-3.5 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-primary focus:border-primary dark:text-white"
                  placeholder="Kullanıcı Şifresi (en az 6 karakter)"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 text-white rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Şirket Kaydını Oluştur</span>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
