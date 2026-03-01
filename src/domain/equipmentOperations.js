/**
 * Equipment Domain Logic
 *
 * 装備関連のビジネスロジックを集約するモジュール
 * 全ての関数は純粋関数として実装（副作用を持たない）
 */

import { swapItemOrder } from './commonOperations'

/**
 * 2つの装備のorder値を交換した新しい配列を返す（純粋関数）
 *
 * @param {Array} equipments - 装備配列
 * @param {string} id1 - 装備ID 1
 * @param {string} id2 - 装備ID 2
 * @returns {{ nextList: Array, swapped: boolean }} 交換後の配列と成功フラグ
 */
export function swapEquipmentOrder(equipments, id1, id2) {
  return swapItemOrder(equipments, id1, id2)
}
