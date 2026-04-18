/**
 * Zustand 游戏状态管理
 * 中心化的全局状态管理，替代分散的 StateManager
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { GameState, Letter, SaveSlot, PlayerMemory } from '../types/game';

interface GameStore {
  // ===== 游戏主状态 =====
  currentState: GameState;
  updateGameState: (state: Partial<GameState>) => void;
  resetGameState: () => void;

  // ===== 存档管理 =====
  slots: SaveSlot[];
  saveToSlot: (slotId: number, state: GameState) => void;
  loadFromSlot: (slotId: number) => GameState | null;
  deleteSlot: (slotId: number) => void;

  // ===== 信件库 =====
  letters: Letter[];
  saveLetter: (content: string, tags?: string[]) => void;
  getLetters: () => Letter[];

  // ===== 跨周目记忆 =====
  memories: PlayerMemory[];
  saveMemory: (playerName: string, summary: string, trust: number, unlockedNGPlus?: boolean) => void;
  getMemory: (playerName: string) => PlayerMemory | null;

  // ===== 音频状态 =====
  audioSettings: {
    isVoiceEnabled: boolean;
    isAmbientEnabled: boolean;
    isBgmEnabled: boolean;
    isTypeSoundEnabled: boolean;
    voiceVolume: number;
    ambientVolume: number;
    bgmVolume: number;
    typeSoundVolume: number;
  };
  updateAudioSettings: (settings: Partial<GameStore['audioSettings']>) => void;

  // ===== UI 状态 =====
  uiState: {
    currentLanguage: 'zh' | 'ja' | 'en';
    isConfigModalOpen: boolean;
    isSaveLoadModalOpen: boolean;
    isArchiveModalOpen: boolean;
  };
  updateUIState: (state: Partial<GameStore['uiState']>) => void;

  // ===== CG 画廊 =====
  unlockedCGs: string[];
  unlockCG: (cgId: string) => void;
}

// 初始游戏状态
const initialGameState: GameState = {
  turn_count: 1,
  storyPhase: 1,
  chatHistory: [],
  openAiHistory: [],
  emotion: 'neutral',
  reply: '...',
  suggested_options: [],
  isGameOver: false,
  playerName: undefined,
  trust: 10,
  affection: 10,
  prop: undefined,
  isNGPlus: false,
};

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ===== 游戏主状态 =====
        currentState: initialGameState,
        updateGameState: (state: Partial<GameState>) => {
          set(prev => ({
            currentState: { ...prev.currentState, ...state },
          }));
        },
        resetGameState: () => {
          set({ currentState: initialGameState });
        },

        // ===== 存档管理 =====
        slots: [],
        saveToSlot: (slotId: number, state: GameState) => {
          set(prev => {
            const slots = [...prev.slots];
            const existingIndex = slots.findIndex(s => s.id === slotId);
            const newSlot: SaveSlot = {
              id: slotId,
              date: new Date().toLocaleString('zh-CN', { hour12: false }),
              state: JSON.parse(JSON.stringify(state)),
            };

            if (existingIndex >= 0) {
              slots[existingIndex] = newSlot;
            } else {
              slots.push(newSlot);
            }

            return { slots };
          });
        },
        loadFromSlot: (slotId: number): GameState | null => {
          const slot = get().slots.find(s => s.id === slotId);
          return slot ? JSON.parse(JSON.stringify(slot.state)) : null;
        },
        deleteSlot: (slotId: number) => {
          set(prev => ({
            slots: prev.slots.filter(s => s.id !== slotId),
          }));
        },

        // ===== 信件库 =====
        letters: [],
        saveLetter: (content: string, tags: string[] = []) => {
          set(prev => ({
            letters: [
              ...prev.letters,
              {
                id: Date.now().toString(),
                date: new Date().toLocaleString('zh-CN', { hour12: false }),
                content,
                tags,
              },
            ],
          }));
        },
        getLetters: () => get().letters,

        // ===== 跨周目记忆 =====
        memories: [],
        saveMemory: (playerName: string, summary: string, trust: number, unlockedNGPlus = false) => {
          set(prev => {
            const existingIndex = prev.memories.findIndex(m => m.playerName === playerName);
            let isNGPlus = unlockedNGPlus;

            if (existingIndex >= 0 && prev.memories[existingIndex].unlockedNGPlus) {
              isNGPlus = true;
            }

            const newMemory: PlayerMemory = { playerName, summary, lastTrust: trust, unlockedNGPlus: isNGPlus };
            const memories = [...prev.memories];

            if (existingIndex >= 0) {
              memories[existingIndex] = newMemory;
            } else {
              memories.push(newMemory);
            }

            return { memories };
          });
        },
        getMemory: (playerName: string) => {
          return get().memories.find(m => m.playerName === playerName) || null;
        },

        // ===== 音频状态 =====
        audioSettings: {
          isVoiceEnabled: true,
          isAmbientEnabled: true,
          isBgmEnabled: true,
          isTypeSoundEnabled: true,
          voiceVolume: 1.0,
          ambientVolume: 0.3,
          bgmVolume: 0.2,
          typeSoundVolume: 0.1,
        },
        updateAudioSettings: (settings: Partial<GameStore['audioSettings']>) => {
          set(prev => ({
            audioSettings: { ...prev.audioSettings, ...settings },
          }));
        },

        // ===== UI 状态 =====
        uiState: {
          currentLanguage: 'zh',
          isConfigModalOpen: false,
          isSaveLoadModalOpen: false,
          isArchiveModalOpen: false,
        },
        updateUIState: (state: Partial<GameStore['uiState']>) => {
          set(prev => ({
            uiState: { ...prev.uiState, ...state },
          }));
        },

        // ===== CG 画廊 =====
        unlockedCGs: [],
        unlockCG: (cgId: string) => {
          set(prev => {
            if (!prev.unlockedCGs.includes(cgId)) {
              return { unlockedCGs: [...prev.unlockedCGs, cgId] };
            }
            return prev;
          });
        },
      }),
      {
        name: 'violet-game-store',
        version: 1,
      }
    )
  )
);
