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
 * 選択中の任務リストを保存
 * @param {Array<{missionId: string, count: number}>} selectedMissions - 任務IDと実行回数の配列（最大8件）
 * @throws {Error} 保存に失敗した場合
 */
export function saveSelectedMissions(selectedMissions) {
  const data = {
    version: SCHEMA_VERSION,
    selectedMissions: selectedMissions,
  };
  setItem(STORAGE_KEYS.SELECTED_MISSIONS, data);
  logInfo('Saved selected missions', {
    function: 'saveSelectedMissions',
    count: selectedMissions.length,
  });
}

/**
 * 選択中の任務リストを読込（マイグレーション対応）
 * @returns {Array<{missionId: string, count: number}>} 任務IDと実行回数の配列（存在しない場合は空配列）
 */
export function loadSelectedMissions() {
  const data = getItem(STORAGE_KEYS.SELECTED_MISSIONS);
  if (!data) {
    logInfo('No selected missions found', { function: 'loadSelectedMissions' });
    return [];
  }

  // マイグレーション: 旧形式（string[]）から新形式（{missionId, count}[]）への変換
  if (Array.isArray(data.selectedMissionIds)) {
    logInfo('Migrating selected missions from old format', { function: 'loadSelectedMissions' });
    const migrated = data.selectedMissionIds.map((id) => ({
      missionId: id,
      count: 1,
    }));
    // 新形式で保存し直す
    saveSelectedMissions(migrated);
    return migrated;
  }

  if (!data.selectedMissions) {
    logInfo('No selected missions found', { function: 'loadSelectedMissions' });
    return [];
  }

  logInfo('Loaded selected missions', {
    function: 'loadSelectedMissions',
    count: data.selectedMissions.length,
  });
  return data.selectedMissions;
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
