/**
 * カテゴリスキーマ定義
 * 装備カテゴリのバリデーションスキーマ
 * @module schemas/category
 */

import { z } from 'zod';
import { safeString, categoryIdSchema, positiveInteger } from './base.js';
import { LIMITS } from '../types/schema.js';

/**
 * ベースカテゴリスキーマ（refinement適用前）
 * extend用の基礎スキーマ
 */
const baseCategorySchema = z
  .object({
    id: categoryIdSchema,
    name: safeString.max(
      LIMITS.CATEGORY_NAME_MAX,
      `カテゴリ名は${LIMITS.CATEGORY_NAME_MAX}文字以内にしてください`
    ),
    order: positiveInteger,
  })
  .strict();

/**
 * 永続化形式カテゴリスキーマ
 * JSONファイル・LocalStorage保存時の形式
 * isMasterフィールドは含まない（実行時に自動付与）
 */
export const persistedCategorySchema = baseCategorySchema.refine(
  (data) => !Object.prototype.hasOwnProperty.call(data, 'isMaster'),
  {
    message: 'isMasterフィールドは保存できません',
    path: ['isMaster'],
  }
);

/**
 * ランタイム形式カテゴリスキーマ
 * アプリ実行時の形式（isMaster付き）
 */
export const runtimeCategorySchema = baseCategorySchema.extend({
  isMaster: z.boolean(),
});

/**
 * カテゴリ配列スキーマ（重複検証付き）
 * ID重複と名前重複をチェック
 */
export const categoriesArraySchema = z
  .array(persistedCategorySchema)
  .refine(
    (arr) => {
      const ids = arr.map((c) => c.id);
      return ids.length === new Set(ids).size;
    },
    { message: 'カテゴリIDが重複しています' }
  )
  .refine(
    (arr) => {
      const names = arr.map((c) => c.name);
      const duplicates = names.filter((name, idx) => names.indexOf(name) !== idx);
      return duplicates.length === 0;
    },
    (arr) => {
      const names = arr.map((c) => c.name);
      const duplicates = [...new Set(names.filter((name, idx) => names.indexOf(name) !== idx))];
      return {
        message: `カテゴリ名が重複しています: ${duplicates.join(', ')}`,
      };
    }
  );

/**
 * LocalStorage用カテゴリデータスキーマ
 * versionとcategories配列を含む
 */
export const categoriesDataSchema = z.object({
  version: z.string(),
  categories: categoriesArraySchema,
});
