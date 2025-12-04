/**
 * LocalStorageユーティリティ
 * ユーザー定義カテゴリ・装備・任務の保存/読込を管理
 * @module utils/localStorage
 */

import { STORAGE_KEYS, SCHEMA_VERSION } from '../types/schema.js';
import { validateEquipment, validateMission, validateName } from './validation.js';
import { createStorageHelper } from './storageHelper.js';
import { logError, logWarning, logInfo } from './logger.js';
import { toRuntimeCategories, toRuntimeEquipments, toRuntimeMissions, toPersistCategories, toPersistEquipments, toPersistMissions } from './dataConverter.js';

// LocalStorage操作用のヘルパー関数
const { getItem, setItem, removeItem } = createStorageHelper(localStorage, 'LocalStorage');

/**
 * ユーザーデータの読込とバリデーション処理の共通関数
 * @param {string} storageKey - StorageKey
 * @param {string} dataKey - データキー名（'equipments'/'missions'）
 * @param {Function} validateFn - バリデーション関数
 * @param {Function} toRuntimeFn - 永続化形式→ランタイム形式変換関数
 * @param {Function} saveFn - 保存関数
 * @param {string} dataType - データ種別（ログ用）
 * @returns {{data: Array, corruptedItems: Array}} データと破損アイテム情報
 */
function loadAndValidateUserData(storageKey, dataKey, validateFn, toRuntimeFn, saveFn, dataType) {
  const rawData = getItem(storageKey);
  if (!rawData || !rawData[dataKey]) {
    logInfo(`No user ${dataType} found`, { function: 'loadAndValidateUserData', dataType });
    return { data: [], corruptedItems: [] };
  }

  // 起動時バリデーション
  const validPersistedItems = [];
  const corruptedItems = [];

  rawData[dataKey].forEach((item) => {
    const validation = validateFn(item);
    if (validation.valid) {
      validPersistedItems.push(item);
    } else {
      logWarning(`Corrupted ${dataType} detected`, {
        function: 'loadAndValidateUserData',
        dataType,
        id: item.id,
        errors: validation.errors,
      });
      corruptedItems.push({
        id: item.id || 'unknown',
        name: item.name || 'unknown',
        type: dataType,
        errors: validation.errors,
      });
    }
  });

  // 永続化形式 → ランタイム形式に変換
  const validItems = toRuntimeFn(validPersistedItems, false);

  // 破損データがあれば正常なデータのみで上書き保存
  if (corruptedItems.length > 0) {
    logInfo(`Removing ${corruptedItems.length} corrupted ${dataType}(s)`, {
      function: 'loadAndValidateUserData',
      dataType,
      corruptedCount: corruptedItems.length,
    });
    saveFn(validItems);
  }

  logInfo(`Loaded user ${dataType}`, {
    function: 'loadAndValidateUserData',
    dataType,
    count: validItems.length,
  });
  return { data: validItems, corruptedItems };
}

/**
 * ユーザー定義カテゴリを保存
 * @param {Array} categories - カテゴリデータの配列
 * @throws {Error} 保存に失敗した場合
 */
export function saveUserCategories(categories) {
  // ランタイム形式 → 永続化形式に変換
  const persistedCategories = toPersistCategories(categories);

  const data = {
    version: SCHEMA_VERSION,
    categories: persistedCategories,
  };
  setItem(STORAGE_KEYS.USER_CATEGORIES, data);
  logInfo('Saved user categories', {
    function: 'saveUserCategories',
    count: persistedCategories.length,
  });
}

/**
 * ユーザー定義カテゴリを読込（起動時バリデーション付き）
 * @returns {{data: Array, corruptedItems: Array}} カテゴリデータと破損アイテム情報
 */
export function loadUserCategories() {
  const rawData = getItem(STORAGE_KEYS.USER_CATEGORIES);
  if (!rawData || !rawData.categories) {
    logInfo('No user categories found', { function: 'loadUserCategories' });
    return { data: [], corruptedItems: [] };
  }

  // 簡易バリデーション
  const validPersistedItems = [];
  const corruptedItems = [];

  rawData.categories.forEach((item) => {
    // 必須フィールドのチェック
    if (!item.id || !item.name || typeof item.order !== 'number') {
      logWarning('Corrupted category detected', {
        function: 'loadUserCategories',
        id: item.id || 'unknown',
      });
      corruptedItems.push({
        id: item.id || 'unknown',
        name: item.name || 'unknown',
        type: 'category',
        errors: ['必須フィールドが不足しています'],
      });
    } else {
      validPersistedItems.push(item);
    }
  });

  // 永続化形式 → ランタイム形式に変換
  const validItems = toRuntimeCategories(validPersistedItems, false);

  // 破損データがあれば正常なデータのみで上書き保存
  if (corruptedItems.length > 0) {
    logInfo(`Removing ${corruptedItems.length} corrupted category(s)`, {
      function: 'loadUserCategories',
      corruptedCount: corruptedItems.length,
    });
    saveUserCategories(validItems);
  }

  logInfo('Loaded user categories', {
    function: 'loadUserCategories',
    count: validItems.length,
  });
  return { data: validItems, corruptedItems };
}

/**
 * ユーザー定義装備を保存
 * @param {Array} equipments - 装備データの配列
 * @throws {Error} 保存に失敗した場合
 */
export function saveUserEquipments(equipments) {
  // ランタイム形式 → 永続化形式に変換
  const persistedEquipments = toPersistEquipments(equipments);

  const data = {
    version: SCHEMA_VERSION,
    equipments: persistedEquipments,
  };
  setItem(STORAGE_KEYS.USER_EQUIPMENTS, data);
  logInfo('Saved user equipments', {
    function: 'saveUserEquipments',
    count: persistedEquipments.length,
  });
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
    toRuntimeEquipments,
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
  // ランタイム形式 → 永続化形式に変換
  const persistedMissions = toPersistMissions(missions);

  const data = {
    version: SCHEMA_VERSION,
    missions: persistedMissions,
  };
  setItem(STORAGE_KEYS.USER_MISSIONS, data);
  logInfo('Saved user missions', {
    function: 'saveUserMissions',
    count: persistedMissions.length,
  });
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
    toRuntimeMissions,
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
    removeItem(STORAGE_KEYS.USER_CATEGORIES);
    removeItem(STORAGE_KEYS.USER_EQUIPMENTS);
    removeItem(STORAGE_KEYS.USER_MISSIONS);
    logInfo('Cleared all user data', { function: 'clearUserData' });
    return true;
  } catch (error) {
    logError('Failed to clear user data', { function: 'clearUserData', error });
    return false;
  }
}

/**
 * 全てのアプリデータを削除（ユーザーデータ + 設定）
 * @returns {boolean} 削除が成功した場合true
 */
export function clearAllData() {
  try {
    removeItem(STORAGE_KEYS.USER_CATEGORIES);
    removeItem(STORAGE_KEYS.USER_EQUIPMENTS);
    removeItem(STORAGE_KEYS.USER_MISSIONS);
    removeItem(STORAGE_KEYS.APP_VERSION);
    removeItem(STORAGE_KEYS.ABOUT_SHOWN);
    logInfo('Cleared all app data', { function: 'clearAllData' });
    return true;
  } catch (error) {
    logError('Failed to clear all data', { function: 'clearAllData', error });
    return false;
  }
}
