// ==========================================
// 音频与 AI 语音管理器 (Audio & Voice System)
// ==========================================
// 负责管理游戏中的所有音效、BGM 以及 AI 语音合成 (TTS)。
// 降低了 main.ts 的代码耦合度。

export class AudioManager {
  private typeSound: HTMLAudioElement;
  private bgm: HTMLAudioElement | null = null;
  private ambientSound: HTMLAudioElement | null = null;
  public isVoiceEnabled: boolean = true;
  public isAmbientEnabled: boolean = true;
  public isBgmEnabled: boolean = true;
  public isTypeSoundEnabled: boolean = true;
  private typeSoundVolume: number = 0.1;
  private voiceVolume: number = 1;
  private isUnlocked: boolean = false;

  constructor(typeSoundUrl: string, ambientSoundUrl?: string, bgmUrl?: string) {
    this.typeSound = new Audio(typeSoundUrl);
    this.typeSound.volume = 0.1;

    if (ambientSoundUrl) {
      this.ambientSound = new Audio(ambientSoundUrl);
      this.ambientSound.loop = true;
      this.ambientSound.volume = 0.3; // 环境音量适中
    }

    if (bgmUrl) {
      this.bgm = new Audio(bgmUrl);
      this.bgm.loop = true;
      this.bgm.volume = 0.2; // BGM音量
    }
  }

  // 解锁音频播放限制 (在首次用户交互时调用)
  public async unlockAudio() {
    if (this.isUnlocked) return;
    console.log("Attempting to unlock audio...");

    try {
      // 播放并立即暂停以解锁音频上下文
      if (this.typeSound) {
        await this.typeSound.play().catch(() => {});
        this.typeSound.pause();
      }
      if (this.ambientSound) {
        await this.ambientSound.play().catch(() => {});
        if (!this.isAmbientEnabled) {
          this.ambientSound.pause();
        }
      }
      if (this.bgm) {
        await this.bgm.play().catch(() => {});
        if (!this.isBgmEnabled) {
          this.bgm.pause();
        }
      }
      
      this.isUnlocked = true;
      console.log("Audio unlocked successfully.");
    } catch (e) {
      console.error("Failed to unlock audio:", e);
    }
  }

  // 播放打字机音效
  public playTypeSound() {
    if (!this.isTypeSoundEnabled) return;
    const sound = this.typeSound.cloneNode() as HTMLAudioElement;
    sound.volume = this.typeSoundVolume;
    sound.play().catch(() => {});
  }

  public toggleTypeSound(enabled: boolean) {
    this.isTypeSoundEnabled = enabled;
  }

  public setTypeSoundVolume(volume: number) {
    this.typeSoundVolume = Math.max(0, Math.min(1, volume));
  }

  public setVoiceVolume(volume: number) {
    this.voiceVolume = Math.max(0, Math.min(1, volume));
  }

  public getTypeSoundVolume(): number {
    return this.typeSoundVolume;
  }

  // 播放环境音效 (邮局背景音)
  public playAmbient() {
    if (this.ambientSound && this.isAmbientEnabled) {
      this.ambientSound.play().catch(() => {});
    }
  }

  // 停止环境音效
  public stopAmbient() {
    if (this.ambientSound) {
      this.ambientSound.pause();
    }
  }

  // 切换环境音效开关
  public toggleAmbient(enabled: boolean) {
    this.isAmbientEnabled = enabled;
    if (enabled) {
      this.playAmbient();
    } else {
      this.stopAmbient();
    }
  }

  public setAmbientVolume(volume: number) {
    if (this.ambientSound) {
      this.ambientSound.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public getAmbientVolume(): number {
    return this.ambientSound ? this.ambientSound.volume : 0.3;
  }

  // BGM 播放控制
  public playBGM() {
    if (this.bgm && this.isBgmEnabled) {
      this.bgm.play().catch(() => {});
    }
  }

  public stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  public toggleBGM(enabled: boolean) {
    this.isBgmEnabled = enabled;
    if (enabled) {
      this.playBGM();
    } else {
      this.stopBGM();
    }
  }

  public setBgmVolume(volume: number) {
    if (this.bgm) {
      this.bgm.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public getBgmVolume(): number {
    return this.bgm ? this.bgm.volume : 0.2;
  }

  // ==========================================
  // AI 语音系统 (TTS - Text to Speech)
  // ==========================================
  private currentVoiceAudio: HTMLAudioElement | null = null;
  private currentSystemVoiceAudio: HTMLAudioElement | null = null;

  /**
   * 播放 AI 语音
   * @param text 要播放的文本
   * @param isSystem 是否为系统语音 (不会中断主对话语音)
   */
  public async playVoice(text: string, isSystem: boolean = false): Promise<void> {
    if (!this.isVoiceEnabled) return;

    // 如果不是系统语音，停止当前正在播放的主对话语音
    if (!isSystem) {
      this.stopVoice();
    } else {
      // 如果是系统语音，停止之前的系统语音
      this.stopSystemVoice();
    }

    // 过滤掉文本中的标点符号或特殊字符
    const cleanText = text.replace(/[\*\_\[\]]/g, '');
    if (!cleanText.trim()) return;

    try {
      // 向后端请求音频流
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch TTS audio');
      }

      // 将返回的音频流转换为 Blob 并播放
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(audioUrl);
      audio.volume = (isSystem ? 0.7 : 1.0) * this.voiceVolume; // 系统语音音量稍低，避免盖过主对话
      
      if (isSystem) {
        this.currentSystemVoiceAudio = audio;
      } else {
        this.currentVoiceAudio = audio;
      }
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl); // 释放内存
        if (isSystem) {
          if (this.currentSystemVoiceAudio === audio) this.currentSystemVoiceAudio = null;
        } else {
          if (this.currentVoiceAudio === audio) this.currentVoiceAudio = null;
        }
      };

      // Wait for audio to be loaded enough to play
      await new Promise((resolve) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', resolve, { once: true });
        // Fallback timeout just in case
        setTimeout(resolve, 2000);
      });

      audio.play().catch(e => console.error("Audio play error:", e));
      
    } catch (error) {
      console.error("Error playing voice:", error);
    }
  }

  // 停止主对话语音
  public stopVoice() {
    if (this.currentVoiceAudio) {
      this.currentVoiceAudio.pause();
      this.currentVoiceAudio.currentTime = 0;
      this.currentVoiceAudio = null;
    }
  }

  // 停止系统语音
  public stopSystemVoice() {
    if (this.currentSystemVoiceAudio) {
      this.currentSystemVoiceAudio.pause();
      this.currentSystemVoiceAudio.currentTime = 0;
      this.currentSystemVoiceAudio = null;
    }
  }

  public toggleVoice(enabled: boolean) {
    this.isVoiceEnabled = enabled;
    if (!enabled) {
      this.stopVoice();
      this.stopSystemVoice();
    }
  }

  public destroy() {
    this.stopVoice();
    this.stopSystemVoice();
    this.stopAmbient();
    this.stopBGM();
  }
}
