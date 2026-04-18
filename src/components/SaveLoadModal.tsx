/**
 * React 组件：存档/读档 Modal (SaveLoadModal.tsx)
 * 提供 6 个存档槽位的保存、读取和删除。
 */

import React from 'react';
import { useGameStore } from '../store/gameStore';

interface SaveLoadModalProps {
  onClose: () => void;
  onBackToMenu: () => void;
}

const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ onClose, onBackToMenu }) => {
  const { slots, currentState, saveToSlot, loadFromSlot, deleteSlot, updateGameState } = useGameStore(state => ({
    slots: state.slots,
    currentState: state.currentState,
    saveToSlot: state.saveToSlot,
    loadFromSlot: state.loadFromSlot,
    deleteSlot: state.deleteSlot,
    updateGameState: state.updateGameState,
  }));

  const handleSave = (slotId: number) => {
    saveToSlot(slotId, currentState);
  };

  const handleLoad = (slotId: number) => {
    const state = loadFromSlot(slotId);
    if (!state) return;
    updateGameState(state);
    onClose();
  };

  const sortedSlots = Array.from({ length: 6 }, (_, index) => index + 1).map(slotId => {
    const slot = slots.find(item => item.id === slotId);
    return { slotId, slot };
  });

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 opacity-100 pointer-events-auto transition-opacity duration-300 backdrop-blur-sm">
      <div className="bg-[#fdfbf7] border border-[#e2d5c5] p-10 flex flex-col gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-sm w-[900px] h-[680px] transform transition-transform duration-300 scale-100">
        <h3 className="text-2xl font-serif text-[#3e3222] tracking-[0.2em] text-center border-b border-[#e2d5c5] pb-4">
          SAVE / LOAD
        </h3>

        <div className="grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
          {sortedSlots.map(({ slotId, slot }) => (
            <div key={slotId} className="rounded-xl border border-[#e2d5c5] bg-[#fffdf8] p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-serif text-lg tracking-[0.15em] text-[#3e3222]">SLOT {slotId}</p>
                  <p className="text-xs text-[#7f6a52]">{slot ? slot.date : 'Empty Slot'}</p>
                </div>
                <span className={`text-xs tracking-[0.2em] ${slot ? 'text-[#d4af37]' : 'text-[#9b8b78]'}`}>
                  {slot ? 'USED' : 'EMPTY'}
                </span>
              </div>

              <div className="mb-4 rounded-lg bg-[#f4ebd8] p-3 text-sm text-[#3e3222] min-h-[96px]">
                {slot ? (
                  <>
                    <p className="mb-1 font-medium">{slot.state.playerName || 'default_user'}</p>
                    <p className="line-clamp-3 opacity-80">{slot.state.reply || 'No preview available'}</p>
                    <p className="mt-2 text-xs text-[#7f6a52]">Turn {slot.state.turn_count} / Phase {slot.state.storyPhase}</p>
                  </>
                ) : (
                  <p className="opacity-50">尚未保存</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSave(slotId)}
                  className="rounded border border-[#3e3222] px-3 py-1 text-xs tracking-[0.15em] text-[#3e3222] transition-colors hover:bg-[#3e3222] hover:text-[#fdfbf7]"
                >
                  SAVE
                </button>
                <button
                  onClick={() => handleLoad(slotId)}
                  disabled={!slot}
                  className="rounded border border-[#3e3222] px-3 py-1 text-xs tracking-[0.15em] text-[#3e3222] transition-colors hover:bg-[#3e3222] hover:text-[#fdfbf7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  LOAD
                </button>
                <button
                  onClick={() => deleteSlot(slotId)}
                  disabled={!slot}
                  className="rounded border border-[#7a4a34] px-3 py-1 text-xs tracking-[0.15em] text-[#7a4a34] transition-colors hover:bg-[#7a4a34] hover:text-[#fdfbf7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  DELETE
                </button>
              </div>
            </div>
          ))}
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

export default SaveLoadModal;
