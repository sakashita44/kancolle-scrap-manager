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
 * ユーザーデータの読込とバリデーション処理の共通関数
 * @param {string} storageKey - StorageKey
 * @param {string} dataKey - データキー名（'equipments'/'missions'）
 * @param {Function} validateFn - バリデーション関数
 * @param {Function} saveFn - 保存関数
 * @param {string} dataType - データ種別（ログ用）
 * @returns {{data: Array, corruptedItems: Array}} データと破損アイテム情報
 */
function loadAndValidateUserData(storageKey, dataKey, validateFn, saveFn, dataType) {
  const rawData = getItem(storageKey);
  if (!rawData || !rawData[dataKey]) {
    console.log(`[LocalStorage] No user ${dataType} found`);
    return { data: [], corruptedItems: [] };
  }

  // 起動時バリデーション
  const validItems = [];
  const corruptedItems = [];

  rawData[dataKey].forEach((item) => {
    const validation = validateFn(item);
    if (validation.valid) {
      // isMaster: false を付与
      validItems.push({ ...item, isMaster: false });
    } else {
      console.warn(`[LocalStorage] Corrupted ${dataType} detected:`, item.id, validation.errors);
      corruptedItems.push({
        id: item.id || 'unknown',
        name: item.name || 'unknown',
        type: dataType,
        errors: validation.errors,
      });
    }
  });

  // 破損データがあれば正常なデータのみで上書き保存
  if (corruptedItems.length > 0) {
    console.log(`[LocalStorage] Removing ${corruptedItems.length} corrupted ${dataType}(s)`);
    saveFn(validItems);
  }

  console.log(`[LocalStorage] Loaded user ${dataType}:`, validItems.length, 'items');
  return { data: validItems, corruptedItems };
}

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
  return loadAndValidateUserData(
    STORAGE_KEYS.USER_EQUIPMENTS,
    'equipments',
    validateEquipment,
    saveUserEquipments,
    'equipment'
  );
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
  return loadAndValidateUserData(
    STORAGE_KEYS.USER_MISSIONS,
    'missions',
    validateMission,
    saveUserMissions,
    'mission'
  );
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
