
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SampleData, YarnType, SizeType } from '../types';

interface AssistantProps {
  currentData: SampleData;
  onUpdateData: (newData: SampleData) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export const Assistant: React.FC<AssistantProps> = ({ currentData, onUpdateData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Merhaba! Ben numune asistanınızım. Bana bir teknik föy resmi atabilir veya "Model kodunu X yap" diyerek değişiklik yapabilirsiniz.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Paste Handler (Sadece Asistan açıksan çalışır)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault(); // Ana sayfanın paste eventini engelle
            e.stopPropagation();
            const reader = new FileReader();
            reader.onload = (ev) => setPendingImage(ev.target?.result as string);
            reader.readAsDataURL(blob);
            return; // Sadece ilk resmi al
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleSend = async () => {
    if ((!input.trim() && !pendingImage) || isLoading) return;

    const userMsg: Message = { role: 'user', text: input, image: pendingImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setInput('');
    setPendingImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `
        Sen uzman bir Tekstil Numune Asistanısın. Görevin, kullanıcının verdiği metin veya görselden verileri analiz edip JSON formatında çıktı vermek.
        
        Mevcut Veriler:
        ${JSON.stringify(currentData)}

        Kurallar:
        1. SADECE geçerli bir JSON objesi döndür. Markdown, açıklama veya ek metin EKLEME.
        2. Gelen resim bir teknik föy veya etiket ise: Model Kodu, Müşteri, Tarih, Kumaş/İplik Cinsi, Gramaj gibi bilgileri okumaya çalış.
        3. Kullanıcı "Model kodunu X yap" derse sadece o alanı güncelle.
        4. "yarnType" alanı için şu değerlerden en yakın olanı seç: ${Object.values(YarnType).join(', ')}. Eğer bulamazsan "Pamuk" varsay.
        5. "size" alanı için şu değerlerden birini seç: ${Object.values(SizeType).join(', ')}.
        6. Aksesuar bilgileri: "buttonSize" (sadece ölçü numarası, örn: "24", "18"), "buttonCount" (number, örn: 5), "zipperLength" (örn: "45 cm").
        7. Tarih formatı YYYY-MM-DD olmalı.
        8. Sayısal değerleri (weight, productionTime, buttonCount, criticCount) number olarak döndür.
        9. Eğer resimden bir bilgi okuyamazsan, mevcut veriyi koru.

        Örnek Çıktı Formatı:
        {
          "modelCode": "...",
          "customerName": "...",
          "yarnType": "...",
          "buttonSize": "24",
          "buttonCount": 5,
          "zipperLength": "45 cm",
          "weight": 250,
          "notes": "..."
        }
      `;

      const promptParts: any[] = [];
      
      if (userMsg.image) {
        // Base64 header'ı temizle
        const base64Data = userMsg.image.split(',')[1];
        promptParts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        });
        promptParts.push({ text: "Bu resimdeki teknik detayları analiz et ve JSON'ı güncelle." });
      }

      if (userMsg.text) {
        promptParts.push({ text: userMsg.text });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          role: 'user',
          parts: promptParts
        },
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text;
      
      if (responseText) {
        try {
          const parsedData = JSON.parse(responseText);
          // Mevcut veri ile birleştir (API eksik alan gönderirse diye güvenli merge)
          const mergedData = { ...currentData, ...parsedData };
          onUpdateData(mergedData);
          setMessages(prev => [...prev, { role: 'model', text: 'Verileri güncelledim! Kontrol edebilirsiniz.' }]);
        } catch (e) {
          console.error("JSON Parse Hatası:", e);
          setMessages(prev => [...prev, { role: 'model', text: 'Verileri işlerken bir sorun oluştu. Lütfen tekrar deneyin.' }]);
        }
      } else {
         setMessages(prev => [...prev, { role: 'model', text: 'Üzgünüm, bir yanıt oluşturamadım.' }]);
      }

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Bağlantı hatası oluştu.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-2xl transition-transform hover:scale-110 flex items-center gap-2 print:hidden"
      >
        <span className="material-symbols-outlined text-3xl">smart_toy</span>
        {isOpen && <span className="font-bold pr-2 animate-in fade-in">Asistan</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[60] w-[350px] md:w-[400px] h-[500px] bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 print:hidden">
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">auto_awesome</span>
              <h3 className="font-bold text-sm">AI Numune Asistanı</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-sm font-medium ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.image && (
                    <img src={msg.image} alt="Upload" className="w-full h-auto rounded-lg mb-2 border border-white/20" />
                  )}
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-none p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                   <div className="flex gap-1">
                     <div className="size-2 bg-indigo-500 rounded-full animate-bounce"></div>
                     <div className="size-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                     <div className="size-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                   </div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-card-dark border-t border-slate-200 dark:border-slate-800">
            {pendingImage && (
              <div className="relative mb-2 inline-block">
                <img src={pendingImage} alt="Preview" className="h-16 rounded-lg border border-slate-300 shadow-sm" />
                <button 
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Resim yapıştırın veya yazın..."
                className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || (!input && !pendingImage)}
                className="bg-indigo-600 disabled:bg-slate-400 text-white rounded-xl p-2.5 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
