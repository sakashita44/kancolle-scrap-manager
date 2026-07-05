/**
 * マスタデータ整合性チェック（純粋関数）
 *
 * 同梱マスタJSON（カテゴリ・装備・任務・要求カテゴリグループ）の参照整合性と
 * ID一意性を検証する。任務が未登録の装備・カテゴリを参照するといった不整合を
 * ビルド前・テスト時に検出するために用いる。
 */

interface CategoryEntry {
    id: string;
}

interface EquipmentEntry {
    id: string;
    categoryId: string;
}

interface RequirementEntry {
    kind: 'equipment' | 'category' | 'categoryGroup';
    id: string;
}

interface MissionEntry {
    id: string;
    name: string;
    reqs: RequirementEntry[];
}

interface RequirementCategoryGroupEntry {
    id: string;
    categoryIds: string[];
}

export interface MasterData {
    categories: CategoryEntry[];
    equipments: EquipmentEntry[];
    missions: MissionEntry[];
    requirementCategoryGroups: RequirementCategoryGroupEntry[];
}

function findDuplicateIds(ids: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const id of ids) {
        if (seen.has(id)) duplicates.add(id);
        seen.add(id);
    }
    return [...duplicates];
}

/**
 * 参照整合性・ID一意性を検証し、違反メッセージの配列を返す。
 * 問題がなければ空配列を返す。
 */
export function validateMasterDataIntegrity(data: MasterData): string[] {
    const { categories, equipments, missions, requirementCategoryGroups } =
        data;
    const errors: string[] = [];

    const categoryIds = new Set(categories.map((c) => c.id));
    const equipmentIds = new Set(equipments.map((e) => e.id));
    const missionIds = missions.map((m) => m.id);
    const groupIds = new Set(requirementCategoryGroups.map((g) => g.id));

    // ID一意性
    for (const [label, ids] of [
        ['カテゴリ', categories.map((c) => c.id)],
        ['装備', equipments.map((e) => e.id)],
        ['任務', missionIds],
        ['要求カテゴリグループ', requirementCategoryGroups.map((g) => g.id)],
    ] as const) {
        for (const dup of findDuplicateIds(ids)) {
            errors.push(`${label}IDが重複しています: ${dup}`);
        }
    }

    // 装備 → カテゴリ参照
    for (const eq of equipments) {
        if (!categoryIds.has(eq.categoryId)) {
            errors.push(
                `装備 "${eq.id}" が存在しないカテゴリを参照しています: ${eq.categoryId}`,
            );
        }
    }

    // 要求カテゴリグループ → カテゴリ参照
    for (const group of requirementCategoryGroups) {
        for (const categoryId of group.categoryIds) {
            if (!categoryIds.has(categoryId)) {
                errors.push(
                    `要求カテゴリグループ "${group.id}" が存在しないカテゴリを参照しています: ${categoryId}`,
                );
            }
        }
    }

    // 任務の要求 → 装備 / カテゴリ / 要求カテゴリグループ参照
    for (const mission of missions) {
        for (const req of mission.reqs) {
            const target =
                req.kind === 'equipment'
                    ? { set: equipmentIds, label: '装備' }
                    : req.kind === 'category'
                      ? { set: categoryIds, label: 'カテゴリ' }
                      : { set: groupIds, label: '要求カテゴリグループ' };
            if (!target.set.has(req.id)) {
                errors.push(
                    `任務 "${mission.id}"（${mission.name}）が存在しない${target.label}を参照しています: ${req.id}`,
                );
            }
        }
    }

    return errors;
}
