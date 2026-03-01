/**
 * カテゴリ関連のドメインロジック（純粋関数）
 */

import { REQUIREMENT_KIND } from '../schema';
import type { Equipment, Mission } from '../schema';

export interface CategoryDeletionImpact {
    categoryName: string;
    affectedEquipments: Equipment[];
    affectedMissions: Mission[];
}

/**
 * カテゴリ削除の影響分析
 * 該当カテゴリに属する装備と、参照している任務を返す
 */
export function analyzeCategoryDeletionImpact(
    categoryId: string,
    allEquipments: Equipment[],
    allMissions: Mission[],
    getCategoryName: (id: string) => string,
): CategoryDeletionImpact {
    const affectedEquipments = allEquipments.filter(
        (eq) => eq.categoryId === categoryId,
    );

    const affectedMissions = allMissions.filter((mission) =>
        mission.reqs.some(
            (req) =>
                req.kind === REQUIREMENT_KIND.CATEGORY && req.id === categoryId,
        ),
    );

    return {
        categoryName: getCategoryName(categoryId),
        affectedEquipments,
        affectedMissions,
    };
}

/**
 * カテゴリ削除時の確認メッセージを生成
 */
export function buildCategoryDeletionMessage(
    impact: CategoryDeletionImpact,
): string {
    const lines: string[] = [];

    lines.push(`カテゴリ「${impact.categoryName}」を削除しますか？`);

    if (impact.affectedEquipments.length > 0) {
        lines.push('');
        lines.push('このカテゴリに含まれる装備:');
        for (const eq of impact.affectedEquipments) {
            lines.push(`  - ${eq.name}`);
        }
        lines.push(`計${impact.affectedEquipments.length}件が削除されます`);
    }

    if (impact.affectedMissions.length > 0) {
        lines.push('');
        lines.push('このカテゴリを参照する任務:');
        for (const ms of impact.affectedMissions) {
            lines.push(`  - ${ms.name}`);
        }
        lines.push(
            `計${impact.affectedMissions.length}件の任務に影響があります（任務は削除されません）`,
        );
    }

    return lines.join('\n');
}
