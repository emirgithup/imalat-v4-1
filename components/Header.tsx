
import React, { useState } from 'react';

interface HeaderProps {
  onLogout?: () => void;
  userEmail?: string;
  companyName?: string;
  onNavigate?: (page: 'home' | 'reports') => void;
  currentPage?: 'home' | 'reports';
  searchTerm?: string;
  onSearch?: (term: string) => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onLogout, 
  userEmail, 
  companyName = "TextileManager",
  onNavigate, 
  currentPage = 'home',
  searchTerm = "",
  onSearch,
  isAdmin = false
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="flex flex-col border-b border-solid border-slate-200 dark:border-slate-800 bg-card-light dark:bg-card-dark sticky top-0 z-[100] print:hidden">
      <div className="flex items-center justify-between whitespace-nowrap px-3 sm:px-6 py-2.5 sm:py-3 gap-2">
        <div className="flex items-center gap-3 sm:gap-8 min-w-0">
          <div 
            className="flex items-center gap-2 sm:gap-3 text-text-primary-light dark:text-text-primary-dark cursor-pointer min-w-0"
            onClick={() => isAdmin ? onNavigate?.('home') : onNavigate?.('reports')}
          >
            <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">dataset</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm sm:text-lg font-bold leading-tight tracking-tight truncate max-w-[120px] sm:max-w-none">{companyName}</h2>
            </div>
          </div>

          {/* Masaüstü & Mobil Sayfa Menüsü */}
          <nav className="flex items-center gap-1 sm:gap-2 md:gap-4 bg-slate-100/80 dark:bg-slate-800/80 md:bg-transparent p-1 md:p-0 rounded-xl">
            {isAdmin && (
              <button 
                type="button"
                onClick={() => onNavigate?.('home')}
                className={`flex items-center gap-1 text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  currentPage === 'home' 
                    ? 'text-primary bg-white md:bg-primary/10 shadow-sm md:shadow-none dark:bg-slate-900' 
                    : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] md:hidden">add_box</span>
                <span>Numuneler</span>
              </button>
            )}
            <button 
              type="button"
              onClick={() => onNavigate?.('reports')}
              className={`flex items-center gap-1 text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                currentPage === 'reports' 
                  ? 'text-primary bg-white md:bg-primary/10 shadow-sm md:shadow-none dark:bg-slate-900' 
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px] md:hidden">folder_open</span>
              <span>Raporlar</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
          <div className="hidden md:flex items-center min-w-48 w-72 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-background-light dark:bg-background-dark focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all px-3 gap-2">
            <span className="material-symbols-outlined text-[20px] text-text-secondary-light dark:text-text-secondary-dark shrink-0">search</span>
            <input 
              className="w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light/70 dark:placeholder:text-text-secondary-dark/70 text-sm font-medium" 
              placeholder="Model kodu / müşteri ara..." 
              value={searchTerm}
              onChange={(e) => onSearch?.(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => onSearch?.("")} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-full"
                title="Aramayı Temizle"
              >
                <span className="material-symbols-outlined text-[16px] block">close</span>
              </button>
            )}
          </div>
          
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="size-8 sm:size-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px]">person</span>
              </div>
              <div className="hidden lg:flex items-center gap-1.5">
                <span className="text-xs font-bold text-text-primary-light dark:text-text-primary-dark">{userEmail?.split('@')[0] || 'Kullanıcı'}</span>
                {isAdmin ? (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    Yönetici
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Kullanıcı
                  </span>
                )}
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
            </button>

            {showProfileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowProfileMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest truncate">{companyName}</p>
                      {isAdmin ? (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          Yönetici
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          Kullanıcı
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-text-primary-light dark:text-text-primary-dark truncate">{userEmail}</p>
                  </div>

                  {isAdmin && (
                    <button 
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onNavigate?.('home');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors ${
                        currentPage === 'home'
                          ? 'text-primary bg-primary/10'
                          : 'text-text-primary-light dark:text-text-primary-dark hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">add_box</span>
                      Numuneler (Yeni Kayıt)
                    </button>
                  )}

                  <button 
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate?.('reports');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors ${
                      currentPage === 'reports'
                        ? 'text-primary bg-primary/10'
                        : 'text-text-primary-light dark:text-text-primary-dark hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">folder_open</span>
                    Raporlar (Arşiv)
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                  <button 
                    type="button"
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Oturumu Kapat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
