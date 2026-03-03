/**
 * 表示用ユーティリティ関数
 */

import {
    REQUIREMENT_KIND,
    type Category,
    type Equipment,
    type RequirementCategoryGroup,
} from '../schema';

const DELETED_LABELS = {
    EQUIPMENT: '削除済み装備',
    CATEGORY: '削除済みカテゴリ',
    CATEGORY_GROUP: '削除済みカテゴリグループ',
} as const;

/**
 * 任務要件の表示名を取得
 */
export function getRequirementDisplayName(
    req: { kind: string; id: string },
    categoryMap: Map<string, Category>,
    equipmentMap: Map<string, Equipment>,
    requirementCategoryGroupMap: Map<string, RequirementCategoryGroup>,
): string {
    if (req.kind === REQUIREMENT_KIND.CATEGORY) {
        const category = categoryMap.get(req.id);
        return category ? category.name : DELETED_LABELS.CATEGORY;
    }

    if (req.kind === REQUIREMENT_KIND.CATEGORY_GROUP) {
        const requirementCategoryGroup = requirementCategoryGroupMap.get(
            req.id,
        );
        return requirementCategoryGroup
            ? requirementCategoryGroup.name
            : DELETED_LABELS.CATEGORY_GROUP;
    }

    {
        const equipment = equipmentMap.get(req.id);
        return equipment ? equipment.name : DELETED_LABELS.EQUIPMENT;
    }
}
