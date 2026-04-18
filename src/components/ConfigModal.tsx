/**
 * React 组件：配置 Modal (ConfigModal.tsx)
 * 处理音频、语言、调试设置
 */

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface ConfigModalProps {
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ onClose }) => {
  const { audioSettings, uiState, updateAudioSettings, updateUIState, currentState } = useGameStore(
    state => ({
      audioSettings: state.audioSettings,
      uiState: state.uiState,
      updateAudioSettings: state.updateAudioSettings,
      updateUIState: state.updateUIState,
      currentState: state.currentState,
    })
  );

  const [showDebug, setShowDebug] = useState(false);
  const [debugAffection, setDebugAffection] = useState(currentState.affection);

  const handleLanguageChange = (lang: 'zh' | 'ja' | 'en') => {
    updateUIState({ currentLanguage: lang });
  };

  const handleAudioToggle = (key: keyof typeof audioSettings) => {
    updateAudioSettings({ [key]: !audioSettings[key as any] });
  };

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 opacity-100 pointer-events-auto transition-opacity duration-300 backdrop-blur-sm">
      <div className="bg-[#fdfbf7] border border-[#e2d5c5] p-10 flex flex-col gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-sm min-w-[400px] transform transition-transform duration-300 scale-100">
        <h3 className="text-2xl font-serif text-[#3e3222] tracking-[0.2em] text-center border-b border-[#e2d5c5] pb-4">
          CONFIGURATION
        </h3>

        <div className="flex flex-col gap-6">
          {/* 语言选择 */}
          <div className="flex justify-between items-center">
            <span className="font-serif text-[#3e3222] tracking-widest text-lg">LANGUAGE</span>
            <select
              value={uiState.currentLanguage}
              onChange={e => handleLanguageChange(e.target.value as 'zh' | 'ja' | 'en')}
              className="text-[#fdfbf7] bg-[#3e3222] border border-[#3e3222] px-4 py-1 text-sm font-sans tracking-widest hover:bg-[#5a4a35] transition-colors w-32 text-center outline-none cursor-pointer"
            >
              <option value="zh">中文 (ZH)</option>
              <option value="ja">日本語 (JA)</option>
              <option value="en">ENGLISH (EN)</option>
            </select>
          </div>

          {/* 环境音 */}
          <div className="flex justify-between items-center">
            <span className="font-serif text-[#3e3222] tracking-widest text-lg">AMBIENT (RAIN)</span>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audioSettings.ambientVolume}
                onChange={e => updateAudioSettings({ ambientVolume: parseFloat(e.target.value) })}
                className="w-24 accent-[#3e3222]"
              />
              <button
                onClick={() => handleAudioToggle('isAmbientEnabled')}
                className="text-[#fdfbf7] bg-[#3e3222] border border-[#3e3222] px-6 py-1 text-sm font-sans tracking-widest hover:bg-[#5a4a35] transition-colors w-20 text-center"
              >
                {audioSettings.isAmbientEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* BGM */}
          <div className="flex justify-between items-center">
            <span className="font-serif text-[#3e3222] tracking-widest text-lg">BGM</span>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audioSettings.bgmVolume}
                onChange={e => updateAudioSettings({ bgmVolume: parseFloat(e.target.value) })}
                className="w-24 accent-[#3e3222]"
              />
              <button
                onClick={() => handleAudioToggle('isBgmEnabled')}
                className="text-[#fdfbf7] bg-[#3e3222] border border-[#3e3222] px-6 py-1 text-sm font-sans tracking-widest hover:bg-[#5a4a35] transition-colors w-20 text-center"
              >
                {audioSettings.isBgmEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* 语音 */}
          <div className="flex justify-between items-center">
            <span className="font-serif text-[#3e3222] tracking-widest text-lg">VOICE</span>
            <button
              onClick={() => handleAudioToggle('isVoiceEnabled')}
              className="text-[#fdfbf7] bg-[#3e3222] border border-[#3e3222] px-6 py-1 text-sm font-sans tracking-widest hover:bg-[#5a4a35] transition-colors w-20 text-center"
            >
              {audioSettings.isVoiceEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 打字机 */}
          <div className="flex justify-between items-center">
            <span className="font-serif text-[#3e3222] tracking-widest text-lg">TYPEWRITER</span>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audioSettings.typeSoundVolume}
                onChange={e => updateAudioSettings({ typeSoundVolume: parseFloat(e.target.value) })}
                className="w-24 accent-[#3e3222]"
              />
              <button
                onClick={() => handleAudioToggle('isTypeSoundEnabled')}
                className="text-[#fdfbf7] bg-[#3e3222] border border-[#3e3222] px-6 py-1 text-sm font-sans tracking-widest hover:bg-[#5a4a35] transition-colors w-20 text-center"
              >
                {audioSettings.isTypeSoundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* 调试面板 */}
          <div className="border-t border-[#e2d5c5] pt-4 mt-2">
            <div
              className="flex justify-between items-center cursor-pointer group"
              onClick={() => setShowDebug(!showDebug)}
            >
              <span className="font-serif text-[#3e3222] tracking-widest text-lg group-hover:text-[#d4af37] transition-colors">
                ADMIN / DEBUG
              </span>
              <span className={`text-[#3e3222] text-xl transition-transform duration-300 ${showDebug ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>

            {showDebug && (
              <div className="flex flex-col gap-4 mt-4 p-4 bg-[#f4ebd8] border border-[#e2d5c5] rounded-sm">
                <div className="flex justify-between items-center">
                  <span className="font-serif text-[#3e3222] tracking-widest text-xs">FAVORABILITY</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={debugAffection}
                      onChange={e => setDebugAffection(parseInt(e.target.value))}
                      className="w-24 accent-[#3e3222]"
                    />
                    <span className="font-sans text-sm w-8 text-right text-[#3e3222]">{debugAffection}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="mt-4 text-[#3e3222] hover:text-[#fdfbf7] hover:bg-[#3e3222] px-8 py-3 transition-all duration-300 font-serif tracking-[0.2em] text-sm border border-[#3e3222] rounded-sm text-center"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

export default ConfigModal;
