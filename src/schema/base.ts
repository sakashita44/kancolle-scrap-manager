/**
 * 共通Zodスキーマ定義
 * XSS対策、IDバリデーション、数値スキーマ等
 */

import { z } from 'zod/v4';
import { ID_PREFIX } from './constants';

/** XSS対策用の危険パターン */
const DANGEROUS_PATTERN = /<script|<iframe|javascript:|on\w+=/i;

/** XSS安全な文字列（1文字以上） */
export const safeString = z
    .string({ error: '入力は必須です' })
    .min(1, '入力は必須です')
    .refine((val) => !DANGEROUS_PATTERN.test(val), {
        message: 'HTMLタグやスクリプトは使用できません',
    });

/** IDスキーマ生成ヘルパー: プレフィックスがある場合は後続文字が必要 */
function createIdSchema(
    label: string,
    masterPrefix: string,
    userPrefix: string,
) {
    return z
        .string({ error: `${label}IDは必須です` })
        .min(1, `${label}IDは必須です`)
        .refine(
            (val) => {
                if (
                    val.startsWith(masterPrefix) ||
                    val.startsWith(userPrefix)
                ) {
                    const prefixLength = val.startsWith(masterPrefix)
                        ? masterPrefix.length
                        : userPrefix.length;
                    return val.length > prefixLength;
                }
                return true;
            },
            { message: `${label}IDはプレフィックス後に内容が必要です` },
        );
}

export const categoryIdSchema = createIdSchema(
    'カテゴリ',
    ID_PREFIX.MASTER_CATEGORY,
    ID_PREFIX.USER_CATEGORY,
);

export const equipmentIdSchema = createIdSchema(
    '装備',
    ID_PREFIX.MASTER_EQUIPMENT,
    ID_PREFIX.USER_EQUIPMENT,
);

export const missionIdSchema = createIdSchema(
    '任務',
    ID_PREFIX.MASTER_MISSION,
    ID_PREFIX.USER_MISSION,
);

/** 0以上の整数 */
export const nonNegativeInteger = z
    .number({ error: '数値は必須です' })
    .int('整数である必要があります')
    .nonnegative('0以上である必要があります');
