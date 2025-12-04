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
 * @param {{baseMission: {missionId: string, count: number} | null, auxiliaryMissions: Array<{missionId: string, count: number}>}} selectedMissions - ベース任務と補助任務（合計最大8件）
 * @throws {Error} 保存に失敗した場合
 */
export function saveSelectedMissions(selectedMissions) {
  const data = {
    version: SCHEMA_VERSION,
    baseMission: selectedMissions.baseMission,
    auxiliaryMissions: selectedMissions.auxiliaryMissions,
  };
  setItem(STORAGE_KEYS.SELECTED_MISSIONS, data);
  const totalCount = (selectedMissions.baseMission ? 1 : 0) + selectedMissions.auxiliaryMissions.length;
  logInfo('Saved selected missions', {
    function: 'saveSelectedMissions',
    totalCount,
    baseCount: selectedMissions.baseMission ? 1 : 0,
    auxiliaryCount: selectedMissions.auxiliaryMissions.length,
  });
}

/**
 * 選択中の任務リストを読込（マイグレーション対応）
 * @returns {{baseMission: {missionId: string, count: number} | null, auxiliaryMissions: Array<{missionId: string, count: number}>}} ベース任務と補助任務（存在しない場合は空）
 */
export function loadSelectedMissions() {
  const data = getItem(STORAGE_KEYS.SELECTED_MISSIONS);
  if (!data) {
    logInfo('No selected missions found', { function: 'loadSelectedMissions' });
    return { baseMission: null, auxiliaryMissions: [] };
  }

  // マイグレーション1: 旧形式（string[]）から{missionId, count}[]への変換
  if (Array.isArray(data.selectedMissionIds)) {
    logInfo('Migrating selected missions from v1 format (string[])', { function: 'loadSelectedMissions' });
    const migrated = {
      baseMission: null,
      auxiliaryMissions: data.selectedMissionIds.map((id) => ({
        missionId: id,
        count: 1,
      })),
    };
    // 新形式で保存し直す
    saveSelectedMissions(migrated);
    return migrated;
  }

  // マイグレーション2: 旧形式（{missionId, count}[]）からベース/補助分離形式への変換
  if (Array.isArray(data.selectedMissions)) {
    logInfo('Migrating selected missions from v2 format ({missionId, count}[])', { function: 'loadSelectedMissions' });
    const migrated = {
      baseMission: null,
      auxiliaryMissions: data.selectedMissions,
    };
    // 新形式で保存し直す
    saveSelectedMissions(migrated);
    return migrated;
  }

  // 新形式の読み込み
  const result = {
    baseMission: data.baseMission || null,
    auxiliaryMissions: data.auxiliaryMissions || [],
  };

  const totalCount = (result.baseMission ? 1 : 0) + result.auxiliaryMissions.length;
  logInfo('Loaded selected missions', {
    function: 'loadSelectedMissions',
    totalCount,
    baseCount: result.baseMission ? 1 : 0,
    auxiliaryCount: result.auxiliaryMissions.length,
  });
  return result;
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
