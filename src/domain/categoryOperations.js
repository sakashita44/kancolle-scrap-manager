/**
 * Category Domain Logic
 *
 * カテゴリ関連のビジネスロジックを集約するモジュール
 */

/**
 * カテゴリのorder値を交換
 *
 * @param {string} id1 - カテゴリID 1
 * @param {string} id2 - カテゴリID 2
 * @param {Array} allCategories - 全カテゴリ配列
 * @param {Function} updateCategory - カテゴリ更新関数
 */
export function swapCategoryOrder(id1, id2, allCategories, updateCategory) {
  const cat1 = allCategories.find(c => c.id === id1)
  const cat2 = allCategories.find(c => c.id === id2)

  if (!cat1 || !cat2) {
    console.warn('カテゴリが見つかりません', { id1, id2 })
    return
  }

  const tempOrder = cat1.order

  updateCategory({ ...cat1, order: cat2.order })
  updateCategory({ ...cat2, order: tempOrder })
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
 * カテゴリ削除確認メッセージを構築
 *
 * @param {Object} impact - 影響分析結果
 * @param {Array} impact.affectedEquipments - 影響を受ける装備配列
 * @param {Array} impact.affectedMissions - 影響を受ける任務配列
 * @param {string} impact.categoryName - カテゴリ名
 * @returns {string} 確認メッセージ
 */
export function buildCategoryDeletionMessage(impact) {
  const { affectedEquipments, affectedMissions, categoryName } = impact
  const messageLines = []

  if (affectedEquipments.length > 0) {
    messageLines.push(`⚠️ このカテゴリ「${categoryName}」に含まれる装備：`)
    affectedEquipments.forEach(eq => {
      messageLines.push(`  • ${eq.name}`)
    })
    messageLines.push(`  計${affectedEquipments.length}件が削除されます`)
    messageLines.push('')
  }

  if (affectedMissions.length > 0) {
    messageLines.push(`⚠️ このカテゴリを参照する任務：`)
    affectedMissions.forEach(ms => {
      messageLines.push(`  • ${ms.name}`)
    })
    messageLines.push(`  計${affectedMissions.length}件の任務に影響があります`)
    messageLines.push(`  （任務は削除されません）`)
  }

  if (messageLines.length === 0) {
    messageLines.push(`カテゴリ「${categoryName}」を削除しますか？`)
  }

  return messageLines.join('\n')
}

/**
 * カテゴリ削除を実行（カスケード削除）
 *
 * カテゴリに含まれる全ての装備を削除した後、カテゴリ自体を削除する
 *
 * @param {string} categoryId - カテゴリID
 * @param {Array} userEquipments - ユーザー装備配列
 * @param {Function} deleteEquipment - 装備削除関数
 * @param {Function} deleteCategory - カテゴリ削除関数
 */
export function executeCategoryDeletion(categoryId, userEquipments, deleteEquipment, deleteCategory) {
  // カテゴリに含まれる装備を全て削除
  const affectedEquipments = userEquipments.filter(eq => eq.categoryId === categoryId)
  affectedEquipments.forEach(eq => {
    deleteEquipment(eq.id)
  })

  // カテゴリを削除
  deleteCategory(categoryId)
}
