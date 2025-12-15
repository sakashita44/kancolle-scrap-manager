/**
 * データサニタイズユーティリティ
 * 外部データ（LocalStorage、インポートファイル）の検証・修復機能
 * @module utils/dataSanitizer
 */

/**
 * データの配列を検証・修復する（純粋関数として実装）
 * Parse, don't validateアーキテクチャに基づき、不正なデータを自動除外
 *
 * @param {Array} items - 検証対象の生データ
 * @param {import('zod').ZodSchema} schema - バリデーションスキーマ
 * @returns {Object} { validItems: Array, errors: Array }
 *
 * @example
 * const { validItems, errors } = sanitizeDataList(rawEquipments, persistedEquipmentSchema)
 * if (errors.length > 0) {
 *   console.warn('不正なデータを検出しました:', errors)
 * }
 * setEquipments(validItems)
 */
export function sanitizeDataList(items, schema) {
  const validItems = []
  const errors = []

  // 配列でない場合は空配列として扱う
  if (!Array.isArray(items)) {
    errors.push({
      type: 'invalid_type',
      message: 'データが配列ではありません',
      data: items,
    })
    return { validItems: [], errors }
  }

  // 各アイテムをバリデーション
  items.forEach((item, index) => {
    const result = schema.safeParse(item)

    if (result.success) {
      validItems.push(result.data)
    } else {
      // バリデーション失敗したアイテムの情報を記録
      errors.push({
        index,
        type: 'validation_error',
        message: formatZodError(result.error),
        data: item,
        zodError: result.error,
      })
    }
  })

  return { validItems, errors }
}

/**
 * Zodエラーを人間が読みやすい形式にフォーマット
 * @param {import('zod').ZodError} zodError - Zodエラーオブジェクト
 * @returns {string} フォーマットされたエラーメッセージ
 */
function formatZodError(zodError) {
  const messages = zodError.errors.map((err) => {
    const path = err.path.length > 0 ? `[${err.path.join('.')}]` : ''
    return `${path} ${err.message}`
  })
  return messages.join(', ')
}
