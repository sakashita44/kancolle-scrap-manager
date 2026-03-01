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
    type PersistedMission,
} from '../schema';

// マスタデータ（静的JSONインポート）
import masterCategoriesJson from '../data/categories.json';
import masterEquipmentsJson from '../data/equipments.json';
import masterMissionsJson from '../data/missions.json';

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

// --- セレクタ ---

/** 全カテゴリ（マスタ + ユーザー、ソート済み） */
export const selectAllCategories = (state: AppState): Category[] => {
    const user: Category[] = state.userCategories.map((c) => ({
        ...c,
        source: SOURCE.USER,
    }));
    return [...masterCategories, ...user].sort(sortBySourceAndOrder);
};

/** カテゴリIDからカテゴリを取得するMap */
export const selectCategoryMap = (state: AppState): Map<string, Category> => {
    const all = selectAllCategories(state);
    return new Map(all.map((c) => [c.id, c]));
};

/** カテゴリ名取得関数 */
export const selectGetCategoryName = (
    state: AppState,
): ((id: string) => string) => {
    const map = selectCategoryMap(state);
    return (id: string) => map.get(id)?.name ?? '不明なカテゴリ';
};

/** 全装備（マスタ + ユーザー、ソート済み） */
export const selectAllEquipments = (state: AppState): Equipment[] => {
    const user: Equipment[] = state.userEquipments.map((e) => ({
        ...e,
        source: SOURCE.USER,
    }));
    return [...masterEquipments, ...user].sort(sortBySourceAndOrder);
};

/** 装備IDから装備を取得するMap */
export const selectEquipmentMap = (state: AppState): Map<string, Equipment> => {
    const all = selectAllEquipments(state);
    return new Map(all.map((e) => [e.id, e]));
};

/** 全任務（マスタ + ユーザー、ソート済み） */
export const selectAllMissions = (state: AppState): Mission[] => {
    const user: Mission[] = state.userMissions.map((m) => ({
        ...m,
        source: SOURCE.USER,
    }));
    return [...masterMissions, ...user].sort(sortBySourceAndOrder);
};

/** 任務IDから任務を取得するMap */
export const selectMissionMap = (state: AppState): Map<string, Mission> => {
    const all = selectAllMissions(state);
    return new Map(all.map((m) => [m.id, m]));
};

/** 選択中の全任務ID */
export const selectAllSelectedIds = (state: AppState): string[] => {
    const ids: string[] = [];
    if (state.baseMission) ids.push(state.baseMission.missionId);
    for (const m of state.auxiliaryMissions) {
        ids.push(m.missionId);
    }
    return ids;
};

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
export const selectEquipmentsByCategory = (
    state: AppState,
): { categoryId: string; categoryName: string; equipments: Equipment[] }[] => {
    const allCategories = selectAllCategories(state);
    const allEquipments = selectAllEquipments(state);

    return allCategories.map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        equipments: allEquipments.filter((e) => e.categoryId === cat.id),
    }));
};

/** 要求装備の選択肢（カテゴリ + 個別装備） */
export const selectRequirementOptions = (
    state: AppState,
): { kind: string; id: string; label: string; group: string }[] => {
    const allCategories = selectAllCategories(state);
    const allEquipments = selectAllEquipments(state);
    const getCategoryName = selectGetCategoryName(state);

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

    return [...categoryOptions, ...equipmentOptions];
};

// --- マスタデータ参照用エクスポート ---

export { masterCategories, masterEquipments, masterMissions };

// --- 型エクスポート ---

export type { DataSlice } from './dataSlice';
export type { SelectionSlice } from './selectionSlice';
export type { UISlice, ModalType, ConfirmDialog } from './uiSlice';
