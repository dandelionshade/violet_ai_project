/**
 * React 组件：档案库 Modal (ArchiveModal.tsx)
 * 展示已解锁信件、便签和周目记忆。
 */

import React from 'react';
import { useGameStore } from '../store/gameStore';

interface ArchiveModalProps {
  onClose: () => void;
  onBackToMenu: () => void;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({ onClose, onBackToMenu }) => {
  const { letters, memories, unlockedCGs } = useGameStore(state => ({
    letters: state.letters,
    memories: state.memories,
    unlockedCGs: state.unlockedCGs,
  }));

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 opacity-100 pointer-events-auto transition-opacity duration-300 backdrop-blur-sm">
      <div className="bg-[#fdfbf7] border border-[#e2d5c5] p-10 flex flex-col gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-sm w-[960px] h-[760px] transform transition-transform duration-300 scale-100">
        <h3 className="text-2xl font-serif text-[#3e3222] tracking-[0.2em] text-center border-b border-[#e2d5c5] pb-4">
          LETTER ARCHIVE
        </h3>

        <div className="grid grid-cols-3 gap-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
          <section className="rounded-xl border border-[#e2d5c5] bg-[#fffdf8] p-4">
            <h4 className="mb-3 font-serif text-lg tracking-[0.15em] text-[#3e3222]">LETTERS</h4>
            <div className="space-y-3">
              {letters.length === 0 ? (
                <p className="text-sm text-[#7f6a52] opacity-60">暂无信件。游玩时选择“写一封信”相关选项会自动加入这里。</p>
              ) : (
                letters.map(letter => (
                  <article key={letter.id} className="rounded-lg bg-[#f4ebd8] p-3 text-sm text-[#3e3222]">
                    <div className="mb-2 flex items-center justify-between text-xs text-[#7f6a52]">
                      <span>{letter.date}</span>
                      <span>{letter.tags.join(', ')}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-6">{letter.content}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[#e2d5c5] bg-[#fffdf8] p-4">
            <h4 className="mb-3 font-serif text-lg tracking-[0.15em] text-[#3e3222]">MEMORIES</h4>
            <div className="space-y-3">
              {memories.length === 0 ? (
                <p className="text-sm text-[#7f6a52] opacity-60">暂无周目记忆。</p>
              ) : (
                memories.map(memory => (
                  <article key={memory.playerName} className="rounded-lg bg-[#f4ebd8] p-3 text-sm text-[#3e3222]">
                    <div className="mb-2 flex items-center justify-between text-xs text-[#7f6a52]">
                      <span>{memory.playerName}</span>
                      <span>Trust {memory.lastTrust}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-6">{memory.summary}</p>
                    <p className="mt-2 text-xs text-[#7f6a52]">NG+ {memory.unlockedNGPlus ? 'Unlocked' : 'Locked'}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[#e2d5c5] bg-[#fffdf8] p-4">
            <h4 className="mb-3 font-serif text-lg tracking-[0.15em] text-[#3e3222]">CG GALLERY</h4>
            <div className="rounded-lg bg-[#f4ebd8] p-3 text-sm text-[#3e3222]">
              <p className="mb-2">已解锁 CG 数量</p>
              <p className="text-3xl font-serif text-[#d4af37]">{unlockedCGs.length}</p>
              <p className="mt-3 text-xs text-[#7f6a52]">当前版本先保留统计视图，后续可接入缩略图网格。</p>
            </div>
          </section>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={onClose}
            className="text-[#3e3222] hover:text-[#fdfbf7] hover:bg-[#3e3222] px-8 py-3 transition-all duration-300 font-serif tracking-[0.2em] text-sm border border-[#3e3222] rounded-sm text-center w-40"
          >
            CLOSE
          </button>
          <button
            onClick={onBackToMenu}
            className="text-[#fdfbf7] bg-[#3e3222] hover:bg-[#5a4a35] px-8 py-3 transition-all duration-300 font-serif tracking-[0.2em] text-sm border border-[#3e3222] rounded-sm text-center w-40"
          >
            TITLE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveModal;
