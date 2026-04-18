import test from 'node:test';
import assert from 'node:assert/strict';

const memoryStorage = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStorage.set(key, value);
  },
  removeItem: (key: string) => {
    memoryStorage.delete(key);
  },
  clear: () => {
    memoryStorage.clear();
  },
  key: (index: number) => {
    return Array.from(memoryStorage.keys())[index] ?? null;
  },
  get length() {
    return memoryStorage.size;
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

const { useGameStore } = await import('../../src/store/gameStore');

function resetStore() {
  useGameStore.setState({
    currentState: {
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
    },
    slots: [],
    letters: [],
    memories: [],
    unlockedCGs: [],
    audioSettings: {
      isVoiceEnabled: true,
      isAmbientEnabled: true,
      isBgmEnabled: true,
      isTypeSoundEnabled: true,
      voiceVolume: 1,
      ambientVolume: 0.3,
      bgmVolume: 0.2,
      typeSoundVolume: 0.1,
    },
    uiState: {
      currentLanguage: 'zh',
      isConfigModalOpen: false,
      isSaveLoadModalOpen: false,
      isArchiveModalOpen: false,
    },
  } as any);
}

test('gameStore save/load slot should deep clone state', () => {
  resetStore();
  const store = useGameStore.getState();

  const state = { ...store.currentState, trust: 55 };
  store.saveToSlot(1, state);

  const loaded = store.loadFromSlot(1);
  assert.ok(loaded);
  assert.equal(loaded!.trust, 55);

  loaded!.trust = 99;
  const loadedAgain = store.loadFromSlot(1);
  assert.equal(loadedAgain!.trust, 55);
});

test('gameStore updateGameState should patch fields', () => {
  resetStore();
  const store = useGameStore.getState();

  store.updateGameState({ trust: 40, affection: 70 });

  const next = useGameStore.getState().currentState;
  assert.equal(next.trust, 40);
  assert.equal(next.affection, 70);
  assert.equal(next.storyPhase, 1);
});

test('gameStore saveMemory should preserve unlockedNGPlus once true', () => {
  resetStore();
  const store = useGameStore.getState();

  store.saveMemory('violet', 'first', 20, true);
  store.saveMemory('violet', 'second', 30, false);

  const memory = store.getMemory('violet');
  assert.ok(memory);
  assert.equal(memory!.summary, 'second');
  assert.equal(memory!.unlockedNGPlus, true);
});
