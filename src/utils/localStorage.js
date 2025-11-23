/**
 * LocalStorageユーティリティ
 * ユーザー定義装備・任務の保存/読込を管理
 * @module utils/localStorage
 */

import { STORAGE_KEYS, SCHEMA_VERSION } from '../types/schema.js';

/**
 * LocalStorageから値を取得してJSONパース
 * @param {string} key - StorageKey
 * @returns {Object|null} パースされたデータ、存在しない場合はnull
 */
function getItem(key) {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return null;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`[LocalStorage] Failed to parse ${key}:`, error);
    return null;
  }
}

/**
 * LocalStorageに値をJSON文字列化して保存
 * @param {string} key - StorageKey
 * @param {Object} value - 保存する値
 * @throws {Error} 容量オーバーまたはプライベートモードの場合
 */
function setItem(key, value) {
  try {
    const jsonString = JSON.stringify(value);
    localStorage.setItem(key, jsonString);
  } catch (error) {
    // QuotaExceededError: LocalStorage容量オーバー
    if (error.name === 'QuotaExceededError') {
      throw new Error(
        'LocalStorageの容量が不足しています. データをエクスポートして整理してください.'
      );
    }
    // プライベートモード等でLocalStorageが無効な場合
    throw new Error('LocalStorageへの保存に失敗しました: ' + error.message);
  }
}

/**
 * ユーザー定義装備を保存
 * @param {Array} equipments - 装備データの配列
 * @throws {Error} 保存に失敗した場合
 */
export function saveUserEquipments(equipments) {
  const data = {
    version: SCHEMA_VERSION,
    equipments,
  };
  setItem(STORAGE_KEYS.USER_EQUIPMENTS, data);
  console.log('[LocalStorage] Saved user equipments:', equipments.length, 'items');
}

/**
 * ユーザー定義装備を読込
 * @returns {Array} 装備データの配列（存在しない場合は空配列）
 */
export function loadUserEquipments() {
  const data = getItem(STORAGE_KEYS.USER_EQUIPMENTS);
  if (!data || !data.equipments) {
    console.log('[LocalStorage] No user equipments found');
    return [];
  }
  console.log('[LocalStorage] Loaded user equipments:', data.equipments.length, 'items');
  return data.equipments;
}

/**
 * ユーザー定義任務を保存
 * @param {Array} missions - 任務データの配列
 * @throws {Error} 保存に失敗した場合
 */
export function saveUserMissions(missions) {
  const data = {
    version: SCHEMA_VERSION,
    missions,
  };
  setItem(STORAGE_KEYS.USER_MISSIONS, data);
  console.log('[LocalStorage] Saved user missions:', missions.length, 'items');
}

/**
 * ユーザー定義任務を読込
 * @returns {Array} 任務データの配列（存在しない場合は空配列）
 */
export function loadUserMissions() {
  const data = getItem(STORAGE_KEYS.USER_MISSIONS);
  if (!data || !data.missions) {
    console.log('[LocalStorage] No user missions found');
    return [];
  }
  console.log('[LocalStorage] Loaded user missions:', data.missions.length, 'items');
  return data.missions;
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
    localStorage.removeItem(STORAGE_KEYS.USER_EQUIPMENTS);
    localStorage.removeItem(STORAGE_KEYS.USER_MISSIONS);
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
    localStorage.removeItem(STORAGE_KEYS.USER_EQUIPMENTS);
    localStorage.removeItem(STORAGE_KEYS.USER_MISSIONS);
    localStorage.removeItem(STORAGE_KEYS.APP_VERSION);
    localStorage.removeItem(STORAGE_KEYS.ABOUT_SHOWN);
    console.log('[LocalStorage] Cleared all app data');
    return true;
  } catch (error) {
    console.error('[LocalStorage] Failed to clear all data:', error);
    return false;
  }
}
