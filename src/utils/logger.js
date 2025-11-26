/**
 * ログ出力ユーティリティ
 *
 * エラー、警告、情報ログを統一フォーマットで出力する.
 * 将来的にSentryなどのエラートラッキングサービス導入時も、
 * この1箇所を変更するだけで対応可能.
 */

/**
 * エラーログを出力する
 * @param {string} message - エラーメッセージ
 * @param {Object} context - コンテキスト情報（関数名、エラーオブジェクト等）
 */
export function logError(message, context = {}) {
  console.error(`[ERROR] ${message}`, context)
  // 将来的にSentry等に送信する場合はここに追加
  // 例: Sentry.captureException(new Error(message), { extra: context })
}

/**
 * 警告ログを出力する
 * @param {string} message - 警告メッセージ
 * @param {Object} context - コンテキスト情報（関数名、データ等）
 */
export function logWarning(message, context = {}) {
  console.warn(`[WARNING] ${message}`, context)
  // 将来的にSentry等に送信する場合はここに追加
}

/**
 * 情報ログを出力する
 * @param {string} message - 情報メッセージ
 * @param {Object} context - コンテキスト情報
 */
export function logInfo(message, context = {}) {
  console.info(`[INFO] ${message}`, context)
}
