import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from 'zustand';
import { createSelectionSlice, type SelectionSlice } from '../selectionSlice';

// storageモジュールをモック化（SessionStorage依存を排除）
vi.mock('../storage', () => ({
    loadSelectedMissions: vi.fn(() => null),
    saveSelectedMissions: vi.fn(),
}));

/**
 * selectionSlice単体のテスト用ストアを生成。
 * AppState全体ではなくSelectionSliceのみを持つ最小構成。
 */
function createTestStore() {
    return createStore<SelectionSlice>()((...args) =>
        createSelectionSlice(
            ...(args as Parameters<typeof createSelectionSlice>),
        ),
    );
}

describe('selectionSlice', () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
        store = createTestStore();
    });

    it('補助→ベース切替時にcountが維持される', () => {
        // 補助任務として count=3 で選択
        store.getState().selectAuxiliaryMission('m1');
        store.getState().updateAuxiliaryMissionCount('m1', 3);
        expect(
            store.getState().auxiliaryMissions.find((m) => m.missionId === 'm1')
                ?.count,
        ).toBe(3);

        // ベースに切り替え → count維持
        store.getState().selectBaseMission('m1');
        expect(store.getState().baseMission?.count).toBe(3);
    });

    it('旧ベース→補助移動時にcountが維持される', () => {
        // ベース任務として count=5 で設定
        store.getState().selectBaseMission('m1');
        store.getState().updateBaseMissionCount(5);
        expect(store.getState().baseMission?.count).toBe(5);

        // 別の任務をベースに → 旧ベースが補助に移動し count維持
        store.getState().selectBaseMission('m2');
        const moved = store
            .getState()
            .auxiliaryMissions.find((m) => m.missionId === 'm1');
        expect(moved?.count).toBe(5);
    });

    it('count更新時に 1..99 にクランプされる（0→1, 100→99）', () => {
        store.getState().selectBaseMission('m1');

        store.getState().updateBaseMissionCount(0);
        expect(store.getState().baseMission?.count).toBe(1);

        store.getState().updateBaseMissionCount(100);
        expect(store.getState().baseMission?.count).toBe(99);

        store.getState().updateBaseMissionCount(50);
        expect(store.getState().baseMission?.count).toBe(50);
    });
});
