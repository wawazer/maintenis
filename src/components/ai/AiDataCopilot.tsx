import React, { useState } from 'react';
import { Send, Bot, X, ArrowRight } from 'lucide-react';
import { maintenanceApi } from '../../services/maintenanceApi';
import { AiCopilotResponse } from '../../types';

interface AiDataCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  contextData?: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  response?: AiCopilotResponse;
  timestamp: string;
}

const PRESET_QUESTIONS = [
  'Aset mana yang MTTR-nya paling lama minggu ini?',
  'Ringkas temuan 5R dan alat tidak pada tempatnya',
  'Apa tindakan prioritas untuk teknisi shift 1 pagi ini?'
];

export const AiDataCopilot: React.FC<AiDataCopilotProps> = ({
  isOpen,
  onClose,
  contextData
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Halo! Saya AI Maintenance Copilot. Tanyakan data operasional spreadsheet, MTTR aset, atau ringkasan temuan 5R.',
      timestamp: 'Baru saja'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await maintenanceApi.askAiCopilot(q, contextData);
      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'ai',
        text: res.answer,
        response: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'ai',
        text: 'Maaf, terjadi kesalahan saat menghubungi model AI. Coba lagi atau periksa koneksi Apps Script.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Abyss Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#02030b]/85 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Slide-over Slate Indigo Panel */}
      <div className="relative z-10 w-full sm:w-[480px] bg-[#0c0a2b] border-l border-[#292a4d] flex flex-col animate-in slide-in-from-right duration-200 h-full">
        {/* Header */}
        <div className="p-4 sm:px-5 border-b border-[#202333] flex items-center justify-between bg-[#0c0a2b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[12px] bg-[#13151f] border border-[#292a4d] flex items-center justify-center text-[#665eff]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-display font-semibold tracking-[0.013em] text-white">
                  AI Maintenance Copilot
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-[30px] bg-[#13151f] text-[#b4b4bb] border border-[#665eff]/60 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#665eff]" />
                  Data Q&A
                </span>
              </div>
              <p className="text-xs text-[#9b9ba4]">Tanya Jawab Telemetri Google Sheets</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup AI Copilot"
            className="p-1.5 rounded-[30px] bg-[#13151f] border border-[#202333] text-[#9b9ba4] hover:text-white hover:border-[#292a4d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[#9b9ba4] tabular-nums">
                {msg.sender === 'ai' ? (
                  <>
                    <Bot className="w-3.5 h-3.5 text-[#665eff]" />
                    <span className="text-[#b4b4bb] font-medium">AI Copilot</span>
                  </>
                ) : (
                  <span className="text-[#b4b4bb] font-medium">Anda</span>
                )}
                <span>â€¢</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`p-3.5 rounded-[12px] max-w-[90%] text-[13px] leading-[1.55] border ${
                  msg.sender === 'user'
                    ? 'bg-[#2c2b52]/70 border-[#665eff]/60 text-white'
                    : 'bg-[#13151f] border-[#202333] text-[#b4b4bb]'
                }`}
              >
                <p className={msg.sender === 'ai' ? 'text-white' : ''}>{msg.text}</p>

                {msg.response && (
                  <div className="mt-2.5 pt-2.5 border-t border-[#202333] space-y-2">
                    {msg.response.recommended_action && (
                      <div className="flex items-start gap-1.5 text-[#b4b4bb] text-xs">
                        <ArrowRight className="w-3.5 h-3.5 text-[#0067ff] shrink-0 mt-0.5" />
                        <span>{msg.response.recommended_action}</span>
                      </div>
                    )}

                    {msg.response.related_assets && msg.response.related_assets.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] text-[#9b9ba4]">Aset:</span>
                        {msg.response.related_assets.map((assetId) => (
                          <span
                            key={assetId}
                            className="text-[11px] px-2.5 py-0.5 rounded-[30px] bg-[#0c0a2b] border border-[#292a4d] text-white tabular-nums"
                          >
                            {assetId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 text-xs text-[#b4b4bb] bg-[#13151f] border border-[#292a4d] rounded-[12px]">
              <Bot className="w-4 h-4 animate-spin text-[#0067ff]" />
              <span>Menganalisis live sheet data & riwayat tiket...</span>
            </div>
          )}
        </div>

        {/* Suggested Quick Questions */}
        <div className="p-3.5 border-t border-[#202333] bg-[#0c0a2b]">
          <span className="text-[11px] text-[#9b9ba4] uppercase tracking-[0.015em] block mb-2 font-medium">
            Pertanyaan Cepat
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(q)}
                disabled={isLoading}
                className="text-xs px-3 py-1 rounded-[30px] bg-[#13151f] hover:bg-[#2c2b52]/60 border border-[#202333] hover:border-[#292a4d] text-[#b4b4bb] hover:text-white transition-colors text-left disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-[#202333] bg-[#02030b]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan status mesin, MTTR, kendala..."
              disabled={isLoading}
              className="flex-1 bg-[#13151f] border border-[#292a4d] focus:border-[#665eff] rounded-[30px] px-4 py-2 text-[13px] text-white placeholder-[#9b9ba4] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Kirim pertanyaan"
              className="btn-coral-cta p-2.5 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
