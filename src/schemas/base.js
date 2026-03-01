/**
 * 共通Zodスキーマ定義
 * 再利用可能な基本スキーマ（XSS対策、IDプレフィックス、数値等）
 * @module schemas/base
 */

import { z } from 'zod';
import { ID_PREFIX, LIMITS } from '../types/schema.js';

/**
 * XSS対策用の危険パターン正規表現
 * HTMLタグやスクリプトを含む文字列を検出
 */
export const DANGEROUS_PATTERN = /<script|<iframe|javascript:|on\w+=/i;

export const safeString = z
  .string({ required_error: '入力は必須です' })
  .min(1, '入力は必須です')
  .refine((val) => !DANGEROUS_PATTERN.test(val), {
    message: 'HTMLタグやスクリプトは使用できません',
  });

/**
 * カテゴリIDスキーマ
 * プレフィックスが推奨レベル（プレフィックスなしも許可）
 */
export const categoryIdSchema = z
  .string({ required_error: 'カテゴリIDは必須です' })
  .min(1, 'カテゴリIDは必須です')
  .refine(
    (val) => {
      // プレフィックスがある場合は、後続文字が必要
      if (
        val.startsWith(ID_PREFIX.MASTER_CATEGORY) ||
        val.startsWith(ID_PREFIX.USER_CATEGORY)
      ) {
        const prefixLength = val.startsWith(ID_PREFIX.MASTER_CATEGORY)
          ? ID_PREFIX.MASTER_CATEGORY.length
          : ID_PREFIX.USER_CATEGORY.length;
        return val.length > prefixLength;
      }
      // プレフィックスなしも許可（既存データとの互換性）
      return true;
    },
    { message: 'カテゴリIDはプレフィックス後に内容が必要です' }
  );

/**
 * 装備IDスキーマ
 * プレフィックスが推奨レベル（プレフィックスなしも許可）
 */
export const equipmentIdSchema = z
  .string({ required_error: '装備IDは必須です' })
  .min(1, '装備IDは必須です')
  .refine(
    (val) => {
      // プレフィックスがある場合は、後続文字が必要
      if (
        val.startsWith(ID_PREFIX.MASTER_EQUIPMENT) ||
        val.startsWith(ID_PREFIX.USER_EQUIPMENT)
      ) {
        const prefixLength = val.startsWith(ID_PREFIX.MASTER_EQUIPMENT)
          ? ID_PREFIX.MASTER_EQUIPMENT.length
          : ID_PREFIX.USER_EQUIPMENT.length;
        return val.length > prefixLength;
      }
      // プレフィックスなしも許可（既存データとの互換性）
      return true;
    },
    { message: '装備IDはプレフィックス後に内容が必要です' }
  );

/**
 * 任務IDスキーマ
 * プレフィックスが推奨レベル（プレフィックスなしも許可）
 */
export const missionIdSchema = z
  .string({ required_error: '任務IDは必須です' })
  .min(1, '任務IDは必須です')
  .refine(
    (val) => {
      // プレフィックスがある場合は、後続文字が必要
      if (
        val.startsWith(ID_PREFIX.MASTER_MISSION) ||
        val.startsWith(ID_PREFIX.USER_MISSION)
      ) {
        const prefixLength = val.startsWith(ID_PREFIX.MASTER_MISSION)
          ? ID_PREFIX.MASTER_MISSION.length
          : ID_PREFIX.USER_MISSION.length;
        return val.length > prefixLength;
      }
      // プレフィックスなしも許可（既存データとの互換性）
      return true;
    },
    { message: '任務IDはプレフィックス後に内容が必要です' }
  );

/**
 * 正の整数スキーマ
 * 0以上の整数値
 */
export const positiveInteger = z
  .number({ required_error: '数値は必須です' })
  .int('整数である必要があります')
  .nonnegative('0以上である必要があります');

/**
 * 配列内の重複検出ヘルパー関数
 * @param {Function} keyFn - 重複チェック用のキー抽出関数
 * @param {string} message - エラーメッセージ
 * @returns {z.ZodEffects} Zodの検証関数
 */
export function uniqueArrayBy(keyFn, message = '重複があります') {
  return (arr) => {
    const keys = arr.map(keyFn);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      // 重複しているキーを特定
      const seen = new Set();
      const duplicates = [];
      for (const key of keys) {
        if (seen.has(key) && !duplicates.includes(key)) {
          duplicates.push(key);
        }
        seen.add(key);
      }
      throw new z.ZodError([
        {
          code: 'custom',
          message: `${message}: ${duplicates.join(', ')}`,
          path: [],
        },
      ]);
    }
    return true;
  };
}
