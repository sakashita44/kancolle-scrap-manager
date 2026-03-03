/**
 * フォーム入力用Zodスキーマ定義
 * react-hook-form + zodResolver で使用
 */

import { z } from 'zod/v4';
import { safeString } from './base';
import { LIMITS, PERIOD, REQUIREMENT_KIND } from './constants';

// --- 装備追加フォーム ---

export const equipmentFormSchema = z.object({
    name: safeString.max(
        LIMITS.EQUIPMENT_NAME_MAX,
        `装備名は${LIMITS.EQUIPMENT_NAME_MAX}文字以内で入力してください`,
    ),
    categoryId: z
        .string({ error: 'カテゴリを選択してください' })
        .min(1, 'カテゴリを選択してください'),
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

// --- カテゴリ追加フォーム ---

export const categoryFormSchema = z.object({
    name: safeString.max(
        LIMITS.CATEGORY_NAME_MAX,
        `カテゴリ名は${LIMITS.CATEGORY_NAME_MAX}文字以内で入力してください`,
    ),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// --- 要求装備フォーム ---

const requirementKindValues = [
    REQUIREMENT_KIND.CATEGORY,
    REQUIREMENT_KIND.EQUIPMENT,
    REQUIREMENT_KIND.CATEGORY_GROUP,
] as const;

export const requirementFormSchema = z.object({
    kind: z.enum(requirementKindValues),
    id: z
        .string({ error: '要求装備を選択してください' })
        .min(1, '要求装備を選択してください'),
    count: z.coerce
        .number({ error: '必要数を入力してください' })
        .int('整数で入力してください')
        .min(
            LIMITS.REQUIREMENT_COUNT_MIN,
            `${LIMITS.REQUIREMENT_COUNT_MIN}以上で入力してください`,
        )
        .max(
            LIMITS.REQUIREMENT_COUNT_MAX,
            `${LIMITS.REQUIREMENT_COUNT_MAX}以下で入力してください`,
        ),
});

export type RequirementFormValues = z.infer<typeof requirementFormSchema>;

// --- 任務フォーム ---

const periodValues = [
    PERIOD.DAILY,
    PERIOD.WEEKLY,
    PERIOD.MONTHLY,
    PERIOD.QUARTERLY,
    PERIOD.YEARLY,
    PERIOD.ONE_TIME,
] as const;

export const missionFormSchema = z.object({
    name: safeString.max(
        LIMITS.MISSION_NAME_MAX,
        `任務名は${LIMITS.MISSION_NAME_MAX}文字以内で入力してください`,
    ),
    period: z.enum(periodValues, {
        error: '周期を選択してください',
    }),
    reqs: z
        .array(requirementFormSchema)
        .min(1, '要求装備は少なくとも1件必要です')
        .max(
            LIMITS.REQUIREMENTS_PER_MISSION_MAX,
            `要求装備は最大${LIMITS.REQUIREMENTS_PER_MISSION_MAX}件までです`,
        )
        .refine(
            (reqs) => {
                const ids = reqs
                    .filter((r) => r.id)
                    .map((r) => `${r.kind}:${r.id}`);
                return ids.length === new Set(ids).size;
            },
            { message: '同じ要求(kind+ID)が複数回選択されています' },
        ),
});

export type MissionFormValues = z.infer<typeof missionFormSchema>;
