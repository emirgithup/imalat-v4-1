
import React, { useRef, useState, useEffect } from 'react';

interface ImageSectionProps {
  mainImage: string;
  isApproved: boolean;
  modelCode: string;
  imageSize?: number;
  imageDimensions?: { width: number; height: number };
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleApproval: () => void;
  isUploading: boolean;
  uploadProgress: number;
}

export const ImageSection: React.FC<ImageSectionProps> = ({ 
  mainImage, 
  isApproved, 
  modelCode,
  imageSize,
  imageDimensions,
  onImageUpload, 
  onToggleApproval,
  isUploading,
  uploadProgress
}) => {
  const mainInputRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);

  useEffect(() => {
    if (mainImage) {
      setImgError(false);
      setImgLoading(true);
    }
  }, [mainImage]);

  return (
    <div className="flex flex-col gap-6 print:gap-4 print:items-center h-full">
      <div className="flex flex-col gap-2 print:w-full h-full">
        <div className="flex justify-between items-end mb-1">
          <h3 className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-[0.2em] pl-1">Numune Fotoğrafı</h3>
        </div>
        
        <div className="resizable-card group relative w-full aspect-[4/5] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700 print:shadow-none print:border-slate-300">
            
            {(isUploading || (imgLoading && mainImage && !imgError)) && (
              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center transition-opacity duration-300">
                <div className="size-14 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                <p className="text-white/80 text-xs font-black mt-4 animate-pulse uppercase tracking-widest">Hazırlanıyor...</p>
              </div>
            )}
            
            {/* Onay Durumu Butonu */}
            <div className="absolute top-6 left-6 z-40 print:hidden">
              <button 
                onClick={onToggleApproval}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-black shadow-2xl transition-all border-2 ${
                  isApproved 
                  ? 'bg-emerald-600 text-white border-emerald-400 ring-8 ring-emerald-500/20' 
                  : 'bg-white/95 text-slate-800 border-white hover:bg-white hover:scale-105'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] font-bold">
                  {isApproved ? 'verified' : 'pending_actions'}
                </span>
                {isApproved ? 'ONAYLANDI' : 'ONAY BEKLİYOR'}
              </button>
            </div>

            {mainImage ? (
                <img 
                  src={mainImage} 
                  alt="Sample" 
                  onLoad={() => setImgLoading(false)}
                  onError={() => {
                    setImgLoading(false);
                    setImgError(true);
                  }}
                  className="w-full h-full object-contain"
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 p-8 text-center">
                    <span className="material-symbols-outlined text-[80px] mb-4">photo_camera</span>
                    <p className="text-sm font-black opacity-60 uppercase tracking-widest">FOTOĞRAF ÇEK / SEÇ</p>
                </div>
            )}
            
            <div className={`absolute inset-0 bg-black/0 ${mainImage ? 'group-hover:bg-black/40' : ''} transition-colors duration-300 flex items-center justify-center print:hidden`}>
                <input type="file" ref={mainInputRef} onChange={onImageUpload} accept="image/*" className="hidden" capture="environment" />
                <button 
                    onClick={() => mainInputRef.current?.click()}
                    className={`${mainImage ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-all duration-300 bg-white text-text-primary-light px-8 py-4 rounded-2xl font-black text-sm shadow-2xl flex items-center gap-3 hover:bg-slate-50 z-30`}
                >
                    <span className="material-symbols-outlined">photo_camera</span>
                    {mainImage ? 'RESMİ DEĞİŞTİR' : 'RESİM SEÇ'}
                </button>
            </div>

            {/* Bilgi Etiketleri - SOL ALTA SABİTLENDİ */}
            <div className="absolute bottom-8 left-8 z-40 flex flex-col gap-3 pointer-events-none">
                <div className="bg-indigo-50/95 backdrop-blur-md border-[2.5px] border-indigo-200 text-indigo-950 px-6 py-3 rounded-2xl shadow-2xl flex flex-col min-w-[140px]">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">MODEL</span>
                  <div className="font-black text-2xl tracking-tight uppercase leading-normal pb-0.5">
                    {modelCode || 'BELİRTİLMEDİ'}
                  </div>
                </div>
                
                {/* Müşteri Etiketi */}
                <div className="bg-cyan-50/95 backdrop-blur-md border-[2.5px] border-cyan-200 text-cyan-950 px-6 py-3 rounded-2xl shadow-2xl flex flex-col min-w-[140px]">
                  <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">MÜŞTERİ</span>
                  <div className="font-black text-[16px] uppercase leading-normal pb-0.5">
                    {modelCode ? 'NUMUNE KARTI' : 'MÜŞTERİ SEÇİN'}
                  </div>
                </div>
            </div>

            {/* Mühür - SAĞ ALTTA SABİTLENDİ */}
            <div className="stamp-container absolute bottom-8 right-8 z-40 pointer-events-none">
                <div className={`relative ${isApproved ? 'bg-emerald-50/95' : 'bg-amber-50/95'} backdrop-blur-md border-[3.5px] ${isApproved ? 'border-emerald-500' : 'border-amber-500'} rounded-2xl p-4 shadow-2xl flex flex-col items-center justify-center gap-2 transform rotate-3 border-double origin-bottom-right min-w-[170px]`}>
                  {/* Status Badge - Dynamic Width */}
                  <div className={`w-auto inline-flex items-center justify-center rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'} text-slate-950 shadow-md py-1.5 px-5`}>
                     <span className="text-[12px] font-black uppercase tracking-widest leading-none whitespace-nowrap">
                        {isApproved ? 'ONAYLI' : 'BEKLEMEDE'}
                     </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1">
                    {isApproved && (
                      <span className={`material-symbols-outlined text-[36px] text-emerald-600 font-bold`}>
                        verified
                      </span>
                    )}
                    <span className={`${isApproved ? 'text-emerald-950' : 'text-amber-950'} font-black text-[14px] leading-tight uppercase text-center whitespace-pre-line`}>
                      {isApproved ? 'İMALAT İÇİN\nUYGUNDUR' : 'ONAY\nBEKLENİYOR'}
                    </span>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
