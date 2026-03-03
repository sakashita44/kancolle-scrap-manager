import { describe, it, expect } from 'vitest';
import { matchesCategoryFilter } from '../missionFilter';
import {
    REQUIREMENT_KIND,
    SOURCE,
    type Requirement,
    type Equipment,
    type RequirementCategoryGroup,
} from '../../schema';

const eq1: Equipment = {
    id: 'eq_25mm_single',
    name: '25mm単装機銃',
    categoryId: 'cat_gun',
    order: 0,
    source: SOURCE.MASTER,
};

const equipmentMap = new Map<string, Equipment>([[eq1.id, eq1]]);
const requirementCategoryGroup: RequirementCategoryGroup = {
    id: 'm_rcg_gun',
    name: '機銃系',
    categoryIds: ['cat_gun'],
    order: 1,
    source: SOURCE.MASTER,
};
const requirementCategoryGroupMap = new Map<string, RequirementCategoryGroup>([
    [requirementCategoryGroup.id, requirementCategoryGroup],
]);

describe('matchesCategoryFilter', () => {
    it('kind=equipment の要求が装備→カテゴリ解決でフィルタに一致', () => {
        const reqs: Requirement[] = [
            { kind: REQUIREMENT_KIND.EQUIPMENT, id: eq1.id, count: 3 },
        ];
        const filter = new Set(['cat_gun']);

        expect(
            matchesCategoryFilter(
                reqs,
                filter,
                equipmentMap,
                requirementCategoryGroupMap,
            ),
        ).toBe(true);
    });

    it('kind=category の要求が直接カテゴリフィルタに一致', () => {
        const reqs: Requirement[] = [
            { kind: REQUIREMENT_KIND.CATEGORY, id: 'cat_gun', count: 5 },
        ];
        const filter = new Set(['cat_gun']);

        expect(
            matchesCategoryFilter(
                reqs,
                filter,
                equipmentMap,
                requirementCategoryGroupMap,
            ),
        ).toBe(true);
    });

    it('kind=categoryGroup の要求がグループ内カテゴリでフィルタに一致', () => {
        const reqs: Requirement[] = [
            {
                kind: REQUIREMENT_KIND.CATEGORY_GROUP,
                id: requirementCategoryGroup.id,
                count: 2,
            },
        ];
        const filter = new Set(['cat_gun']);

        expect(
            matchesCategoryFilter(
                reqs,
                filter,
                equipmentMap,
                requirementCategoryGroupMap,
            ),
        ).toBe(true);
    });
});
