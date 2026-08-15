
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { SampleData } from '../types';
import { PreviewModal } from './PreviewModal';

interface ReportsPageProps {
  userId: string;
  onEdit: (data: SampleData) => void;
  searchTerm?: string;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
  isAdmin?: boolean;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ userId, onEdit, searchTerm = "", onNotify, isAdmin = false }) => {
  const [samples, setSamples] = useState<SampleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState<string | null>(null);
  const [fullImageModal, setFullImageModal] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const openFullImage = (url: string) => {
    setFullImageModal(url);
    setImageScale(1);
    setImagePos({ x: 0, y: 0 });
  };

  const handleCopyImage = async (url: string) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      if (onNotify) onNotify("Resim başarıyla kopyalandı!", "success");
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify("Resim kopyalanamadı. Tarayıcınız desteklemiyor olabilir.", "error");
    }
  };
  
  // Preview Modal State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{model: string, customer: string} | null>(null);
  const [isCopiedDirectly, setIsCopiedDirectly] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
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

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setSamples((data || []).map((item: any) => {
        const accDetail = item.details?.find((d: any) => d.label === 'accessories')?.data;
        const rawButtonCount = accDetail?.buttonCount !== undefined && accDetail?.buttonCount !== '' 
          ? accDetail.buttonCount 
          : (item.button_count !== undefined ? item.button_count : 0);
        const parsedButtonCount = Number(rawButtonCount) || 0;

        return {
          id: item.id,
          modelCode: item.model_code,
          date: item.date,
          customerName: item.customer_name,
          firmName: item.firm_name,
          yarnManufacturer: item.yarn_manufacturer,
          criticCount: item.critic_count,
          weight: item.weight,
          productionTime: item.production_time,
          size: item.size,
          yarnType: item.yarn_type,
          buttonSize: accDetail?.buttonSize || item.button_size || "",
          buttonCount: parsedButtonCount,
          buttonImage: item.details?.find((d: any) => d.label === 'button_image')?.url || accDetail?.buttonImage || item.button_image || "",
          zipperLength: accDetail?.zipperLength || item.zipper_length || "",
          notes: item.notes,
          mainImage: item.main_image,
          weightImage: item.details?.find((d: any) => d.label === 'weight_image')?.url || "",
          isApproved: item.is_approved,
          details: item.details || [],
          updatedAt: item.updated_at
        };
      }));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { if (userId) fetchSamples(); }, [userId]);

  const filteredSamples = useMemo(() => {
    const normalizeForSearch = (str: string) => 
      (str || '').toLocaleLowerCase('tr-TR').trim();

    const term = normalizeForSearch(searchTerm);
    if (!term) return samples;

    return samples.filter(s => {
      const code = normalizeForSearch(s.modelCode);
      const customer = normalizeForSearch(s.customerName);
      return code.includes(term) || customer.includes(term);
    });
  }, [samples, searchTerm]);

  const handleGeneratePreview = async (sampleId: string, modelCode: string, customerName: string) => {
    const cardElement = document.getElementById(`sample-card-${sampleId}`);
    if (!cardElement) return;
    setIsCapturing(sampleId);
    
    try {
      // @ts-ignore
      const canvas = await window.html2canvas(cardElement, {
        useCORS: true,
        scale: 4, // Yüksek kalite
        width: 250, 
        windowWidth: 250,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const card = clonedDoc.getElementById(`sample-card-${sampleId}`);
          if (card) {
            // Ana Kart Stilleri
            card.style.width = '250px';
            card.style.height = 'auto'; 
            card.style.minHeight = 'auto';
            card.style.borderRadius = '0';
            card.style.border = 'none';
            card.style.padding = '0';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.boxShadow = 'none';
            card.style.fontFamily = 'Arial, sans-serif'; // Garantili font

            // Gizlenecek elementler
            const hiddenEls = card.querySelectorAll('.print\\:hidden');
            hiddenEls.forEach(el => {
              (el as HTMLElement).style.display = 'none';
            });

            // --- GÖRSEL ALANI DÜZELTMELERİ ---
            const badges = card.querySelectorAll('.img-badge');
            badges.forEach(b => {
               const el = b as HTMLElement;
               const text = el.innerText;
               
               // Renkleri netleştir
               if(text.includes('MODEL')) el.style.backgroundColor = '#eef2ff'; 
               else el.style.backgroundColor = '#ecfeff';
               el.style.borderColor = '#cbd5e1';
               
               // Rozet içindeki metinlerin kesilmesini önle
               const pTags = el.querySelectorAll('p');
               pTags.forEach(p => {
                 p.style.lineHeight = '1.4';
                 p.style.paddingBottom = '4px'; // Harf kuyrukları için ekstra boşluk
                 p.style.marginBottom = '0';
                 p.style.overflow = 'visible';
                 p.style.whiteSpace = 'normal'; // Satır sarmaya izin ver gerekirse
               });
            });

            // Mühür Alanı Düzeltmeleri
            const stampTexts = card.querySelectorAll('.stamp-container span');
            stampTexts.forEach(s => {
                (s as HTMLElement).style.lineHeight = '1.2';
                (s as HTMLElement).style.paddingBottom = '2px';
            });
            
            // ROZET (Status Pill) Düzeltmesi - GÖRÜNÜRLÜK FIX
            const statusPill = card.querySelector('.status-pill');
            if(statusPill) {
               const el = statusPill as HTMLElement;
               const textSpan = el.querySelector('span');
               const isApproved = textSpan?.innerText.includes('ONAYLI');

               // Container Stilleri - DİNAMİK GENİŞLİK
               el.style.width = 'auto'; // İçeriğe göre genişle
               el.style.minWidth = '50px';
               el.style.display = 'flex'; // inline-flex yerine flex daha güvenli olabilir
               el.style.justifyContent = 'center';
               el.style.alignItems = 'center'; 
               
               // Padding ayarı
               el.style.padding = '6px 12px'; 
               
               el.style.borderRadius = '20px';
               el.style.backgroundColor = isApproved ? '#10b981' : '#fb923c'; 
               el.style.border = 'none';
               el.style.opacity = '1';
               el.style.visibility = 'visible';
               
               // Yazı Stilleri - KESİN GÖRÜNÜRLÜK
               if (textSpan) {
                   const span = textSpan as HTMLElement;
                   span.style.color = '#000000'; // Siyah
                   span.style.fontSize = '9px';
                   span.style.fontWeight = '900';
                   span.style.letterSpacing = '0.1em';
                   span.style.lineHeight = '1.2'; 
                   span.style.whiteSpace = 'nowrap';
                   span.style.padding = '0'; 
                   span.style.margin = '0';
                   span.style.display = 'block';
                   span.style.position = 'relative';
                   span.style.zIndex = '10';
               }
            }

            const imgArea = card.querySelector('.img-area');
            if (imgArea) {
              (imgArea as HTMLElement).style.height = 'auto';
              (imgArea as HTMLElement).style.minHeight = '220px'; // Biraz daha yüksek
              (imgArea as HTMLElement).style.flex = 'none';
              (imgArea as HTMLElement).style.borderBottom = '1px solid #e2e8f0';
              (imgArea as HTMLElement).style.display = 'block';

              const img = imgArea.querySelector('img');
              if(img) {
                  img.style.padding = '0';
                  img.style.width = '100%';
                  img.style.height = 'auto';
                  img.style.objectFit = 'contain';
                  img.style.position = 'relative';
              }
            }

            // --- İÇERİK ALANI DÜZELTMELERİ ---
            const contentArea = card.querySelector('.content-area');
            if (contentArea) {
              (contentArea as HTMLElement).style.padding = '10px';
              (contentArea as HTMLElement).style.gap = '6px';
              
              // Grid yapısını yeniden oluştur (html2canvas grid gap sorunlarını önlemek için)
              const grids = contentArea.querySelectorAll('.grid');
              const allItems: HTMLElement[] = [];
              grids.forEach(g => {
                g.querySelectorAll(':scope > div').forEach(i => allItems.push(i as HTMLElement));
                g.remove();
              });

              const newGrid = clonedDoc.createElement('div');
              newGrid.style.display = 'grid';
              newGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
              newGrid.style.gap = '6px'; // Gap artırıldı

              const colorMap: Record<string, { bg: string, border: string }> = {
                'TARİH': { bg: '#f1f5f9', border: '#e2e8f0' },
                'FİRMA': { bg: '#ffedd5', border: '#fed7aa' },
                'BEDEN': { bg: '#ede9fe', border: '#ddd6fe' },
                'GRAMAJ': { bg: '#ffe4e6', border: '#fecdd3' },
                'SÜRE': { bg: '#e0f2fe', border: '#bae6fd' },
                'KRİTİK': { bg: '#fef3c7', border: '#fde68a' },
                'İPLİK CİNSİ': { bg: '#d1fae5', border: '#a7f3d0' },
                'DÜĞME (ÇAP \\ ADET)': { bg: '#ccfbf1', border: '#99f6e4' },
                'DÜĞME (ÇAP / ADET)': { bg: '#ccfbf1', border: '#99f6e4' },
                'DÜĞME': { bg: '#ccfbf1', border: '#99f6e4' },
                'FERMUAR BOYU': { bg: '#fae8ff', border: '#f5d0fe' },
                'FERMUAR': { bg: '#fae8ff', border: '#f5d0fe' }
              };

              allItems.forEach(item => {
                const labelEl = item.querySelector('span.label-text');
                const labelText = labelEl ? (labelEl as HTMLElement).innerText.trim() : '';
                const style = colorMap[labelText] || { bg: '#f8fafc', border: '#cbd5e1' };

                // Kutu Stilleri (Kompakt ve Dengeli)
                item.style.padding = '4px 3px';
                item.style.minHeight = '42px';
                item.style.height = 'auto';
                item.style.border = `1px solid ${style.border}`;
                item.style.backgroundColor = style.bg;
                item.style.display = 'flex';
                item.style.flexDirection = 'column';
                item.style.alignItems = 'center';
                item.style.justifyContent = 'center';
                item.style.borderRadius = '7px';
                item.style.overflow = 'visible'; // Taşan yazıları kesme
                
                // Label Stilleri
                const labels = item.querySelectorAll('span.label-text');
                labels.forEach(l => { 
                    (l as HTMLElement).style.fontSize = '8px';
                    (l as HTMLElement).style.fontWeight = '900';
                    (l as HTMLElement).style.color = '#475569';
                    (l as HTMLElement).style.marginBottom = '1.5px';
                    (l as HTMLElement).style.display = 'block';
                });
                
                // Değer Stilleri
                const vals = item.querySelectorAll('span.val-text');
                vals.forEach(v => { 
                    (v as HTMLElement).style.fontSize = '12px';
                    (v as HTMLElement).style.fontWeight = '900'; 
                    (v as HTMLElement).style.color = '#000000';
                    (v as HTMLElement).style.lineHeight = '1.3';
                    (v as HTMLElement).style.paddingBottom = '2px';
                    (v as HTMLElement).style.display = 'block';
                    (v as HTMLElement).style.overflow = 'visible';
                });

                // Saat Stilleri
                const timeTexts = item.querySelectorAll('span.time-text');
                timeTexts.forEach(t => { 
                    (t as HTMLElement).style.fontSize = '7.5px';
                    (t as HTMLElement).style.fontWeight = '800'; 
                    (t as HTMLElement).style.color = '#64748b';
                    (t as HTMLElement).style.marginTop = '1px'; 
                    (t as HTMLElement).style.display = 'block';
                    (t as HTMLElement).style.overflow = 'visible';
                });

                if (labelText.includes('İPLİK')) {
                   item.style.gridColumn = '1 / -1';
                }
                newGrid.appendChild(item);
              });
              contentArea.insertBefore(newGrid, contentArea.firstChild);
            }

            const notes = card.querySelector('.notes-area');
            if (notes) {
              (notes as HTMLElement).style.marginTop = '6px';
              (notes as HTMLElement).style.backgroundColor = '#fffbeb'; 
              (notes as HTMLElement).style.padding = '10px 12px';
              (notes as HTMLElement).style.border = '1px solid #fde68a';
              (notes as HTMLElement).style.borderRadius = '10px';
              const p = notes.querySelector('p');
              if (p) { 
                p.style.fontSize = '10.5px'; 
                p.style.fontWeight = '900'; 
                p.style.lineHeight = '1.4'; 
                p.style.color = '#000000';
                p.style.whiteSpace = 'pre-wrap';
                p.style.wordBreak = 'break-word';
                p.style.paddingBottom = '2px';
              }
            }
          }
        }
      });
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setPreviewUrl(dataUrl);
      setPreviewData({ model: modelCode, customer: customerName });

    } catch (err) { 
      console.error(err); 
      alert("Görsel oluşturulurken bir hata oluştu.");
    } finally { 
      setIsCapturing(null); 
    }
  };

  const handleWhatsAppDirectShare = async (sampleId: string) => {
    const cardElement = document.getElementById(`sample-card-${sampleId}`);
    if (!cardElement) return;
    setIsCapturing(sampleId);
    
    try {
      // @ts-ignore
      const canvas = await window.html2canvas(cardElement, {
        useCORS: true,
        scale: 4, // Yüksek kalite
        width: 250, 
        windowWidth: 250,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const card = clonedDoc.getElementById(`sample-card-${sampleId}`);
          if (card) {
            // Ana Kart Stilleri
            card.style.width = '250px';
            card.style.height = 'auto'; 
            card.style.minHeight = 'auto';
            card.style.borderRadius = '0';
            card.style.border = 'none';
            card.style.padding = '0';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.boxShadow = 'none';
            card.style.fontFamily = 'Arial, sans-serif'; // Garantili font

            // Gizlenecek elementler
            const hiddenEls = card.querySelectorAll('.print\\:hidden');
            hiddenEls.forEach(el => {
              (el as HTMLElement).style.display = 'none';
            });

            // --- GÖRSEL ALANI DÜZELTMELERİ ---
            const badges = card.querySelectorAll('.img-badge');
            badges.forEach(b => {
               const el = b as HTMLElement;
               const text = el.innerText;
               
               // Renkleri netleştir
               if(text.includes('MODEL')) el.style.backgroundColor = '#eef2ff'; 
               else el.style.backgroundColor = '#ecfeff';
               el.style.borderColor = '#cbd5e1';
               
               // Rozet içindeki metinlerin kesilmesini önle
               const pTags = el.querySelectorAll('p');
               pTags.forEach(p => {
                 p.style.lineHeight = '1.4';
                 p.style.paddingBottom = '4px'; // Harf kuyrukları için ekstra boşluk
                 p.style.marginBottom = '0';
                 p.style.overflow = 'visible';
                 p.style.whiteSpace = 'normal'; // Satır sarmaya izin ver gerekirse
               });
            });

            // Mühür Alanı Düzeltmeleri
            const stampTexts = card.querySelectorAll('.stamp-container span');
            stampTexts.forEach(s => {
                (s as HTMLElement).style.lineHeight = '1.2';
                (s as HTMLElement).style.paddingBottom = '2px';
            });
            
            // ROZET (Status Pill) Düzeltmesi - GÖRÜNÜRLÜK FIX
            const statusPill = card.querySelector('.status-pill');
            if(statusPill) {
               const el = statusPill as HTMLElement;
               const textSpan = el.querySelector('span');
               const isApproved = textSpan?.innerText.includes('ONAYLI');

               // Container Stilleri - DİNAMİK GENİŞLİK
               el.style.width = 'auto'; // İçeriğe göre genişle
               el.style.minWidth = '50px';
               el.style.display = 'flex';
               el.style.justifyContent = 'center';
               el.style.alignItems = 'center'; 
               el.style.padding = '6px 12px'; 
               el.style.borderRadius = '20px';
               el.style.backgroundColor = isApproved ? '#10b981' : '#fb923c'; 
               el.style.border = 'none';
               el.style.opacity = '1';
               el.style.visibility = 'visible';
               
               if (textSpan) {
                   const span = textSpan as HTMLElement;
                   span.style.color = '#000000'; // Siyah
                   span.style.fontSize = '9px';
                   span.style.fontWeight = '900';
                   span.style.letterSpacing = '0.1em';
                   span.style.lineHeight = '1.2'; 
                   span.style.whiteSpace = 'nowrap';
                   span.style.padding = '0'; 
                   span.style.margin = '0';
                   span.style.display = 'block';
                   span.style.position = 'relative';
                   span.style.zIndex = '10';
               }
            }

            const imgArea = card.querySelector('.img-area');
            if (imgArea) {
              (imgArea as HTMLElement).style.height = 'auto';
              (imgArea as HTMLElement).style.minHeight = '220px';
              (imgArea as HTMLElement).style.flex = 'none';
              (imgArea as HTMLElement).style.borderBottom = '1px solid #e2e8f0';
              (imgArea as HTMLElement).style.display = 'block';

              const img = imgArea.querySelector('img');
              if(img) {
                  img.style.padding = '0';
                  img.style.width = '100%';
                  img.style.height = 'auto';
                  img.style.objectFit = 'contain';
                  img.style.position = 'relative';
              }
            }

            // --- İÇERİK ALANI DÜZELTMELERİ ---
            const contentArea = card.querySelector('.content-area');
            if (contentArea) {
              (contentArea as HTMLElement).style.padding = '10px';
              (contentArea as HTMLElement).style.gap = '6px';
              
              const grids = contentArea.querySelectorAll('.grid');
              const allItems: HTMLElement[] = [];
              grids.forEach(g => {
                g.querySelectorAll(':scope > div').forEach(i => allItems.push(i as HTMLElement));
                g.remove();
              });

              const newGrid = clonedDoc.createElement('div');
              newGrid.style.display = 'grid';
              newGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
              newGrid.style.gap = '6px';

              const colorMap: Record<string, { bg: string, border: string }> = {
                'TARİH': { bg: '#f1f5f9', border: '#e2e8f0' },
                'FİRMA': { bg: '#ffedd5', border: '#fed7aa' },
                'BEDEN': { bg: '#ede9fe', border: '#ddd6fe' },
                'GRAMAJ': { bg: '#ffe4e6', border: '#fecdd3' },
                'SÜRE': { bg: '#e0f2fe', border: '#bae6fd' },
                'KRİTİK': { bg: '#fef3c7', border: '#fde68a' },
                'İPLİK CİNSİ': { bg: '#d1fae5', border: '#a7f3d0' },
                'DÜĞME (ÇAP \\ ADET)': { bg: '#ccfbf1', border: '#99f6e4' },
                'DÜĞME (ÇAP / ADET)': { bg: '#ccfbf1', border: '#99f6e4' },
                'DÜĞME': { bg: '#ccfbf1', border: '#99f6e4' },
                'FERMUAR BOYU': { bg: '#fae8ff', border: '#f5d0fe' },
                'FERMUAR': { bg: '#fae8ff', border: '#f5d0fe' }
              };

              allItems.forEach(item => {
                const labelEl = item.querySelector('span.label-text');
                const labelText = labelEl ? (labelEl as HTMLElement).innerText.trim() : '';
                const style = colorMap[labelText] || { bg: '#f8fafc', border: '#cbd5e1' };

                // Kutu Stilleri (Kompakt ve Dengeli)
                item.style.padding = '4px 3px';
                item.style.minHeight = '42px';
                item.style.height = 'auto';
                item.style.border = `1px solid ${style.border}`;
                item.style.backgroundColor = style.bg;
                item.style.display = 'flex';
                item.style.flexDirection = 'column';
                item.style.alignItems = 'center';
                item.style.justifyContent = 'center';
                item.style.borderRadius = '7px';
                item.style.overflow = 'visible';
                
                const labels = item.querySelectorAll('span.label-text');
                labels.forEach(l => { 
                    (l as HTMLElement).style.fontSize = '8px';
                    (l as HTMLElement).style.fontWeight = '900';
                    (l as HTMLElement).style.color = '#475569';
                    (l as HTMLElement).style.marginBottom = '1.5px';
                    (l as HTMLElement).style.display = 'block';
                });
                
                const vals = item.querySelectorAll('span.val-text');
                vals.forEach(v => { 
                    (v as HTMLElement).style.fontSize = '12px';
                    (v as HTMLElement).style.fontWeight = '900'; 
                    (v as HTMLElement).style.color = '#000000';
                    (v as HTMLElement).style.lineHeight = '1.3';
                    (v as HTMLElement).style.paddingBottom = '2px';
                    (v as HTMLElement).style.display = 'block';
                    (v as HTMLElement).style.overflow = 'visible';
                });

                const timeTexts = item.querySelectorAll('span.time-text');
                timeTexts.forEach(t => { 
                    (t as HTMLElement).style.fontSize = '7.5px';
                    (t as HTMLElement).style.fontWeight = '800'; 
                    (t as HTMLElement).style.color = '#64748b';
                    (t as HTMLElement).style.marginTop = '1px'; 
                    (t as HTMLElement).style.display = 'block';
                    (t as HTMLElement).style.overflow = 'visible';
                });

                if (labelText.includes('İPLİK')) {
                   item.style.gridColumn = '1 / -1';
                }
                newGrid.appendChild(item);
              });
              contentArea.insertBefore(newGrid, contentArea.firstChild);
            }

            const notes = card.querySelector('.notes-area');
            if (notes) {
              (notes as HTMLElement).style.marginTop = '6px';
              (notes as HTMLElement).style.backgroundColor = '#fffbeb'; 
              (notes as HTMLElement).style.padding = '10px 12px';
              (notes as HTMLElement).style.border = '1px solid #fde68a';
              (notes as HTMLElement).style.borderRadius = '10px';
              const p = notes.querySelector('p');
              if (p) { 
                p.style.fontSize = '10.5px'; 
                p.style.fontWeight = '900'; 
                p.style.lineHeight = '1.4'; 
                p.style.color = '#000000';
                p.style.whiteSpace = 'pre-wrap';
                p.style.wordBreak = 'break-word';
                p.style.paddingBottom = '2px';
              }
            }
          }
        }
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert("Görsel dönüştürülemedi!");
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob
            })
          ]);
          setIsCopiedDirectly(true);
          if (onNotify) {
            onNotify("Kart kopyalandı! WhatsApp'ta doğrudan CTRL+V ile paylaşabilirsiniz.", "success");
          }
          setTimeout(() => setIsCopiedDirectly(false), 8000);
        } catch (clipErr) {
          console.error("Panoya yazma hatası:", clipErr);
          alert("Görsel kopyalanamadı. Lütfen önizleme açarak veya tarayıcı izinlerini onaylayarak deneyin.");
        }
      }, "image/png");

    } catch (err) { 
      console.error(err); 
      alert("Hata oluştu. Lütfen önizleme üzerinden paylaşmayı deneyin.");
    } finally { 
      setIsCapturing(null); 
    }
  };

  const handleDownload = () => {
    if (!previewUrl || !previewData) return;
    const link = document.createElement('a');
    const safeModel = (previewData.model || 'model').replace(/[^a-z0-9]/gi, '_');
    link.download = `${safeModel}_Kart.jpg`;
    link.href = previewUrl;
    link.click();
    setPreviewUrl(null); // İndirdikten sonra kapat
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu numune kaydını silmek istediğinize emin misiniz?")) return;
    await supabase.from('samples').delete().eq('id', id);
    setSamples(prev => prev.filter(s => s.id !== id));
  };

  if (loading) return <div className="py-20 text-center font-black animate-pulse text-indigo-600 tracking-widest">ARŞİV YÜKLENİYOR...</div>;

  return (
    <>
      {/* WhatsApp Bilgilendirme ve Uyarı Balonu */}
      {isCopiedDirectly && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white p-5 rounded-2xl shadow-2xl max-w-md text-center animate-in zoom-in-95 duration-300 z-[120] border-4 border-white">
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl animate-bounce">check_circle</span>
            <p className="font-black text-base uppercase tracking-wider">KART GÖRSELİ PANOYA KOPYALANDI!</p>
            <p className="text-xs font-bold leading-relaxed">
              Şimdi aktif olan <strong>WhatsApp Web sekmenize geçin</strong> ve herhangi bir grup veya konuşma kutusunda <strong>CTRL + V (Yapıştır)</strong> yaparak hemen gönderin!
            </p>
            <p className="text-[10px] font-black bg-emerald-700/50 px-3 py-1 rounded-full mt-1">
              Farklı bir sekme açılmadığı için mevcut WhatsApp oturumunuz kesintisiz devam eder!
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8 pb-20">
        <div className="flex justify-between items-center border-b pb-6">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">NUMUNE ARŞİVİ <span className="text-indigo-500">({filteredSamples.length})</span></h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
          {filteredSamples.map((sample) => (
            <div key={sample.id} className="flex flex-col gap-3 group">
              
              <div 
                id={`sample-card-${sample.id}`} 
                className="bg-white dark:bg-card-dark rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col relative transition-all mx-auto w-full duration-300 hover:shadow-lg hover:-translate-y-1 hover:z-[60]"
              >
                {isCapturing === sample.id && (
                  <div className="absolute inset-0 z-50 bg-white/95 flex items-center justify-center font-black text-[10px] text-indigo-600 animate-pulse uppercase tracking-widest rounded-[24px]">
                    Görsel Hazırlanıyor...
                  </div>
                )}
                
                <div className="img-area relative h-[280px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/50 overflow-hidden group/image rounded-t-[24px]">
                  {sample.mainImage ? (
                    <>
                      <img src={sample.mainImage} className="w-full h-full object-cover" alt="sample" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-4 z-40 print:hidden">
                        <button onClick={(e) => { e.stopPropagation(); openFullImage(sample.mainImage); }} className="bg-white/90 text-slate-900 size-10 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg" title="Göster">
                          <span className="material-symbols-outlined shrink-0 text-[20px]">visibility</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleCopyImage(sample.mainImage); }} className="bg-white/90 text-slate-900 size-10 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg" title="Kopyala">
                          <span className="material-symbols-outlined shrink-0 text-[20px]">content_copy</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-slate-300">image_not_supported</span>
                  )}
                  
                  <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 items-start z-10 w-full pr-28">
                    <div className="img-badge bg-indigo-100/95 dark:bg-indigo-900/30 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/50 shadow-md flex flex-col min-w-[90px]">
                      <span className="text-[7px] font-black text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider mb-0.5">MODEL</span>
                      <p className="text-slate-900 dark:text-white font-black text-[13px] uppercase leading-normal truncate w-full pb-1">{sample.modelCode}</p>
                    </div>
                    <div className="img-badge bg-cyan-100/95 dark:bg-cyan-900/30 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-800/50 shadow-md flex flex-col min-w-[90px]">
                      <span className="text-[7px] font-black text-cyan-600 dark:text-cyan-400 block uppercase tracking-wider mb-0.5">MÜŞTERİ</span>
                      <p className="text-slate-900 dark:text-white font-black text-[11px] uppercase truncate max-w-[120px] leading-normal pb-1">{sample.customerName || '-'}</p>
                    </div>
                  </div>

                  <div className="absolute bottom-3 right-3 z-20">
                    <div className={`${sample.isApproved ? 'bg-emerald-50' : 'bg-amber-50'} dark:bg-slate-900/90 border-2 ${sample.isApproved ? 'border-emerald-500' : 'border-orange-400'} border-double rounded-2xl p-2.5 shadow-xl transform -rotate-6 min-w-[80px]`}>
                      
                      {/* Status Pill - Dynamic Structure & Width Auto */}
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
                      {sample.updatedAt && (
                        <span className="time-text text-[8px] font-bold text-slate-500 mt-0.5">
                          {new Date(sample.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
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
                          <div 
                            className="size-4.5 rounded-md border border-rose-300 shadow-sm cursor-pointer overflow-hidden z-10 print:hidden shrink-0" 
                            onClick={(e) => { e.stopPropagation(); openFullImage(sample.weightImage!); }}
                          >
                             <img src={sample.weightImage} className="w-full h-full object-cover hover:scale-110 transition-transform" alt="Gramaj Resmi" />
                          </div>
                        )}
                        <span className="val-text text-[13px] font-black text-slate-950 dark:text-white leading-normal pb-0.5">{sample.weight}g</span>
                      </div>
                      
                      {/* Zoom Modal on Hover */}
                      {sample.weightImage && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[416px] h-[416px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] opacity-0 invisible group-hover/weight:opacity-100 group-hover/weight:visible transition-all duration-300 overflow-hidden print:hidden scale-50 group-hover/weight:scale-100 origin-bottom pointer-events-none">
                          <img src={sample.weightImage} className="w-full h-full object-contain" alt="zoom" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Satır: Süre & Kritik */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-sky-100 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800/50 p-1 rounded-xl text-center flex flex-col justify-center min-h-[40px]">
                      <span className="label-text text-[7.5px] font-black text-sky-600 uppercase tracking-wider mb-0.5">SÜRE</span>
                      <span className="val-text text-[11px] font-black text-slate-950 dark:text-white leading-normal pb-0.5">{sample.productionTime} dk</span>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 p-1 rounded-xl text-center flex flex-col justify-center min-h-[40px]">
                      <span className="label-text text-[7.5px] font-black text-amber-600 uppercase tracking-wider mb-0.5">KRİTİK</span>
                      <span className="val-text text-[11px] font-black text-slate-950 dark:text-white leading-normal pb-0.5">{sample.criticCount}</span>
                    </div>
                  </div>

                  {/* 4. Satır: İplik Cinsi */}
                  <div className="grid grid-cols-1">
                     <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 p-1.5 rounded-xl text-center flex flex-col justify-center min-h-[38px]">
                        <span className="label-text text-[7.5px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">İPLİK CİNSİ</span>
                        <span className="val-text text-[11px] font-black text-slate-950 dark:text-white truncate px-2 leading-normal pb-0.5">{sample.yarnType}</span>
                     </div>
                  </div>

                  {/* 5. Satır: Aksesuarlar (Düğme & Fermuar) */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50 p-1.5 rounded-xl text-center flex flex-col justify-center min-h-[40px] overflow-hidden relative group/button">
                      <span className="label-text text-[7.5px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-0.5">DÜĞME (ÇAP \ ADET)</span>
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {sample.buttonImage && (
                          <div 
                            className="size-4 rounded-md border border-teal-300 shadow-sm overflow-hidden z-10 shrink-0 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); openFullImage(sample.buttonImage!); }}
                          >
                             <img src={sample.buttonImage} className="w-full h-full object-cover hover:scale-110 transition-transform" alt="Düğme Resmi" />
                          </div>
                        )}
                        <span className="val-text text-[11px] font-black text-slate-950 dark:text-white truncate px-1 leading-normal pb-0.5">
                          {formatButtonDisplay(sample.buttonSize, sample.buttonCount)}
                        </span>
                      </div>
                      
                      {/* Zoom Modal on Hover */}
                      {sample.buttonImage && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[416px] h-[416px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] opacity-0 invisible group-hover/button:opacity-100 group-hover/button:visible transition-all duration-300 overflow-hidden print:hidden scale-50 group-hover/button:scale-100 origin-bottom pointer-events-none">
                          <img src={sample.buttonImage} className="w-full h-full object-contain" alt="Düğme Zoom" />
                        </div>
                      )}
                    </div>
                    <div className="bg-fuchsia-100 dark:bg-fuchsia-900/30 border border-fuchsia-200 dark:border-fuchsia-800/50 p-1.5 rounded-xl text-center flex flex-col justify-center min-h-[40px] overflow-hidden">
                      <span className="label-text text-[7.5px] font-black text-fuchsia-700 dark:text-fuchsia-400 uppercase tracking-wider mb-0.5">FERMUAR BOYU</span>
                      <span className="val-text text-[11px] font-black text-slate-950 dark:text-white truncate px-1 leading-normal pb-0.5">
                        {formatZipperDisplay(sample.zipperLength)}
                      </span>
                    </div>
                  </div>

                  {sample.notes && (
                    <div className="notes-area bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50 relative mt-0.5 shadow-inner">
                      <p className="text-[10.5px] font-black text-slate-950 dark:text-white leading-[1.35] uppercase whitespace-pre-wrap break-words">
                        {sample.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-card-dark rounded-xl p-2 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-2 h-14">
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => onEdit(sample)} 
                        className="flex-1 h-full bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-[10px] uppercase hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-0.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit_square</span>
                        <span>Düzenle</span>
                      </button>
                      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                    </>
                  )}
                  <button 
                    onClick={() => handleWhatsAppDirectShare(sample.id!)} 
                    className="flex-1 h-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-[10px] uppercase hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-100 dark:border-emerald-800/30 flex flex-col items-center justify-center gap-0.5 transition-colors"
                    title="WhatsApp için Kart Kopyala"
                  >
                    <span className="material-symbols-outlined text-[18px] text-emerald-500">share</span>
                    <span>WhatsApp</span>
                  </button>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                  <button 
                    onClick={() => handleGeneratePreview(sample.id!, sample.modelCode, sample.customerName)} 
                    className="flex-1 h-full bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-[10px] uppercase hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-0.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    <span>Önizle</span>
                  </button>
                  {isAdmin && (
                    <>
                      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                      <button 
                        onClick={() => handleDelete(sample.id!)} 
                        className="flex-1 h-full bg-slate-50 dark:bg-slate-800 text-rose-500 font-bold rounded-lg text-[10px] uppercase hover:bg-rose-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-0.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        <span>Sil</span>
                      </button>
                    </>
                  )}
              </div>

            </div>
          ))}
        </div>
      </div>
      
      {/* Önizleme Modalı */}
      {previewUrl && previewData && (
        <PreviewModal 
          imageUrl={previewUrl}
          modelCode={previewData.model}
          customerName={previewData.customer}
          onClose={() => setPreviewUrl(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Büyük Resim Gösterim Modalı */}
      {fullImageModal && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-hidden select-none" 
          onClick={() => setFullImageModal(null)}
          onWheel={(e) => {
            e.preventDefault();
            setImageScale(prev => Math.min(Math.max(0.5, prev - e.deltaY * 0.005), 5));
          }}
          onMouseMove={(e) => {
            if (isDragging) {
              setImagePos({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
              });
            }
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setFullImageModal(null); }}
            className="absolute top-4 right-4 text-white hover:text-red-400 z-50 bg-black/50 rounded-full p-2 flex items-center justify-center transition-colors shadow-lg"
            title="Kapat"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          
          <div 
            className="absolute bottom-4 bg-black/50 text-white/80 py-2 px-4 rounded-full text-xs font-medium z-50 backdrop-blur-md pointer-events-none"
          >
            Sarmak için Scroll, Gezinmek için Sürükle (Zoom: {Math.round(imageScale * 100)}%)
          </div>

          <div
            className={`w-full h-full flex items-center justify-center transition-transform ${isDragging ? 'cursor-grabbing' : (imageScale > 1 ? 'cursor-grab' : 'cursor-zoom-in')}`}
          >
            <img 
              src={fullImageModal} 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (imageScale > 1) {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - imagePos.x, y: e.clientY - imagePos.y });
                } else {
                  // Click to close when not zoomed, or just stop propagation so it doesn't close
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if(imageScale <= 1) setFullImageModal(null);
              }}
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform ease-out" 
              style={{ 
                transform: `translate(${imagePos.x}px, ${imagePos.y}px) scale(${imageScale})`,
                transitionDuration: isDragging ? '0ms' : '150ms'
              }}
              draggable={false}
              alt="Full Preview" 
            />
          </div>
        </div>
      )}
    </>
  );
};
