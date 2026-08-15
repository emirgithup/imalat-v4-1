export const captureExportCard = async (elementId: string): Promise<string | null> => {
  const cardElement = document.getElementById(elementId);
  if (!cardElement) return null;
  
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
        const card = clonedDoc.getElementById(elementId);
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
             
             if(text.includes('MODEL')) el.style.backgroundColor = '#eef2ff'; 
             else el.style.backgroundColor = '#ecfeff';
             el.style.borderColor = '#cbd5e1';
             
             const pTags = el.querySelectorAll('p');
             pTags.forEach(p => {
               p.style.lineHeight = '1.4';
               p.style.paddingBottom = '4px'; 
               p.style.marginBottom = '0';
               p.style.overflow = 'visible';
               p.style.whiteSpace = 'normal';
             });
          });

          // --- ROZET DÜZELTMELERİ ---
          const statusPill = card.querySelector('.status-pill');
          if(statusPill) {
             const el = statusPill as HTMLElement;
             const textSpan = el.querySelector('span');
             const isApproved = textSpan?.innerText.includes('ONAYLI');

             el.style.width = 'auto';
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
                 span.style.color = '#000000';
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
    
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
    console.error("captureExportCard hatası: ", error);
    return null;
  }
};
