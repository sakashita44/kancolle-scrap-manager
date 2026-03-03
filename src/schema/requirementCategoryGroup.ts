/**
 * 要求カテゴリグループスキーマ定義
 */

import { z } from 'zod/v4';
import { safeString, nonNegativeInteger } from './base';
import { ID_PREFIX, LIMITS, type Source } from './constants';

const requirementCategoryGroupIdSchema = z
    .string({ error: '要求カテゴリグループIDは必須です' })
    .min(1, '要求カテゴリグループIDは必須です')
    .refine(
        (val) =>
            val.startsWith(ID_PREFIX.MASTER_REQUIREMENT_CATEGORY_GROUP) &&
            val.length > ID_PREFIX.MASTER_REQUIREMENT_CATEGORY_GROUP.length,
        {
            message:
                '要求カテゴリグループIDは m_rcg_ プレフィックス後に内容が必要です',
        },
    );

export const persistedRequirementCategoryGroupSchema = z
    .object({
        id: requirementCategoryGroupIdSchema,
        name: safeString.max(
            LIMITS.CATEGORY_NAME_MAX,
            `要求カテゴリグループ名は${LIMITS.CATEGORY_NAME_MAX}文字以内にしてください`,
        ),
        categoryIds: z
            .array(
                z
                    .string({ error: 'カテゴリIDは必須です' })
                    .min(1, 'カテゴリIDは必須です'),
            )
            .min(1, 'categoryIdsは1件以上必要です')
            .refine(
                (ids) => ids.length === new Set(ids).size,
                'categoryIdsに重複があります',
            ),
        order: nonNegativeInteger,
    })
    .strict();

export type PersistedRequirementCategoryGroup = z.infer<
    typeof persistedRequirementCategoryGroupSchema
>;

export type RequirementCategoryGroup = PersistedRequirementCategoryGroup & {
    source: Source;
};

export const requirementCategoryGroupsArraySchema = z
    .array(persistedRequirementCategoryGroupSchema)
    .refine(
        (arr) => {
            const ids = arr.map((group) => group.id);
            return ids.length === new Set(ids).size;
        },
        { message: '要求カテゴリグループIDが重複しています' },
    )
    .refine(
        (arr) => {
            const names = arr.map((group) => group.name);
            return names.length === new Set(names).size;
        },
        { message: '要求カテゴリグループ名が重複しています' },
    );

export const requirementCategoryGroupsDataSchema = z.object({
    version: z.string(),
    requirementCategoryGroups: requirementCategoryGroupsArraySchema,
});

export type RequirementCategoryGroupsData = z.infer<
    typeof requirementCategoryGroupsDataSchema
>;
