/**
 * 任務フィルタロジック
 * カテゴリフィルタの判定を純粋関数として提供
 */

import {
    REQUIREMENT_KIND,
    type Requirement,
    type Equipment,
    type RequirementCategoryGroup,
} from '../schema';

/**
 * 任務の要求リストがカテゴリフィルタに一致するか判定する。
 * kind=equipment の要求は装備→カテゴリ解決でフィルタと照合する。
 */
export function matchesCategoryFilter(
    reqs: Requirement[],
    filterCategories: Set<string>,
    equipmentMap: Map<string, Equipment>,
    requirementCategoryGroupMap: Map<string, RequirementCategoryGroup>,
): boolean {
    return reqs.some((req) => {
        if (req.kind === REQUIREMENT_KIND.CATEGORY) {
            return filterCategories.has(req.id);
        }
        if (req.kind === REQUIREMENT_KIND.EQUIPMENT) {
            const equipment = equipmentMap.get(req.id);
            return equipment
                ? filterCategories.has(equipment.categoryId)
                : false;
        }
        if (req.kind === REQUIREMENT_KIND.CATEGORY_GROUP) {
            const requirementCategoryGroup = requirementCategoryGroupMap.get(
                req.id,
            );
            return requirementCategoryGroup
                ? requirementCategoryGroup.categoryIds.some((categoryId) =>
                      filterCategories.has(categoryId),
                  )
                : false;
        }
        return false;
    });
}
