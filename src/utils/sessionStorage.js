/**
 * SessionStorageユーティリティ
 * 選択中の任務IDリストの保存/読込を管理（タブ閉じで消去）
 * @module utils/sessionStorage
 */

import { STORAGE_KEYS, SCHEMA_VERSION } from '../types/schema.js';

/**
 * SessionStorageから値を取得してJSONパース
 * @param {string} key - StorageKey
 * @returns {Object|null} パースされたデータ、存在しない場合はnull
 */
function getItem(key) {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) {
      return null;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`[SessionStorage] Failed to parse ${key}:`, error);
    return null;
  }
}

/**
 * SessionStorageに値をJSON文字列化して保存
 * @param {string} key - StorageKey
 * @param {Object} value - 保存する値
 */
function setItem(key, value) {
  try {
    const jsonString = JSON.stringify(value);
    sessionStorage.setItem(key, jsonString);
  } catch (error) {
    console.error(`[SessionStorage] Failed to save ${key}:`, error);
    throw new Error('SessionStorageへの保存に失敗しました: ' + error.message);
  }
}

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
  console.log('[SessionStorage] Saved selected missions:', missionIds.length, 'items');
}

/**
 * 選択中の任務IDリストを読込
 * @returns {string[]} 任務IDの配列（存在しない場合は空配列）
 */
export function loadSelectedMissions() {
  const data = getItem(STORAGE_KEYS.SELECTED_MISSIONS);
  if (!data || !data.selectedMissionIds) {
    console.log('[SessionStorage] No selected missions found');
    return [];
  }
  console.log('[SessionStorage] Loaded selected missions:', data.selectedMissionIds.length, 'items');
  return data.selectedMissionIds;
}

/**
 * 選択状態をクリア
 * @returns {boolean} 削除が成功した場合true
 */
export function clearSelectedMissions() {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SELECTED_MISSIONS);
    console.log('[SessionStorage] Cleared selected missions');
    return true;
  } catch (error) {
    console.error('[SessionStorage] Failed to clear selected missions:', error);
    return false;
  }
}
