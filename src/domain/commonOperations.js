/**
 * 共通ドメインロジック
 *
 * 複数のデータ型で共通のビジネスロジックを集約するモジュール
 * 全ての関数は純粋関数として実装（副作用を持たない）
 */

/**
 * 2つのアイテムのorder値を交換した新しい配列を返す（純粋関数）
 *
 * @param {Array} items - オブジェクト配列
 * @param {string} id1 - アイテムID 1
 * @param {string} id2 - アイテムID 2
 * @returns {{ nextList: Array, swapped: boolean }} 交換後の配列と成功フラグ
 */
export function swapItemOrder(items, id1, id2) {
  const item1 = items.find(i => i.id === id1)
  const item2 = items.find(i => i.id === id2)

  if (!item1 || !item2) {
    return { nextList: items, swapped: false }
  }

  const nextList = items.map(item => {
    if (item.id === id1) return { ...item, order: item2.order }
    if (item.id === id2) return { ...item, order: item1.order }
    return item
  })

  return { nextList, swapped: true }
}
