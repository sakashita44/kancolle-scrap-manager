/**
 * データ変換層
 * 永続化形式（JSON/LocalStorage）とランタイム形式（アプリケーション内部）間の変換を担当
 * @module utils/dataConverter
 */

import { EQUIPMENT_TYPE } from '../types/schema.js';
import { createIdMap } from './dataManagement.js';

/**
 * 永続化形式 → ランタイム形式: カテゴリ
 * @param {Array} persistedCategories - 永続化形式のカテゴリ配列
 * @param {boolean} isMaster - マスタデータかどうか
 * @returns {Array} ランタイム形式のカテゴリ配列
 */
export function toRuntimeCategories(persistedCategories, isMaster) {
  return persistedCategories.map(cat => ({
    ...cat,
    isMaster,
  }));
}

/**
 * 永続化形式 → ランタイム形式: 装備
 * @param {Array} persistedEquipments - 永続化形式の装備配列
 * @param {boolean} isMaster - マスタデータかどうか
 * @returns {Array} ランタイム形式の装備配列
 */
export function toRuntimeEquipments(persistedEquipments, isMaster) {
  return persistedEquipments.map(eq => ({
    ...eq,
    isMaster,
  }));
}

/**
 * 永続化形式 → ランタイム形式: 任務
 * @param {Array} persistedMissions - 永続化形式の任務配列
 * @param {boolean} isMaster - マスタデータかどうか
 * @returns {Array} ランタイム形式の任務配列
 */
export function toRuntimeMissions(persistedMissions, isMaster) {
  return persistedMissions.map(ms => ({
    ...ms,
    isMaster,
  }));
}

/**
 * カテゴリ代表装備を動的生成
 * @param {Array} runtimeCategories - ランタイム形式のカテゴリ配列
 * @returns {Array} カテゴリ代表装備の配列
 */
export function generateCategoryRepresentatives(runtimeCategories) {
  return runtimeCategories.map(cat => ({
    id: cat.id,
    name: cat.name + '（種別不問）',
    categoryId: cat.id,
    isMaster: cat.isMaster,
    type: EQUIPMENT_TYPE.CATEGORY,
    order: cat.order,
  }));
}

/**
 * 装備にtypeフィールドを付与
 * @param {Array} equipments - ランタイム形式の装備配列（type未付与）
 * @returns {Array} ランタイム形式の装備配列（type付与済み）
 */
export function addEquipmentType(equipments) {
  return equipments.map(eq => ({
    ...eq,
    type: EQUIPMENT_TYPE.ITEM,
  }));
}

/**
 * カテゴリ関連のMap生成
 * @param {Array} categories - ランタイム形式のカテゴリ配列
 * @returns {Object} categoryMap, categoryNameMap, categoryIds を含むオブジェクト
 */
export function createCategoryMaps(categories) {
  const categoryMap = createIdMap(categories);
  const categoryNameMap = new Map();

  categories.forEach((cat) => {
    categoryNameMap.set(cat.id, cat.name);
  });

  const categoryIds = categories.map(cat => cat.id);

  return {
    categoryMap,
    categoryNameMap,
    categoryIds,
  };
}

/**
 * 装備検索用Map生成
 * @param {Array} equipments - ランタイム形式の装備配列（カテゴリ代表を含まない）
 * @returns {Map} equipmentMap
 */
export function createEquipmentMap(equipments) {
  return createIdMap(equipments);
}

/**
 * ランタイム形式 → 永続化形式: カテゴリ
 * @param {Array} runtimeCategories - ランタイム形式のカテゴリ配列
 * @returns {Array} 永続化形式のカテゴリ配列（isMaster除外）
 */
export function toPersistCategories(runtimeCategories) {
  return runtimeCategories.map(({ isMaster, ...cat }) => cat);
}

/**
 * ランタイム形式 → 永続化形式: 装備
 * @param {Array} runtimeEquipments - ランタイム形式の装備配列
 * @returns {Array} 永続化形式の装備配列（isMaster, type除外）
 */
export function toPersistEquipments(runtimeEquipments) {
  return runtimeEquipments.map(({ isMaster, type, ...eq }) => eq);
}

/**
 * ランタイム形式 → 永続化形式: 任務
 * @param {Array} runtimeMissions - ランタイム形式の任務配列
 * @returns {Array} 永続化形式の任務配列（isMaster除外）
 */
export function toPersistMissions(runtimeMissions) {
  return runtimeMissions.map(({ isMaster, ...ms }) => ms);
}
