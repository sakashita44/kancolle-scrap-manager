/**
 * バリデーションユーティリティ
 * データ整合性チェック機能
 * @module utils/validation
 */

import { ID_PREFIX, LIMITS, EQUIPMENT_TYPE, PERIOD } from '../types/schema.js';

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
 * 装備データの妥当性を検証
 * @param {Object} equipment - 装備データ
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateEquipment(equipment) {
  const errors = [];

  // 必須フィールドチェック
  if (!equipment.id) {
    errors.push('id は必須です');
  }
  if (!equipment.name) {
    errors.push('name は必須です');
  }
  if (!equipment.category) {
    errors.push('category は必須です');
  }
  if (!equipment.type) {
    errors.push('type は必須です');
  }

  // ID形式チェック
  if (equipment.id) {
    const hasValidPrefix =
      equipment.id.startsWith(ID_PREFIX.MASTER_EQUIPMENT) ||
      equipment.id.startsWith(ID_PREFIX.USER_EQUIPMENT);

    if (!hasValidPrefix) {
      errors.push(
        `id は "${ID_PREFIX.MASTER_EQUIPMENT}" または "${ID_PREFIX.USER_EQUIPMENT}" で始まる必要があります`
      );
    }

    // ユーザー定義IDの場合、プレフィックス後が空でないことをチェック
    if (equipment.id.startsWith(ID_PREFIX.USER_EQUIPMENT)) {
      if (!isValidUserEquipmentId(equipment.id)) {
        errors.push('ユーザー定義装備のIDはプレフィックス後に内容が必要です');
      }
    }
  }

  // 文字数制限チェック
  if (equipment.name && equipment.name.length > LIMITS.EQUIPMENT_NAME_MAX) {
    errors.push(`name は${LIMITS.EQUIPMENT_NAME_MAX}文字以内にしてください`);
  }
  if (equipment.category && equipment.category.length > LIMITS.CATEGORY_NAME_MAX) {
    errors.push(`category は${LIMITS.CATEGORY_NAME_MAX}文字以内にしてください`);
  }

  // type値チェック
  if (equipment.type) {
    const validTypes = Object.values(EQUIPMENT_TYPE);
    if (!validTypes.includes(equipment.type)) {
      errors.push(`type は ${validTypes.join(' または ')} である必要があります`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 任務データの妥当性を検証
 * @param {Object} mission - 任務データ
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateMission(mission) {
  const errors = [];

  // 必須フィールドチェック
  if (!mission.id) {
    errors.push('id は必須です');
  }
  if (!mission.name) {
    errors.push('name は必須です');
  }
  if (!mission.period) {
    errors.push('period は必須です');
  }
  if (!mission.reqs) {
    errors.push('reqs は必須です');
  }

  // ID形式チェック
  if (mission.id) {
    const hasValidPrefix =
      mission.id.startsWith(ID_PREFIX.MASTER_MISSION) ||
      mission.id.startsWith(ID_PREFIX.USER_MISSION);

    if (!hasValidPrefix) {
      errors.push(
        `id は "${ID_PREFIX.MASTER_MISSION}" または "${ID_PREFIX.USER_MISSION}" で始まる必要があります`
      );
    }

    // ユーザー定義IDの場合、プレフィックス後が空でないことをチェック
    if (mission.id.startsWith(ID_PREFIX.USER_MISSION)) {
      if (!isValidUserMissionId(mission.id)) {
        errors.push('ユーザー定義任務のIDはプレフィックス後に内容が必要です');
      }
    }
  }

  // 文字数制限チェック
  if (mission.name && mission.name.length > LIMITS.MISSION_NAME_MAX) {
    errors.push(`name は${LIMITS.MISSION_NAME_MAX}文字以内にしてください`);
  }

  // period値チェック
  if (mission.period) {
    const validPeriods = Object.values(PERIOD);
    if (!validPeriods.includes(mission.period)) {
      errors.push(`period は ${validPeriods.join(', ')} のいずれかである必要があります`);
    }
  }

  // reqs配列チェック
  if (mission.reqs) {
    if (!Array.isArray(mission.reqs)) {
      errors.push('reqs は配列である必要があります');
    } else {
      if (mission.reqs.length === 0) {
        errors.push('reqs は少なくとも1件必要です');
      }
      if (mission.reqs.length > LIMITS.REQUIREMENTS_PER_MISSION_MAX) {
        errors.push(
          `reqs は最大${LIMITS.REQUIREMENTS_PER_MISSION_MAX}件までです`
        );
      }

      // 各要求装備の検証
      mission.reqs.forEach((req, index) => {
        if (!req.id) {
          errors.push(`reqs[${index}].id は必須です`);
        }
        if (!req.targetId) {
          errors.push(`reqs[${index}].targetId は必須です`);
        }
        if (typeof req.count !== 'number') {
          errors.push(`reqs[${index}].count は数値である必要があります`);
        } else {
          if (req.count < LIMITS.REQUIREMENT_COUNT_MIN) {
            errors.push(
              `reqs[${index}].count は${LIMITS.REQUIREMENT_COUNT_MIN}以上である必要があります`
            );
          }
          if (req.count > LIMITS.REQUIREMENT_COUNT_MAX) {
            errors.push(
              `reqs[${index}].count は${LIMITS.REQUIREMENT_COUNT_MAX}以下である必要があります`
            );
          }
        }
      });

      // targetIdの重複チェック
      const targetIdSet = new Set();
      const duplicateTargetIds = [];
      mission.reqs.forEach((req) => {
        if (req.targetId) {
          if (targetIdSet.has(req.targetId)) {
            if (!duplicateTargetIds.includes(req.targetId)) {
              duplicateTargetIds.push(req.targetId);
            }
          } else {
            targetIdSet.add(req.targetId);
          }
        }
      });
      if (duplicateTargetIds.length > 0) {
        errors.push(
          `reqs 内で targetId が重複しています: ${duplicateTargetIds.join(', ')}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
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
