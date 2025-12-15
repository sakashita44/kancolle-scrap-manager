/**
 * 任務スキーマ定義
 * 任務データのバリデーションスキーマ（要求装備含む）
 * @module schemas/mission
 */

import { z } from 'zod';
import { safeString, missionIdSchema, positiveInteger } from './base.js';
import { LIMITS, PERIOD, TARGET_TYPE } from '../types/schema.js';

/**
 * 要求装備スキーマ
 * 任務の各要求装備（reqs配列の要素）
 */
export const requirementSchema = z.object({
  id: z.string({ required_error: '要求装備IDは必須です' }).min(1, '要求装備IDは必須です'),
  targetId: z.string({ required_error: 'targetIdは必須です' }).min(1, 'targetIdは必須です'),
  targetType: z.enum([TARGET_TYPE.CATEGORY, TARGET_TYPE.ITEM], {
    errorMap: () => ({
      message: `targetTypeは${TARGET_TYPE.CATEGORY}または${TARGET_TYPE.ITEM}である必要があります`,
    }),
  }),
  count: z
    .number({ required_error: 'countは必須です' })
    .int('countは整数である必要があります')
    .min(LIMITS.REQUIREMENT_COUNT_MIN, `countは${LIMITS.REQUIREMENT_COUNT_MIN}以上である必要があります`)
    .max(LIMITS.REQUIREMENT_COUNT_MAX, `countは${LIMITS.REQUIREMENT_COUNT_MAX}以下である必要があります`),
});

/**
 * ベース任務スキーマ（refinement適用前）
 * extend用の基礎スキーマ
 */
const baseMissionSchema = z
  .object({
    id: missionIdSchema,
    name: safeString.max(
      LIMITS.MISSION_NAME_MAX,
      `任務名は${LIMITS.MISSION_NAME_MAX}文字以内にしてください`
    ),
    period: z.enum(Object.values(PERIOD), {
      errorMap: () => ({
        message: `periodは${Object.values(PERIOD).join(', ')}のいずれかである必要があります`,
      }),
    }),
    order: positiveInteger,
    reqs: z
      .array(requirementSchema, { required_error: 'reqsは必須です' })
      .min(1, 'reqsは少なくとも1件必要です')
      .max(
        LIMITS.REQUIREMENTS_PER_MISSION_MAX,
        `reqsは最大${LIMITS.REQUIREMENTS_PER_MISSION_MAX}件までです`
      )
      .refine(
        (reqs) => {
          const targetIds = reqs.map((r) => r.targetId);
          return targetIds.length === new Set(targetIds).size;
        },
        (reqs) => {
          const targetIds = reqs.map((r) => r.targetId);
          const duplicates = [
            ...new Set(targetIds.filter((id, idx) => targetIds.indexOf(id) !== idx)),
          ];
          return {
            message: `reqs内でtargetIdが重複しています: ${duplicates.join(', ')}`,
          };
        }
      ),
  })
  .strict();

/**
 * 永続化形式任務スキーマ
 * JSONファイル・LocalStorage保存時の形式
 * isMasterフィールドは含まない（実行時に自動付与）
 */
export const persistedMissionSchema = baseMissionSchema.refine(
  (data) => !Object.prototype.hasOwnProperty.call(data, 'isMaster'),
  {
    message: 'isMasterフィールドは保存できません',
    path: ['isMaster'],
  }
);

/**
 * ランタイム形式任務スキーマ
 * アプリ実行時の形式（isMaster付き）
 */
export const runtimeMissionSchema = baseMissionSchema.extend({
  isMaster: z.boolean(),
});

/**
 * 任務配列スキーマ（重複検証付き）
 * ID重複をチェック
 */
export const missionsArraySchema = z.array(persistedMissionSchema).refine(
  (arr) => {
    const ids = arr.map((m) => m.id);
    return ids.length === new Set(ids).size;
  },
  { message: '任務IDが重複しています' }
);

/**
 * LocalStorage用任務データスキーマ
 * versionとmissions配列を含む
 */
export const missionsDataSchema = z.object({
  version: z.string(),
  missions: missionsArraySchema,
});

/**
 * 選択中任務データスキーマ（SessionStorage用）
 * baseMissionとauxiliaryMissionsを含む
 */
export const selectedMissionsSchema = z
  .object({
    baseMission: z
      .object({
        missionId: z.string(),
        count: z.number(),
      })
      .nullable(),
    auxiliaryMissions: z.array(
      z.object({
        missionId: z.string(),
        count: z.number(),
      })
    ),
  })
  .nullable(); // データが存在しない場合はnullも許可（初期値）
