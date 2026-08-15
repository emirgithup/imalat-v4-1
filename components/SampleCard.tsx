import React from 'react';
import { SampleData } from '../types';

interface SampleCardProps {
  sample: SampleData;
  isCapturing?: boolean;
  id?: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const cleanButtonSize = (size?: string): string => {
  if (!size) return '';
  let cleaned = size.replace(/\(.*?\)/g, '');
  cleaned = cleaned.replace(/boy|mm/gi, '');
  return cleaned.trim();
};

const formatButtonDisplay = (size?: string, count?: number | string) => {
  const s = cleanButtonSize(size);
  const numCount = count !== undefined && count !== null && count !== '' ? Number(count) : 0;
  if (s && numCount > 0) return `${s}\\${numCount}`;
  if (s) return s;
  if (numCount > 0) return `-\\${numCount}`;
  return '-';
};

const formatZipperDisplay = (zipper?: string) => {
  const z = (zipper || '').trim();
  if (!z) return '-';
  if (/^\d+$/.test(z)) return `${z} cm`;
  return z;
};

export const SampleCard: React.FC<SampleCardProps> = ({ sample, isCapturing = false, id }) => {
  return (
    <div 
      id={id || `sample-card-${sample.id || 'new'}`} 
      className="bg-white dark:bg-card-dark rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col relative transition-all mx-auto w-full duration-300 hover:shadow-lg hover:-translate-y-1 hover:z-[60]"
    >
      {isCapturing && (
        <div className="absolute inset-0 z-50 bg-white/95 flex items-center justify-center font-black text-[10px] text-indigo-600 animate-pulse uppercase tracking-widest rounded-[24px]">
          Görsel Hazırlanıyor...
        </div>
      )}
      
      <div className="img-area relative h-[280px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/50 overflow-hidden group/image rounded-t-[24px]">
        {sample.mainImage ? (
          <img src={sample.mainImage} className="w-full h-full object-cover" alt="sample" />
        ) : (
          <span className="material-symbols-outlined text-4xl text-slate-300">image_not_supported</span>
        )}
        
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 items-start z-10 w-full pr-28">
          <div className="img-badge bg-indigo-100/95 dark:bg-indigo-900/30 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/50 shadow-md flex flex-col min-w-[90px]">
            <span className="text-[7px] font-black text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider mb-0.5">MODEL</span>
            <p className="text-slate-900 dark:text-white font-black text-[13px] uppercase leading-normal truncate w-full pb-1">{sample.modelCode || '-'}</p>
          </div>
          <div className="img-badge bg-cyan-100/95 dark:bg-cyan-900/30 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-800/50 shadow-md flex flex-col min-w-[90px]">
            <span className="text-[7px] font-black text-cyan-600 dark:text-cyan-400 block uppercase tracking-wider mb-0.5">MÜŞTERİ</span>
            <p className="text-slate-900 dark:text-white font-black text-[11px] uppercase truncate max-w-[120px] leading-normal pb-1">{sample.customerName || '-'}</p>
          </div>
        </div>

        <div className="absolute bottom-3 right-3 z-20">
          <div className={`${sample.isApproved ? 'bg-emerald-50' : 'bg-amber-50'} dark:bg-slate-900/90 border-2 ${sample.isApproved ? 'border-emerald-500' : 'border-orange-400'} border-double rounded-2xl p-2.5 shadow-xl transform -rotate-6 min-w-[80px]`}>
            
            <div className={`status-pill w-auto inline-flex items-center justify-center rounded-full ${sample.isApproved ? 'bg-emerald-500' : 'bg-orange-400'} text-slate-950 shadow-sm mb-1 px-3 py-1`}>
              <span className="text-[8px] font-black uppercase tracking-widest leading-none whitespace-nowrap">
                {sample.isApproved ? 'ONAYLI' : 'BEKLEMEDE'}
              </span>
            </div>

             <div className="flex flex-col items-center justify-center gap-0.5">
                {sample.isApproved && (
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">
                    verified
                  </span>
                )}
                <span className={`text-[7px] font-black uppercase ${sample.isApproved ? 'text-emerald-950' : 'text-orange-950'} text-center leading-snug whitespace-pre-line pb-0.5`}>
                   {sample.isApproved ? 'İMALAT İÇİN\nUYGUNDUR' : 'ONAY\nBEKLENİYOR'}
                </span>
             </div>
          </div>
        </div>
      </div>

      <div className="content-area p-3 flex-1 flex flex-col gap-1.5">
        {/* 1. Satır: Tarih & Firma */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 rounded-xl flex flex-col items-center justify-center min-h-[42px]">
            <span className="label-text text-[7.5px] font-black text-slate-600 uppercase tracking-wider mb-0.5">TARİH</span>
            <span className="val-text text-[11px] font-black text-slate-950 dark:text-white leading-none">{formatDate(sample.date)}</span>
          </div>
          <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 p-1.5 rounded-xl flex flex-col items-center justify-center overflow-hidden min-h-[42px]">
            <span className="label-text text-[7.5px] font-black text-orange-600 uppercase tracking-wider mb-0.5">FİRMA</span>
            <span className="val-text text-[11px] font-black text-slate-950 dark:text-white truncate uppercase w-full text-center leading-normal pb-0.5">{sample.firmName || '-'}</span>
          </div>
        </div>
        
        {/* 2. Satır: Beden & Gramaj */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 p-1.5 rounded-xl text-center flex flex-col justify-center min-h-[44px]">
            <span className="label-text text-[7.5px] font-black text-violet-600 uppercase tracking-wider mb-0.5">BEDEN</span>
            <span className="val-text text-[13px] font-black text-slate-950 dark:text-white leading-normal pb-0.5">{sample.size}</span>
          </div>
          <div className="bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 p-1.5 rounded-xl text-center flex flex-col justify-center min-h-[44px] relative group/weight">
            <span className="label-text text-[7.5px] font-black text-rose-600 uppercase tracking-wider mb-0.5">GRAMAJ</span>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {sample.weightImage && (
                <div className="size-4.5 rounded-md border border-rose-300 shadow-sm overflow-hidden z-10 shrink-0">
                   <img src={sample.weightImage} className="w-full h-full object-cover" alt="Gramaj Resmi" />
                </div>
              )}
              <span className="val-text text-[13px] font-black text-slate-950 dark:text-white leading-normal pb-0.5">{sample.weight || '0'}g</span>
            </div>
          </div>
        </div>

        {/* 3. Satır: Süre & Kritik */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-sky-100 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800/50 p-1 rounded-xl text-center flex flex-col justify-center min-h-[40px]">
            <span className="label-text text-[7.5px] font-black text-sky-600 uppercase tracking-wider mb-0.5">SÜRE</span>
            <span className="val-text text-[11px] font-black text-slate-950 dark:text-white leading-normal pb-0.5">{sample.productionTime || '0'} dk</span>
          </div>
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 p-1 rounded-xl text-center flex flex-col justify-center min-h-[40px]">
            <span className="label-text text-[7.5px] font-black text-amber-600 uppercase tracking-wider mb-0.5">KRİTİK</span>
            <span className="val-text text-[11px] font-black text-slate-950 dark:text-white leading-normal pb-0.5">{sample.criticCount || '0'}</span>
          </div>
        </div>

        {/* 4. Satır: İplik Cinsi */}
        <div className="grid grid-cols-1">
           <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 p-1.5 rounded-xl text-center flex flex-col justify-center min-h-[38px]">
              <span className="label-text text-[7.5px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">İPLİK CİNSİ</span>
              <span className="val-text text-[11px] font-black text-slate-950 dark:text-white truncate max-w-full leading-normal pb-0.5">{sample.yarnType}</span>
           </div>
        </div>

        {/* 5. Satır: Aksesuarlar (Düğme & Fermuar) */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50 p-1.5 rounded-xl text-center flex flex-col justify-center min-h-[40px] overflow-hidden">
            <span className="label-text text-[7.5px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-0.5">DÜĞME (ÇAP \ ADET)</span>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {sample.buttonImage && (
                <div className="size-4 rounded-md border border-teal-300 shadow-sm overflow-hidden z-10 shrink-0">
                  <img src={sample.buttonImage} className="w-full h-full object-cover" alt="Düğme Resmi" />
                </div>
              )}
              <span className="val-text text-[11px] font-black text-slate-950 dark:text-white truncate px-1 leading-normal pb-0.5">
                {formatButtonDisplay(sample.buttonSize, sample.buttonCount)}
              </span>
            </div>
          </div>
          <div className="bg-fuchsia-100 dark:bg-fuchsia-900/30 border border-fuchsia-200 dark:border-fuchsia-800/50 p-1.5 rounded-xl text-center flex flex-col justify-center min-h-[40px] overflow-hidden">
            <span className="label-text text-[7.5px] font-black text-fuchsia-700 dark:text-fuchsia-400 uppercase tracking-wider mb-0.5">FERMUAR BOYU</span>
            <span className="val-text text-[11px] font-black text-slate-950 dark:text-white truncate px-1 leading-normal pb-0.5">
              {formatZipperDisplay(sample.zipperLength)}
            </span>
          </div>
        </div>

        {sample.notes && (
          <div className="notes-area mt-1 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800/50 shadow-inner">
            <p className="text-slate-800 dark:text-slate-300 text-[10.5px] leading-relaxed break-words whitespace-pre-wrap">{sample.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
