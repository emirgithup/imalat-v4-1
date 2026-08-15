
import React, { useState } from 'react';

interface PreviewModalProps {
  imageUrl: string;
  onClose: () => void;
  onDownload: () => void;
  modelCode: string;
  customerName: string;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ imageUrl, onClose, onDownload, modelCode, customerName }) => {
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  
  const handleGeneralShare = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const safeModel = (modelCode || 'model').replace(/[^a-z0-9]/gi, '_');
      const safeCustomer = (customerName || 'musteri').replace(/[^a-z0-9]/gi, '_');
      const file = new File([blob], `${safeModel}_${safeCustomer}.jpg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Numune Kartı: ${modelCode}`,
          text: `${modelCode} - ${customerName} teknik kartı.`,
        });
      } else {
        alert("Tarayıcınız doğrudan paylaşımı desteklemiyor. Lütfen 'İndir' butonunu kullanın.");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Paylaşım kullanıcı tarafından iptal edildi.');
        return;
      }
      console.error('Paylaşım sırasında bir hata oluştu:', error);
      alert("Paylaşım sırasında bir sorun oluştu. Lütfen görseli indirip manuel paylaşmayı deneyin.");
    }
  };

  const handleWhatsAppCopy = async () => {
    try {
      setIsCopying(true);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Tuval hazırlanamadı.");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(async (pngBlob) => {
        if (!pngBlob) {
          alert("Görsel dönüştürülemedi!");
          setIsCopying(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": pngBlob
            })
          ]);
          setCopiedStatus(true);
          setIsCopying(false);
          setTimeout(() => setCopiedStatus(false), 8000);
        } catch (err) {
          console.error("Panoya yazma hatası:", err);
          alert("Görsel kopyalanamadı. Tarayıcınızın panoya yazma izinlerini kontrol edin.");
          setIsCopying(false);
        }
      }, "image/png");

    } catch (error) {
      console.error(error);
      alert("Hata oluştu. Lütfen JPG indirmeyi deneyin.");
      setIsCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-6 animate-in fade-in duration-300">
      
      {/* WhatsApp Bilgilendirme ve Uyarı Balonu */}
      {copiedStatus && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white p-5 rounded-2xl shadow-2xl max-w-md text-center animate-in zoom-in-95 duration-300 z-[120] border-4 border-white">
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl animate-bounce">check_circle</span>
            <p className="font-black text-base uppercase tracking-wider">KART GÖRSELİ PANOYA KOPYALANDI!</p>
            <p className="text-xs font-bold leading-relaxed">
              Şimdi aktif olan <strong>WhatsApp Web tabınıza geçiş yapın</strong> ve herhangi bir konuşma kutusunda <strong>CTRL + V (Yapıştır)</strong> yaparak hemen gönderin!
            </p>
            <p className="text-[10px] font-black bg-emerald-700/50 px-3 py-1 rounded-full mt-1">
              Farklı bir sekme açmadığı için mevcut WhatsApp oturumunuz kapanmaz!
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-card-dark w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] relative">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Görsel Önizleme</h3>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">JPEG olarak kaydedilecek hali</p>
          </div>
          <button onClick={onClose} className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900 p-4 flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt="JPEG Preview" 
            className="shadow-2xl rounded border-4 border-white max-w-full max-h-full object-contain"
          />
        </div>

        <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col gap-1">
             <div className="flex gap-2">
                <div className="bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-black tracking-tight uppercase">
                  MODEL: {modelCode || 'BELİRTİLMEDİ'}
                </div>
                <div className="bg-slate-800 text-white px-4 py-1.5 rounded-md text-sm font-black tracking-tight uppercase">
                  MÜŞTERİ: {customerName || '-'}
                </div>
             </div>
             <span className="text-[10px] text-text-secondary-light font-bold uppercase tracking-widest">YÜKSEK ÇÖZÜNÜRLÜK AKTİF</span>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button 
              onClick={handleWhatsAppCopy} 
              disabled={isCopying}
              className={`flex-1 md:flex-none h-12 px-6 rounded-xl text-white font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                isCopying 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-600/10'
              }`}
            >
              <span className="material-symbols-outlined text-lg">content_copy</span> 
              {isCopying ? "KOPYALANIYOR..." : "WHATSAPP İÇİN KART KOPYALA"}
            </button>
            <button onClick={handleGeneralShare} className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-slate-800 text-white font-bold text-sm shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">share</span> Paylaş
            </button>
            <button onClick={onDownload} className="flex-1 md:flex-none h-12 px-10 rounded-xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">download</span> JPG OLARAK İNDİR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
