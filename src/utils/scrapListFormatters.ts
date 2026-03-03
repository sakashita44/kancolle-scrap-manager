/**
 * 廃棄リストの変換ユーティリティ
 */

import { REQUIREMENT_KIND } from '../schema';
import type { ScrapListItem } from '../domain';

export interface ScrapCategorySection {
    categoryName: string;
    totalCount: number;
    items: { name: string; count: number }[];
    remainder: number;
}

/**
 * 廃棄リストをカテゴリごとにグループ化
 */
export function groupScrapListByCategory(
    scrapList: ScrapListItem[],
): ScrapCategorySection[] {
    const map = new Map<string, ScrapCategorySection>();

    for (const item of scrapList) {
        if (!map.has(item.categoryName)) {
            map.set(item.categoryName, {
                categoryName: item.categoryName,
                totalCount: 0,
                items: [],
                remainder: 0,
            });
        }

        const group = map.get(item.categoryName)!;
        if (item.targetKind === REQUIREMENT_KIND.EQUIPMENT) {
            group.items.push({ name: item.name, count: item.count });
        } else {
            group.remainder = item.count;
        }
        group.totalCount += item.count;
    }

    return Array.from(map.values());
}
