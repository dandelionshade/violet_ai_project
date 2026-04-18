/**
 * React 根组件 (App.tsx)
 * 整合所有游戏场景和状态管理
 */

import React, { useEffect } from 'react';
import MainMenu from './components/MainMenu';
import GameUI from './components/GameUI';
import { useGameStore } from './store/gameStore';

const App: React.FC = () => {
  const { resetGameState, loadFromSlot, updateGameState, slots } = useGameStore(
    state => ({
      resetGameState: state.resetGameState,
      loadFromSlot: state.loadFromSlot,
      updateGameState: state.updateGameState,
      slots: state.slots,
    })
  );
  const [scene, setScene] = React.useState<'menu' | 'game'>('menu');

  useEffect(() => {
    console.log('[App] Game initialized');
    // 这里可以初始化游戏所需的资源
  }, []);

  const handleNewGame = (isNGPlus: boolean) => {
    resetGameState();
    if (isNGPlus) {
      useGameStore.setState(state => ({
        currentState: { ...state.currentState, isNGPlus: true },
      }));
    }
    setScene('game');
    console.log(`[App] New game started${isNGPlus ? ' (NG+)' : ''}`);
  };

  const handleContinue = () => {
    if (currentStateIsFresh() && slots.length > 0) {
      const latestSlotId = [...slots].sort((left, right) => right.id - left.id)[0].id;
      const savedState = loadFromSlot(latestSlotId);
      if (savedState) {
        updateGameState(savedState);
      }
    }
    setScene('game');
    console.log('[App] Game continued from save');
  };

  const handleExit = () => {
    console.log('[App] Game exited');
    // 可选：关闭应用或清理资源
  };

  const currentStateIsFresh = () => useGameStore.getState().currentState.turn_count <= 1;

  return scene === 'menu' ? (
    <MainMenu
      onNewGame={handleNewGame}
      onContinue={handleContinue}
      onExit={handleExit}
    />
  ) : (
    <GameUI onBackToMenu={() => setScene('menu')} />
  );
};

export default App;
