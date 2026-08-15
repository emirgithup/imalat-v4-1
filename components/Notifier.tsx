
import React, { useEffect } from 'react';

export interface NotificationState {
  message: string;
  type: 'success' | 'error';
}

interface NotifierProps {
  notification: NotificationState | null;
  onClose: () => void;
}

export const Notifier: React.FC<NotifierProps> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // 5 saniye sonra otomatik kapat
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) {
    return null;
  }

  const isError = notification.type === 'error';
  const bgColor = isError ? 'bg-red-600' : 'bg-green-600';
  const icon = isError ? 'error' : 'check_circle';

  return (
    <div 
      className={`fixed top-5 right-5 z-[300] w-full max-w-sm p-4 rounded-xl text-white shadow-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500`}
      style={{ backgroundColor: isError ? '#dc2626' : '#16a34a' }}
      role="alert"
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="font-bold text-sm leading-tight">{isError ? 'Bir Hata Oluştu!' : 'Başarılı!'}</p>
        <p className="text-xs text-white/90 mt-1">{notification.message}</p>
      </div>
      <button onClick={onClose} className="size-6 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
};
