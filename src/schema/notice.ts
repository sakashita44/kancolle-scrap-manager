/**
 * 告知（バナー）スキーマ定義
 *
 * 常設バナーの文言は `src/data/notices.json` に集約する。
 * `type` が不正だと表示先のレベルに一致せず告知が黙って消えるため、
 * ビルド前チェック（validate:data）でスキーマ検証して弾く。
 */

import { z } from 'zod/v4';
import { safeString } from './base';
import { NOTICE_TYPE_VALUES } from './constants';

export const noticeSchema = z
    .object({
        id: z.string().min(1, '告知IDは必須です'),
        type: z.enum(NOTICE_TYPE_VALUES),
        message: safeString,
    })
    .strict();

export type Notice = z.infer<typeof noticeSchema>;

export const noticesArraySchema = z.array(noticeSchema).refine(
    (arr) => {
        const ids = arr.map((n) => n.id);
        return ids.length === new Set(ids).size;
    },
    { message: '告知IDが重複しています' },
);

export const noticesDataSchema = z.object({
    version: z.string(),
    notices: noticesArraySchema,
});

export type NoticesData = z.infer<typeof noticesDataSchema>;
