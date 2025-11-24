/**
 * ID生成ユーティリティ
 *
 * ユーザー定義データのID生成を一元管理する
 * - 装備ID: u_eq_<UUID>
 * - 任務ID: u_ms_<UUID>
 *
 * @module utils/idGenerator
 */

/**
 * ユーザー定義装備のIDを生成する
 *
 * @returns {string} u_eq_プレフィックス付きUUID
 * @example
 * generateEquipmentId()
 * // => "u_eq_123e4567-e89b-12d3-a456-426614174000"
 */
export function generateEquipmentId() {
  return `u_eq_${crypto.randomUUID()}`
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
  return `u_ms_${crypto.randomUUID()}`
}
