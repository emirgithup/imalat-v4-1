
import React, { useState } from 'react';

interface HeaderProps {
  onLogout?: () => void;
  userEmail?: string;
  onNavigate?: (page: 'home' | 'reports') => void;
  currentPage?: 'home' | 'reports';
  searchTerm?: string;
  onSearch?: (term: string) => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onLogout, 
  userEmail, 
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
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-card-light dark:bg-card-dark px-6 py-3 sticky top-0 z-50 print:hidden">
      <div className="flex items-center gap-8">
        <div 
          className="flex items-center gap-3 text-text-primary-light dark:text-text-primary-dark cursor-pointer"
          onClick={() => isAdmin && onNavigate?.('home')}
        >
          <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">dataset</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight">TextileManager</h2>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {isAdmin && (
            <button 
              onClick={() => onNavigate?.('home')}
              className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${currentPage === 'home' ? 'text-primary bg-primary/10' : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary'}`}
            >
              Numuneler
            </button>
          )}
          <button 
            onClick={() => onNavigate?.('reports')}
            className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${currentPage === 'reports' ? 'text-primary bg-primary/10' : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary'}`}
          >
            Raporlar
          </button>
          <button className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors">Ayarlar</button>
        </nav>
      </div>
      <div className="flex flex-1 justify-end gap-4 items-center">
        <label className="hidden md:flex flex-col min-w-40 h-10 w-64 group">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full border border-slate-200 dark:border-slate-700 bg-background-light dark:bg-background-dark group-focus-within:border-primary group-focus-within:ring-1 group-focus-within:ring-primary transition-all">
            <div className="text-text-secondary-light dark:text-text-secondary-dark flex items-center justify-center pl-3">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input 
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-transparent border-none focus:ring-0 text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light/70 dark:placeholder:text-text-secondary-dark/70 px-3 text-sm font-normal leading-normal" 
              placeholder="Model kodu ara..." 
              value={searchTerm}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </label>
        
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="size-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">person</span>
            </div>
            <span className="hidden lg:block text-xs font-bold text-text-primary-light dark:text-text-primary-dark">{userEmail?.split('@')[0] || 'Kullanıcı'}</span>
            <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
          </button>

          {showProfileMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowProfileMenu(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <p className="text-[10px] font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">Oturum Açan</p>
                  <p className="text-xs font-bold text-text-primary-light dark:text-text-primary-dark truncate">{userEmail}</p>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-text-primary-light dark:text-text-primary-dark hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                  Profilim
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-text-primary-light dark:text-text-primary-dark hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  Ayarlar
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                <button 
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
    </header>
  );
};
