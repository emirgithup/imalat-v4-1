
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { supabase } from './supabaseClient';
import { Header } from './components/Header';
import { ImageSection } from './components/ImageSection';
import { FormSection } from './components/FormSection';
import { PreviewModal } from './components/PreviewModal';
import { LoginPage } from './components/LoginPage';
import { ReportsPage } from './components/ReportsPage';
import { ImageResizeModal } from './components/ImageResizeModal';
import { Notifier, NotificationState } from './components/Notifier';
import { Assistant } from './components/Assistant';
import { SampleCard } from './components/SampleCard';
import { captureExportCard } from './lib/captureCardUtils';
import { SampleData, YarnType, SizeType } from './types';

// --- YARDIMCI FONKSİYONLAR ---

const dataURLtoBlob = (dataurl: string) => {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Blob dönüştürme hatası:", e);
    return null;
  }
};

// Supabase Storage Upload
const uploadImageAndGetURL = async (
  base64Data: string, 
  userId: string, 
  onProgress: (progress: number) => void
): Promise<string> => {
  try {
    onProgress(10);
    const blob = dataURLtoBlob(base64Data);
    if (!blob) throw new Error("Görüntü verisi dönüştürülemedi.");

    // Dosya adı benzersiz olsun
    const uniqueFilename = `${userId}/${Date.now()}.jpg`;
    onProgress(30);

    const { data, error } = await supabase.storage
      .from('sample-images')
      .upload(uniqueFilename, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    onProgress(80);
    
    // Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from('sample-images')
      .getPublicUrl(uniqueFilename);

    onProgress(100);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Storage upload error:", error);
    throw error;
  }
};

const getInitialData = (): SampleData => ({
  modelCode: "",
  date: new Date().toISOString().split('T')[0],
  customerName: "",
  firmName: "",
  yarnManufacturer: "",
  criticCount: 2,
  weight: 0,
  productionTime: 0,
  size: SizeType.M,
  yarnType: YarnType.Cotton100,
  buttonSize: "",
  buttonCount: 0,
  buttonImage: "",
  zipperLength: "",
  notes: "",
  mainImage: "",
  details: [],
  isApproved: false
});

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'reports'>(() => {
    const saved = localStorage.getItem('currentView');
    return (saved === 'home' || saved === 'reports') ? saved : 'home';
  });

  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);

  const [formData, setFormData] = useState<SampleData>(getInitialData());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); 
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [resizeSource, setResizeSource] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<'main' | 'weight' | 'button'>('main');
  const mainRef = useRef<HTMLElement>(null);
  
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ message, type });
  };

  const handleSupabaseError = (error: any) => {
    console.error(`HATA:`, error);
    showNotification(error.message || "Bilinmeyen bir hata oluştu.", 'error');
  };

  useEffect(() => {
    // İlk yüklemede session kontrolü
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user && user.email !== 'mixemir@gmail.com') {
        setCurrentView('reports');
      }
      setLoadingAuth(false);
    });

    // Auth değişimlerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user && user.email !== 'mixemir@gmail.com') {
        setCurrentView('reports');
      }
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try { 
      const { error } = await supabase.auth.signOut(); 
      if (error) throw error;
      setCurrentUser(null);
      localStorage.removeItem('currentView');
      setCurrentView('home');
    } catch (e) { 
      console.error("Çıkış hatası:", e);
      setCurrentUser(null);
      localStorage.removeItem('currentView');
      setCurrentView('home');
    }
  };

  const handleFieldChange = useCallback((field: keyof SampleData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'weight' | 'button' = 'main') => {
    setUploadTarget(target);
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setResizeSource(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleResizeComplete = async (resizedDataUrl: string, sizeKB: number, dims: { width: number, height: number }) => {
    if (!currentUser) {
      showNotification("Resim yüklemek için giriş yapmış olmalısınız.");
      return;
    }
    try {
      setResizeSource(null);
      setIsUploadingImage(true);
      
      const downloadURL = await uploadImageAndGetURL(resizedDataUrl, currentUser.id, setUploadProgress);
      
      const urlWithTimestamp = `${downloadURL}?t=${Date.now()}`;

      let parsedWeight: number | null = null;
      let parsedButtonSize: string | null = null;
      let parsedButtonCount: number | null = null;

      if (uploadTarget === 'weight') {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
          const base64Data = resizedDataUrl.split(',')[1];
          const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: [
                {
                   role: 'user',
                   parts: [
                     { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                     { text: 'Bu resimdeki gramaj numarasını veya ölçüsünü bul. Sadece tek ve en alakalı sayıyı (gram sayısı) döndür. (örn: 250). Sadece rakam olan kısmı döndür. Cihaz/etiket/kağıt resminde en belirgin ağırlık sayısını bul.' }
                   ]
                }
             ]
          });
          const weightText = response.text?.trim() || "";
          const weightMatch = weightText.match(/\d+/);
          if (weightMatch) {
            parsedWeight = parseInt(weightMatch[0], 10);
          }
        } catch (e) {
          console.error("Gemini okuma hatası:", e);
        }
      } else if (uploadTarget === 'button') {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
          const base64Data = resizedDataUrl.split(',')[1];
          const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: [
                {
                   role: 'user',
                   parts: [
                     { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                     { text: 'Bu resimdeki düğme boyunu/çapını (sadece boy numarası örn: 24 veya 18) ve varsa düğme adedini bul. JSON formatında döndür: {"buttonSize": "24", "buttonCount": 5}. Eğer bulamazsan boş obje döndür.' }
                   ]
                }
             ]
          });
          const text = response.text?.trim() || "";
          const cleanJson = text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed.buttonSize) {
            parsedButtonSize = String(parsed.buttonSize).replace(/\(.*?\)/g, '').replace(/boy|mm/gi, '').trim();
          }
          if (parsed.buttonCount) {
            parsedButtonCount = Number(parsed.buttonCount) || null;
          }
        } catch (e) {
          console.error("Gemini düğme okuma hatası:", e);
        }
      }

      setFormData(prev => {
        if (uploadTarget === 'main') {
          return {
            ...prev, 
            mainImage: urlWithTimestamp,
            mainImageSize: sizeKB,
            mainImageDimensions: dims
          };
        } else if (uploadTarget === 'weight') {
          return {
            ...prev, 
            weightImage: urlWithTimestamp,
            weightImageSize: sizeKB,
            weightImageDimensions: dims,
            ...(parsedWeight ? { weight: parsedWeight } : {}) // Update weight if found
          };
        } else {
          return {
            ...prev,
            buttonImage: urlWithTimestamp,
            buttonImageSize: sizeKB,
            buttonImageDimensions: dims,
            ...(parsedButtonSize ? { buttonSize: parsedButtonSize } : {}),
            ...(parsedButtonCount ? { buttonCount: parsedButtonCount } : {})
          };
        }
      });

      if (parsedWeight) {
        showNotification(`Resim yüklendi ve gramaj okundu: ${parsedWeight}g`, 'success');
      } else if (parsedButtonSize || parsedButtonCount) {
        showNotification(`Düğme resmi yüklendi ve bilgileri okundu!`, 'success');
      } else {
        showNotification("Resim optimize edildi ve başarıyla yüklendi!", 'success');
      }
      
    } catch (error: any) {
      handleSupabaseError(error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    if (!currentUser || currentView !== 'home') return;
    const handlePaste = async (event: ClipboardEvent) => {
      const target = event.target as HTMLElement;
      
      const items = event.clipboardData?.items;
      if (!items) return;
      
      let blob: File | null = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          blob = items[i].getAsFile();
          break;
        }
      }

      if (!blob) return;

      // Determine upload target based on focus or closest container
      if (target.id === 'button-size-input' || target.id === 'button-count-input' || target.closest('#button-container')) {
        setUploadTarget('button');
      } else if (target.id === 'weight-input' || target.closest('#weight-container')) {
        setUploadTarget('weight');
      } else {
        setUploadTarget('main');
      }

      const reader = new FileReader();
      reader.onload = (e) => setResizeSource(e.target?.result as string);
      reader.readAsDataURL(blob);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [currentUser, currentView]);

  const handleToggleApproval = useCallback(() => {
    setFormData(prev => {
      const nextApprovedState = !prev.isApproved;
      let updatedNotes = prev.notes;
      const approvalText = "NUMUNE SERİ ÜRETİME GİRMİŞTİR";
      const pendingText = "ONAY BEKLİYOR";

      if (nextApprovedState) {
        updatedNotes = updatedNotes.replace(pendingText, "").trim();
        if (!updatedNotes.includes(approvalText)) {
          updatedNotes = updatedNotes ? `${updatedNotes}\n\n${approvalText}` : approvalText;
        }
      } else {
        updatedNotes = updatedNotes.replace(approvalText, "").trim();
        if (!updatedNotes.includes(pendingText)) {
          updatedNotes = updatedNotes ? `${updatedNotes}\n\n${pendingText}` : pendingText;
        }
      }
      return { ...prev, isApproved: nextApprovedState, notes: updatedNotes.trim() };
    });
  }, []);

  const handleGenerateAndDownloadCard = async (data: SampleData) => {
    try {
      const dataUrl = await captureExportCard('export-card-capture');
      if (dataUrl) {
        const safeModel = (data.modelCode || 'model').replace(/[^a-z0-9]/gi, '_');
        const safeCustomer = (data.customerName || 'musteri').replace(/[^a-z0-9]/gi, '_');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${safeModel}_${safeCustomer}.jpg`;
        link.click();
      } else {
        throw new Error("Görsel oluşturulamadı, lütfen daha sonra tekrar deneyin.");
      }
    } catch (err) {
      console.error("Görsel oluşturulamadı:", err);
      showNotification('Görsel oluşturulamadı.', 'error');
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    if (!formData.modelCode || formData.modelCode.trim() === "") {
      showNotification("Lütfen bir Model Kodu giriniz.");
      return;
    }

    setIsSaving(true);
    setSaveStatus("Veritabanı güncelleniyor...");
    
    try {
      const cleanMainImage = formData.mainImage ? formData.mainImage.split('?')[0] : "";
      const currentIsoTime = new Date().toISOString();
      const currentDate = currentIsoTime.split('T')[0];
      
      const cleanWeightImage = formData.weightImage ? formData.weightImage.split('?')[0] : "";
      const cleanButtonImage = formData.buttonImage ? formData.buttonImage.split('?')[0] : "";
      let updatedDetails = [...(formData.details || [])];
      
      if (cleanWeightImage) {
        const wIdx = updatedDetails.findIndex(d => d.label === 'weight_image');
        if (wIdx >= 0) {
          updatedDetails[wIdx].url = cleanWeightImage;
        } else {
          updatedDetails.push({ id: Date.now().toString(), url: cleanWeightImage, label: 'weight_image' });
        }
      }

      if (cleanButtonImage) {
        const bIdx = updatedDetails.findIndex(d => d.label === 'button_image');
        if (bIdx >= 0) {
          updatedDetails[bIdx].url = cleanButtonImage;
        } else {
          updatedDetails.push({ id: Date.now().toString() + '_btn', url: cleanButtonImage, label: 'button_image' });
        }
      }

      // Aksesuar bilgilerini details içinde sakla (düğme çapı, adeti ve fermuar boyu)
      const accIdx = updatedDetails.findIndex(d => d.label === 'accessories');
      const accObj = {
        id: 'accessories',
        url: '',
        label: 'accessories',
        data: {
          buttonSize: formData.buttonSize || "",
          buttonCount: formData.buttonCount || 0,
          buttonImage: cleanButtonImage,
          zipperLength: formData.zipperLength || ""
        }
      };
      if (accIdx >= 0) {
        updatedDetails[accIdx] = accObj as any;
      } else {
        updatedDetails.push(accObj as any);
      }

      const dbPayload = {
        user_id: currentUser.id,
        model_code: formData.modelCode,
        date: currentDate,
        customer_name: formData.customerName,
        firm_name: formData.firmName,
        yarn_manufacturer: formData.yarnManufacturer,
        critic_count: formData.criticCount,
        weight: formData.weight,
        production_time: formData.productionTime,
        size: formData.size,
        yarn_type: formData.yarnType,
        notes: formData.notes,
        main_image: cleanMainImage,
        main_image_size: formData.mainImageSize,
        main_image_dimensions: formData.mainImageDimensions,
        is_approved: formData.isApproved,
        details: updatedDetails,
        updated_at: currentIsoTime
      };

      let error;
      if (formData.id) {
        const { error: updateError } = await supabase
          .from('samples')
          .update(dbPayload)
          .eq('id', formData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('samples')
          .insert(dbPayload);
        error = insertError;
      }

      if (error) throw error;

      setSaveStatus("Görsel PC'ye kaydediliyor...");
      await handleGenerateAndDownloadCard(formData);

      setSaveStatus("Tamamlandı!");
      showNotification("Numune ve görsel başarıyla kaydedildi!", 'success');
      setTimeout(() => {
        setFormData(getInitialData());
        setCurrentView('reports');
        setIsSaving(false);
      }, 500);

    } catch (error: any) {
      handleSupabaseError(error);
      setIsSaving(false);
    }
  };

  const handleEditSample = (sample: SampleData) => {
    setFormData(sample);
    setPreviewUrl(null);
    setCurrentView('home');
  };

  const handleNewSample = () => {
    setFormData(getInitialData());
    setPreviewUrl(null);
    setCurrentView('home');
  };

  const handlePrintPdf = () => { window.print(); };

  const handleSaveJpg = async () => {
    setIsGenerating(true);
    await handleGenerateAndDownloadCard(formData);
    setIsGenerating(false);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
         <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) return <LoginPage />;

  const isAdmin = currentUser?.email === 'mixemir@gmail.com';

  return (
    <>
      <Notifier notification={notification} onClose={() => setNotification(null)} />
      <Header 
        onLogout={handleLogout} 
        userEmail={currentUser.email || ''} 
        currentPage={currentView}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onNavigate={(page) => {
          if (page === 'home') {
            if (isAdmin) handleNewSample();
          } else {
            setCurrentView(page);
          }
        }}
        isAdmin={isAdmin}
      />
      
      {currentView === 'home' && isAdmin ? (
        <main ref={mainRef} className="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-6 lg:p-10 flex flex-col gap-6 print:p-0 animate-in fade-in duration-500">
          <div className="flex flex-col gap-4 print:hidden">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-text-primary-light dark:text-text-primary-dark text-3xl font-extrabold tracking-tight">
                  {formData.id ? 'Numuneyi Düzenle' : 'Yeni Numune Kaydı'}
                </h1>
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-base">Optimize edilmiş resim yönetimi aktif.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleSaveJpg} disabled={isGenerating} className="flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition-all">
                   <span className="material-symbols-outlined">{isGenerating ? 'hourglass_empty' : 'image'}</span>
                   <span>Görsel Al</span>
                </button>
                <button onClick={handlePrintPdf} className="flex items-center gap-2 h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark text-text-primary-light dark:text-text-primary-dark text-sm font-semibold hover:bg-slate-50">
                  <span className="material-symbols-outlined text-[20px]">print</span>
                  <span>Yazdır</span>
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 h-11 px-8 rounded-xl bg-primary text-white text-sm font-bold shadow-lg hover:bg-blue-600 disabled:opacity-70"
                >
                  {isSaving ? (
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">{formData.id ? 'sync' : 'cloud_upload'}</span>
                      <span>{formData.id ? 'Güncelle' : 'Kaydet'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:flex print:flex-row-reverse grid-container">
            <div className="lg:col-start-2 lg:col-span-5 print:w-1/2">
              <ImageSection 
                mainImage={formData.mainImage} 
                isApproved={formData.isApproved}
                modelCode={formData.modelCode}
                imageSize={formData.mainImageSize}
                imageDimensions={formData.mainImageDimensions}
                onImageUpload={handleImageUpload} 
                onToggleApproval={handleToggleApproval}
                isUploading={isUploadingImage}
                uploadProgress={uploadProgress}
              />
            </div>
            <div className="lg:col-span-4 print:w-1/2">
              <FormSection data={formData} onChange={handleFieldChange} onImageUpload={(e, target) => handleImageUpload(e, target || 'weight')} />
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-6 lg:p-10">
          <ReportsPage 
            userId={currentUser.id} 
            onEdit={handleEditSample} 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm}
            onNotify={showNotification} 
            isAdmin={isAdmin} 
          />
        </main>
      )}

      {/* GİZLİ EXPORT KARTI */}
      {currentView === 'home' && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none opacity-0 select-none z-0 overflow-visible p-10 bg-white min-w-[300px]">
          <div className="w-[250px] relative p-0 m-0">
             <SampleCard sample={formData} id="export-card-capture" />
          </div>
        </div>
      )}

      {/* ASİSTAN MODÜLÜ */}
      {currentView === 'home' && isAdmin && currentUser && (
        <Assistant 
          currentData={formData} 
          onUpdateData={(newData) => {
            setFormData(newData);
            showNotification("Numune verileri asistan tarafından güncellendi!", 'success');
          }} 
        />
      )}

      {/* MODALLAR */}
      {resizeSource && (
        <ImageResizeModal 
          image={resizeSource} 
          onResizeComplete={handleResizeComplete} 
          onClose={() => setResizeSource(null)} 
          title="Fotoğrafı Düzenle" 
        />
      )}

      {isSaving && (
        <div className="fixed inset-0 z-[200] bg-white/40 dark:bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="bg-white dark:bg-card-dark p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 w-full max-w-sm mx-4 border border-slate-200 dark:border-slate-800">
              <div className="size-16 relative">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Buluta Aktarılıyor</p>
                <p className="text-sm text-primary font-semibold animate-pulse">{saveStatus}</p>
              </div>
           </div>
        </div>
      )}

      {previewUrl && (
        <PreviewModal 
          imageUrl={previewUrl} 
          modelCode={formData.modelCode}
          customerName={formData.customerName}
          onClose={() => setPreviewUrl(null)} 
          onDownload={() => {
            const safeModel = (formData.modelCode || 'model').replace(/[^a-z0-9]/gi, '_');
            const safeCustomer = (formData.customerName || 'musteri').replace(/[^a-z0-9]/gi, '_');
            const link = document.createElement('a');
            link.href = previewUrl;
            link.download = `${safeModel}_${safeCustomer}.jpg`;
            link.click();
            setPreviewUrl(null);
          }}
        />
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[110] bg-white/60 dark:bg-black/60 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="size-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-bold">Görsel Kartı Hazırlanıyor</p>
        </div>
      )}
    </>
  );
};

export default App;
