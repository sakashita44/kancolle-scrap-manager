/**
 * 廃棄リスト計算ロジック
 * 選択された任務から必要最小限の廃棄装備リストを算出
 * @module utils/calculateScrapList
 */

import { EQUIPMENT_TYPE, LIMITS } from '../types/schema.js';

/**
 * 廃棄リストを計算
 * @param {string[]} selectedMissionIds - 選択中の任務IDリスト
 * @param {Object[]} allMissions - 全任務データ
 * @param {Object[]} allEquipments - 全装備データ
 * @returns {Object} { scrapList: 廃棄リスト, warnings: 警告情報 }
 */
export function calculateScrapList(selectedMissionIds, allMissions, allEquipments) {
  const warnings = [];

  // フェーズ1: 事前チェック
  if (!selectedMissionIds || selectedMissionIds.length === 0) {
    return { scrapList: [], warnings: [] };
  }

  if (selectedMissionIds.length > LIMITS.SELECTED_MISSIONS_MAX) {
    warnings.push({
      type: 'error',
      message: `選択可能な任務数は最大${LIMITS.SELECTED_MISSIONS_MAX}件です`,
    });
    return { scrapList: [], warnings };
  }

  // 装備検索の高速化: Map生成 (O(n) → O(1)アクセス)
  const equipmentMap = new Map(allEquipments.map((eq) => [eq.id, eq]));

  // カテゴリIDからカテゴリ名への変換Map (type: "Category"の装備のnameを使用)
  const categoryNameMap = new Map();
  allEquipments.forEach((eq) => {
    if (eq.type === EQUIPMENT_TYPE.CATEGORY) {
      categoryNameMap.set(eq.categoryId, eq.name);
    }
  });

  // フェーズ2: 要求装備の展開
  const allRequirements = expandRequirements(
    selectedMissionIds,
    allMissions,
    warnings
  );

  // フェーズ2.5: 整合性チェック
  const validRequirements = validateRequirements(
    allRequirements,
    equipmentMap,
    warnings
  );

  if (validRequirements.length === 0) {
    return { scrapList: [], warnings };
  }

  // フェーズ3: 装備種別ごとにグループ化
  const { itemRequirements, categoryRequirements } = groupByType(
    validRequirements,
    equipmentMap
  );

  // フェーズ4: Item要求のMAX集計
  const itemCountMap = aggregateByMax(itemRequirements);

  // フェーズ5: Category要求のMAX集計
  const categoryCountMap = aggregateByMax(categoryRequirements);

  // フェーズ6: 包含関係の解決(OR条件)
  resolveInclusion(itemCountMap, categoryCountMap, equipmentMap);

  // フェーズ7: 廃棄リストの生成
  const scrapList = generateScrapList(
    itemCountMap,
    categoryCountMap,
    equipmentMap,
    categoryNameMap
  );

  return { scrapList, warnings };
}

/**
 * フェーズ2: 要求装備の展開
 * @private
 */
function expandRequirements(selectedMissionIds, allMissions, warnings) {
  const allRequirements = [];

  for (const missionId of selectedMissionIds) {
    const mission = allMissions.find((m) => m.id === missionId);

    if (!mission) {
      warnings.push({
        type: 'warning',
        missionId,
        message: `任務ID "${missionId}" が見つかりません`,
      });
      continue;
    }

    if (!mission.reqs || mission.reqs.length === 0) {
      continue;
    }

    for (const req of mission.reqs) {
      allRequirements.push({
        missionId: mission.id,
        missionName: mission.name,
        targetId: req.targetId,
        count: req.count,
      });
    }
  }

  return allRequirements;
}

/**
 * フェーズ2.5: 整合性チェック
 * @private
 */
function validateRequirements(allRequirements, equipmentMap, warnings) {
  return allRequirements.filter((req) => {
    const equipment = equipmentMap.get(req.targetId);

    if (!equipment) {
      warnings.push({
        type: 'warning',
        missionId: req.missionId,
        missionName: req.missionName,
        message: `装備ID "${req.targetId}" が存在しません`,
      });
      return false;
    }

    return true;
  });
}

/**
 * フェーズ3: 装備種別ごとにグループ化
 * @private
 */
function groupByType(validRequirements, equipmentMap) {
  const itemRequirements = [];
  const categoryRequirements = [];

  for (const req of validRequirements) {
    const equipment = equipmentMap.get(req.targetId);

    if (equipment.type === EQUIPMENT_TYPE.ITEM) {
      itemRequirements.push(req);
    } else if (equipment.type === EQUIPMENT_TYPE.CATEGORY) {
      categoryRequirements.push(req);
    }
  }

  return { itemRequirements, categoryRequirements };
}

/**
 * フェーズ4/5: MAX集計
 * @private
 */
function aggregateByMax(requirements) {
  const countMap = new Map();

  for (const req of requirements) {
    const currentMax = countMap.get(req.targetId) || 0;
    countMap.set(req.targetId, Math.max(currentMax, req.count));
  }

  return countMap;
}

/**
 * フェーズ6: 包含関係の解決(OR条件)
 * @private
 */
function resolveInclusion(itemCountMap, categoryCountMap, equipmentMap) {
  for (const [categoryTargetId, categoryCount] of categoryCountMap) {
    const categoryEquipment = equipmentMap.get(categoryTargetId);

    if (!categoryEquipment) {
      continue;
    }

    const categoryName = categoryEquipment.category;

    // 同じカテゴリのItem要求の合計を計算
    let itemTotalInCategory = 0;
    for (const [itemTargetId, itemCount] of itemCountMap) {
      const itemEquipment = equipmentMap.get(itemTargetId);
      if (itemEquipment && itemEquipment.category === categoryName) {
        itemTotalInCategory += itemCount;
      }
    }

    // カテゴリ要求数からItem合計を差し引く
    const remaining = categoryCount - itemTotalInCategory;

    if (remaining <= 0) {
      // Itemだけで満たされるのでカテゴリ要求は不要
      categoryCountMap.delete(categoryTargetId);
    } else {
      // 残数を更新
      categoryCountMap.set(categoryTargetId, remaining);
    }
  }
}

/**
 * フェーズ7: 廃棄リストの生成
 * @private
 */
function generateScrapList(itemCountMap, categoryCountMap, equipmentMap, categoryNameMap) {
  const scrapList = [];

  // Item要求を追加
  for (const [equipmentId, count] of itemCountMap) {
    const equipment = equipmentMap.get(equipmentId);
    if (equipment) {
      const categoryName = categoryNameMap.get(equipment.categoryId) || equipment.categoryId;
      scrapList.push({
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        category: categoryName,
        count: count,
        type: equipment.type,
      });
    }
  }

  // Category要求を追加
  for (const [equipmentId, count] of categoryCountMap) {
    const equipment = equipmentMap.get(equipmentId);
    if (equipment) {
      const categoryName = categoryNameMap.get(equipment.categoryId) || equipment.categoryId;
      scrapList.push({
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        category: categoryName,
        count: count,
        type: equipment.type,
      });
    }
  }

  // カテゴリ名でソート
  scrapList.sort((a, b) => a.category.localeCompare(b.category, 'ja'));

  return scrapList;
}
