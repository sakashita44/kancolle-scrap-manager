/**
 * 廃棄リスト計算ロジック
 * 選択された任務から必要最小限の廃棄装備リストを算出
 * @module domain/scrapCalculation
 */

import { EQUIPMENT_TYPE, LIMITS, TARGET_TYPE } from '../types/schema.js'
import { WarningCollector } from '../utils/warningCollector.js'

/**
 * 廃棄リストを計算
 * @param {string[]} selectedMissionIds - 選択中の任務IDリスト
 * @param {Object[]} allMissions - 全任務データ
 * @param {Map} equipmentMap - 装備検索用Map（カテゴリ代表は含まない）
 * @param {Map} categoryMap - カテゴリ検索用Map
 * @returns {Object} { scrapList: 廃棄リスト, warnings: 警告情報 }
 */
export function calculateScrapList(selectedMissionIds, allMissions, equipmentMap, categoryMap) {
  const collector = new WarningCollector()

  // フェーズ1: 事前チェック
  if (!selectedMissionIds || selectedMissionIds.length === 0) {
    return { scrapList: [], warnings: [] }
  }

  if (selectedMissionIds.length > LIMITS.SELECTED_MISSIONS_MAX) {
    collector.addError(`選択可能な任務数は最大${LIMITS.SELECTED_MISSIONS_MAX}件です`)
    return { scrapList: [], warnings: collector.getWarnings() }
  }

  // フェーズ2: 要求装備の展開
  const allRequirements = expandRequirements(
    selectedMissionIds,
    allMissions,
    collector
  )

  // フェーズ2.5: 整合性チェック
  const validRequirements = validateRequirements(
    allRequirements,
    equipmentMap,
    categoryMap,
    collector
  )

  if (validRequirements.length === 0) {
    return { scrapList: [], warnings: collector.getWarnings() }
  }

  // フェーズ3: 装備種別ごとにグループ化（targetTypeで判定）
  const { itemRequirements, categoryRequirements } = groupByType(validRequirements);

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
    categoryMap
  )

  return { scrapList, warnings: collector.getWarnings() }
}

/**
 * フェーズ2: 要求装備の展開
 * @private
 */
function expandRequirements(selectedMissionIds, allMissions, collector) {
  const allRequirements = []

  for (const missionId of selectedMissionIds) {
    const mission = allMissions.find((m) => m.id === missionId)

    if (!mission) {
      collector.addWarning(`任務ID "${missionId}" が見つかりません`, { missionId })
      continue
    }

    if (!mission.reqs || mission.reqs.length === 0) {
      continue
    }

    for (const req of mission.reqs) {
      allRequirements.push({
        missionId: mission.id,
        missionName: mission.name,
        targetId: req.targetId,
        targetType: req.targetType,
        count: req.count,
      })
    }
  }

  return allRequirements
}

/**
 * フェーズ2.5: 整合性チェック
 * @private
 */
function validateRequirements(allRequirements, equipmentMap, categoryMap, collector) {
  return allRequirements.filter((req) => {
    if (req.targetType === TARGET_TYPE.CATEGORY) {
      // カテゴリMapから検索
      const category = categoryMap.get(req.targetId)
      if (!category) {
        collector.addWarning(
          `カテゴリID "${req.targetId}" が存在しません`,
          { missionId: req.missionId, missionName: req.missionName }
        )
        return false
      }
    } else {  // targetType === 'item'
      // 装備Mapから検索
      const equipment = equipmentMap.get(req.targetId)
      if (!equipment) {
        collector.addWarning(
          `装備ID "${req.targetId}" が存在しません`,
          { missionId: req.missionId, missionName: req.missionName }
        )
        return false
      }
    }

    return true
  })
}

/**
 * フェーズ3: 装備種別ごとにグループ化（targetTypeで判定）
 * @private
 */
function groupByType(validRequirements) {
  const itemRequirements = [];
  const categoryRequirements = [];

  for (const req of validRequirements) {
    if (req.targetType === TARGET_TYPE.CATEGORY) {
      categoryRequirements.push(req);
    } else {  // targetType === 'item'
      itemRequirements.push(req);
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
  // categoryCountMapのキーはカテゴリID
  for (const [categoryId, categoryCount] of categoryCountMap) {
    // 同じカテゴリのItem要求の合計を計算
    let itemTotalInCategory = 0;
    for (const [itemTargetId, itemCount] of itemCountMap) {
      const itemEquipment = equipmentMap.get(itemTargetId);
      if (itemEquipment && itemEquipment.categoryId === categoryId) {
        itemTotalInCategory += itemCount;
      }
    }

    // カテゴリ要求数からItem合計を差し引く
    const remaining = categoryCount - itemTotalInCategory;

    if (remaining <= 0) {
      // Itemだけで満たされるのでカテゴリ要求は不要
      categoryCountMap.delete(categoryId);
    } else {
      // 残数を更新
      categoryCountMap.set(categoryId, remaining);
    }
  }
}

/**
 * フェーズ7: 廃棄リストの生成
 * @private
 */
function generateScrapList(itemCountMap, categoryCountMap, equipmentMap, categoryMap) {
  const scrapList = [];

  // Item要求を追加
  for (const [equipmentId, count] of itemCountMap) {
    const equipment = equipmentMap.get(equipmentId);
    if (equipment) {
      const category = categoryMap.get(equipment.categoryId);
      const categoryName = category ? category.name : equipment.categoryId;
      scrapList.push({
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        category: categoryName,
        count: count,
        type: EQUIPMENT_TYPE.ITEM,
      });
    }
  }

  // Category要求を追加（カテゴリ代表として動的生成）
  for (const [categoryId, count] of categoryCountMap) {
    const category = categoryMap.get(categoryId);
    if (category) {
      scrapList.push({
        equipmentId: categoryId,               // カテゴリIDをそのまま使用
        equipmentName: category.name + '（種別不問）',
        category: category.name,
        count: count,
        type: EQUIPMENT_TYPE.CATEGORY,
      });
    }
  }

  // カテゴリ名でソート
  scrapList.sort((a, b) => a.category.localeCompare(b.category, 'ja'));

  return scrapList;
}
