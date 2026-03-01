/**
 * 選択Slice
 * 任務の選択状態管理（ベース / 補助）
 */

import type { StateCreator } from 'zustand';
import type { AppState } from './index';
import { LIMITS, type SelectedMissionEntry } from '../schema';
import { loadSelectedMissions, saveSelectedMissions } from './storage';

// --- 型定義 ---

export interface SelectionSlice {
    baseMission: SelectedMissionEntry | null;
    auxiliaryMissions: SelectedMissionEntry[];
    selectionInitialized: boolean;

    // アクション
    initSelection: () => void;
    selectBaseMission: (missionId: string) => void;
    deselectBaseMission: () => void;
    selectAuxiliaryMission: (missionId: string) => void;
    deselectAuxiliaryMission: (missionId: string) => void;
    toggleMission: (missionId: string) => void;
    updateBaseMissionCount: (count: number) => void;
    updateAuxiliaryMissionCount: (missionId: string, count: number) => void;
    clearSelection: () => void;
}

// --- ヘルパー ---

function persistSelection(
    base: SelectedMissionEntry | null,
    aux: SelectedMissionEntry[],
): void {
    saveSelectedMissions({
        baseMission: base,
        auxiliaryMissions: aux,
    });
}

function totalSelected(
    base: SelectedMissionEntry | null,
    aux: SelectedMissionEntry[],
): number {
    return (base ? 1 : 0) + aux.length;
}

// --- Slice 生成 ---

export const createSelectionSlice: StateCreator<
    AppState,
    [],
    [],
    SelectionSlice
> = (set, get) => ({
    baseMission: null,
    auxiliaryMissions: [],
    selectionInitialized: false,

    initSelection: () => {
        const saved = loadSelectedMissions();
        if (saved) {
            set({
                baseMission: saved.baseMission,
                auxiliaryMissions: saved.auxiliaryMissions,
                selectionInitialized: true,
            });
        } else {
            set({ selectionInitialized: true });
        }
    },

    selectBaseMission: (missionId) => {
        const { auxiliaryMissions, baseMission } = get();
        // 既に補助任務として選択されている場合は除外
        const filteredAux = auxiliaryMissions.filter(
            (m) => m.missionId !== missionId,
        );
        const newBase: SelectedMissionEntry = { missionId, count: 1 };

        // 旧ベース任務を補助に移動
        let newAux = filteredAux;
        if (
            baseMission &&
            totalSelected(newBase, filteredAux) < LIMITS.SELECTED_MISSIONS_MAX
        ) {
            newAux = [
                ...filteredAux,
                { missionId: baseMission.missionId, count: 1 },
            ];
        }

        set({ baseMission: newBase, auxiliaryMissions: newAux });
        persistSelection(newBase, newAux);
    },

    deselectBaseMission: () => {
        const { auxiliaryMissions } = get();
        set({ baseMission: null });
        persistSelection(null, auxiliaryMissions);
    },

    selectAuxiliaryMission: (missionId) => {
        const { baseMission, auxiliaryMissions } = get();
        if (
            totalSelected(baseMission, auxiliaryMissions) >=
            LIMITS.SELECTED_MISSIONS_MAX
        ) {
            return;
        }
        if (auxiliaryMissions.some((m) => m.missionId === missionId)) return;
        if (baseMission?.missionId === missionId) return;

        const newAux = [...auxiliaryMissions, { missionId, count: 1 }];
        set({ auxiliaryMissions: newAux });
        persistSelection(baseMission, newAux);
    },

    deselectAuxiliaryMission: (missionId) => {
        const { baseMission, auxiliaryMissions } = get();
        const newAux = auxiliaryMissions.filter(
            (m) => m.missionId !== missionId,
        );
        set({ auxiliaryMissions: newAux });
        persistSelection(baseMission, newAux);
    },

    toggleMission: (missionId) => {
        const { baseMission, auxiliaryMissions } = get();
        if (baseMission?.missionId === missionId) {
            get().deselectBaseMission();
        } else if (auxiliaryMissions.some((m) => m.missionId === missionId)) {
            get().deselectAuxiliaryMission(missionId);
        } else {
            get().selectAuxiliaryMission(missionId);
        }
    },

    updateBaseMissionCount: (count) => {
        const { baseMission, auxiliaryMissions } = get();
        if (!baseMission) return;
        const updated = { ...baseMission, count };
        set({ baseMission: updated });
        persistSelection(updated, auxiliaryMissions);
    },

    updateAuxiliaryMissionCount: (missionId, count) => {
        const { baseMission, auxiliaryMissions } = get();
        const newAux = auxiliaryMissions.map((m) =>
            m.missionId === missionId ? { ...m, count } : m,
        );
        set({ auxiliaryMissions: newAux });
        persistSelection(baseMission, newAux);
    },

    clearSelection: () => {
        set({ baseMission: null, auxiliaryMissions: [] });
        persistSelection(null, []);
    },
});
