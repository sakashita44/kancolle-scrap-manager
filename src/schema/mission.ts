/**
 * 任務スキーマ定義
 * 要求装備: targetType/targetId → kind/id に変更
 */

import { z } from 'zod/v4';
import { safeString, missionIdSchema, nonNegativeInteger } from './base';
import {
    LIMITS,
    PERIOD_VALUES,
    REQUIREMENT_KIND,
    type Source,
} from './constants';

// --- 要求装備スキーマ ---

const requirementKindValues = Object.values(REQUIREMENT_KIND) as [
    string,
    ...string[],
];

export const requirementSchema = z.object({
    kind: z.enum(requirementKindValues, {
        error: `kindは${requirementKindValues.join('または')}である必要があります`,
    }),
    id: z.string({ error: '対象IDは必須です' }).min(1, '対象IDは必須です'),
    count: z
        .number({ error: 'countは必須です' })
        .int('countは整数である必要があります')
        .min(
            LIMITS.REQUIREMENT_COUNT_MIN,
            `countは${LIMITS.REQUIREMENT_COUNT_MIN}以上である必要があります`,
        )
        .max(
            LIMITS.REQUIREMENT_COUNT_MAX,
            `countは${LIMITS.REQUIREMENT_COUNT_MAX}以下である必要があります`,
        ),
});

export type Requirement = z.infer<typeof requirementSchema>;

// --- 任務スキーマ ---

const periodValues = PERIOD_VALUES as [string, ...string[]];

const baseMissionSchema = z
    .object({
        id: missionIdSchema,
        name: safeString.max(
            LIMITS.MISSION_NAME_MAX,
            `任務名は${LIMITS.MISSION_NAME_MAX}文字以内にしてください`,
        ),
        period: z.enum(periodValues, {
            error: `periodは${periodValues.join(', ')}のいずれかである必要があります`,
        }),
        order: nonNegativeInteger,
        reqs: z
            .array(requirementSchema, { error: 'reqsは必須です' })
            .min(1, 'reqsは少なくとも1件必要です')
            .max(
                LIMITS.REQUIREMENTS_PER_MISSION_MAX,
                `reqsは最大${LIMITS.REQUIREMENTS_PER_MISSION_MAX}件までです`,
            )
            .refine(
                (reqs) => {
                    const ids = reqs.map((r) => r.id);
                    return ids.length === new Set(ids).size;
                },
                { message: 'reqs内でIDが重複しています' },
            ),
    })
    .strict();

// --- 永続化形式 ---

export const persistedMissionSchema = baseMissionSchema;

export type PersistedMission = z.infer<typeof persistedMissionSchema>;

// --- ランタイム形式 ---

export type Mission = PersistedMission & {
    source: Source;
};

// --- 配列スキーマ ---

export const missionsArraySchema = z.array(persistedMissionSchema).refine(
    (arr) => {
        const ids = arr.map((m) => m.id);
        return ids.length === new Set(ids).size;
    },
    { message: '任務IDが重複しています' },
);

// --- ストレージ形式 ---

export const missionsDataSchema = z.object({
    version: z.string(),
    missions: missionsArraySchema,
});

export type MissionsData = z.infer<typeof missionsDataSchema>;

// --- 選択中任務（SessionStorage） ---

const selectedMissionEntrySchema = z.object({
    missionId: z.string(),
    count: z.number(),
});

export const selectedMissionsSchema = z
    .object({
        baseMission: selectedMissionEntrySchema.nullable(),
        auxiliaryMissions: z.array(selectedMissionEntrySchema),
    })
    .nullable();

export type SelectedMissionEntry = z.infer<typeof selectedMissionEntrySchema>;

export type SelectedMissions = z.infer<typeof selectedMissionsSchema>;
