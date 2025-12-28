/**
 * 表示用ユーティリティ関数
 * @module utils/displayUtils
 */

/**
 * 削除済みデータの表示ラベル
 */
export const DELETED_LABELS = {
  EQUIPMENT: '削除済み装備',
  CATEGORY: '削除済みカテゴリ',
}

/**
 * 任務要件の表示名を取得
 * @param {object} req - 任務要件 { targetType, targetId, count }
 * @param {Map} categoryMap - カテゴリID→カテゴリオブジェクトのMap
 * @param {Map} equipmentMap - 装備ID→装備オブジェクトのMap
 * @returns {string} 表示名
 */
export function getRequirementDisplayName(req, categoryMap, equipmentMap) {
  if (req.targetType === 'category') {
    const category = categoryMap.get(req.targetId)
    return category ? category.name : DELETED_LABELS.CATEGORY
  } else {
    const equipment = equipmentMap.get(req.targetId)
    return equipment ? equipment.name : DELETED_LABELS.EQUIPMENT
  }
}
