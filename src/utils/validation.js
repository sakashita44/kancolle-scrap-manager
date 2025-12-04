/**
 * バリデーションユーティリティ
 * データ整合性チェック機能
 * @module utils/validation
 */

import { ID_PREFIX, LIMITS, EQUIPMENT_TYPE, PERIOD, TARGET_TYPE } from '../types/schema.js';

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
 * 名前フィールドのバリデーション（XSS対策込み）
 * @param {string} name - 装備名/任務名/カテゴリ名
 * @param {number} maxLength - 最大文字数
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateName(name, maxLength) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '名前は必須です' };
  }

  if (name.length > maxLength) {
    return { valid: false, error: `名前は${maxLength}文字以内で入力してください` };
  }

  if (!isSafeString(name)) {
    return { valid: false, error: 'HTMLタグやスクリプトは使用できません' };
  }

  return { valid: true };
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
  if (!equipment.categoryId) {
    errors.push('categoryId は必須です');
  }
  if (typeof equipment.order !== 'number') {
    errors.push('order は数値である必要があります');
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
  // categoryId は ID なので長さ制限チェックは不要（プレフィックスの形式チェックで十分）

  // XSS対策チェック
  if (equipment.name && !isSafeString(equipment.name)) {
    errors.push('name にHTMLタグやスクリプトは使用できません');
  }
  // categoryId は ID なので XSS チェックは不要

  // order値チェック
  if (typeof equipment.order === 'number') {
    if (!Number.isInteger(equipment.order)) {
      errors.push('order は整数である必要があります');
    }
  }

  // typeフィールドは永続化データに含めない（ランタイムでのみ使用）
  if (equipment.hasOwnProperty('type')) {
    errors.push('type フィールドは保存できません');
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
  if (typeof mission.order !== 'number') {
    errors.push('order は数値である必要があります');
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

  // XSS対策チェック
  if (mission.name && !isSafeString(mission.name)) {
    errors.push('name にHTMLタグやスクリプトは使用できません');
  }

  // period値チェック
  if (mission.period) {
    const validPeriods = Object.values(PERIOD);
    if (!validPeriods.includes(mission.period)) {
      errors.push(`period は ${validPeriods.join(', ')} のいずれかである必要があります`);
    }
  }

  // order値チェック
  if (typeof mission.order === 'number') {
    if (!Number.isInteger(mission.order)) {
      errors.push('order は整数である必要があります');
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
        if (!req.targetType) {
          errors.push(`reqs[${index}].targetType は必須です`);
        } else {
          // targetType値チェック
          const validTargetTypes = Object.values(TARGET_TYPE);
          if (!validTargetTypes.includes(req.targetType)) {
            errors.push(`reqs[${index}].targetType は ${validTargetTypes.join(' または ')} である必要があります`);
          }
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

/**
 * 選択中任務データの妥当性を検証
 * @param {any} data - 検証するデータ
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateSelectedMissions(data) {
  const errors = [];

  // データが存在しない場合は有効（初期値として扱う）
  if (!data) {
    return { valid: true, errors: [] };
  }

  // データがオブジェクトであることを確認
  if (typeof data !== 'object' || Array.isArray(data)) {
    errors.push('選択中任務データはオブジェクトである必要があります');
    return { valid: false, errors };
  }

  // baseMission のバリデーション
  if (data.baseMission !== null && data.baseMission !== undefined) {
    if (typeof data.baseMission !== 'object' || Array.isArray(data.baseMission)) {
      errors.push('baseMission はオブジェクトまたはnullである必要があります');
    } else {
      if (typeof data.baseMission.missionId !== 'string') {
        errors.push('baseMission.missionId は文字列である必要があります');
      }
      if (typeof data.baseMission.count !== 'number') {
        errors.push('baseMission.count は数値である必要があります');
      }
    }
  }

  // auxiliaryMissions のバリデーション
  if (data.auxiliaryMissions !== undefined) {
    if (!Array.isArray(data.auxiliaryMissions)) {
      errors.push('auxiliaryMissions は配列である必要があります');
    } else {
      data.auxiliaryMissions.forEach((mission, index) => {
        if (typeof mission !== 'object' || mission === null || Array.isArray(mission)) {
          errors.push(`auxiliaryMissions[${index}] はオブジェクトである必要があります`);
        } else {
          if (typeof mission.missionId !== 'string') {
            errors.push(`auxiliaryMissions[${index}].missionId は文字列である必要があります`);
          }
          if (typeof mission.count !== 'number') {
            errors.push(`auxiliaryMissions[${index}].count は数値である必要があります`);
          }
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

