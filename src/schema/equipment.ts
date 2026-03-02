/**
 * 装備スキーマ定義
 * カテゴリ代表装備は廃止: 装備は常に実装備のみ
 */

import { z } from 'zod/v4';
import {
    safeString,
    equipmentIdSchema,
    categoryIdSchema,
    nonNegativeInteger,
} from './base';
import { LIMITS, type Source } from './constants';

// --- 永続化形式（JSON / LocalStorage） ---

export const persistedEquipmentSchema = z
    .object({
        id: equipmentIdSchema,
        name: safeString.max(
            LIMITS.EQUIPMENT_NAME_MAX,
            `装備名は${LIMITS.EQUIPMENT_NAME_MAX}文字以内にしてください`,
        ),
        categoryId: categoryIdSchema,
        order: nonNegativeInteger,
    })
    .strict();

export type PersistedEquipment = z.infer<typeof persistedEquipmentSchema>;

// --- ランタイム形式（アプリ内でのみ使用） ---

export type Equipment = PersistedEquipment & {
    source: Source;
};

// --- 配列スキーマ（重複検証付き） ---

export const equipmentsArraySchema = z
    .array(persistedEquipmentSchema)
    .refine(
        (arr) => {
            const ids = arr.map((e) => e.id);
            return ids.length === new Set(ids).size;
        },
        { message: '装備IDが重複しています' },
    )
    .refine(
        (arr) => {
            const names = arr.map((e) => e.name);
            return names.length === new Set(names).size;
        },
        { message: '装備名が重複しています' },
    );

// --- ストレージ形式（version付き） ---

export const equipmentsDataSchema = z.object({
    version: z.string(),
    equipments: equipmentsArraySchema,
});

export type EquipmentsData = z.infer<typeof equipmentsDataSchema>;
