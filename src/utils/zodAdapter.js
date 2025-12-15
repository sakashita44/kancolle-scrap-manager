/**
 * Zodバリデーション結果を既存の戻り値形式に変換するアダプター
 * 段階的移行のため、既存コードとの互換性を維持
 * @module utils/zodAdapter
 *
 * NOTE: Zod v4では error.errors → error.issues に変更されている
 */

import { ZodError } from 'zod';

/**
 * Zodの検証結果を { valid: boolean, errors: string[] } 形式に変換
 * @param {z.ZodSchema} schema - Zodスキーマ
 * @param {any} data - 検証するデータ
 * @returns {{ valid: boolean, errors: string[] }}
 *
 * @example
 * const result = toValidationResult(EquipmentSchema, equipment);
 * if (!result.valid) {
 *   console.error(result.errors); // ['name は必須です', 'order は整数である必要があります']
 * }
 */
export function toValidationResult(schema, data) {
  try {
    schema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof ZodError) {
      // Zod v4: error.errors → error.issues
      const issues = error.issues;
      if (!issues || issues.length === 0) {
        return { valid: false, errors: ['検証に失敗しました'] };
      }
      const errors = issues.map((err) => {
        // パス情報がある場合は先頭に付与（例: "reqs[0].count: 数値は必須です"）
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      return { valid: false, errors };
    }
    // ZodError以外の予期しないエラーは再スロー
    throw error;
  }
}

/**
 * Zodの検証結果を { valid: boolean, error?: string } 形式に変換
 * 単一エラーのみ返す（最初のエラーのみ）
 * @param {z.ZodSchema} schema - Zodスキーマ
 * @param {any} data - 検証するデータ
 * @returns {{ valid: boolean, error?: string }}
 *
 * @example
 * const result = toSimpleValidationResult(NameSchema, name);
 * if (!result.valid) {
 *   console.error(result.error); // '名前は必須です'
 * }
 */
export function toSimpleValidationResult(schema, data) {
  try {
    schema.parse(data);
    return { valid: true };
  } catch (error) {
    if (error instanceof ZodError) {
      // Zod v4: error.errors → error.issues
      const issues = error.issues;
      if (!issues || issues.length === 0) {
        return { valid: false, error: '検証に失敗しました' };
      }
      // 最初のエラーのみ返す
      const firstIssue = issues[0];
      const path = firstIssue.path.length > 0 ? `${firstIssue.path.join('.')}: ` : '';
      return { valid: false, error: `${path}${firstIssue.message}` };
    }
    // ZodError以外の予期しないエラーは再スロー
    throw error;
  }
}

/**
 * Zodで安全にパースする（"Parse, don't validate"）
 * パース成功時は型安全なデータを返す
 * @param {z.ZodSchema} schema - Zodスキーマ
 * @param {any} data - パースするデータ
 * @returns {any} パース済みデータ（型安全）
 * @throws {ZodError} バリデーション失敗時
 *
 * @example
 * try {
 *   const validEquipment = safeParse(EquipmentSchema, rawData);
 *   // validEquipmentは型安全で、以降のコードは正しいデータであることを前提にできる
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     console.error('Validation failed:', error.errors);
 *   }
 * }
 */
export function safeParse(schema, data) {
  return schema.parse(data);
}
