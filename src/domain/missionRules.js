/**
 * Mission Domain Logic
 *
 * 任務関連のビジネスロジックを集約するモジュール
 * 全ての関数は純粋関数として実装（副作用を持たない）
 */

/**
 * 保存用の任務オブジェクトを準備する（純粋関数）
 *
 * @param {Object} formData - フォームからの入力データ
 * @param {Object} options - オプション
 * @param {string} options.newId - 新規の場合に使用するID
 * @param {number} options.nextOrder - 新規の場合に使用するorder
 * @returns {{ mission: Object, isNew: boolean }} 保存用任務データと新規フラグ
 */
export function prepareMissionForSave(formData, { newId, nextOrder }) {
  const isNew = !formData.id

  if (isNew) {
    return {
      mission: {
        ...formData,
        id: newId,
        order: nextOrder
      },
      isNew: true
    }
  }

  // 編集の場合はformDataをそのまま返す（id, orderは既存のものを維持）
  return {
    mission: formData,
    isNew: false
  }
}
