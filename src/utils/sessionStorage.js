/**
 * SessionStorageユーティリティ
 * 選択中の任務IDリストの保存/読込を管理（タブ閉じで消去）
 * @module utils/sessionStorage
 */

import { STORAGE_KEYS, SCHEMA_VERSION } from '../types/schema.js';
import { createStorageHelper } from './storageHelper.js';
import { logError, logInfo } from './logger.js';

// SessionStorage操作用のヘルパー関数
const { getItem, setItem, removeItem } = createStorageHelper(sessionStorage, 'SessionStorage');

/**
 * 選択中の任務IDリストを保存
 * @param {string[]} missionIds - 任務IDの配列（最大8件）
 * @throws {Error} 保存に失敗した場合
 */
export function saveSelectedMissions(missionIds) {
  const data = {
    version: SCHEMA_VERSION,
    selectedMissionIds: missionIds,
  };
  setItem(STORAGE_KEYS.SELECTED_MISSIONS, data);
  logInfo('Saved selected missions', {
    function: 'saveSelectedMissions',
    count: missionIds.length,
  });
}

/**
 * 選択中の任務IDリストを読込
 * @returns {string[]} 任務IDの配列（存在しない場合は空配列）
 */
export function loadSelectedMissions() {
  const data = getItem(STORAGE_KEYS.SELECTED_MISSIONS);
  if (!data || !data.selectedMissionIds) {
    logInfo('No selected missions found', { function: 'loadSelectedMissions' });
    return [];
  }
  logInfo('Loaded selected missions', {
    function: 'loadSelectedMissions',
    count: data.selectedMissionIds.length,
  });
  return data.selectedMissionIds;
}

/**
 * 選択状態をクリア
 * @returns {boolean} 削除が成功した場合true
 */
export function clearSelectedMissions() {
  try {
    removeItem(STORAGE_KEYS.SELECTED_MISSIONS);
    logInfo('Cleared selected missions', { function: 'clearSelectedMissions' });
    return true;
  } catch (error) {
    logError('Failed to clear selected missions', {
      function: 'clearSelectedMissions',
      error,
    });
    return false;
  }
}
