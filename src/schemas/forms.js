/**
 * フォーム入力用Zodスキーマ定義
 * react-hook-formとzodResolverで使用
 * @module schemas/forms
 */

import { z } from 'zod';
import { safeString } from './base.js';
import { LIMITS, PERIOD, TARGET_TYPE } from '../types/schema.js';

/**
 * 装備追加フォームスキーマ
 * EquipmentModalの「装備を追加」モード用
 */
export const equipmentFormSchema = z.object({
  name: safeString.max(
    LIMITS.EQUIPMENT_NAME_MAX,
    `装備名は${LIMITS.EQUIPMENT_NAME_MAX}文字以内で入力してください`
  ),
  categoryId: z
    .string({ required_error: 'カテゴリを選択してください' })
    .min(1, 'カテゴリを選択してください'),
});

/**
 * カテゴリ追加フォームスキーマ
 * EquipmentModalの「カテゴリを追加」モード用
 */
export const categoryFormSchema = z.object({
  name: safeString.max(
    LIMITS.CATEGORY_NAME_MAX,
    `カテゴリ名は${LIMITS.CATEGORY_NAME_MAX}文字以内で入力してください`
  ),
});

/**
 * 要求装備フォームスキーマ
 * MissionModalの各要求装備入力用
 */
export const requirementFormSchema = z.object({
  id: z.string(),
  targetId: z
    .string({ required_error: '要求装備を選択してください' })
    .min(1, '要求装備を選択してください'),
  count: z.coerce
    .number({ required_error: '必要数を入力してください' })
    .int('整数で入力してください')
    .min(LIMITS.REQUIREMENT_COUNT_MIN, `${LIMITS.REQUIREMENT_COUNT_MIN}以上で入力してください`)
    .max(LIMITS.REQUIREMENT_COUNT_MAX, `${LIMITS.REQUIREMENT_COUNT_MAX}以下で入力してください`),
});

/**
 * 任務フォームスキーマ
 * MissionModalの入力用
 */
export const missionFormSchema = z.object({
  name: safeString.max(
    LIMITS.MISSION_NAME_MAX,
    `任務名は${LIMITS.MISSION_NAME_MAX}文字以内で入力してください`
  ),
  period: z.enum(Object.values(PERIOD), {
    errorMap: () => ({ message: '周期を選択してください' }),
  }),
  reqs: z
    .array(requirementFormSchema)
    .min(1, '要求装備は少なくとも1件必要です')
    .max(LIMITS.REQUIREMENTS_PER_MISSION_MAX, `要求装備は最大${LIMITS.REQUIREMENTS_PER_MISSION_MAX}件までです`)
    .refine(
      (reqs) => {
        const targetIds = reqs.map((r) => r.targetId).filter(Boolean);
        return targetIds.length === new Set(targetIds).size;
      },
      { message: '同じ装備が複数回選択されています' }
    ),
});
