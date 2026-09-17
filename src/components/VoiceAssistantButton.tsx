import React from 'react';
import { Mic, Sparkles } from 'lucide-react';

interface VoiceAssistantButtonProps {
  onClick: () => void;
  isListening?: boolean;
}

export const VoiceAssistantButton: React.FC<VoiceAssistantButtonProps> = ({
  onClick,
  isListening = false,
}) => {
  return (
    <aside
      aria-label="Assistente Inteligente por Voz"
      className="fixed bottom-5 right-5 z-40 no-print flex flex-col items-end gap-2 group"
    >
      {/* Tooltip on hover/focus */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span>Falar com o assistente</span>
      </div>

      {/* Main Floating Trigger Button */}
      <button
        id="voice-assistant-floating-btn"
        type="button"
        onClick={onClick}
        aria-label="Falar com o Assistente Inteligente"
        className={`relative flex items-center gap-2.5 px-4 py-3 rounded-full text-white font-bold text-xs sm:text-sm shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-400/50 active:scale-95 ${
          isListening
            ? 'bg-rose-600 shadow-rose-600/40 animate-pulse'
            : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 shadow-sky-600/35 hover:shadow-2xl hover:scale-105'
        }`}
      >
        {/* Radar ping ring */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-400"></span>
        </span>

        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Mic className="w-4 h-4 text-white" />
        </div>

        <span className="hidden sm:inline font-semibold">Assistente por Voz</span>
        <span className="sm:hidden font-semibold">Voz</span>
      </button>
    </aside>
  );
};
