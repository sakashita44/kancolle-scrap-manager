/**
 * 廃棄リストの変換ユーティリティ
 * @module utils/scrapListFormatters
 */

import { EQUIPMENT_TYPE } from '../types/schema.js'

/**
 * 廃棄リストをカテゴリごとにグループ化
 *
 * ScrapListItem[]（基本形式）をCategoryGroup[]（UI表示用の集計形式）に変換する.
 * - Item型の装備は個別アイテムリストに追加
 * - Category型の装備はremainder（カテゴリ代表の数）として扱う
 * - totalCountはItem型とCategory型の合計
 *
 * @param {import('../types/schema').ScrapListItem[]} scrapList - 廃棄リスト
 * @returns {import('../types/schema').CategoryGroup[]} カテゴリ別グループ
 */
export function groupScrapListByCategory(scrapList) {
  const categoryMap = new Map()

  scrapList.forEach(item => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, {
        categoryName: item.category,
        totalCount: 0,
        items: [],
        remainder: 0
      })
    }

    const categoryData = categoryMap.get(item.category)
    if (item.type === EQUIPMENT_TYPE.ITEM) {
      categoryData.items.push({
        name: item.equipmentName,
        count: item.count
      })
      categoryData.totalCount += item.count
    } else {
      categoryData.remainder = item.count
      categoryData.totalCount += item.count
    }
  })

  return Array.from(categoryMap.values())
}

/**
 * カテゴリ別の総数を計算
 *
 * @param {import('../types/schema').ScrapListItem[]} scrapList - 廃棄リスト
 * @returns {Map<string, number>} カテゴリ名 -> 総数のマップ
 */
export function calculateCategoryTotals(scrapList) {
  const totals = new Map()

  scrapList.forEach(item => {
    const currentTotal = totals.get(item.category) || 0
    totals.set(item.category, currentTotal + item.count)
  })

  return totals
}
