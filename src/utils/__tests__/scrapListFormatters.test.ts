import { describe, it, expect } from 'vitest';
import { REQUIREMENT_KIND } from '../../schema';
import { groupScrapListByCategory } from '../scrapListFormatters';

describe('groupScrapListByCategory', () => {
    it('同カテゴリのequipmentとcategoryは同一グループにまとまる', () => {
        const grouped = groupScrapListByCategory([
            {
                targetKind: REQUIREMENT_KIND.EQUIPMENT,
                targetId: 'm_eq_25mm_single',
                name: '25mm単装機銃',
                categoryName: '対空機銃',
                count: 2,
            },
            {
                targetKind: REQUIREMENT_KIND.CATEGORY,
                targetId: 'm_cat_anti_air_machine_gun',
                name: '対空機銃（種別不問）',
                categoryName: '対空機銃',
                count: 3,
            },
        ]);

        expect(grouped).toHaveLength(1);
        expect(grouped[0]?.categoryName).toBe('対空機銃');
        expect(grouped[0]?.items).toEqual([{ name: '25mm単装機銃', count: 2 }]);
        expect(grouped[0]?.remainder).toBe(3);
        expect(grouped[0]?.totalCount).toBe(5);
    });

    it('同名categoryとcategoryGroupを別グループとして扱う', () => {
        const grouped = groupScrapListByCategory([
            {
                targetKind: REQUIREMENT_KIND.CATEGORY,
                targetId: 'm_cat_depth_charge',
                name: '爆雷（種別不問）',
                categoryName: '爆雷',
                count: 2,
            },
            {
                targetKind: REQUIREMENT_KIND.CATEGORY_GROUP,
                targetId: 'm_rcg_depth_charge',
                name: '爆雷系装備（種別不問）',
                categoryName: '爆雷',
                count: 5,
            },
        ]);

        expect(grouped).toHaveLength(2);
        expect(
            grouped.map((group) => group.totalCount).sort((a, b) => a - b),
        ).toEqual([2, 5]);
    });

    it('同一キー内の非equipment要件はremainderを上書きせず加算する', () => {
        const grouped = groupScrapListByCategory([
            {
                targetKind: REQUIREMENT_KIND.CATEGORY,
                targetId: 'm_cat_mg',
                name: '機銃（種別不問）',
                categoryName: '機銃',
                count: 2,
            },
            {
                targetKind: REQUIREMENT_KIND.CATEGORY,
                targetId: 'm_cat_mg',
                name: '機銃（種別不問）',
                categoryName: '機銃',
                count: 3,
            },
        ]);

        expect(grouped).toHaveLength(1);
        expect(grouped[0]?.remainder).toBe(5);
        expect(grouped[0]?.totalCount).toBe(5);
    });
});
