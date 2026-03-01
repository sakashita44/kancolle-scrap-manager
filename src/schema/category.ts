/**
 * カテゴリスキーマ定義
 */

import { z } from 'zod/v4';
import { safeString, categoryIdSchema, nonNegativeInteger } from './base';
import { LIMITS, type Source } from './constants';

// --- 永続化形式（JSON / LocalStorage） ---

export const persistedCategorySchema = z
    .object({
        id: categoryIdSchema,
        name: safeString.max(
            LIMITS.CATEGORY_NAME_MAX,
            `カテゴリ名は${LIMITS.CATEGORY_NAME_MAX}文字以内にしてください`,
        ),
        order: nonNegativeInteger,
    })
    .strict();

export type PersistedCategory = z.infer<typeof persistedCategorySchema>;

// --- ランタイム形式（アプリ内でのみ使用） ---

export type Category = PersistedCategory & {
    source: Source;
};

// --- 配列スキーマ（重複検証付き） ---

export const categoriesArraySchema = z
    .array(persistedCategorySchema)
    .refine(
        (arr) => {
            const ids = arr.map((c) => c.id);
            return ids.length === new Set(ids).size;
        },
        { message: 'カテゴリIDが重複しています' },
    )
    .refine(
        (arr) => {
            const names = arr.map((c) => c.name);
            return names.length === new Set(names).size;
        },
        { message: 'カテゴリ名が重複しています' },
    );

// --- ストレージ形式（version付き） ---

export const categoriesDataSchema = z.object({
    version: z.string(),
    categories: categoriesArraySchema,
});

export type CategoriesData = z.infer<typeof categoriesDataSchema>;
