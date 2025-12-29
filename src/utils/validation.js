/**
 * バリデーションユーティリティ
 * データ整合性チェック機能
 * @module utils/validation
 */

import { ID_PREFIX } from '../types/schema.js';
import {
  persistedEquipmentSchema,
  persistedMissionSchema,
  selectedMissionsSchema,
  safeString,
} from '../schemas/index.js';

/**
 * 危険な文字列パターンを検出（XSS対策）
 * @param {string} value - 検証する文字列
 * @returns {boolean} 安全な場合true
 */
export function isSafeString(value) {
  const dangerousPattern = /<script|<iframe|javascript:|on\w+=/i;
  return !dangerousPattern.test(value);
}


/**
 * 装備IDが存在するか確認
 * @param {string} equipmentId - 装備ID
 * @param {Object[]} equipments - 装備データ配列
 * @returns {boolean} 存在する場合true
 */
export function validateEquipmentExists(equipmentId, equipments) {
  return equipments.some((eq) => eq.id === equipmentId);
}

/**
 * 任務IDが存在するか確認
 * @param {string} missionId - 任務ID
 * @param {Object[]} missions - 任務データ配列
 * @returns {boolean} 存在する場合true
 */
export function validateMissionExists(missionId, missions) {
  return missions.some((ms) => ms.id === missionId);
}

/**
 * IDの一意性を確認
 * @param {string} id - チェックするID
 * @param {Object[]} existingItems - 既存のデータ配列
 * @returns {boolean} 一意の場合true（重複がない場合true）
 */
export function validateUniqueId(id, existingItems) {
  return !existingItems.some((item) => item.id === id);
}

/**
 * 名前の一意性を確認
 * @param {string} name - チェックする名前
 * @param {Object[]} existingItems - 既存のデータ配列
 * @returns {boolean} 一意の場合true（重複がない場合true）
 */
export function validateUniqueName(name, existingItems) {
  return !existingItems.some((item) => item.name === name);
}

/**
 * 配列内でIDの重複がないかチェック
 * @param {Object[]} items - チェックするデータ配列
 * @returns {Object} { valid: boolean, duplicates: string[] }
 */
export function validateNoDuplicateIds(items) {
  const idSet = new Set();
  const duplicates = [];

  for (const item of items) {
    if (idSet.has(item.id)) {
      duplicates.push(item.id);
    } else {
      idSet.add(item.id);
    }
  }

  return {
    valid: duplicates.length === 0,
    duplicates,
  };
}

/**
 * 配列内で名前の重複がないかチェック
 * @param {Object[]} items - チェックするデータ配列
 * @returns {Object} { valid: boolean, duplicates: string[] }
 */
export function validateNoDuplicateNames(items) {
  const nameSet = new Set();
  const duplicates = [];

  for (const item of items) {
    if (nameSet.has(item.name)) {
      duplicates.push(item.name);
    } else {
      nameSet.add(item.name);
    }
  }

  return {
    valid: duplicates.length === 0,
    duplicates,
  };
}



/**
 * ユーザー定義装備IDの妥当性チェック
 * プレフィックスが正しく、ID部分が空でなければ有効
 * @param {string} equipmentId - 装備ID
 * @returns {boolean} 妥当な場合true
 */
export function isValidUserEquipmentId(equipmentId) {
  if (!equipmentId.startsWith(ID_PREFIX.USER_EQUIPMENT)) {
    return false;
  }
  const idPart = equipmentId.substring(ID_PREFIX.USER_EQUIPMENT.length);
  return idPart.length > 0;
}

/**
 * ユーザー定義任務IDの妥当性チェック
 * プレフィックスが正しく、ID部分が空でなければ有効
 * @param {string} missionId - 任務ID
 * @returns {boolean} 妥当な場合true
 */
export function isValidUserMissionId(missionId) {
  if (!missionId.startsWith(ID_PREFIX.USER_MISSION)) {
    return false;
  }
  const idPart = missionId.substring(ID_PREFIX.USER_MISSION.length);
  return idPart.length > 0;
}

// ==================== Zodベースバリデーション関数（ネイティブ形式） ====================

/**
 * 装備データの妥当性を検証（Zodネイティブ形式）
 * @param {Object} equipment - 装備データ
 * @returns {import('zod').SafeParseReturnType} Zodの検証結果（{ success: boolean, data?: T, error?: ZodError }）
 */
export function validateEquipment(equipment) {
  return persistedEquipmentSchema.safeParse(equipment);
}

/**
 * 任務データの妥当性を検証（Zodネイティブ形式）
 * @param {Object} mission - 任務データ
 * @returns {import('zod').SafeParseReturnType} Zodの検証結果（{ success: boolean, data?: T, error?: ZodError }）
 */
export function validateMission(mission) {
  return persistedMissionSchema.safeParse(mission);
}

/**
 * 選択中任務データの妥当性を検証（Zodネイティブ形式）
 * @param {any} data - 検証するデータ
 * @returns {import('zod').SafeParseReturnType} Zodの検証結果（{ success: boolean, data?: T, error?: ZodError }）
 */
export function validateSelectedMissions(data) {
  return selectedMissionsSchema.safeParse(data);
}

/**
 * 名前フィールドのバリデーション（Zodネイティブ形式、XSS対策込み）
 * @param {string} name - 装備名/任務名/カテゴリ名
 * @param {number} maxLength - 最大文字数
 * @returns {import('zod').SafeParseReturnType} Zodの検証結果（{ success: boolean, data?: T, error?: ZodError }）
 */
export function validateName(name, maxLength) {
  const schema = safeString.max(maxLength, `名前は${maxLength}文字以内で入力してください`);
  return schema.safeParse(name);
}

