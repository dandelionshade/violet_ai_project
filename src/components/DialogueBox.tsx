/**
 * 原版风格对话框
 */

import React from 'react';

interface DialogueBoxProps {
  speakerName: string;
  narratorText: string;
  dialogueText: string;
  isTyping: boolean;
  onMessageChange: (value: string) => void;
  message: string;
  onSend: () => void;
  options: string[];
  onOptionClick: (option: string) => void;
  trust: number;
  affection: number;
  isGameOver: boolean;
  onRestart: () => void;
  onMenu: () => void;
  onSave: () => void;
  onArchive: () => void;
  isInputDisabled: boolean;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({
  speakerName,
  narratorText,
  dialogueText,
  isTyping,
  onMessageChange,
  message,
  onSend,
  options,
  onOptionClick,
  trust,
  affection,
  isGameOver,
  onRestart,
  onMenu,
  onSave,
  onArchive,
  isInputDisabled,
}) => {
  return (
    <>
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20 pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="text-[#d4af37] font-serif tracking-[0.3em] text-sm md:text-base drop-shadow-md">
            AUTO MEMORIES DOLL
          </div>
          <div className="text-white/50 font-serif tracking-widest text-xs uppercase">CH POSTAL COMPANY</div>
        </div>

        <div className="flex flex-col gap-4 pointer-events-auto">
          <div className="flex flex-col items-end gap-1">
            <div className="text-white/60 font-serif text-xs tracking-widest uppercase">Trust</div>
            <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-[#8b9dc3] transition-all duration-1000 ease-out" style={{ width: `${trust}%` }} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-white/60 font-serif text-xs tracking-widest uppercase">Affection</div>
            <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-[#d4af37] transition-all duration-1000 ease-out" style={{ width: `${affection}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div id="options-area" className="absolute right-[5%] md:right-[8%] bottom-[360px] flex flex-col items-end gap-4 transition-all duration-500 opacity-100 pointer-events-auto z-30 translate-x-0 max-h-[50vh] overflow-y-auto custom-scrollbar pr-4 pb-4 pt-4">
        {options.map(option => (
          <button
            key={option}
            onClick={() => onOptionClick(option)}
            className="bg-[#fdfbf7]/95 hover:bg-[#fdfbf7] border border-[#e2d5c5] hover:border-[#c5b39a] text-[#3e3222] px-6 py-4 transition-all duration-300 backdrop-blur-sm text-base md:text-lg tracking-wide shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_0_15px_rgba(197,179,154,0.5)] transform hover:-translate-x-2 font-serif text-right min-w-[250px] max-w-[450px] rounded-sm"
          >
            {option}
          </button>
        ))}
      </div>

      <div id="dialogue-container" className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px] h-[320px] z-20 transition-all duration-500">
        <div className="w-full h-full bg-[#fdfbf7]/95 backdrop-blur-sm border border-[#e2d5c5] p-8 md:p-10 pb-12 relative flex flex-col shadow-[2px_4px_20px_rgba(0,0,0,0.15)] rounded-sm">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#3e3222] text-[#f4ebd8] px-8 py-1.5 text-sm font-serif tracking-[0.3em] shadow-md border border-[#5a4a35] uppercase animate-name-tag">
            {speakerName}
          </div>

          {narratorText ? (
            <div className="font-serif text-base md:text-lg text-[#3e3222]/60 italic leading-[2.2] mt-2 tracking-wide pr-4 empty:hidden">{narratorText}</div>
          ) : null}

          <div id="dialogue-text" className={`font-serif text-lg md:text-xl text-[#3e3222] leading-[2.2] flex-1 overflow-y-auto custom-scrollbar mt-2 tracking-wide pr-4 ${isTyping ? 'cursor' : ''}`}>
            {dialogueText || '...'}
          </div>

          <div id="typing-indicator" className="absolute top-6 right-10 text-sm font-serif text-[#3e3222]/60 italic opacity-100 transition-opacity duration-300 flex items-center gap-2 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="origin-bottom-left" style={{ animation: 'sway 1.5s infinite ease-in-out' }}>
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
              <line x1="16" y1="8" x2="2" y2="22" />
              <line x1="17.5" y1="15" x2="9" y2="15" />
            </svg>
            <span className="tracking-widest">Drafting...</span>
          </div>

          <div className="mt-4 flex gap-4 items-center transition-opacity duration-300 border-t border-[#e2d5c5] pt-4">
            <input
              type="text"
              id="manual-input"
              value={message}
              onChange={e => onMessageChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onSend();
              }}
              className="flex-1 bg-transparent border-none px-2 py-2 text-[#3e3222] focus:outline-none font-serif placeholder-[#3e3222]/30 text-lg"
              placeholder="输入您的回复..."
              disabled={isInputDisabled}
            />
            <button
              id="send-btn"
              onClick={onSend}
              disabled={isInputDisabled}
              className="text-[#3e3222] hover:text-[#fdfbf7] hover:bg-[#3e3222] px-8 py-2 transition-all duration-300 font-serif tracking-[0.2em] text-sm border border-[#3e3222] rounded-sm"
            >
              SEND
            </button>
          </div>

          <div className="absolute bottom-3 right-10 flex gap-6 z-30">
            <button onClick={onSave} className="text-[#3e3222]/50 hover:text-[#3e3222] transition-colors text-xs font-sans tracking-widest">SAVE</button>
            <button onClick={onArchive} className="text-[#3e3222]/50 hover:text-[#3e3222] transition-colors text-xs font-sans tracking-widest">ARCHIVE</button>
            <button onClick={onRestart} className="text-[#3e3222]/50 hover:text-[#3e3222] transition-colors text-xs font-sans tracking-widest">RESTART</button>
            <button onClick={onMenu} className="text-[#3e3222]/50 hover:text-[#3e3222] transition-colors text-xs font-sans tracking-widest">TITLE</button>
          </div>

          {isGameOver ? (
            <div className="absolute inset-0 bg-black/92 rounded-sm flex items-center justify-center flex-col gap-8">
              <h2 className="text-5xl md:text-7xl font-serif text-[#d4af37] tracking-[0.3em] uppercase">Game Over</h2>
              <button onClick={onMenu} className="text-white/80 hover:text-white tracking-[0.2em] uppercase text-lg transition-all duration-300 border border-white/20 px-12 py-4 hover:bg-white/10">
                RETURN TO MENU
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default DialogueBox;