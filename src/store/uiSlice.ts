/**
 * UI Slice
 * モーダル、確認ダイアログ、フィルタ、展開状態
 */

import type { StateCreator } from 'zustand';
import type { AppState } from './index';
import type { PersistedMission } from '../schema';
import {
    isAboutShown,
    saveAboutShown,
    loadFilterPeriod,
    saveFilterPeriod,
    loadFilterCategory,
    saveFilterCategory,
    loadExpandedMissions,
    saveExpandedMissions,
} from './storage';

// --- 型定義 ---

export type ModalType = 'equipment' | 'mission' | null;

export interface ConfirmDialog {
    isOpen: boolean;
    type: string;
    id: string;
    message: string;
}

export interface UISlice {
    // モーダル
    activeModal: ModalType;
    editingMission: PersistedMission | null;

    // 確認ダイアログ
    confirmDialog: ConfirmDialog;

    // Aboutモーダル
    aboutShown: boolean;

    // フィルタ
    filterPeriods: Set<string>;
    filterCategories: Set<string>;
    filterText: string;

    // 任務リスト展開状態
    expandedMissions: Set<string>;

    // アクション: モーダル
    openEquipmentModal: () => void;
    openMissionModal: (editing?: PersistedMission) => void;
    closeModal: () => void;

    // アクション: 確認ダイアログ
    openConfirmDialog: (type: string, id: string, message: string) => void;
    closeConfirmDialog: () => void;

    // アクション: About
    initAbout: () => void;
    markAboutShown: () => void;

    // アクション: フィルタ
    initFilters: () => void;
    setFilterPeriods: (periods: Set<string>) => void;
    toggleFilterPeriod: (period: string) => void;
    setFilterCategories: (categories: Set<string>) => void;
    toggleFilterCategory: (categoryId: string) => void;
    setFilterText: (text: string) => void;
    resetFilters: () => void;

    // アクション: 展開状態
    initExpanded: () => void;
    toggleExpanded: (missionId: string) => void;
}

const INITIAL_CONFIRM: ConfirmDialog = {
    isOpen: false,
    type: '',
    id: '',
    message: '',
};

// --- Slice 生成 ---

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (
    set,
    get,
) => ({
    activeModal: null,
    editingMission: null,
    confirmDialog: INITIAL_CONFIRM,
    aboutShown: true,
    filterPeriods: new Set(),
    filterCategories: new Set(),
    filterText: '',
    expandedMissions: new Set(),

    // --- モーダル ---

    openEquipmentModal: () => {
        set({ activeModal: 'equipment', editingMission: null });
    },

    openMissionModal: (editing) => {
        set({
            activeModal: 'mission',
            editingMission: editing ?? null,
        });
    },

    closeModal: () => {
        set({ activeModal: null, editingMission: null });
    },

    // --- 確認ダイアログ ---

    openConfirmDialog: (type, id, message) => {
        set({
            confirmDialog: { isOpen: true, type, id, message },
        });
    },

    closeConfirmDialog: () => {
        set({ confirmDialog: INITIAL_CONFIRM });
    },

    // --- About ---

    initAbout: () => {
        set({ aboutShown: isAboutShown() });
    },

    markAboutShown: () => {
        set({ aboutShown: true });
        saveAboutShown();
    },

    // --- フィルタ ---

    initFilters: () => {
        set({
            filterPeriods: loadFilterPeriod(),
            filterCategories: loadFilterCategory(),
        });
    },

    setFilterPeriods: (periods) => {
        set({ filterPeriods: periods });
        saveFilterPeriod(periods);
    },

    toggleFilterPeriod: (period) => {
        const { filterPeriods } = get();
        const next = new Set(filterPeriods);
        if (next.has(period)) {
            next.delete(period);
        } else {
            next.add(period);
        }
        set({ filterPeriods: next });
        saveFilterPeriod(next);
    },

    setFilterCategories: (categories) => {
        set({ filterCategories: categories });
        saveFilterCategory(categories);
    },

    toggleFilterCategory: (categoryId) => {
        const { filterCategories } = get();
        const next = new Set(filterCategories);
        if (next.has(categoryId)) {
            next.delete(categoryId);
        } else {
            next.add(categoryId);
        }
        set({ filterCategories: next });
        saveFilterCategory(next);
    },

    setFilterText: (text) => {
        set({ filterText: text });
    },

    resetFilters: () => {
        const empty = new Set<string>();
        set({
            filterPeriods: empty,
            filterCategories: empty,
            filterText: '',
        });
        saveFilterPeriod(empty);
        saveFilterCategory(empty);
    },

    // --- 展開状態 ---

    initExpanded: () => {
        set({ expandedMissions: loadExpandedMissions() });
    },

    toggleExpanded: (missionId) => {
        const { expandedMissions } = get();
        const next = new Set(expandedMissions);
        if (next.has(missionId)) {
            next.delete(missionId);
        } else {
            next.add(missionId);
        }
        set({ expandedMissions: next });
        saveExpandedMissions(next);
    },
});
