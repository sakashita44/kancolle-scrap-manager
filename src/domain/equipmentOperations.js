/**
 * Equipment Domain Logic
 *
 * 装備関連のビジネスロジックを集約するモジュール
 */

/**
 * 2つの装備のorder値を交換
 *
 * @param {string} id1 - 装備ID 1
 * @param {string} id2 - 装備ID 2
 * @param {Array} equipments - 装備配列
 * @param {Function} updateEquipment - 装備更新関数
 * @returns {boolean} 交換に成功したかどうか
 */
export function swapEquipmentOrder(id1, id2, equipments, updateEquipment) {
  const eq1 = equipments.find(e => e.id === id1)
  const eq2 = equipments.find(e => e.id === id2)

  if (!eq1 || !eq2) {
    return false
  }

  const tempOrder = eq1.order
  updateEquipment(id1, { ...eq1, order: eq2.order })
  updateEquipment(id2, { ...eq2, order: tempOrder })

  return true
}
