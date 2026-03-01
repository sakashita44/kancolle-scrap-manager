/**
 * データSlice
 * カテゴリ・装備・任務の状態管理とCRUD
 */

import type { StateCreator } from 'zustand';
import type { AppState } from './index';
import {
    ID_PREFIX,
    type PersistedCategory,
    type PersistedEquipment,
    type PersistedMission,
    type MissionFormValues,
} from '../schema';
import {
    loadUserCategories,
    saveUserCategories,
    loadUserEquipments,
    saveUserEquipments,
    loadUserMissions,
    saveUserMissions,
} from './storage';

// --- 型定義 ---

export interface DataSlice {
    // ユーザーデータ（永続化形式）
    userCategories: PersistedCategory[];
    userEquipments: PersistedEquipment[];
    userMissions: PersistedMission[];

    // データ読み込み時の警告
    dataWarnings: string[];

    // カテゴリ CRUD
    addUserCategory: (name: string) => void;
    updateUserCategory: (
        id: string,
        updates: Partial<Pick<PersistedCategory, 'name' | 'order'>>,
    ) => void;
    deleteUserCategory: (id: string) => void;
    setUserCategories: (categories: PersistedCategory[]) => void;
    swapUserCategoryOrder: (id1: string, id2: string) => void;

    // 装備 CRUD
    addUserEquipment: (name: string, categoryId: string) => void;
    updateUserEquipment: (
        id: string,
        updates: Partial<
            Pick<PersistedEquipment, 'name' | 'categoryId' | 'order'>
        >,
    ) => void;
    deleteUserEquipment: (id: string) => void;
    setUserEquipments: (equipments: PersistedEquipment[]) => void;
    swapUserEquipmentOrder: (id1: string, id2: string) => void;

    // 任務 CRUD
    saveMission: (formData: MissionFormValues, editingId?: string) => void;
    deleteUserMission: (id: string) => void;

    // カテゴリ削除時の連鎖削除
    deleteCategoryWithDependents: (categoryId: string) => void;

    // データ初期化
    initData: () => void;
    resetAllUserData: () => void;
}

// --- ヘルパー ---

function generateId(prefix: string): string {
    return `${prefix}${crypto.randomUUID()}`;
}

function getNextOrder(items: { order: number }[]): number {
    if (items.length === 0) return 0;
    return Math.max(...items.map((item) => item.order)) + 1;
}

function swapOrder<T extends { id: string; order: number }>(
    items: T[],
    id1: string,
    id2: string,
): T[] {
    const item1 = items.find((i) => i.id === id1);
    const item2 = items.find((i) => i.id === id2);
    if (!item1 || !item2) return items;
    return items.map((item) => {
        if (item.id === id1) return { ...item, order: item2.order };
        if (item.id === id2) return { ...item, order: item1.order };
        return item;
    });
}

// --- Slice 生成 ---

export const createDataSlice: StateCreator<AppState, [], [], DataSlice> = (
    set,
    get,
) => ({
    userCategories: [],
    userEquipments: [],
    userMissions: [],
    dataWarnings: [],

    initData: () => {
        const catResult = loadUserCategories();
        const eqResult = loadUserEquipments();
        const msResult = loadUserMissions();

        const warnings = [
            ...catResult.warnings,
            ...eqResult.warnings,
            ...msResult.warnings,
        ];

        set({
            userCategories: catResult.data,
            userEquipments: eqResult.data,
            userMissions: msResult.data,
            dataWarnings: warnings,
        });
    },

    // --- カテゴリ ---

    addUserCategory: (name) => {
        const { userCategories } = get();
        const newCategory: PersistedCategory = {
            id: generateId(ID_PREFIX.USER_CATEGORY),
            name,
            order: getNextOrder(userCategories),
        };
        const updated = [...userCategories, newCategory];
        set({ userCategories: updated });
        saveUserCategories(updated);
    },

    updateUserCategory: (id, updates) => {
        const { userCategories } = get();
        const updated = userCategories.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
        );
        set({ userCategories: updated });
        saveUserCategories(updated);
    },

    deleteUserCategory: (id) => {
        const { userCategories } = get();
        const updated = userCategories.filter((c) => c.id !== id);
        set({ userCategories: updated });
        saveUserCategories(updated);
    },

    setUserCategories: (categories) => {
        set({ userCategories: categories });
        saveUserCategories(categories);
    },

    swapUserCategoryOrder: (id1, id2) => {
        const { userCategories } = get();
        const updated = swapOrder(userCategories, id1, id2);
        set({ userCategories: updated });
        saveUserCategories(updated);
    },

    // --- 装備 ---

    addUserEquipment: (name, categoryId) => {
        const { userEquipments } = get();
        const newEquipment: PersistedEquipment = {
            id: generateId(ID_PREFIX.USER_EQUIPMENT),
            name,
            categoryId,
            order: getNextOrder(userEquipments),
        };
        const updated = [...userEquipments, newEquipment];
        set({ userEquipments: updated });
        saveUserEquipments(updated);
    },

    updateUserEquipment: (id, updates) => {
        const { userEquipments } = get();
        const updated = userEquipments.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
        );
        set({ userEquipments: updated });
        saveUserEquipments(updated);
    },

    deleteUserEquipment: (id) => {
        const { userEquipments } = get();
        const updated = userEquipments.filter((e) => e.id !== id);
        set({ userEquipments: updated });
        saveUserEquipments(updated);
    },

    setUserEquipments: (equipments) => {
        set({ userEquipments: equipments });
        saveUserEquipments(equipments);
    },

    swapUserEquipmentOrder: (id1, id2) => {
        const { userEquipments } = get();
        const updated = swapOrder(userEquipments, id1, id2);
        set({ userEquipments: updated });
        saveUserEquipments(updated);
    },

    // --- 任務 ---

    saveMission: (formData, editingId) => {
        const { userMissions } = get();

        if (editingId) {
            // 更新
            const updated = userMissions.map((m) =>
                m.id === editingId
                    ? {
                          ...m,
                          name: formData.name,
                          period: formData.period,
                          reqs: formData.reqs.map((r) => ({
                              kind: r.kind as 'category' | 'equipment',
                              id: r.id,
                              count: r.count,
                          })),
                      }
                    : m,
            );
            set({ userMissions: updated });
            saveUserMissions(updated);
        } else {
            // 新規追加
            const newMission: PersistedMission = {
                id: generateId(ID_PREFIX.USER_MISSION),
                name: formData.name,
                period: formData.period,
                order: getNextOrder(userMissions),
                reqs: formData.reqs.map((r) => ({
                    kind: r.kind as 'category' | 'equipment',
                    id: r.id,
                    count: r.count,
                })),
            };
            const updated = [...userMissions, newMission];
            set({ userMissions: updated });
            saveUserMissions(updated);
        }
    },

    deleteUserMission: (id) => {
        const { userMissions } = get();
        const updated = userMissions.filter((m) => m.id !== id);
        set({ userMissions: updated });
        saveUserMissions(updated);
    },

    // --- カテゴリ連鎖削除 ---

    deleteCategoryWithDependents: (categoryId) => {
        const { userCategories, userEquipments } = get();

        const updatedCategories = userCategories.filter(
            (c) => c.id !== categoryId,
        );
        const updatedEquipments = userEquipments.filter(
            (e) => e.categoryId !== categoryId,
        );
        // 任務の要求から該当カテゴリ/装備を参照するものは任務ごと削除しない
        // （任務は残し、計算時に警告する設計を維持）

        set({
            userCategories: updatedCategories,
            userEquipments: updatedEquipments,
        });
        saveUserCategories(updatedCategories);
        saveUserEquipments(updatedEquipments);
    },

    // --- リセット ---

    resetAllUserData: () => {
        set({
            userCategories: [],
            userEquipments: [],
            userMissions: [],
            dataWarnings: [],
        });
        saveUserCategories([]);
        saveUserEquipments([]);
        saveUserMissions([]);
    },
});
