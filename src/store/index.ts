/**
 * Zustand Store
 * 単一ストア、slice構成
 */

import { create } from 'zustand';
import { createDataSlice, type DataSlice } from './dataSlice';
import { createSelectionSlice, type SelectionSlice } from './selectionSlice';
import { createUISlice, type UISlice } from './uiSlice';
import {
    SOURCE,
    REQUIREMENT_KIND,
    LIMITS,
    type Category,
    type Equipment,
    type Mission,
    type RequirementCategoryGroup,
    type PersistedRequirementCategoryGroup,
    type PersistedMission,
} from '../schema';

// マスタデータ（静的JSONインポート）
import masterCategoriesJson from '../data/categories.json';
import masterEquipmentsJson from '../data/equipments.json';
import masterMissionsJson from '../data/missions.json';
import masterRequirementCategoryGroupsJson from '../data/requirementCategoryGroups.json';

// --- マスタデータのランタイム変換（モジュールスコープで1回だけ実行） ---

const masterCategories: Category[] = masterCategoriesJson.categories.map(
    (c) => ({
        ...c,
        source: SOURCE.MASTER,
    }),
);

const masterEquipments: Equipment[] = masterEquipmentsJson.equipments.map(
    (e) => ({
        ...e,
        source: SOURCE.MASTER,
    }),
);

const masterMissions: Mission[] = (
    masterMissionsJson as { version: string; missions: PersistedMission[] }
).missions.map((m) => ({
    ...m,
    source: SOURCE.MASTER,
}));

const masterRequirementCategoryGroups: RequirementCategoryGroup[] = (
    masterRequirementCategoryGroupsJson as {
        version: string;
        requirementCategoryGroups: PersistedRequirementCategoryGroup[];
    }
).requirementCategoryGroups.map((group) => ({
    ...group,
    source: SOURCE.MASTER,
}));

const enabledMasterRequirementCategoryGroups: RequirementCategoryGroup[] =
    masterRequirementCategoryGroups
        .filter((group) => group.categoryIds.length > 0)
        .sort(sortBySourceAndOrder);

// --- ストア型 ---

export type AppState = DataSlice & SelectionSlice & UISlice;

// --- ストア生成 ---

export const useStore = create<AppState>()((...args) => ({
    ...createDataSlice(...args),
    ...createSelectionSlice(...args),
    ...createUISlice(...args),
}));

// --- ソートヘルパー ---

function sortBySourceAndOrder<T extends { source: string; order: number }>(
    a: T,
    b: T,
): number {
    // master → user の順
    if (a.source !== b.source) {
        return a.source === SOURCE.MASTER ? -1 : 1;
    }
    return a.order - b.order;
}

// --- メモ化セレクタ生成 ---

/**
 * 入力セレクタの結果が変わらない（参照等価）場合、前回の結果を返すメモ化セレクタを生成する。
 * reselectのcreateSelector相当の最小実装。
 */
function createSelector<S, R>(
    inputSelectors: ((state: S) => unknown)[],
    combiner: (...inputs: never[]) => R,
): (state: S) => R {
    let lastInputs: unknown[] | undefined;
    let lastResult: R;
    return (state: S) => {
        const inputs = inputSelectors.map((sel) => sel(state));
        if (
            lastInputs &&
            inputs.length === lastInputs.length &&
            inputs.every((v, i) => v === lastInputs![i])
        ) {
            return lastResult;
        }
        lastInputs = inputs;
        lastResult = (combiner as (...args: unknown[]) => R)(...inputs);
        return lastResult;
    };
}

// --- セレクタ ---

/** 全カテゴリ（マスタ + ユーザー、ソート済み） */
export const selectAllCategories = createSelector(
    [(state: AppState) => state.userCategories],
    (userCategories: Category[]): Category[] => {
        const user: Category[] = userCategories.map((c) => ({
            ...c,
            source: SOURCE.USER,
        }));
        return [...masterCategories, ...user].sort(sortBySourceAndOrder);
    },
);

/** カテゴリIDからカテゴリを取得するMap */
export const selectCategoryMap = createSelector(
    [selectAllCategories],
    (all: Category[]): Map<string, Category> =>
        new Map(all.map((c) => [c.id, c])),
);

/** カテゴリ名取得関数 */
export const selectGetCategoryName = createSelector(
    [selectCategoryMap],
    (map: Map<string, Category>): ((id: string) => string) =>
        (id: string) =>
            map.get(id)?.name ?? '不明なカテゴリ',
);

/** 全要求カテゴリグループ（有効カテゴリを1件以上持つもののみ） */
export const selectAllRequirementCategoryGroups = createSelector(
    [selectCategoryMap],
    (categoryMap: Map<string, Category>): RequirementCategoryGroup[] =>
        enabledMasterRequirementCategoryGroups.filter((group) =>
            group.categoryIds.some((categoryId) => categoryMap.has(categoryId)),
        ),
);

/** 要求カテゴリグループIDからグループを取得するMap */
export const selectRequirementCategoryGroupMap = createSelector(
    [selectAllRequirementCategoryGroups],
    (all: RequirementCategoryGroup[]): Map<string, RequirementCategoryGroup> =>
        new Map(all.map((group) => [group.id, group])),
);

/** 全装備（マスタ + ユーザー、ソート済み） */
export const selectAllEquipments = createSelector(
    [(state: AppState) => state.userEquipments],
    (userEquipments: Equipment[]): Equipment[] => {
        const user: Equipment[] = userEquipments.map((e) => ({
            ...e,
            source: SOURCE.USER,
        }));
        return [...masterEquipments, ...user].sort(sortBySourceAndOrder);
    },
);

/** 装備IDから装備を取得するMap */
export const selectEquipmentMap = createSelector(
    [selectAllEquipments],
    (all: Equipment[]): Map<string, Equipment> =>
        new Map(all.map((e) => [e.id, e])),
);

/** 全任務（マスタ + ユーザー、ソート済み） */
export const selectAllMissions = createSelector(
    [(state: AppState) => state.userMissions],
    (userMissions: Mission[]): Mission[] => {
        const user: Mission[] = userMissions.map((m) => ({
            ...m,
            source: SOURCE.USER,
        }));
        return [...masterMissions, ...user].sort(sortBySourceAndOrder);
    },
);

/** 任務IDから任務を取得するMap */
export const selectMissionMap = createSelector(
    [selectAllMissions],
    (all: Mission[]): Map<string, Mission> =>
        new Map(all.map((m) => [m.id, m])),
);

/** 選択中の全任務ID */
export const selectAllSelectedIds = createSelector(
    [
        (state: AppState) => state.baseMission,
        (state: AppState) => state.auxiliaryMissions,
    ],
    (
        baseMission: AppState['baseMission'],
        auxiliaryMissions: AppState['auxiliaryMissions'],
    ): string[] => {
        const ids: string[] = [];
        if (baseMission) ids.push(baseMission.missionId);
        for (const m of auxiliaryMissions) {
            ids.push(m.missionId);
        }
        return ids;
    },
);

/** 選択中の任務数 */
export const selectSelectedCount = (state: AppState): number => {
    return (state.baseMission ? 1 : 0) + state.auxiliaryMissions.length;
};

/** 任務が選択中かどうか */
export const selectIsSelected = (
    state: AppState,
    missionId: string,
): boolean => {
    if (state.baseMission?.missionId === missionId) return true;
    return state.auxiliaryMissions.some((m) => m.missionId === missionId);
};

/** ベース任務かどうか */
export const selectIsBaseMission = (
    state: AppState,
    missionId: string,
): boolean => {
    return state.baseMission?.missionId === missionId;
};

/** 追加選択可能かどうか */
export const selectCanSelect = (state: AppState): boolean => {
    return selectSelectedCount(state) < LIMITS.SELECTED_MISSIONS_MAX;
};

/** カテゴリ別装備グループ（UI用） */
export const selectEquipmentsByCategory = createSelector(
    [selectAllCategories, selectAllEquipments],
    (
        allCategories: Category[],
        allEquipments: Equipment[],
    ): {
        categoryId: string;
        categoryName: string;
        equipments: Equipment[];
    }[] =>
        allCategories.map((cat) => ({
            categoryId: cat.id,
            categoryName: cat.name,
            equipments: allEquipments.filter((e) => e.categoryId === cat.id),
        })),
);

/** 要求装備の選択肢（カテゴリグループ + カテゴリ + 個別装備） */
export const selectRequirementOptions = createSelector(
    [
        selectAllRequirementCategoryGroups,
        selectAllCategories,
        selectAllEquipments,
        selectGetCategoryName,
    ],
    (
        allRequirementCategoryGroups: RequirementCategoryGroup[],
        allCategories: Category[],
        allEquipments: Equipment[],
        getCategoryName: (id: string) => string,
    ): { kind: string; id: string; label: string; group: string }[] => {
        const categoryGroupOptions = allRequirementCategoryGroups.map(
            (group) => ({
                kind: REQUIREMENT_KIND.CATEGORY_GROUP,
                id: group.id,
                label: `【${group.name}】（種別不問）`,
                group: 'カテゴリグループ',
            }),
        );

        const categoryOptions = allCategories.map((cat) => ({
            kind: REQUIREMENT_KIND.CATEGORY,
            id: cat.id,
            label: `【${cat.name}】（種別不問）`,
            group: 'カテゴリ',
        }));

        const equipmentOptions = allEquipments.map((eq) => ({
            kind: REQUIREMENT_KIND.EQUIPMENT,
            id: eq.id,
            label: eq.name,
            group: getCategoryName(eq.categoryId),
        }));

        return [
            ...categoryGroupOptions,
            ...categoryOptions,
            ...equipmentOptions,
        ];
    },
);

// --- マスタデータ参照用エクスポート ---

export {
    masterCategories,
    masterEquipments,
    masterMissions,
    masterRequirementCategoryGroups,
};

// --- 型エクスポート ---

export type { DataSlice } from './dataSlice';
export type { SelectionSlice } from './selectionSlice';
export type { UISlice, ModalType, ConfirmDialog } from './uiSlice';
