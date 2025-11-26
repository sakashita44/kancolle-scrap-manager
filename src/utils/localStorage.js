/**
 * LocalStorageユーティリティ
 * ユーザー定義装備・任務の保存/読込を管理
 * @module utils/localStorage
 */

import { STORAGE_KEYS, SCHEMA_VERSION } from '../types/schema.js';
import { validateEquipment, validateMission } from './validation.js';
import { createStorageHelper } from './storageHelper.js';

// LocalStorage操作用のヘルパー関数
const { getItem, setItem, removeItem } = createStorageHelper(localStorage, 'LocalStorage');

/**
 * ユーザー定義装備を保存
 * @param {Array} equipments - 装備データの配列
 * @throws {Error} 保存に失敗した場合
 */
export function saveUserEquipments(equipments) {
  // isMasterフィールドを除外（仕様: JSONには含まれない）
  const cleanedEquipments = equipments.map(({ isMaster, ...eq }) => eq);

  const data = {
    version: SCHEMA_VERSION,
    equipments: cleanedEquipments,
  };
  setItem(STORAGE_KEYS.USER_EQUIPMENTS, data);
  console.log('[LocalStorage] Saved user equipments:', cleanedEquipments.length, 'items');
}

/**
 * ユーザー定義装備を読込（起動時バリデーション付き）
 * @returns {{data: Array, corruptedItems: Array}} 装備データと破損アイテム情報
 */
export function loadUserEquipments() {
  const rawData = getItem(STORAGE_KEYS.USER_EQUIPMENTS);
  if (!rawData || !rawData.equipments) {
    console.log('[LocalStorage] No user equipments found');
    return { data: [], corruptedItems: [] };
  }

  // 起動時バリデーション
  const validEquipments = [];
  const corruptedItems = [];

  rawData.equipments.forEach((equipment) => {
    const validation = validateEquipment(equipment);
    if (validation.valid) {
      // isMaster: false を付与
      validEquipments.push({ ...equipment, isMaster: false });
    } else {
      console.warn('[LocalStorage] Corrupted equipment detected:', equipment.id, validation.errors);
      corruptedItems.push({
        id: equipment.id || 'unknown',
        name: equipment.name || 'unknown',
        type: 'equipment',
        errors: validation.errors,
      });
    }
  });

  // 破損データがあれば正常なデータのみで上書き保存
  if (corruptedItems.length > 0) {
    console.log('[LocalStorage] Removing', corruptedItems.length, 'corrupted equipment(s)');
    saveUserEquipments(validEquipments);
  }

  console.log('[LocalStorage] Loaded user equipments:', validEquipments.length, 'items');
  return { data: validEquipments, corruptedItems };
}

/**
 * ユーザー定義任務を保存
 * @param {Array} missions - 任務データの配列
 * @throws {Error} 保存に失敗した場合
 */
export function saveUserMissions(missions) {
  // isMasterフィールドを除外（仕様: JSONには含まれない）
  const cleanedMissions = missions.map(({ isMaster, ...ms }) => ms);

  const data = {
    version: SCHEMA_VERSION,
    missions: cleanedMissions,
  };
  setItem(STORAGE_KEYS.USER_MISSIONS, data);
  console.log('[LocalStorage] Saved user missions:', cleanedMissions.length, 'items');
}

/**
 * ユーザー定義任務を読込（起動時バリデーション付き）
 * @returns {{data: Array, corruptedItems: Array}} 任務データと破損アイテム情報
 */
export function loadUserMissions() {
  const rawData = getItem(STORAGE_KEYS.USER_MISSIONS);
  if (!rawData || !rawData.missions) {
    console.log('[LocalStorage] No user missions found');
    return { data: [], corruptedItems: [] };
  }

  // 起動時バリデーション
  const validMissions = [];
  const corruptedItems = [];

  rawData.missions.forEach((mission) => {
    const validation = validateMission(mission);
    if (validation.valid) {
      // isMaster: false を付与
      validMissions.push({ ...mission, isMaster: false });
    } else {
      console.warn('[LocalStorage] Corrupted mission detected:', mission.id, validation.errors);
      corruptedItems.push({
        id: mission.id || 'unknown',
        name: mission.name || 'unknown',
        type: 'mission',
        errors: validation.errors,
      });
    }
  });

  // 破損データがあれば正常なデータのみで上書き保存
  if (corruptedItems.length > 0) {
    console.log('[LocalStorage] Removing', corruptedItems.length, 'corrupted mission(s)');
    saveUserMissions(validMissions);
  }

  console.log('[LocalStorage] Loaded user missions:', validMissions.length, 'items');
  return { data: validMissions, corruptedItems };
}

/**
 * アプリバージョンを保存
 * @param {string} version - アプリバージョン
 */
export function saveAppVersion(version) {
  setItem(STORAGE_KEYS.APP_VERSION, version);
}

/**
 * アプリバージョンを読込
 * @returns {string|null} アプリバージョン
 */
export function loadAppVersion() {
  return getItem(STORAGE_KEYS.APP_VERSION);
}

/**
 * About表示済みフラグを保存
 */
export function saveAboutShown() {
  setItem(STORAGE_KEYS.ABOUT_SHOWN, true);
}

/**
 * About表示済みフラグを確認
 * @returns {boolean} 表示済みの場合true
 */
export function isAboutShown() {
  return getItem(STORAGE_KEYS.ABOUT_SHOWN) === true;
}

/**
 * 全てのユーザーデータを削除
 * @returns {boolean} 削除が成功した場合true
 */
export function clearUserData() {
  try {
    removeItem(STORAGE_KEYS.USER_EQUIPMENTS);
    removeItem(STORAGE_KEYS.USER_MISSIONS);
    console.log('[LocalStorage] Cleared all user data');
    return true;
  } catch (error) {
    console.error('[LocalStorage] Failed to clear user data:', error);
    return false;
  }
}

/**
 * 全てのアプリデータを削除（ユーザーデータ + 設定）
 * @returns {boolean} 削除が成功した場合true
 */
export function clearAllData() {
  try {
    removeItem(STORAGE_KEYS.USER_EQUIPMENTS);
    removeItem(STORAGE_KEYS.USER_MISSIONS);
    removeItem(STORAGE_KEYS.APP_VERSION);
    removeItem(STORAGE_KEYS.ABOUT_SHOWN);
    console.log('[LocalStorage] Cleared all app data');
    return true;
  } catch (error) {
    console.error('[LocalStorage] Failed to clear all data:', error);
    return false;
  }
}
