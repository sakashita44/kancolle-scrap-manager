/**
 * ID生成ユーティリティ
 *
 * ユーザー定義データのID生成を一元管理する
 * - 装備ID: u_eq_<UUID>
 * - 任務ID: u_ms_<UUID>
 * - カテゴリID: u_cat_<UUID>
 *
 * @module utils/idGenerator
 */

import { logWarning } from './logger.js';

/**
 * UUID v4を生成（crypto.randomUUID()のフォールバック付き）
 *
 * @returns {string} UUID
 * @private
 */
function generateUUID() {
  // モダンブラウザ: crypto.randomUUID()を使用
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  // フォールバック: 疑似乱数を使用（セキュアではないが動作する）
  logWarning('crypto.randomUUID() is not available. Using fallback method', {
    function: 'generateUUID',
    message: 'セキュアな環境（HTTPS）での使用を推奨します',
  });

  // RFC 4122 v4形式のUUID生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * ユーザー定義装備のIDを生成する
 *
 * @returns {string} u_eq_プレフィックス付きUUID
 * @example
 * generateEquipmentId()
 * // => "u_eq_123e4567-e89b-12d3-a456-426614174000"
 */
export function generateEquipmentId() {
  return `u_eq_${generateUUID()}`
}

/**
 * ユーザー定義任務のIDを生成する
 *
 * @returns {string} u_ms_プレフィックス付きUUID
 * @example
 * generateMissionId()
 * // => "u_ms_123e4567-e89b-12d3-a456-426614174000"
 */
export function generateMissionId() {
  return `u_ms_${generateUUID()}`
}

/**
 * ユーザー定義カテゴリのIDを生成する
 *
 * @returns {string} u_cat_プレフィックス付きUUID
 * @example
 * generateCategoryId()
 * // => "u_cat_123e4567-e89b-12d3-a456-426614174000"
 */
export function generateCategoryId() {
  return `u_cat_${generateUUID()}`
}
