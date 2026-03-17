/**
 * storageイベント監視hook
 * 別タブでLocalStorageが更新された際にストアを自動再読み込みする
 */

import { useEffect } from 'react';
import { useStore, selectAllMissions } from '../store';
import { STORAGE_KEYS } from '../schema';

/** 監視対象のLocalStorageキー */
const WATCHED_KEYS: ReadonlySet<string> = new Set([
    STORAGE_KEYS.USER_CATEGORIES,
    STORAGE_KEYS.USER_EQUIPMENTS,
    STORAGE_KEYS.USER_MISSIONS,
]);

/**
 * 別タブでのLocalStorage変更を検知し、ストアを自動同期する。
 *
 * `storage`イベントは同一オリジンの**別タブ**でLocalStorageが変更された場合にのみ発火する。
 * 自タブでの変更では発火しないため、ループの心配はない。
 */
export function useStorageWatcher(): void {
    const initData = useStore((s) => s.initData);
    const initSelection = useStore((s) => s.initSelection);

    useEffect(() => {
        const handleStorage = (event: StorageEvent): void => {
            if (event.key === null || !WATCHED_KEYS.has(event.key)) return;

            // LocalStorageからデータを再読み込み
            initData();

            // 再読み込み後の全任務IDで選択状態を整合性チェック
            const missionIds = new Set(
                selectAllMissions(useStore.getState()).map((m) => m.id),
            );
            initSelection(missionIds);
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [initData, initSelection]);
}
