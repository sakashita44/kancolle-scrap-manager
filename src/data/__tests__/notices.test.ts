import { describe, it, expect } from 'vitest';
import { noticesDataSchema } from '../../schema';
import noticesJson from '../notices.json';

describe('同梱告知データ（notices.json）の整合性', () => {
    it('スキーマ検証を通過する（type が不正だと表示先に一致せず告知が消えるため弾く）', () => {
        const result = noticesDataSchema.safeParse(noticesJson);
        expect(result.success).toBe(true);
    });
});

describe('noticesDataSchema', () => {
    it('type が既定のレベル以外の場合に検出する', () => {
        const result = noticesDataSchema.safeParse({
            version: '1.0.0',
            notices: [{ id: 'x', type: 'waring', message: 'test' }],
        });
        expect(result.success).toBe(false);
    });

    it('告知IDが重複している場合に検出する', () => {
        const result = noticesDataSchema.safeParse({
            version: '1.0.0',
            notices: [
                { id: 'dup', type: 'info', message: 'a' },
                { id: 'dup', type: 'info', message: 'b' },
            ],
        });
        expect(result.success).toBe(false);
    });
});
