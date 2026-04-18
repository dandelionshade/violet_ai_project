/**
 * React 组件：游戏主界面 (GameUI.tsx)
 * 提供最小可玩闭环：开场对白、文本输入、选项发送、后端回包或本地 fallback。
 */

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GameState } from '../types/game';
import SaveLoadModal from './SaveLoadModal';
import ArchiveModal from './ArchiveModal';
import DialogueBox from './DialogueBox';
import { AudioManager } from '../core/AudioManager';
import { GAME_ASSETS } from '../gameAssets';

const Live2DStage = React.lazy(() => import('./Live2DStage'));

interface GameUIProps {
  onBackToMenu: () => void;
}

type ChatResponseLike = Partial<GameState> & {
  reply_zh?: string;
  reply_ja?: string;
  reply_en?: string;
  suggested_options_zh?: string[];
  suggested_options_ja?: string[];
  suggested_options_en?: string[];
  resonance_change?: number;
  favorability_change?: number;
  memory_summary?: string;
};

const CG_LIBRARY: Record<string, string> = {
  cg_writing: 'https://picsum.photos/seed/violet_typewriter/1920/1080?blur=1',
  cg_sunset: 'https://picsum.photos/seed/violet_sunset/1920/1080',
  cg_tears: 'https://picsum.photos/seed/violet_tears/1920/1080',
  cg_smile: 'https://picsum.photos/seed/violet_smile/1920/1080',
};

function getLocalizedText(
  state: GameState,
  language: 'zh' | 'ja' | 'en',
  fallback = '...'
) {
  if (language === 'zh') return state.reply_zh || state.reply || fallback;
  if (language === 'ja') return state.reply_ja || state.reply || fallback;
  return state.reply_en || state.reply || fallback;
}

function getLocalizedOptions(
  state: GameState,
  language: 'zh' | 'ja' | 'en'
) {
  if (language === 'zh') return state.suggested_options_zh || state.suggested_options || [];
  if (language === 'ja') return state.suggested_options_ja || state.suggested_options || [];
  return state.suggested_options_en || state.suggested_options || [];
}

function getLocalizedNarrator(
  state: GameState,
  language: 'zh' | 'ja' | 'en'
) {
  if (language === 'zh') return state.narrator_text_zh || '';
  if (language === 'ja') return state.narrator_text_ja || '';
  return state.narrator_text_en || '';
}

function createOpeningState(isNGPlus: boolean, affection: number): Partial<GameState> {
  const hasHighAffinity = isNGPlus && affection >= 50;

  return {
    reply_zh: hasHighAffinity
      ? '如果客户有要求，无论身在何处都会赶来。自动手记人偶服务，薇尔莉特·伊芙加登。……啊，是您。很高兴能再次见到您。请问今天有什么我可以为您效劳的吗？'
      : '如果客户有要求，无论身在何处都会赶来。自动手记人偶服务，薇尔莉特·伊芙加登。请问，您有什么需要代笔的信件或烦恼吗？',
    reply_ja: hasHighAffinity
      ? 'お客様がお望みならどこでも駆けつけます。自動手記人形サービス、ヴァイオレット・エヴァーガーデンです。……あ、あなた様ですね。またお会いできて光栄です。本日はどのようなご用命でしょうか？'
      : 'お客様がお望みならどこでも駆けつけます。自動手記人形サービス、ヴァイオレット・エヴァーガーデンです。何か代筆のご要望やお悩みはございますか？',
    reply_en: hasHighAffinity
      ? 'If a client requests it, I shall travel anywhere. Auto Memories Doll service, Violet Evergarden. ...Ah, it is you. It is an honor to see you again. How may I be of service to you today?'
      : 'If a client requests it, I shall travel anywhere. Auto Memories Doll service, Violet Evergarden. Do you have any letters you need ghostwritten or any troubles you would like to share?',
    emotion: hasHighAffinity ? 'smile' : 'neutral',
    reply: hasHighAffinity
      ? '如果客户有要求，无论身在何处都会赶来。自动手记人偶服务，薇尔莉特·伊芙加登。……啊，是您。很高兴能再次见到您。请问今天有什么我可以为您效劳的吗？'
      : '如果客户有要求，无论身在何处都会赶来。自动手记人偶服务，薇尔莉特·伊芙加登。请问，您有什么需要代笔的信件或烦恼吗？',
    suggested_options_zh: ['我想写一封信。', '我有些烦恼想倾诉。', '离开邮局'],
    suggested_options_ja: ['手紙を書きたいです。', '少し悩みを聞いてほしい。', '郵便局を出る'],
    suggested_options_en: ['I want to write a letter.', 'I have some troubles to share.', 'Leave the post office'],
    suggested_options: ['我想写一封信。', '我有些烦恼想倾诉。', '离开邮局'],
    turn_count: 2,
    storyPhase: 2,
    chatHistory: [
      { role: 'user', parts: [{ text: '你好' }] },
      { role: 'model', parts: [{ text: 'opening line' }] },
    ],
    openAiHistory: [
      { role: 'system', content: 'opening line' },
      { role: 'user', content: '你好' },
      { role: 'assistant', content: 'opening line' },
    ],
    isGameOver: false,
    gameOverType: '',
    ready_to_draft: false,
    refusal: false,
  };
}

function buildFallbackResponse(message: string, state: GameState): ChatResponseLike {
  const lower = message.trim();
  const isExit = lower.includes('离开邮局') || lower.toLowerCase().includes('leave');

  if (isExit) {
    return {
      reply_zh: '那么，今天就先到这里吧。请保重。',
      reply_ja: 'では、今日はここまでにしましょう。どうかお気をつけて。',
      reply_en: 'Then let us end here for today. Please take care.',
      emotion: 'sad',
      reply: '那么，今天就先到这里吧。请保重。',
      suggested_options_zh: [],
      suggested_options_ja: [],
      suggested_options_en: [],
      suggested_options: [],
      isGameOver: true,
      gameOverType: 'normal_ending',
      turn_count: state.turn_count + 1,
      storyPhase: state.storyPhase + 1,
      trust: state.trust,
      affection: state.affection,
      chatHistory: [...state.chatHistory, { role: 'user', parts: [{ text: message }] }],
      openAiHistory: [...state.openAiHistory, { role: 'user', content: message }],
    };
  }

  const responseTextZh = `我明白了。关于「${message}」，我会认真倾听。请继续告诉我。`;
  const responseTextJa = `承知しました。「${message}」について、真摯にお話を伺います。どうぞ続けてください。`;
  const responseTextEn = `I understand. Regarding "${message}", I will listen carefully. Please continue.`;

  return {
    reply_zh: responseTextZh,
    reply_ja: responseTextJa,
    reply_en: responseTextEn,
    emotion: 'thoughtful',
    reply: responseTextZh,
    suggested_options_zh: ['我还想继续说。', '请帮我写一封信。', '离开邮局'],
    suggested_options_ja: ['まだ話したいです。', '手紙を書いてください。', '郵便局を出る'],
    suggested_options_en: ['I would like to keep talking.', 'Please help me write a letter.', 'Leave the post office'],
    suggested_options: ['我还想继续说。', '请帮我写一封信。', '离开邮局'],
    resonance_change: 0,
    favorability_change: 0,
    ready_to_draft: false,
    refusal: false,
    isGameOver: false,
    gameOverType: '',
    turn_count: state.turn_count + 1,
    storyPhase: state.storyPhase + 1,
    trust: state.trust,
    affection: state.affection,
    chatHistory: [...state.chatHistory, { role: 'user', parts: [{ text: message }] }],
    openAiHistory: [...state.openAiHistory, { role: 'user', content: message }],
  };
}

function getBackgroundUrl(state: GameState) {
  if (state.isGameOver) return 'https://picsum.photos/seed/evening/1920/1080?blur=2';
  if (state.turn_count >= 2) return 'https://picsum.photos/seed/rainy/1920/1080?blur=2';
  return GAME_ASSETS.bg;
}

const GameUI: React.FC<GameUIProps> = ({ onBackToMenu }) => {
  const { currentState, updateGameState, uiState, updateUIState, audioSettings } = useGameStore(state => ({
    currentState: state.currentState,
    updateGameState: state.updateGameState,
    uiState: state.uiState,
    updateUIState: state.updateUIState,
    audioSettings: state.audioSettings,
  }));

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [displayedDialogue, setDisplayedDialogue] = useState('...');
  const [displayedNarrator, setDisplayedNarrator] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sceneLabel, setSceneLabel] = useState('');
  const [sceneTransitionVisible, setSceneTransitionVisible] = useState(false);
  const initializedRef = React.useRef(false);
  const audioRef = useRef(
    new AudioManager(GAME_ASSETS.typeSound, GAME_ASSETS.ambientSound, GAME_ASSETS.bgm)
  );
  const audioPrimedRef = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const language = uiState.currentLanguage;

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (currentState.turn_count === 1 && currentState.reply === '...') {
      updateGameState(createOpeningState(Boolean(currentState.isNGPlus), currentState.affection));
    }
  }, [currentState.affection, currentState.isNGPlus, currentState.reply, currentState.turn_count, updateGameState]);

  const currentDialogue = useMemo(() => getLocalizedText(currentState, language), [currentState, language]);
  const currentOptions = useMemo(() => getLocalizedOptions(currentState, language), [currentState, language]);
  const currentNarrator = useMemo(() => getLocalizedNarrator(currentState, language), [currentState, language]);

  useEffect(() => {
    if (currentState.turn_count === 1 && currentState.reply === '...') return;

    let cancelled = false;
    let frameId = 0;
    let index = 0;
    const nextText = currentDialogue || '...';

    setDisplayedNarrator(currentNarrator);
    setDisplayedDialogue('');
    setIsTyping(true);

    const tick = () => {
      if (cancelled) return;
      index += 1;
      setDisplayedDialogue(nextText.slice(0, index));
      if (index < nextText.length) {
        if (nextText[index - 1] !== ' ') {
          audioRef.current.playTypeSound();
        }
        frameId = window.setTimeout(tick, 18);
      } else {
        setIsTyping(false);
      }
    };

    frameId = window.setTimeout(tick, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(frameId);
    };
  }, [currentDialogue, currentNarrator, currentState.reply, currentState.storyPhase, currentState.turn_count, language]);

  useEffect(() => {
    const manager = audioRef.current;
    manager.toggleVoice(audioSettings.isVoiceEnabled);
    manager.toggleAmbient(audioSettings.isAmbientEnabled);
    manager.toggleBGM(audioSettings.isBgmEnabled);
    manager.toggleTypeSound(audioSettings.isTypeSoundEnabled);
    manager.setVoiceVolume(audioSettings.voiceVolume);
    manager.setAmbientVolume(audioSettings.ambientVolume);
    manager.setBgmVolume(audioSettings.bgmVolume);
    manager.setTypeSoundVolume(audioSettings.typeSoundVolume);
  }, [audioSettings]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      activeRequestRef.current?.abort();
      audioRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (currentState.isGameOver) {
      setSceneLabel('Evening');
      setSceneTransitionVisible(true);
      const timeoutId = window.setTimeout(() => setSceneTransitionVisible(false), 1400);
      return () => window.clearTimeout(timeoutId);
    }

    if (currentState.turn_count >= 2) {
      setSceneLabel('Rainy Day');
      setSceneTransitionVisible(true);
      const timeoutId = window.setTimeout(() => setSceneTransitionVisible(false), 1400);
      return () => window.clearTimeout(timeoutId);
    }

    setSceneLabel('Post Office');
    setSceneTransitionVisible(true);
    const timeoutId = window.setTimeout(() => setSceneTransitionVisible(false), 800);
    return () => window.clearTimeout(timeoutId);
  }, [currentState.isGameOver, currentState.turn_count]);

  const primeAudio = async () => {
    if (audioPrimedRef.current) return;
    await audioRef.current.unlockAudio();
    audioRef.current.playAmbient();
    audioRef.current.playBGM();
    audioPrimedRef.current = true;
  };

  const sendMessage = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    void primeAudio();

    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ message: trimmed, state: currentState }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as ChatResponseLike;
      updateGameState({
        ...currentState,
        ...data,
        reply: data.reply_zh || data.reply || currentState.reply,
        suggested_options: data.suggested_options_zh || data.suggested_options || [],
        suggested_options_zh: data.suggested_options_zh || data.suggested_options || [],
        suggested_options_ja: data.suggested_options_ja || data.suggested_options || [],
        suggested_options_en: data.suggested_options_en || data.suggested_options || [],
        chatHistory: data.chatHistory || currentState.chatHistory,
        openAiHistory: data.openAiHistory || currentState.openAiHistory,
        turn_count: data.turn_count ?? currentState.turn_count + 1,
        storyPhase: data.storyPhase ?? currentState.storyPhase + 1,
        isGameOver: data.isGameOver ?? false,
        gameOverType: data.gameOverType,
      });

      if (/信|letter|手紙/i.test(trimmed)) {
        useGameStore.getState().saveLetter(
          `${data.reply_zh || data.reply || '一封信件草稿'}\n\n${trimmed}`,
          ['draft', language]
        );
      }
      if (mountedRef.current) setInput('');
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      console.warn('[GameUI] Falling back to local response:', error);
      const fallback = buildFallbackResponse(trimmed, currentState);
      updateGameState({
        ...currentState,
        ...fallback,
        reply: fallback.reply_zh || fallback.reply || currentState.reply,
        suggested_options: fallback.suggested_options_zh || fallback.suggested_options || [],
        suggested_options_zh: fallback.suggested_options_zh || fallback.suggested_options || [],
        suggested_options_ja: fallback.suggested_options_ja || fallback.suggested_options || [],
        suggested_options_en: fallback.suggested_options_en || fallback.suggested_options || [],
        chatHistory: fallback.chatHistory || currentState.chatHistory,
        openAiHistory: fallback.openAiHistory || currentState.openAiHistory,
        turn_count: fallback.turn_count ?? currentState.turn_count + 1,
        storyPhase: fallback.storyPhase ?? currentState.storyPhase + 1,
        isGameOver: fallback.isGameOver ?? false,
        gameOverType: fallback.gameOverType,
      });

      if (/信|letter|手紙/i.test(trimmed)) {
        useGameStore.getState().saveLetter(
          `${fallback.reply_zh || fallback.reply || '一封信件草稿'}\n\n${trimmed}`,
          ['draft', language]
        );
      }
      if (mountedRef.current) setInput('');
    } finally {
      window.clearTimeout(timeoutId);
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
      if (mountedRef.current) setIsSending(false);
    }
  };

  const handleOptionClick = (option: string) => {
    void primeAudio();
    setInput(option);
    void sendMessage(option);
  };

  const handleRestart = () => {
    updateUIState({ currentLanguage: 'zh' });
    updateUIState({ isSaveLoadModalOpen: false, isArchiveModalOpen: false, isConfigModalOpen: false });
    useGameStore.getState().resetGameState();
    initializedRef.current = false;
    setDisplayedDialogue('...');
    setDisplayedNarrator('');
    setInput('');
    audioRef.current.stopVoice();
    audioRef.current.stopSystemVoice();
  };

  const handleSaveSnapshot = () => {
    void primeAudio();
    useGameStore.getState().saveToSlot(1, currentState);
    updateUIState({ isSaveLoadModalOpen: true });
  };

  const handleArchiveOpen = () => {
    void primeAudio();
    updateUIState({ isArchiveModalOpen: true });
  };

  const handleBackToMenu = () => {
    audioRef.current.stopAmbient();
    audioRef.current.stopBGM();
    audioRef.current.stopVoice();
    audioRef.current.stopSystemVoice();
    updateUIState({ isSaveLoadModalOpen: false, isArchiveModalOpen: false, isConfigModalOpen: false });
    onBackToMenu();
  };

  const trust = Math.max(0, Math.min(100, currentState.trust ?? 10));
  const affection = Math.max(0, Math.min(100, currentState.affection ?? 10));
  const backgroundUrl = getBackgroundUrl(currentState);
  const cgUrl = currentState.trigger_cg ? CG_LIBRARY[currentState.trigger_cg] : '';
  const backgroundEffectClass =
    currentState.emotion === 'smile'
      ? 'bg-effect-happy'
      : currentState.emotion === 'sad' || currentState.emotion === 'crying'
        ? 'bg-effect-sad'
        : currentState.emotion === 'angry'
          ? 'bg-effect-angry'
          : '';

  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-black text-white selection:bg-[#d4af37] selection:text-black font-sans">
      <div
        id="bg-image"
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-80"
        style={{ backgroundImage: `url('${backgroundUrl}')` }}
      />
      <div id="bg-effect-layer" className={`absolute inset-0 pointer-events-none z-10 transition-colors duration-1000 ${backgroundEffectClass}`} />
      {cgUrl ? <div id="cg-layer" className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-60 z-15 pointer-events-none" style={{ backgroundImage: `url('${cgUrl}')` }} /> : null}

      {sceneTransitionVisible ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 backdrop-blur-[1px] transition-opacity duration-700">
          <div className="rounded-full border border-[#d4af37]/30 bg-black/50 px-8 py-4 font-serif text-sm tracking-[0.4em] text-[#f3dfb0] shadow-[0_0_30px_rgba(212,175,55,0.18)] uppercase">
            {sceneLabel}
          </div>
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="absolute top-4 left-4 z-35 flex items-center gap-3">
          <div className="rounded border border-white/15 bg-black/45 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-white/65">
            {isSending ? 'Thinking...' : 'Ready'}
          </div>
          <div className="rounded border border-white/15 bg-black/45 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-white/65">
            {language.toUpperCase()}
          </div>
        </div>

        <div className="absolute top-4 right-4 z-35 flex items-center gap-2">
          <button
            onClick={handleBackToMenu}
            className="rounded border border-white/20 bg-black/45 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/70 transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
          >
            Return Title
          </button>
        </div>

        <Suspense
          fallback={
            <div className="absolute bottom-0 left-[40%] -translate-x-1/2 w-200 h-[95vh] pointer-events-none z-0 flex justify-center items-end">
              <div className="absolute inset-0 w-full h-full bg-contain bg-no-repeat bg-bottom opacity-100 transition-opacity duration-1000 drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                style={{ backgroundImage: `url('${GAME_ASSETS.spriteNeutral}')` }}
              />
            </div>
          }
        >
          <Live2DStage emotion={currentState.emotion || 'neutral'} />
        </Suspense>

        <DialogueBox
          speakerName="Violet Evergarden"
          narratorText={displayedNarrator}
          dialogueText={displayedDialogue}
          isTyping={isTyping}
          onMessageChange={setInput}
          message={input}
          onSend={() => void sendMessage(input)}
          options={currentOptions.slice(0, 3)}
          onOptionClick={handleOptionClick}
          trust={trust}
          affection={affection}
          isGameOver={Boolean(currentState.isGameOver)}
          onRestart={handleRestart}
          onMenu={handleBackToMenu}
          onSave={handleSaveSnapshot}
          onArchive={handleArchiveOpen}
          isInputDisabled={isSending || Boolean(currentState.isGameOver)}
        />
      </div>

      {uiState.isSaveLoadModalOpen && (
        <SaveLoadModal
          onClose={() => updateUIState({ isSaveLoadModalOpen: false })}
          onBackToMenu={handleBackToMenu}
        />
      )}
      {uiState.isArchiveModalOpen && (
        <ArchiveModal
          onClose={() => updateUIState({ isArchiveModalOpen: false })}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
};

export default GameUI;