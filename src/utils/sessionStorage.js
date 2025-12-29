/**
 * SessionStorageユーティリティ
 * 選択中の任務IDリストの保存/読込を管理（タブ閉じで消去）
 * @module utils/sessionStorage
 */

import { STORAGE_KEYS, SCHEMA_VERSION } from '../types/schema.js';
import { createStorageHelper } from './storageHelper.js';
import { logError, logInfo } from './logger.js';
import { validateSelectedMissions } from './validation.js';

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
 * 選択中の任務リストを読込（バリデーション対応）
 * @returns {{baseMission: {missionId: string, count: number} | null, auxiliaryMissions: Array<{missionId: string, count: number}>}} ベース任務と補助任務（存在しない場合は空）
 */
export function loadSelectedMissions() {
  const data = getItem(STORAGE_KEYS.SELECTED_MISSIONS);
  if (!data) {
    logInfo('No selected missions found', { function: 'loadSelectedMissions' });
    return { baseMission: null, auxiliaryMissions: [] };
  }

  // バリデーション: 正しい形式かチェック（Zodネイティブ形式）
  const validation = validateSelectedMissions(data);
  if (validation.success) {
    const validData = validation.data;
    const result = {
      baseMission: validData.baseMission || null,
      auxiliaryMissions: validData.auxiliaryMissions || [],
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

  // 不正な形式の場合は初期値を返す
  const errorMessages = validation.error?.issues?.map((issue) => issue.message) || [];
  logInfo('Invalid selected missions format, returning initial value', {
    function: 'loadSelectedMissions',
    errors: errorMessages,
  });
  return { baseMission: null, auxiliaryMissions: [] };
}

/**
 * 選択状態をクリア（空データを保存する方針に統一）
 * @returns {boolean} クリアが成功した場合true
 */
export function clearSelectedMissions() {
  try {
    saveSelectedMissions({ baseMission: null, auxiliaryMissions: [] });
    logInfo('Cleared selected missions (saved empty data)', { function: 'clearSelectedMissions' });
    return true;
  } catch (error) {
    logError('Failed to clear selected missions', {
      function: 'clearSelectedMissions',
      error,
    });
    return false;
  }
}
