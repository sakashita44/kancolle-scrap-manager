import { describe, it, expect } from 'vitest';
import {
    calculateScrapList,
    calculateScrapComparison,
} from '../scrapCalculation';
import {
    REQUIREMENT_KIND,
    SOURCE,
    type Mission,
    type Equipment,
    type Category,
    type RequirementCategoryGroup,
    type SelectedMissionEntry,
} from '../../schema';

// --- テスト用ミニマルデータ ---

const cat1: Category = {
    id: 'cat_gun',
    name: '機銃',
    order: 0,
    source: SOURCE.MASTER,
};

const eq1: Equipment = {
    id: 'eq_25mm_single',
    name: '25mm単装機銃',
    categoryId: 'cat_gun',
    order: 0,
    source: SOURCE.MASTER,
};

const eq2: Equipment = {
    id: 'eq_25mm_triple',
    name: '25mm三連装機銃',
    categoryId: 'cat_gun',
    order: 1,
    source: SOURCE.MASTER,
};

const categoryMap = new Map<string, Category>([[cat1.id, cat1]]);
const equipmentMap = new Map<string, Equipment>([
    [eq1.id, eq1],
    [eq2.id, eq2],
]);
const requirementCategoryGroup: RequirementCategoryGroup = {
    id: 'm_rcg_gun',
    name: '機銃系',
    categoryIds: [cat1.id],
    order: 1,
    source: SOURCE.MASTER,
};
const requirementCategoryGroupMap = new Map<string, RequirementCategoryGroup>([
    [requirementCategoryGroup.id, requirementCategoryGroup],
]);

function makeMission(
    id: string,
    reqs: Mission['reqs'],
    overrides?: Partial<Mission>,
): Mission {
    return {
        id,
        name: `任務${id}`,
        period: 'Daily',
        order: 0,
        reqs,
        source: SOURCE.MASTER,
        ...overrides,
    };
}

describe('calculateScrapList', () => {
    it('MAX集計: 同一装備を要求する2任務は合計ではなく最大値を採用', () => {
        const missionA = makeMission('A', [
            { kind: REQUIREMENT_KIND.EQUIPMENT, id: eq1.id, count: 3 },
        ]);
        const missionB = makeMission('B', [
            { kind: REQUIREMENT_KIND.EQUIPMENT, id: eq1.id, count: 5 },
        ]);
        const selected: SelectedMissionEntry[] = [
            { missionId: 'A', count: 1 },
            { missionId: 'B', count: 1 },
        ];

        const { scrapList } = calculateScrapList(
            selected,
            [missionA, missionB],
            equipmentMap,
            categoryMap,
            requirementCategoryGroupMap,
        );

        const item = scrapList.find((s) => s.targetId === eq1.id);
        expect(item?.count).toBe(5);
    });

    it('包含解決: カテゴリ要求と個別装備要求の混在で個別装備分がカテゴリから減算', () => {
        const missionA = makeMission('A', [
            { kind: REQUIREMENT_KIND.CATEGORY, id: cat1.id, count: 5 },
        ]);
        const missionB = makeMission('B', [
            { kind: REQUIREMENT_KIND.EQUIPMENT, id: eq1.id, count: 2 },
        ]);
        const selected: SelectedMissionEntry[] = [
            { missionId: 'A', count: 1 },
            { missionId: 'B', count: 1 },
        ];

        const { scrapList } = calculateScrapList(
            selected,
            [missionA, missionB],
            equipmentMap,
            categoryMap,
            requirementCategoryGroupMap,
        );

        const eqItem = scrapList.find((s) => s.targetId === eq1.id);
        const catItem = scrapList.find((s) => s.targetId === cat1.id);
        expect(eqItem?.count).toBe(2);
        expect(catItem?.count).toBe(3); // 5 - 2 = 3
    });

    it('包含解決: 個別装備がカテゴリ要求を完全充足するとカテゴリ行が消える', () => {
        const missionA = makeMission('A', [
            { kind: REQUIREMENT_KIND.CATEGORY, id: cat1.id, count: 2 },
        ]);
        const missionB = makeMission('B', [
            { kind: REQUIREMENT_KIND.EQUIPMENT, id: eq1.id, count: 3 },
        ]);
        const selected: SelectedMissionEntry[] = [
            { missionId: 'A', count: 1 },
            { missionId: 'B', count: 1 },
        ];

        const { scrapList } = calculateScrapList(
            selected,
            [missionA, missionB],
            equipmentMap,
            categoryMap,
            requirementCategoryGroupMap,
        );

        const catItem = scrapList.find((s) => s.targetId === cat1.id);
        expect(catItem).toBeUndefined();
        expect(scrapList.find((s) => s.targetId === eq1.id)?.count).toBe(3);
    });

    it('任務count乗算: count=3の任務は要求数が3倍になる', () => {
        const mission = makeMission('A', [
            { kind: REQUIREMENT_KIND.EQUIPMENT, id: eq1.id, count: 2 },
        ]);
        const selected: SelectedMissionEntry[] = [{ missionId: 'A', count: 3 }];

        const { scrapList } = calculateScrapList(
            selected,
            [mission],
            equipmentMap,
            categoryMap,
            requirementCategoryGroupMap,
        );

        expect(scrapList.find((s) => s.targetId === eq1.id)?.count).toBe(6);
    });
});

describe('calculateScrapComparison', () => {
    it('カテゴリ要求のベースに対し補助の個別装備がsufficient判定される', () => {
        const baseMission = makeMission('base', [
            { kind: REQUIREMENT_KIND.CATEGORY, id: cat1.id, count: 3 },
        ]);
        const auxMission = makeMission('aux', [
            { kind: REQUIREMENT_KIND.EQUIPMENT, id: eq1.id, count: 2 },
            { kind: REQUIREMENT_KIND.EQUIPMENT, id: eq2.id, count: 2 },
        ]);

        const { comparison } = calculateScrapComparison(
            {
                baseMission: { missionId: 'base', count: 1 },
                auxiliaryMissions: [{ missionId: 'aux', count: 1 }],
            },
            [baseMission, auxMission],
            equipmentMap,
            categoryMap,
            requirementCategoryGroupMap,
        );

        // ベースはカテゴリ要求3。補助は個別装備2+2=4で充足
        const catComparison = comparison.find((c) => c.targetId === cat1.id);
        expect(catComparison?.status).toBe('sufficient');
        expect(catComparison?.auxiliaryCount).toBe(4);
    });

    it('categoryGroup要求のMAX集計: 同一groupは合計ではなく最大値を採用', () => {
        const missionA = makeMission('A', [
            {
                kind: REQUIREMENT_KIND.CATEGORY_GROUP,
                id: requirementCategoryGroup.id,
                count: 3,
            },
        ]);
        const missionB = makeMission('B', [
            {
                kind: REQUIREMENT_KIND.CATEGORY_GROUP,
                id: requirementCategoryGroup.id,
                count: 5,
            },
        ]);

        const { scrapList } = calculateScrapList(
            [
                { missionId: 'A', count: 1 },
                { missionId: 'B', count: 1 },
            ],
            [missionA, missionB],
            equipmentMap,
            categoryMap,
            requirementCategoryGroupMap,
        );

        const groupItem = scrapList.find(
            (item) => item.targetKind === REQUIREMENT_KIND.CATEGORY_GROUP,
        );
        expect(groupItem?.count).toBe(5);
    });

    it('categoryGroup要求は同group配下の個別装備で包含解決される', () => {
        const missionA = makeMission('A', [
            {
                kind: REQUIREMENT_KIND.CATEGORY_GROUP,
                id: requirementCategoryGroup.id,
                count: 5,
            },
        ]);
        const missionB = makeMission('B', [
            { kind: REQUIREMENT_KIND.EQUIPMENT, id: eq1.id, count: 2 },
        ]);

        const { scrapList } = calculateScrapList(
            [
                { missionId: 'A', count: 1 },
                { missionId: 'B', count: 1 },
            ],
            [missionA, missionB],
            equipmentMap,
            categoryMap,
            requirementCategoryGroupMap,
        );

        const groupItem = scrapList.find(
            (item) => item.targetKind === REQUIREMENT_KIND.CATEGORY_GROUP,
        );
        const eqItem = scrapList.find((item) => item.targetId === eq1.id);
        expect(eqItem?.count).toBe(2);
        expect(groupItem?.count).toBe(3);
    });

    it('categoryGroup要求は同group配下のカテゴリ要求でも包含解決される', () => {
        const missionA = makeMission('A', [
            {
                kind: REQUIREMENT_KIND.CATEGORY_GROUP,
                id: requirementCategoryGroup.id,
                count: 5,
            },
        ]);
        const missionB = makeMission('B', [
            { kind: REQUIREMENT_KIND.CATEGORY, id: cat1.id, count: 2 },
        ]);

        const { scrapList } = calculateScrapList(
            [
                { missionId: 'A', count: 1 },
                { missionId: 'B', count: 1 },
            ],
            [missionA, missionB],
            equipmentMap,
            categoryMap,
            requirementCategoryGroupMap,
        );

        const groupItem = scrapList.find(
            (item) => item.targetKind === REQUIREMENT_KIND.CATEGORY_GROUP,
        );
        const categoryItem = scrapList.find(
            (item) => item.targetId === cat1.id,
        );
        expect(categoryItem?.count).toBe(2);
        expect(groupItem?.count).toBe(3);
    });

    it('categoryGroup要求のcount乗算: 任務countが要求数に反映される', () => {
        const missionA = makeMission('A', [
            {
                kind: REQUIREMENT_KIND.CATEGORY_GROUP,
                id: requirementCategoryGroup.id,
                count: 2,
            },
        ]);

        const { scrapList } = calculateScrapList(
            [{ missionId: 'A', count: 3 }],
            [missionA],
            equipmentMap,
            categoryMap,
            requirementCategoryGroupMap,
        );

        const groupItem = scrapList.find(
            (item) => item.targetKind === REQUIREMENT_KIND.CATEGORY_GROUP,
        );
        expect(groupItem?.count).toBe(6);
    });
});
