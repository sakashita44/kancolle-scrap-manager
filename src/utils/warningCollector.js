/**
 * 警告メッセージの収集と管理を行うユーティリティクラス
 * 計算処理中に発生する警告を一元管理し、型安全性とコードの可読性を向上させる
 */
export class WarningCollector {
  constructor() {
    this.warnings = []
  }

  /**
   * 警告レベルのメッセージを追加
   * @param {string} message - 警告メッセージ
   * @param {Object} context - 追加のコンテキスト情報（オプション）
   */
  addWarning(message, context = {}) {
    this.warnings.push({
      type: 'warning',
      message,
      ...context,
    })
  }

  /**
   * エラーレベルのメッセージを追加
   * @param {string} message - エラーメッセージ
   * @param {Object} context - 追加のコンテキスト情報（オプション）
   */
  addError(message, context = {}) {
    this.warnings.push({
      type: 'error',
      message,
      ...context,
    })
  }

  /**
   * 警告が存在するか判定
   * @returns {boolean}
   */
  hasWarnings() {
    return this.warnings.length > 0
  }

  /**
   * エラーレベルのメッセージが存在するか判定
   * @returns {boolean}
   */
  hasErrors() {
    return this.warnings.some((w) => w.type === 'error')
  }

  /**
   * 収集した全警告を取得
   * @returns {Array}
   */
  getWarnings() {
    return this.warnings
  }

  /**
   * 警告数を取得
   * @returns {number}
   */
  count() {
    return this.warnings.length
  }

  /**
   * エラー数を取得
   * @returns {number}
   */
  errorCount() {
    return this.warnings.filter((w) => w.type === 'error').length
  }
}
