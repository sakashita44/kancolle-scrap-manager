/**
 * Category Domain Logic
 *
 * カテゴリ関連のビジネスロジックを集約するモジュール
 * 全ての関数は純粋関数として実装（副作用を持たない）
 */

/**
 * カテゴリのorder値を交換した新しい配列を返す（純粋関数）
 *
 * @param {Array} categories - カテゴリ配列
 * @param {string} id1 - カテゴリID 1
 * @param {string} id2 - カテゴリID 2
 * @returns {{ nextList: Array, swapped: boolean }} 交換後の配列と成功フラグ
 */
export function swapCategoryOrder(categories, id1, id2) {
  const cat1 = categories.find(c => c.id === id1)
  const cat2 = categories.find(c => c.id === id2)

  if (!cat1 || !cat2) {
    return { nextList: categories, swapped: false }
  }

  const nextList = categories.map(cat => {
    if (cat.id === id1) return { ...cat, order: cat2.order }
    if (cat.id === id2) return { ...cat, order: cat1.order }
    return cat
  })

  return { nextList, swapped: true }
}

/**
 * カテゴリ削除の影響分析
 *
 * @param {string} categoryId - カテゴリID
 * @param {Array} userEquipments - ユーザー装備配列
 * @param {Array} missions - 任務配列
 * @param {Function} getCategoryName - カテゴリ名取得関数
 * @returns {Object} { affectedEquipments, affectedMissions, categoryName }
 */
export function analyzeCategoryDeletionImpact(categoryId, userEquipments, missions, getCategoryName) {
  const affectedEquipments = userEquipments.filter(eq => eq.categoryId === categoryId)

  const affectedMissions = missions.filter(mission =>
    mission.reqs.some(req => req.targetType === 'category' && req.targetId === categoryId)
  )

  const categoryName = getCategoryName(categoryId)

  return {
    affectedEquipments,
    affectedMissions,
    categoryName
  }
}

/**
 * カテゴリ削除後の装備リストを計算（純粋関数）
 *
 * カテゴリに含まれる全ての装備を除外した新しいリストを返す
 * 実際の状態更新は呼び出し側で行う
 *
 * @param {string} categoryId - カテゴリID
 * @param {Array} userEquipments - ユーザー装備配列
 * @returns {{ remainingEquipments: Array, deletedEquipmentIds: Array }} 削除後の装備リストと削除された装備IDリスト
 */
export function calculateCategoryDeletionResult(categoryId, userEquipments) {
  // カテゴリに含まれる装備IDを収集
  const deletedEquipmentIds = userEquipments
    .filter(eq => eq.categoryId === categoryId)
    .map(eq => eq.id)

  // 残すべき装備のみ保持
  const remainingEquipments = userEquipments.filter(eq => eq.categoryId !== categoryId)

  return { remainingEquipments, deletedEquipmentIds }
}
