import React, { useState, useEffect, useCallback } from 'react';

interface ImageResizeModalProps {
  image: string;
  onResizeComplete: (resizedDataUrl: string, sizeKB: number, dims: { width: number; height: number }) => void;
  onClose: () => void;
  title?: string;
}

export const ImageResizeModal: React.FC<ImageResizeModalProps> = ({ image, onResizeComplete, onClose, title }) => {
  const [originalSize, setOriginalSize] = useState<{ w: number; h: number; kb: number }>({ w: 0, h: 0, kb: 0 });
  const [scale, setScale] = useState(0.8); // Varsayılan %80 boyut
  const [quality, setQuality] = useState(0.7); // Varsayılan %70 kalite
  const [preview, setPreview] = useState<string>('');
  const [currentSizeKB, setCurrentSizeKB] = useState(0);

  // Orijinal bilgileri al
  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      const kb = Math.round((image.length * 3) / 4 / 1024);
      setOriginalSize({ w: img.width, h: img.height, kb });
      processImage(img, 0.8, 0.7);
    };
  }, [image]);

  const processImage = useCallback((img: HTMLImageElement, currentScale: number, currentQuality: number) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetW = Math.round(img.width * currentScale);
    const targetH = Math.round(img.height * currentScale);

    canvas.width = targetW;
    canvas.height = targetH;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const result = canvas.toDataURL('image/jpeg', currentQuality);
    setPreview(result);
    setCurrentSizeKB(Math.round((result.length * 3) / 4 / 1024));
  }, []);

  const handleApply = () => {
    const img = new Image();
    img.src = preview;
    img.onload = () => {
      onResizeComplete(preview, currentSizeKB, { width: img.width, height: img.height });
    };
  };

  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => processImage(img, scale, quality);
  }, [scale, quality, image, processImage]);

  return (
    <div className="fixed inset-0 z-[250] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-card-dark w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-text-primary-light dark:text-text-primary-dark">{title || 'Görsel Boyutlandırıcı'}</h3>
            <p className="text-xs text-text-secondary-light font-bold uppercase tracking-widest mt-0.5">Yüklemeden önce optimize edin</p>
          </div>
          <button onClick={onClose} className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          {/* Preview Area */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center p-4 min-h-[300px]">
             {preview ? (
               <div className="relative group">
                 <img src={preview} className="max-h-[400px] rounded-lg shadow-xl object-contain border-2 border-white" />
                 <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-black px-2 py-1 rounded-md backdrop-blur-md">
                   {Math.round(originalSize.w * scale)} x {Math.round(originalSize.h * scale)}
                 </div>
               </div>
             ) : (
               <div className="animate-pulse flex flex-col items-center">
                 <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
               </div>
             )}
          </div>

          {/* Controls Area */}
          <div className="w-full md:w-80 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Orijinal</span>
                <p className="text-sm font-bold">{originalSize.kb} KB</p>
              </div>
              <div className="bg-primary/5 p-3 rounded-2xl border border-primary/20">
                <span className="text-[9px] font-black text-primary uppercase block mb-1">Yeni Boyut</span>
                <p className="text-sm font-bold text-primary">{currentSizeKB} KB</p>
              </div>
            </div>

            {/* Scale Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-xs font-bold text-text-primary-light dark:text-text-primary-dark uppercase">Boyut Çözünürlüğü</label>
                <span className="text-primary font-black text-sm">%{Math.round(scale * 100)}</span>
              </div>
              <input 
                type="range" min="0.1" max="1.5" step="0.05" value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary" 
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>KÜÇÜK</span>
                <span>BÜYÜK</span>
              </div>
            </div>

            {/* Quality Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-xs font-bold text-text-primary-light dark:text-text-primary-dark uppercase">Sıkıştırma Kalitesi</label>
                <span className="text-emerald-500 font-black text-sm">%{Math.round(quality * 100)}</span>
              </div>
              <input 
                type="range" min="0.1" max="1.0" step="0.05" value={quality} 
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>DÜŞÜK</span>
                <span>YÜKSEK</span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
              <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 leading-relaxed italic">
                Boyutu küçültmek, uygulamanın daha hızlı çalışmasını ve veritabanının daha az yer kaplamasını sağlar.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-4">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl bg-white dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark font-bold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors">Vazgeç</button>
          <button onClick={handleApply} className="flex-[2] h-12 rounded-xl bg-primary text-white font-bold text-sm shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">cloud_upload</span>
            BU BOYUTLA YÜKLE
          </button>
        </div>
      </div>
    </div>
  );
};