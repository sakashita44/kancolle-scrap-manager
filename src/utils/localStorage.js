/**
 * LocalStorageユーティリティ
 * ユーザー定義カテゴリ・装備・任務の保存/読込を管理
 * @module utils/localStorage
 */

import { STORAGE_KEYS, SCHEMA_VERSION } from '../types/schema.js';
import { createStorageHelper } from './storageHelper.js';
import { logError, logWarning, logInfo } from './logger.js';
import { toRuntimeCategories, toRuntimeEquipments, toRuntimeMissions, toPersistCategories, toPersistEquipments, toPersistMissions } from './dataConverter.js';
import { sanitizeDataList } from './dataSanitizer.js';
import { persistedCategorySchema, persistedEquipmentSchema, persistedMissionSchema } from '../schemas/index.js';

// LocalStorage操作用のヘルパー関数
const { getItem, setItem, removeItem } = createStorageHelper(localStorage, 'LocalStorage');

/**
 * ユーザーデータの読込とバリデーション処理の共通関数
 * Parse, don't validateアーキテクチャに基づき、Zodスキーマで境界での厳密なバリデーションを実施
 * @param {string} storageKey - StorageKey
 * @param {string} dataKey - データキー名（'equipments'/'missions'）
 * @param {import('zod').ZodSchema} schema - Zodスキーマ
 * @param {Function} toRuntimeFn - 永続化形式→ランタイム形式変換関数
 * @param {Function} saveFn - 保存関数
 * @param {string} dataType - データ種別（ログ用）
 * @returns {{data: Array, corruptedItems: Array}} データと破損アイテム情報
 */
function loadAndValidateUserData(storageKey, dataKey, schema, toRuntimeFn, saveFn, dataType) {
  const rawData = getItem(storageKey);
  if (!rawData || !rawData[dataKey]) {
    logInfo(`No user ${dataType} found`, { function: 'loadAndValidateUserData', dataType });
    return { data: [], corruptedItems: [] };
  }

  // sanitizeDataListを使用した起動時バリデーション（Parse, don't validate）
  const { validItems: validPersistedItems, errors } = sanitizeDataList(rawData[dataKey], schema);

  // エラー情報をcorruptedItems形式に変換
  const corruptedItems = errors.map((err) => {
    logWarning(`Corrupted ${dataType} detected`, {
      function: 'loadAndValidateUserData',
      dataType,
      index: err.index,
      message: err.message,
    });
    return {
      id: err.data?.id || 'unknown',
      name: err.data?.name || 'unknown',
      type: dataType,
      errors: [err.message],
    };
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
 * ユーザーデータ保存関数の共通処理
 * @param {string} storageKey - StorageKey
 * @param {string} dataKey - データキー名（'categories'/'equipments'/'missions'）
 * @param {Function} toPersistFn - ランタイム形式→永続化形式変換関数
 * @param {string} dataType - データ種別（ログ用）
 * @param {Array} items - 保存するデータ配列
 */
function saveUserData(storageKey, dataKey, toPersistFn, dataType, items) {
  const persistedItems = toPersistFn(items);
  setItem(storageKey, {
    version: SCHEMA_VERSION,
    [dataKey]: persistedItems,
  });
  logInfo(`Saved user ${dataType}`, {
    function: `saveUser${dataType}`,
    count: persistedItems.length,
  });
}

/**
 * ユーザー定義カテゴリを保存
 * @param {Array} categories - カテゴリデータの配列
 * @throws {Error} 保存に失敗した場合
 */
export function saveUserCategories(categories) {
  saveUserData(STORAGE_KEYS.USER_CATEGORIES, 'categories', toPersistCategories, 'categories', categories);
}

/**
 * ユーザー定義カテゴリを読込（起動時バリデーション付き）
 * @returns {{data: Array, corruptedItems: Array}} カテゴリデータと破損アイテム情報
 */
export function loadUserCategories() {
  return loadAndValidateUserData(
    STORAGE_KEYS.USER_CATEGORIES, 'categories', persistedCategorySchema,
    toRuntimeCategories, saveUserCategories, 'category'
  );
}

/**
 * ユーザー定義装備を保存
 * @param {Array} equipments - 装備データの配列
 * @throws {Error} 保存に失敗した場合
 */
export function saveUserEquipments(equipments) {
  saveUserData(STORAGE_KEYS.USER_EQUIPMENTS, 'equipments', toPersistEquipments, 'equipments', equipments);
}

/**
 * ユーザー定義装備を読込（起動時バリデーション付き）
 * @returns {{data: Array, corruptedItems: Array}} 装備データと破損アイテム情報
 */
export function loadUserEquipments() {
  return loadAndValidateUserData(
    STORAGE_KEYS.USER_EQUIPMENTS, 'equipments', persistedEquipmentSchema,
    toRuntimeEquipments, saveUserEquipments, 'equipment'
  );
}

/**
 * ユーザー定義任務を保存
 * @param {Array} missions - 任務データの配列
 * @throws {Error} 保存に失敗した場合
 */
export function saveUserMissions(missions) {
  saveUserData(STORAGE_KEYS.USER_MISSIONS, 'missions', toPersistMissions, 'missions', missions);
}

/**
 * ユーザー定義任務を読込（起動時バリデーション付き）
 * @returns {{data: Array, corruptedItems: Array}} 任務データと破損アイテム情報
 */
export function loadUserMissions() {
  return loadAndValidateUserData(
    STORAGE_KEYS.USER_MISSIONS, 'missions', persistedMissionSchema,
    toRuntimeMissions, saveUserMissions, 'mission'
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
