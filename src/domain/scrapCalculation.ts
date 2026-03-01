/**
 * 廃棄リスト計算ロジック
 * 選択された任務から必要最小限の廃棄装備リストを算出する純粋関数群
 */

import {
    LIMITS,
    REQUIREMENT_KIND,
    type RequirementKind,
    type Mission,
    type Category,
    type Equipment,
    type SelectedMissionEntry,
} from '../schema';

// --- 出力型定義 ---

export interface CalcWarning {
    type: 'warning' | 'error';
    message: string;
    missionId?: string;
    missionName?: string;
}

export interface ScrapListItem {
    targetKind: RequirementKind;
    targetId: string;
    name: string;
    categoryName: string;
    count: number;
}

export interface ComparisonItem extends ScrapListItem {
    baseCount: number;
    auxiliaryCount: number;
    difference: number;
    status: 'sufficient' | 'insufficient' | 'excess';
}

// --- WarningCollector ---

class WarningCollector {
    private items: CalcWarning[] = [];

    addWarning(
        message: string,
        context?: { missionId?: string; missionName?: string },
    ): void {
        this.items.push({ type: 'warning', message, ...context });
    }

    addError(message: string): void {
        this.items.push({ type: 'error', message });
    }

    getAll(): CalcWarning[] {
        return this.items;
    }
}

// --- 内部型 ---

interface ExpandedRequirement {
    missionId: string;
    missionName: string;
    kind: RequirementKind;
    targetId: string;
    count: number;
}

// --- メイン計算 ---

export function calculateScrapList(
    selectedMissions: SelectedMissionEntry[],
    allMissions: Mission[],
    equipmentMap: Map<string, Equipment>,
    categoryMap: Map<string, Category>,
): { scrapList: ScrapListItem[]; warnings: CalcWarning[] } {
    const collector = new WarningCollector();

    // フェーズ1: 事前チェック
    if (!selectedMissions || selectedMissions.length === 0) {
        return { scrapList: [], warnings: [] };
    }

    if (selectedMissions.length > LIMITS.SELECTED_MISSIONS_MAX) {
        collector.addError(
            `選択可能な任務数は最大${LIMITS.SELECTED_MISSIONS_MAX}件です`,
        );
        return { scrapList: [], warnings: collector.getAll() };
    }

    // フェーズ2: 要求装備の展開
    const allRequirements = expandRequirements(
        selectedMissions,
        allMissions,
        collector,
    );

    // フェーズ2.5: 整合性チェック
    const validRequirements = validateRequirements(
        allRequirements,
        equipmentMap,
        categoryMap,
        collector,
    );

    if (validRequirements.length === 0) {
        return { scrapList: [], warnings: collector.getAll() };
    }

    // フェーズ3: 種別ごとにグループ化
    const { equipmentReqs, categoryReqs } = groupByKind(validRequirements);

    // フェーズ4/5: MAX集計
    const equipmentCountMap = aggregateByMax(equipmentReqs);
    const categoryCountMap = aggregateByMax(categoryReqs);

    // フェーズ6: 包含関係の解決
    resolveInclusion(equipmentCountMap, categoryCountMap, equipmentMap);

    // フェーズ7: 廃棄リスト生成
    const scrapList = generateScrapList(
        equipmentCountMap,
        categoryCountMap,
        equipmentMap,
        categoryMap,
    );

    return { scrapList, warnings: collector.getAll() };
}

// --- フェーズ2: 要求装備の展開 ---

function expandRequirements(
    selectedMissions: SelectedMissionEntry[],
    allMissions: Mission[],
    collector: WarningCollector,
): ExpandedRequirement[] {
    const result: ExpandedRequirement[] = [];

    for (const selected of selectedMissions) {
        const mission = allMissions.find((m) => m.id === selected.missionId);

        if (!mission) {
            collector.addWarning(
                `任務ID "${selected.missionId}" が見つかりません`,
                { missionId: selected.missionId },
            );
            continue;
        }

        if (!mission.reqs || mission.reqs.length === 0) continue;

        for (const req of mission.reqs) {
            result.push({
                missionId: mission.id,
                missionName: mission.name,
                kind: req.kind as RequirementKind,
                targetId: req.id,
                count: req.count * selected.count,
            });
        }
    }

    return result;
}

// --- フェーズ2.5: 整合性チェック ---

function validateRequirements(
    reqs: ExpandedRequirement[],
    equipmentMap: Map<string, Equipment>,
    categoryMap: Map<string, Category>,
    collector: WarningCollector,
): ExpandedRequirement[] {
    return reqs.filter((req) => {
        if (req.kind === REQUIREMENT_KIND.CATEGORY) {
            if (!categoryMap.has(req.targetId)) {
                collector.addWarning(
                    `カテゴリID "${req.targetId}" が存在しません`,
                    {
                        missionId: req.missionId,
                        missionName: req.missionName,
                    },
                );
                return false;
            }
        } else {
            if (!equipmentMap.has(req.targetId)) {
                collector.addWarning(
                    `装備ID "${req.targetId}" が存在しません`,
                    {
                        missionId: req.missionId,
                        missionName: req.missionName,
                    },
                );
                return false;
            }
        }
        return true;
    });
}

// --- フェーズ3: 種別ごとにグループ化 ---

function groupByKind(reqs: ExpandedRequirement[]): {
    equipmentReqs: ExpandedRequirement[];
    categoryReqs: ExpandedRequirement[];
} {
    const equipmentReqs: ExpandedRequirement[] = [];
    const categoryReqs: ExpandedRequirement[] = [];

    for (const req of reqs) {
        if (req.kind === REQUIREMENT_KIND.CATEGORY) {
            categoryReqs.push(req);
        } else {
            equipmentReqs.push(req);
        }
    }

    return { equipmentReqs, categoryReqs };
}

// --- フェーズ4/5: MAX集計 ---

function aggregateByMax(reqs: ExpandedRequirement[]): Map<string, number> {
    const countMap = new Map<string, number>();

    for (const req of reqs) {
        const current = countMap.get(req.targetId) ?? 0;
        countMap.set(req.targetId, Math.max(current, req.count));
    }

    return countMap;
}

// --- フェーズ6: 包含関係の解決 ---

function resolveInclusion(
    equipmentCountMap: Map<string, number>,
    categoryCountMap: Map<string, number>,
    equipmentMap: Map<string, Equipment>,
): void {
    for (const [categoryId, categoryCount] of categoryCountMap) {
        let itemTotalInCategory = 0;
        for (const [eqId, eqCount] of equipmentCountMap) {
            const equipment = equipmentMap.get(eqId);
            if (equipment && equipment.categoryId === categoryId) {
                itemTotalInCategory += eqCount;
            }
        }

        const remaining = categoryCount - itemTotalInCategory;
        if (remaining <= 0) {
            categoryCountMap.delete(categoryId);
        } else {
            categoryCountMap.set(categoryId, remaining);
        }
    }
}

// --- フェーズ7: 廃棄リスト生成 ---

function generateScrapList(
    equipmentCountMap: Map<string, number>,
    categoryCountMap: Map<string, number>,
    equipmentMap: Map<string, Equipment>,
    categoryMap: Map<string, Category>,
): ScrapListItem[] {
    const scrapList: ScrapListItem[] = [];

    for (const [eqId, count] of equipmentCountMap) {
        const equipment = equipmentMap.get(eqId);
        if (equipment) {
            const category = categoryMap.get(equipment.categoryId);
            scrapList.push({
                targetKind: REQUIREMENT_KIND.EQUIPMENT as RequirementKind,
                targetId: equipment.id,
                name: equipment.name,
                categoryName: category?.name ?? equipment.categoryId,
                count,
            });
        }
    }

    for (const [categoryId, count] of categoryCountMap) {
        const category = categoryMap.get(categoryId);
        if (category) {
            scrapList.push({
                targetKind: REQUIREMENT_KIND.CATEGORY as RequirementKind,
                targetId: categoryId,
                name: category.name + '（種別不問）',
                categoryName: category.name,
                count,
            });
        }
    }

    scrapList.sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName, 'ja'),
    );

    return scrapList;
}

// --- 過不足計算 ---

export function calculateScrapComparison(
    selectedMissions: {
        baseMission: SelectedMissionEntry | null;
        auxiliaryMissions: SelectedMissionEntry[];
    },
    allMissions: Mission[],
    equipmentMap: Map<string, Equipment>,
    categoryMap: Map<string, Category>,
): {
    baseRequirements: ScrapListItem[];
    auxiliaryScrapList: ScrapListItem[];
    comparison: ComparisonItem[];
    warnings: CalcWarning[];
} {
    if (!selectedMissions.baseMission) {
        const auxResult = calculateScrapList(
            selectedMissions.auxiliaryMissions,
            allMissions,
            equipmentMap,
            categoryMap,
        );
        return {
            baseRequirements: [],
            auxiliaryScrapList: auxResult.scrapList,
            comparison: [],
            warnings: auxResult.warnings,
        };
    }

    const baseResult = calculateScrapList(
        [selectedMissions.baseMission],
        allMissions,
        equipmentMap,
        categoryMap,
    );

    const auxResult = calculateScrapList(
        selectedMissions.auxiliaryMissions,
        allMissions,
        equipmentMap,
        categoryMap,
    );

    const comparison = calculateDifference(
        baseResult.scrapList,
        auxResult.scrapList,
        equipmentMap,
    );

    return {
        baseRequirements: baseResult.scrapList,
        auxiliaryScrapList: auxResult.scrapList,
        comparison,
        warnings: [...baseResult.warnings, ...auxResult.warnings],
    };
}

// --- 過不足の詳細計算 ---

function calculateDifference(
    baseReqs: ScrapListItem[],
    auxList: ScrapListItem[],
    equipmentMap: Map<string, Equipment>,
): ComparisonItem[] {
    const comparison: ComparisonItem[] = [];

    for (const baseReq of baseReqs) {
        let auxiliaryCount = 0;

        if (baseReq.targetKind === REQUIREMENT_KIND.EQUIPMENT) {
            const auxItem = auxList.find(
                (a) => a.targetId === baseReq.targetId,
            );
            if (auxItem) auxiliaryCount = auxItem.count;
        } else {
            const categoryId = baseReq.targetId;

            const auxCategory = auxList.find(
                (a) =>
                    a.targetKind === REQUIREMENT_KIND.CATEGORY &&
                    a.targetId === categoryId,
            );
            if (auxCategory) auxiliaryCount += auxCategory.count;

            for (const auxItem of auxList) {
                if (auxItem.targetKind === REQUIREMENT_KIND.EQUIPMENT) {
                    const eq = equipmentMap.get(auxItem.targetId);
                    if (eq && eq.categoryId === categoryId) {
                        auxiliaryCount += auxItem.count;
                    }
                }
            }
        }

        const difference = auxiliaryCount - baseReq.count;
        comparison.push({
            ...baseReq,
            baseCount: baseReq.count,
            auxiliaryCount,
            difference,
            status: difference >= 0 ? 'sufficient' : 'insufficient',
        });
    }

    for (const auxItem of auxList) {
        const existsInBase = baseReqs.some((b) => {
            if (
                b.targetKind === REQUIREMENT_KIND.EQUIPMENT &&
                auxItem.targetKind === REQUIREMENT_KIND.EQUIPMENT
            ) {
                return b.targetId === auxItem.targetId;
            }
            if (
                b.targetKind === REQUIREMENT_KIND.CATEGORY &&
                auxItem.targetKind === REQUIREMENT_KIND.CATEGORY
            ) {
                return b.targetId === auxItem.targetId;
            }
            if (
                b.targetKind === REQUIREMENT_KIND.CATEGORY &&
                auxItem.targetKind === REQUIREMENT_KIND.EQUIPMENT
            ) {
                const eq = equipmentMap.get(auxItem.targetId);
                return eq !== undefined && eq.categoryId === b.targetId;
            }
            return false;
        });

        if (!existsInBase) {
            comparison.push({
                ...auxItem,
                baseCount: 0,
                auxiliaryCount: auxItem.count,
                difference: auxItem.count,
                status: 'excess',
            });
        }
    }

    comparison.sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName, 'ja'),
    );

    return comparison;
}
