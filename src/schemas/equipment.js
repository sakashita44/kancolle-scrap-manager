/**
 * 装備スキーマ定義
 * 装備データのバリデーションスキーマ
 * @module schemas/equipment
 */

import { z } from 'zod';
import { safeString, equipmentIdSchema, categoryIdSchema, positiveInteger } from './base.js';
import { LIMITS, EQUIPMENT_TYPE } from '../types/schema.js';

/**
 * 永続化形式装備スキーマ
 * JSONファイル・LocalStorage保存時の形式
 * type, isMasterフィールドは含まない（実行時に自動付与）
 */
export const persistedEquipmentSchema = z
  .object({
    id: equipmentIdSchema,
    name: safeString.max(
      LIMITS.EQUIPMENT_NAME_MAX,
      `装備名は${LIMITS.EQUIPMENT_NAME_MAX}文字以内にしてください`
    ),
    categoryId: categoryIdSchema,
    order: positiveInteger,
  })
  .strict()
  .refine((data) => !Object.prototype.hasOwnProperty.call(data, 'type'), {
    message: 'typeフィールドは保存できません',
    path: ['type'],
  })
  .refine((data) => !Object.prototype.hasOwnProperty.call(data, 'isMaster'), {
    message: 'isMasterフィールドは保存できません',
    path: ['isMaster'],
  });

/**
 * ランタイム形式装備スキーマ
 * アプリ実行時の形式（type, isMaster付き）
 */
export const runtimeEquipmentSchema = persistedEquipmentSchema.extend({
  type: z.enum([EQUIPMENT_TYPE.ITEM, EQUIPMENT_TYPE.CATEGORY]),
  isMaster: z.boolean(),
});

/**
 * 装備配列スキーマ（重複検証付き）
 * ID重複と名前重複をチェック
 */
export const equipmentsArraySchema = z
  .array(persistedEquipmentSchema)
  .refine(
    (arr) => {
      const ids = arr.map((e) => e.id);
      return ids.length === new Set(ids).size;
    },
    { message: '装備IDが重複しています' }
  )
  .refine(
    (arr) => {
      const names = arr.map((e) => e.name);
      const duplicates = names.filter((name, idx) => names.indexOf(name) !== idx);
      return duplicates.length === 0;
    },
    (arr) => {
      const names = arr.map((e) => e.name);
      const duplicates = [...new Set(names.filter((name, idx) => names.indexOf(name) !== idx))];
      return {
        message: `装備名が重複しています: ${duplicates.join(', ')}`,
      };
    }
  );

/**
 * LocalStorage用装備データスキーマ
 * versionとequipments配列を含む
 */
export const equipmentsDataSchema = z.object({
  version: z.string(),
  equipments: equipmentsArraySchema,
});
