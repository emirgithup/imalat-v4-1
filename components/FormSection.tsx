
import React, { useRef } from 'react';
import { SampleData, YarnType, SizeType } from '../types';

interface FormSectionProps {
  data: SampleData;
  onChange: (field: keyof SampleData, value: string | number) => void;
  onImageUpload?: (event: React.ChangeEvent<HTMLInputElement>, target?: 'main' | 'weight' | 'button') => void;
}

export const FormSection: React.FC<FormSectionProps> = ({ data, onChange, onImageUpload }) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const buttonInputRef = useRef<HTMLInputElement>(null);

  const handleDateIconClick = () => {
    if (dateInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          dateInputRef.current.showPicker();
        } catch (error) {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  // Tarih Formatlayıcı (Görsel Alma Modu İçin)
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  return (
    <div className="h-full">
      <div className="resizable-card relative bg-card-light dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden print:shadow-none print:border-none min-h-full">
        
        {/* Arka Plan Resmi */}
        {data.mainImage && (
          <div 
            className="absolute inset-0 z-0 pointer-events-none transition-all duration-500"
            style={{
              backgroundImage: `url(${data.mainImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.25, 
              filter: 'blur(1px) saturate(0.8) contrast(0.9)',
              transform: 'scale(1.02)'
            }}
          />
        )}

        {/* İçerik Katmanı */}
        <div className="relative z-10 h-full flex flex-col backdrop-blur-[0.5px]">
          <div className="px-6 py-5 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center bg-white/70 dark:bg-slate-800/70 print:px-0 print:py-2 print:bg-white print:border-b-2 print:border-slate-900">
            <h3 className="text-text-primary-light dark:text-text-primary-dark font-black text-[15px] print:text-xs uppercase tracking-tighter">KENZA'A Teknik Özellikler</h3>
            <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark cursor-pointer hover:text-primary print:hidden">more_horiz</span>
          </div>
          
          <div className="p-4 md:p-6 space-y-5 print:p-0 print:pt-4 print:space-y-3 flex-1 overflow-y-auto">
            {/* Model Kodu */}
            <div className="space-y-1.5" data-field="model-code">
              <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">Model Kodu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary">
                  <span className="material-symbols-outlined text-[20px] font-bold">qr_code_2</span>
                </div>
                <input 
                  type="text"
                  value={data.modelCode}
                  onChange={(e) => onChange('modelCode', e.target.value)}
                  className="block w-full pl-11 rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-background-dark/90 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary text-lg h-12 print:h-10 print:pl-8 print:text-sm print:border-slate-200 backdrop-blur-md font-black uppercase tracking-wider" 
                  placeholder="Model No" 
                />
                <div className="hidden capture-mode:flex input-replacement">{data.modelCode || '-'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Tarih */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">Tarih</label>
                <div className="relative">
                  <button type="button" onClick={handleDateIconClick} className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary z-20 print:hidden">
                    <span className="material-symbols-outlined text-[20px] font-bold">calendar_month</span>
                  </button>
                  <input 
                    ref={dateInputRef}
                    type="date" 
                    value={data.date}
                    onChange={(e) => onChange('date', e.target.value)}
                    className="block w-full pl-11 rounded-xl border-slate-300 dark:border-slate-600 bg-white text-slate-900 text-[15px] h-12 print:h-8 print:pl-8 print:text-xs print:border-slate-200 font-bold cursor-pointer" 
                  />
                  <div className="hidden capture-mode:flex input-replacement">{formatDisplayDate(data.date)}</div>
                </div>
              </div>

              {/* Müşteri Adı */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">Müşteri</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={data.customerName}
                    onChange={(e) => onChange('customerName', e.target.value)}
                    className="block w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white text-slate-900 text-[15px] h-12 px-4 print:h-8 print:text-xs print:border-slate-200 font-bold" 
                    placeholder="Müşteri Adı" 
                  />
                  <div className="hidden capture-mode:flex input-replacement">{data.customerName || '-'}</div>
                </div>
              </div>
            </div>

            {/* Getiren Firma */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">Firma</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={data.firmName}
                  onChange={(e) => onChange('firmName', e.target.value)}
                  className="block w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white text-slate-900 text-[15px] h-12 px-4 print:h-8 print:text-xs print:border-slate-200 font-bold" 
                  placeholder="Getiren Firma" 
                />
                <div className="hidden capture-mode:flex input-replacement">{data.firmName || '-'}</div>
              </div>
            </div>

            <hr className="border-slate-300/60 dark:border-slate-600/60 my-2 print:border-slate-100"/>

            <div className="grid grid-cols-2 gap-5">
              {/* Gramaj */}
              <div className="space-y-1.5 flex flex-col" id="weight-container">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">Gramaj (g)</label>
                  <div className="flex items-center gap-1.5 print:hidden">
                    {data.weightImage && (
                      <button 
                        type="button"
                        onClick={() => onChange('weightImage', '')}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1 rounded-lg transition-all flex items-center gap-0.5 text-[11px] font-bold"
                        title="Gramaj Resmini Kaldır"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        <span className="hidden sm:inline">Sil</span>
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => weightInputRef.current?.click()}
                      className="text-primary hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center"
                      title={data.weightImage ? "Gramaj Resmini Değiştir" : "Gramaj Resmi Ekle Veya Kopyala Yapıştırın (Ctrl+V)"}
                    >
                      <span className="material-symbols-outlined text-[16px]">{data.weightImage ? 'change_circle' : 'add_a_photo'}</span>
                    </button>
                  </div>
                  <input type="file" ref={weightInputRef} onChange={onImageUpload} accept="image/*" className="hidden" capture="environment" />
                </div>
                <div className="relative">
                  <input 
                    id="weight-input"
                    type="number" 
                    value={data.weight || ''}
                    onChange={(e) => onChange('weight', parseInt(e.target.value) || 0)}
                    className={`block w-full rounded-xl border-slate-300 bg-white text-slate-900 text-[18px] h-12 px-4 ${data.weightImage ? 'text-left pl-14' : 'text-right'} font-black print:h-8 print:text-xs print:border-slate-200`} 
                    placeholder="0" 
                  />
                  {data.weightImage && (
                    <div className="absolute inset-y-1 left-1 flex items-center group/thumb">
                      <div 
                        className="w-10 h-10 rounded-lg bg-cover bg-center border border-slate-200 dark:border-slate-700 cursor-pointer relative overflow-hidden shadow-xs"
                        style={{ backgroundImage: `url(${data.weightImage})` }}
                        onClick={() => window.open(data.weightImage, '_blank')}
                        title="Resmi Yeni Sekmede Aç"
                      >
                        <div 
                          className="absolute inset-0 bg-rose-900/80 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChange('weightImage', '');
                          }}
                          title="Resmi Sil"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="hidden capture-mode:flex input-replacement justify-between items-center text-[18px] font-black">
                     {data.weightImage && <img src={data.weightImage} className="h-8 w-8 object-cover rounded-md border border-slate-200" alt="Gramaj" />}
                     <span>{data.weight || 0} g</span>
                  </div>
                </div>
              </div>
              
              {/* Üretim Süresi */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">Süre (dk)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={data.productionTime || ''}
                    onChange={(e) => onChange('productionTime', parseInt(e.target.value) || 0)}
                    className="block w-full rounded-xl border-slate-300 bg-white text-slate-900 text-[18px] h-12 px-4 text-right font-black print:h-8 print:text-xs print:border-slate-200" 
                    placeholder="0" 
                  />
                  <div className="hidden capture-mode:flex input-replacement justify-end text-[18px] font-black">{data.productionTime || 0} dk</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Kritik Sayısı */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">Kritik Sayısı</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={data.criticCount}
                    onChange={(e) => onChange('criticCount', parseInt(e.target.value) || 0)}
                    className="block w-full rounded-xl border-slate-300 bg-white text-red-600 text-[18px] h-12 px-4 font-black" 
                  />
                  <div className="hidden capture-mode:flex input-replacement text-red-600 font-black text-[18px]">{data.criticCount || 0}</div>
                </div>
              </div>

              {/* Beden */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">Beden</label>
                <div className="relative">
                  <input 
                    type="text"
                    list="size-presets"
                    value={data.size}
                    onChange={(e) => onChange('size', e.target.value)}
                    className="block w-full rounded-xl border-slate-300 bg-white text-slate-900 text-[15px] h-12 px-4 font-black"
                    placeholder="Seçiniz veya yazınız"
                  />
                  <datalist id="size-presets">
                    {Object.values(SizeType).map(size => (
                      <option key={size} value={size} />
                    ))}
                  </datalist>
                  <div className="hidden capture-mode:flex input-replacement font-black">{data.size}</div>
                </div>
              </div>
            </div>

            {/* İplik Cinsi */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">İplik Cinsi</label>
              <div className="relative">
                <input 
                  type="text" 
                  list="yarn-types"
                  value={data.yarnType}
                  onChange={(e) => onChange('yarnType', e.target.value)}
                  className="block w-full rounded-xl border-slate-300 bg-white text-slate-900 text-[15px] h-12 px-4 font-black"
                  placeholder="Seçiniz veya yazınız"
                />
                <datalist id="yarn-types">
                   {Object.values(YarnType).map(yarn => (
                    <option key={yarn} value={yarn} />
                  ))}
                </datalist>
                <div className="hidden capture-mode:flex input-replacement font-black">{data.yarnType}</div>
              </div>
            </div>

            <hr className="border-slate-300/60 dark:border-slate-600/60 my-2 print:border-slate-100"/>

            {/* Aksesuarlar Bölümü */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 pl-1">
                <span className="material-symbols-outlined text-primary text-[18px]">extension</span>
                <label className="text-[12px] font-black text-text-primary-light dark:text-text-primary-dark uppercase tracking-wider">Aksesuarlar</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="button-container">
                {/* Düğme Çapı */}
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex items-center justify-between pl-1">
                    <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">Düğme Çapı</label>
                    <div className="flex items-center gap-1.5 print:hidden">
                      {data.buttonImage && (
                        <button 
                          type="button"
                          onClick={() => onChange('buttonImage', '')}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1 rounded-lg transition-all flex items-center gap-0.5 text-[11px] font-bold"
                          title="Düğme Resmini Kaldır"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => buttonInputRef.current?.click()}
                        className="text-primary hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center"
                        title={data.buttonImage ? "Düğme Resmini Değiştir" : "Düğme Resmi Ekle Veya Kopyala Yapıştırın (Ctrl+V)"}
                      >
                        <span className="material-symbols-outlined text-[16px]">{data.buttonImage ? 'change_circle' : 'add_a_photo'}</span>
                      </button>
                    </div>
                    <input type="file" ref={buttonInputRef} onChange={(e) => onImageUpload && onImageUpload(e, 'button')} accept="image/*" className="hidden" capture="environment" />
                  </div>
                  <div className="relative">
                    <input 
                      id="button-size-input"
                      type="text" 
                      list="button-sizes"
                      value={data.buttonSize || ''}
                      onChange={(e) => onChange('buttonSize', e.target.value)}
                      className={`block w-full rounded-xl border-slate-300 bg-white text-slate-900 text-[14px] h-11 px-3.5 ${data.buttonImage ? 'pl-12' : ''} font-bold`}
                      placeholder="örn: 24"
                    />
                    {data.buttonImage && (
                      <div className="absolute inset-y-1 left-1 flex items-center group/btn-thumb">
                        <div 
                          className="w-9 h-9 rounded-lg bg-cover bg-center border border-slate-200 dark:border-slate-700 cursor-pointer relative overflow-hidden shadow-xs"
                          style={{ backgroundImage: `url(${data.buttonImage})` }}
                          onClick={() => window.open(data.buttonImage, '_blank')}
                          title="Düğme Resmini Büyüt"
                        >
                          <div 
                            className="absolute inset-0 bg-rose-900/80 opacity-0 group-hover/btn-thumb:opacity-100 transition-opacity flex items-center justify-center text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChange('buttonImage', '');
                            }}
                            title="Resmi Sil"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <datalist id="button-sizes">
                      <option value="14" />
                      <option value="16" />
                      <option value="18" />
                      <option value="20" />
                      <option value="22" />
                      <option value="24" />
                      <option value="26" />
                      <option value="28" />
                      <option value="30" />
                      <option value="32" />
                      <option value="34" />
                      <option value="36" />
                      <option value="38" />
                      <option value="40" />
                    </datalist>
                    <div className="hidden capture-mode:flex input-replacement justify-between items-center font-black">
                      {data.buttonImage && <img src={data.buttonImage} className="h-7 w-7 object-cover rounded-md border border-slate-200" alt="Düğme" />}
                      <span>{data.buttonSize || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Düğme Adeti */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">Düğme Adeti</label>
                  <div className="relative">
                    <input 
                      id="button-count-input"
                      type="number" 
                      min="0"
                      value={data.buttonCount || ''}
                      onChange={(e) => onChange('buttonCount', parseInt(e.target.value) || 0)}
                      className="block w-full rounded-xl border-slate-300 bg-white text-slate-900 text-[15px] h-11 px-3.5 text-right font-black"
                      placeholder="0"
                    />
                    <div className="hidden capture-mode:flex input-replacement justify-end font-black">{data.buttonCount || 0} Adet</div>
                  </div>
                </div>

                {/* Fermuar Boyu */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest pl-1">Fermuar Boyu</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      list="zipper-lengths"
                      value={data.zipperLength || ''}
                      onChange={(e) => onChange('zipperLength', e.target.value)}
                      className="block w-full rounded-xl border-slate-300 bg-white text-slate-900 text-[14px] h-11 px-3.5 font-bold"
                      placeholder="örn: 45 cm"
                    />
                    <datalist id="zipper-lengths">
                      <option value="10 cm" />
                      <option value="15 cm" />
                      <option value="20 cm" />
                      <option value="25 cm" />
                      <option value="30 cm" />
                      <option value="35 cm" />
                      <option value="40 cm" />
                      <option value="45 cm" />
                      <option value="50 cm" />
                      <option value="55 cm" />
                      <option value="60 cm" />
                      <option value="65 cm" />
                      <option value="70 cm" />
                      <option value="75 cm" />
                      <option value="80 cm" />
                    </datalist>
                    <div className="hidden capture-mode:flex input-replacement font-black">{data.zipperLength || '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-300/60 dark:border-slate-600/60 my-2 print:border-slate-100"/>

            {/* Notlar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[11px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">Notlar & Açıklamalar</label>
                <span className="text-[10px] font-bold text-slate-500">{(data.notes || '').length} karakter</span>
              </div>
              <div className="relative">
                <textarea 
                  value={data.notes}
                  onChange={(e) => onChange('notes', e.target.value)}
                  className="block w-full rounded-xl border-slate-300 bg-white text-slate-900 text-[14px] p-4 resize-y min-h-[140px] font-bold leading-relaxed shadow-sm focus:ring-2 focus:ring-primary focus:border-primary" 
                  rows={6}
                  placeholder="Üretim, model detayları veya kritik notları..."
                ></textarea>
                <div className="hidden capture-mode:flex input-replacement h-auto min-h-[100px] py-3 items-start text-[14px] font-bold whitespace-pre-wrap break-words" data-type="textarea">{data.notes || '-'}</div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-2xl print:hidden backdrop-blur-sm">
              <p className="text-[13px] text-primary font-black leading-tight uppercase flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">{data.isApproved ? 'verified' : 'info'}</span>
                  {data.isApproved ? 'Üretim Onayı Alınmıştır' : 'İmalat Onayı Bekleniyor'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
