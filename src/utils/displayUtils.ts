/**
 * 表示用ユーティリティ関数
 */

import { REQUIREMENT_KIND, type Category, type Equipment } from '../schema';

const DELETED_LABELS = {
    EQUIPMENT: '削除済み装備',
    CATEGORY: '削除済みカテゴリ',
} as const;

/**
 * 任務要件の表示名を取得
 */
export function getRequirementDisplayName(
    req: { kind: string; id: string },
    categoryMap: Map<string, Category>,
    equipmentMap: Map<string, Equipment>,
): string {
    if (req.kind === REQUIREMENT_KIND.CATEGORY) {
        const category = categoryMap.get(req.id);
        return category ? category.name : DELETED_LABELS.CATEGORY;
    } else {
        const equipment = equipmentMap.get(req.id);
        return equipment ? equipment.name : DELETED_LABELS.EQUIPMENT;
    }
}
