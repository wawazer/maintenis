import React, { useState } from 'react';
import { Send, Bot, X, Sparkles, HelpCircle, ArrowRight, CornerDownLeft } from 'lucide-react';
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
    } catch (err: any) {
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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-cyan-950 text-cyan-400 border border-cyan-700/50">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono">
                AI Maintenance Copilot
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Data Q&A
              </span>
            </div>
            <p className="text-xs text-slate-400">Tanya Jawab Telemetri Google Sheets</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono text-slate-400">
              {msg.sender === 'ai' ? (
                <>
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Copilot</span>
                </>
              ) : (
                <span>Anda</span>
              )}
              <span>•</span>
              <span className="tabular-nums">{msg.timestamp}</span>
            </div>

            <div
              className={`p-3.5 rounded-lg max-w-[90%] text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-800 border border-slate-700 text-slate-100'
                  : 'bg-slate-950/80 border border-cyan-900/50 text-slate-200'
              }`}
            >
              <p>{msg.text}</p>

              {msg.response && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2">
                  {msg.response.recommended_action && (
                    <div className="flex items-start gap-1.5 text-emerald-400 font-mono text-[11px]">
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{msg.response.recommended_action}</span>
                    </div>
                  )}

                  {msg.response.related_assets && msg.response.related_assets.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono text-slate-400">Aset:</span>
                      {msg.response.related_assets.map((assetId) => (
                        <span
                          key={assetId}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300"
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
          <div className="flex items-center gap-2 p-3 text-xs font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-800/40 rounded-lg">
            <Bot className="w-4 h-4 animate-spin" />
            <span>Menganalisis live sheet data & riwayat tiket...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
          Pertanyaan Cepat:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSubmit(q)}
              disabled={isLoading}
              className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors text-left disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
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
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
