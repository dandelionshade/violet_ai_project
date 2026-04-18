/**
 * Live2D 舞台
 * 封装 Live2D 加载与情绪驱动，失败时回退到静态立绘。
 */

import React, { useEffect, useRef, useState } from 'react';
import { Live2DManager } from '../core/Live2DManager';
import { GAME_ASSETS } from '../gameAssets';

interface Live2DStageProps {
  emotion: string;
}

const Live2DStage: React.FC<Live2DStageProps> = ({ emotion }) => {
  const managerRef = useRef<Live2DManager | null>(null);
  const [useLive2D, setUseLive2D] = useState(false);
  const [activeSpriteIndex, setActiveSpriteIndex] = useState<1 | 2>(1);
  const [layer1Url, setLayer1Url] = useState(GAME_ASSETS.spriteNeutral);
  const [layer2Url, setLayer2Url] = useState(GAME_ASSETS.spriteNeutral);
  const spriteUrl =
    emotion === 'smile'
      ? GAME_ASSETS.spriteSmile
      : emotion === 'sad'
        ? GAME_ASSETS.spriteSad
        : emotion === 'surprised'
          ? GAME_ASSETS.spriteSurprised
          : emotion === 'thoughtful'
            ? GAME_ASSETS.spriteThoughtful
            : emotion === 'crying'
              ? GAME_ASSETS.spriteCrying
              : GAME_ASSETS.spriteNeutral;

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      const manager = new Live2DManager('live2d-canvas');
      managerRef.current = manager;
      const loaded = await manager.loadModel(GAME_ASSETS.live2dModel);

      if (disposed) {
        manager.destroy();
        return;
      }

      setUseLive2D(loaded);
    };

    void init();

    return () => {
      disposed = true;
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (useLive2D && managerRef.current) {
      managerRef.current.setEmotion(emotion);
      return;
    }

    setActiveSpriteIndex(prev => {
      if (prev === 1) {
        setLayer2Url(spriteUrl);
        return 2;
      }

      setLayer1Url(spriteUrl);
      return 1;
    });
  }, [emotion, useLive2D]);

  return (
    <div className="absolute bottom-0 left-[40%] -translate-x-1/2 w-200 h-[95vh] pointer-events-none z-0 flex justify-center items-end">
      <div
        className="absolute inset-0 w-full h-full bg-contain bg-no-repeat bg-bottom transition-opacity duration-1000 drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] opacity-100"
        style={{
          backgroundImage: `url('${layer1Url}')`,
          opacity: useLive2D ? 0 : activeSpriteIndex === 1 ? 1 : 0,
        }}
      />
      <div
        className="absolute inset-0 w-full h-full bg-contain bg-no-repeat bg-bottom transition-opacity duration-1000 drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] opacity-0"
        style={{
          backgroundImage: `url('${layer2Url}')`,
          opacity: useLive2D ? 0 : activeSpriteIndex === 2 ? 1 : 0,
        }}
      />
      <canvas id="live2d-canvas" className="absolute inset-0 w-full h-full pointer-events-none opacity-0 transition-opacity duration-700" />
    </div>
  );
};

export default Live2DStage;