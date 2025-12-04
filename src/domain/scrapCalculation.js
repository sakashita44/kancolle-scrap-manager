/**
 * 廃棄リスト計算ロジック
 * 選択された任務から必要最小限の廃棄装備リストを算出
 * @module domain/scrapCalculation
 */

import { EQUIPMENT_TYPE, LIMITS, TARGET_TYPE } from '../types/schema.js'
import { WarningCollector } from '../utils/warningCollector.js'

/**
 * 廃棄リストを計算（従来の計算ロジック、補助任務用）
 * @param {Array<{missionId: string, count: number}>} selectedMissions - 選択中の任務リスト（実行回数含む）
 * @param {Object[]} allMissions - 全任務データ
 * @param {Map} equipmentMap - 装備検索用Map（カテゴリ代表は含まない）
 * @param {Map} categoryMap - カテゴリ検索用Map
 * @returns {Object} { scrapList: 廃棄リスト, warnings: 警告情報 }
 */
export function calculateScrapList(selectedMissions, allMissions, equipmentMap, categoryMap) {
  const collector = new WarningCollector()

  // フェーズ1: 事前チェック
  if (!selectedMissions || selectedMissions.length === 0) {
    return { scrapList: [], warnings: [] }
  }

  if (selectedMissions.length > LIMITS.SELECTED_MISSIONS_MAX) {
    collector.addError(`選択可能な任務数は最大${LIMITS.SELECTED_MISSIONS_MAX}件です`)
    return { scrapList: [], warnings: collector.getWarnings() }
  }

  // フェーズ2: 要求装備の展開
  const allRequirements = expandRequirements(
    selectedMissions,
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
function expandRequirements(selectedMissions, allMissions, collector) {
  const allRequirements = []

  for (const selected of selectedMissions) {
    const mission = allMissions.find((m) => m.id === selected.missionId)

    if (!mission) {
      collector.addWarning(`任務ID "${selected.missionId}" が見つかりません`, { missionId: selected.missionId })
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
        count: req.count * selected.count, // 実行回数を乗算
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

/**
 * ベース任務と補助任務の過不足を計算
 * @param {{baseMission: {missionId: string, count: number} | null, auxiliaryMissions: Array<{missionId: string, count: number}>}} selectedMissions - 選択中の任務（ベース/補助分離）
 * @param {Object[]} allMissions - 全任務データ
 * @param {Map} equipmentMap - 装備検索用Map（カテゴリ代表は含まない）
 * @param {Map} categoryMap - カテゴリ検索用Map
 * @returns {Object} { baseRequirements: ベース任務の必要数, auxiliaryScrapList: 補助任務の廃棄リスト, comparison: 過不足, warnings: 警告情報 }
 */
export function calculateScrapComparison(selectedMissions, allMissions, equipmentMap, categoryMap) {
  const warnings = [];

  // ベース任務がない場合
  if (!selectedMissions.baseMission) {
    // 補助任務のみの廃棄リストを計算
    const auxiliaryResult = calculateScrapList(
      selectedMissions.auxiliaryMissions,
      allMissions,
      equipmentMap,
      categoryMap
    );

    return {
      baseRequirements: [],
      auxiliaryScrapList: auxiliaryResult.scrapList,
      comparison: [],
      warnings: auxiliaryResult.warnings,
    };
  }

  // ベース任務の必要数を計算
  const baseResult = calculateScrapList(
    [selectedMissions.baseMission],
    allMissions,
    equipmentMap,
    categoryMap
  );

  // 補助任務の廃棄リストを計算
  const auxiliaryResult = calculateScrapList(
    selectedMissions.auxiliaryMissions,
    allMissions,
    equipmentMap,
    categoryMap
  );

  // 過不足を計算
  const comparison = calculateDifference(
    baseResult.scrapList,
    auxiliaryResult.scrapList,
    equipmentMap
  );

  // 警告をマージ
  const allWarnings = [...baseResult.warnings, ...auxiliaryResult.warnings];

  return {
    baseRequirements: baseResult.scrapList,
    auxiliaryScrapList: auxiliaryResult.scrapList,
    comparison,
    warnings: allWarnings,
  };
}

/**
 * ベース任務と補助任務の過不足を計算
 * @private
 * @param {Array} baseRequirements - ベース任務の必要数
 * @param {Array} auxiliaryScrapList - 補助任務の廃棄リスト
 * @param {Map} equipmentMap - 装備検索用Map
 * @returns {Array} 過不足リスト
 */
function calculateDifference(baseRequirements, auxiliaryScrapList, equipmentMap) {
  const comparison = [];

  // ベース任務の各要求に対して、補助任務での廃棄数を比較
  for (const baseReq of baseRequirements) {
    // 同じ装備IDの補助任務廃棄数を検索
    let auxiliaryCount = 0;

    if (baseReq.type === EQUIPMENT_TYPE.ITEM) {
      // Item要求の場合、同じ装備IDを探す
      const auxItem = auxiliaryScrapList.find((aux) => aux.equipmentId === baseReq.equipmentId);
      if (auxItem) {
        auxiliaryCount = auxItem.count;
      }
    } else {
      // Category要求の場合、同じカテゴリIDまたは同じカテゴリ内のアイテムの合計を計算
      const categoryId = baseReq.equipmentId; // カテゴリ代表のequipmentIdはカテゴリID

      // 同じカテゴリの代表を探す
      const auxCategory = auxiliaryScrapList.find(
        (aux) => aux.type === EQUIPMENT_TYPE.CATEGORY && aux.equipmentId === categoryId
      );
      if (auxCategory) {
        auxiliaryCount += auxCategory.count;
      }

      // 同じカテゴリ内のItem要求の合計を加算
      for (const auxItem of auxiliaryScrapList) {
        if (auxItem.type === EQUIPMENT_TYPE.ITEM) {
          const equipment = equipmentMap.get(auxItem.equipmentId);
          if (equipment && equipment.categoryId === categoryId) {
            auxiliaryCount += auxItem.count;
          }
        }
      }
    }

    // 過不足を計算
    const difference = auxiliaryCount - baseReq.count;

    comparison.push({
      equipmentId: baseReq.equipmentId,
      equipmentName: baseReq.equipmentName,
      category: baseReq.category,
      type: baseReq.type,
      baseCount: baseReq.count,
      auxiliaryCount,
      difference, // 正の値=過剰、負の値=不足
      status: difference >= 0 ? 'sufficient' : 'insufficient',
    });
  }

  // 補助任務にのみ存在する装備を追加（ベース任務にない装備）
  for (const auxItem of auxiliaryScrapList) {
    // ベース任務に同じ装備が存在するかチェック
    const existsInBase = baseRequirements.some((baseReq) => {
      if (baseReq.type === EQUIPMENT_TYPE.ITEM && auxItem.type === EQUIPMENT_TYPE.ITEM) {
        return baseReq.equipmentId === auxItem.equipmentId;
      }
      if (baseReq.type === EQUIPMENT_TYPE.CATEGORY && auxItem.type === EQUIPMENT_TYPE.CATEGORY) {
        return baseReq.equipmentId === auxItem.equipmentId;
      }
      if (baseReq.type === EQUIPMENT_TYPE.CATEGORY && auxItem.type === EQUIPMENT_TYPE.ITEM) {
        const equipment = equipmentMap.get(auxItem.equipmentId);
        return equipment && equipment.categoryId === baseReq.equipmentId;
      }
      return false;
    });

    if (!existsInBase) {
      comparison.push({
        equipmentId: auxItem.equipmentId,
        equipmentName: auxItem.equipmentName,
        category: auxItem.category,
        type: auxItem.type,
        baseCount: 0,
        auxiliaryCount: auxItem.count,
        difference: auxItem.count,
        status: 'excess', // ベース任務には不要だが補助任務で廃棄される
      });
    }
  }

  // カテゴリ名でソート
  comparison.sort((a, b) => a.category.localeCompare(b.category, 'ja'));

  return comparison;
}
