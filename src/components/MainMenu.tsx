/**
 * React 组件：主菜单 (MainMenu.tsx)
 * 这是从 Vanilla TS 的 renderMainMenu() 迁移的第一个试点组件
 * 
 * 功能：
 * - 新游戏 / 新游戏+ / 继续
 * - 读档 / 存档
 * - 档案库
 * - 配置
 */

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import ConfigModal from './ConfigModal';
import SaveLoadModal from './SaveLoadModal';
import ArchiveModal from './ArchiveModal';

interface MainMenuProps {
  onNewGame: (isNGPlus: boolean) => void;
  onContinue: () => void;
  onExit: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onNewGame, onContinue, onExit }) => {
  const { currentState, uiState, updateUIState, memories, slots } = useGameStore(
    state => ({
      currentState: state.currentState,
      uiState: state.uiState,
      updateUIState: state.updateUIState,
      memories: state.memories,
      slots: state.slots,
    })
  );

  const hasSave = slots.length > 0 || (currentState && !currentState.isGameOver && currentState.turn_count > 1);
  const hasNGPlus = memories.some(m => m.unlockedNGPlus);

  const handleNewGame = () => {
    onNewGame(false);
  };

  const handleNewGamePlus = () => {
    onNewGame(true);
  };

  const handleExit = () => {
    const overlay = document.getElementById('exit-overlay');
    if (overlay) {
      overlay.classList.replace('opacity-0', 'opacity-100');
      overlay.classList.replace('pointer-events-none', 'pointer-events-auto');
    }
    setTimeout(() => onExit(), 1000);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans selection:bg-[#d4af37] selection:text-black">
      {/* 背景 */}
      <div className="absolute inset-0 bg-cover bg-center opacity-60 transition-opacity duration-1000 scale-105 animate-pulse-slow"
        style={{
          backgroundImage: 'url(/assets/images/title-bg.jpg)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />

      {/* 菜单区域 */}
      <div className="absolute left-[8%] md:left-[12%] top-1/2 -translate-y-1/2 flex flex-col z-10">
        <h1 className="text-6xl md:text-8xl font-serif text-[#d4af37] tracking-[0.2em] mb-2 drop-shadow-[0_0_20px_rgba(212,175,55,0.6)]">
          Violet AI
        </h1>
        <p className="text-xl md:text-2xl font-serif text-white/60 tracking-[0.4em] mb-16 uppercase">
          Auto Memories Doll
        </p>

        <div className="flex flex-col gap-8 items-start">
          {/* 新游戏 */}
          <button
            onClick={handleNewGame}
            className="text-2xl md:text-3xl font-serif tracking-[0.3em] text-white/80 hover:text-[#d4af37] hover:translate-x-6 transition-all duration-500 drop-shadow-lg flex items-center gap-4 group"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#d4af37]">▶</span>
            NEW GAME
          </button>

          {/* 新游戏+ */}
          {hasNGPlus && (
            <button
              onClick={handleNewGamePlus}
              className="text-2xl md:text-3xl font-serif tracking-[0.3em] text-[#d4af37] hover:text-white hover:translate-x-6 transition-all duration-500 drop-shadow-[0_0_10px_rgba(212,175,55,0.8)] flex items-center gap-4 group"
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white">▶</span>
              NEW GAME+
            </button>
          )}

          {/* 继续 */}
          <button
            onClick={onContinue}
            disabled={!hasSave}
            className={`text-2xl md:text-3xl font-serif tracking-[0.3em] ${
              hasSave
                ? 'text-white/80 hover:text-[#d4af37] hover:translate-x-6 group'
                : 'text-white/20 cursor-not-allowed'
            } transition-all duration-500 drop-shadow-lg flex items-center gap-4`}
          >
            <span className={`opacity-0 ${hasSave ? 'group-hover:opacity-100' : ''} transition-opacity text-[#d4af37]`}>
              ▶
            </span>
            CONTINUE
          </button>

          {/* 读档 */}
          <button
            onClick={() => updateUIState({ isSaveLoadModalOpen: true })}
            className="text-2xl md:text-3xl font-serif tracking-[0.3em] text-white/80 hover:text-[#d4af37] hover:translate-x-6 transition-all duration-500 drop-shadow-lg flex items-center gap-4 group"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#d4af37]">▶</span>
            LOAD
          </button>

          {/* 档案库 */}
          <button
            onClick={() => updateUIState({ isArchiveModalOpen: true })}
            className="text-2xl md:text-3xl font-serif tracking-[0.3em] text-white/80 hover:text-[#d4af37] hover:translate-x-6 transition-all duration-500 drop-shadow-lg flex items-center gap-4 group"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#d4af37]">▶</span>
            ARCHIVE
          </button>

          {/* 配置 */}
          <button
            onClick={() => updateUIState({ isConfigModalOpen: true })}
            className="text-2xl md:text-3xl font-serif tracking-[0.3em] text-white/80 hover:text-[#d4af37] hover:translate-x-6 transition-all duration-500 drop-shadow-lg flex items-center gap-4 group"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#d4af37]">▶</span>
            CONFIG
          </button>

          {/* 退出 */}
          <button
            onClick={handleExit}
            className="text-2xl md:text-3xl font-serif tracking-[0.3em] text-white/80 hover:text-[#d4af37] hover:translate-x-6 transition-all duration-500 drop-shadow-lg flex items-center gap-4 group"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#d4af37]">▶</span>
            EXIT
          </button>
        </div>
      </div>

      {/* Modal 组件 */}
      {uiState.isConfigModalOpen && (
        <ConfigModal onClose={() => updateUIState({ isConfigModalOpen: false })} />
      )}
      {uiState.isSaveLoadModalOpen && (
        <SaveLoadModal onClose={() => updateUIState({ isSaveLoadModalOpen: false })} />
      )}
      {uiState.isArchiveModalOpen && (
        <ArchiveModal onClose={() => updateUIState({ isArchiveModalOpen: false })} />
      )}

      {/* 退出遮罩 */}
      <div
        id="exit-overlay"
        className="absolute inset-0 bg-black z-50 opacity-0 pointer-events-none transition-opacity duration-1000 flex items-center justify-center"
      >
        <p className="text-white/50 font-serif tracking-widest text-xl">You can close the tab now.</p>
      </div>
    </div>
  );
};

export default MainMenu;
