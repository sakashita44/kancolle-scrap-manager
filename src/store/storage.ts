/**
 * ストレージユーティリティ
 * LocalStorage / SessionStorage の読み書きとZodバリデーション
 */

import { z } from 'zod/v4';
import {
    STORAGE_KEYS,
    SCHEMA_VERSION,
    persistedCategorySchema,
    persistedEquipmentSchema,
    persistedMissionSchema,
    selectedMissionsSchema,
    type PersistedCategory,
    type PersistedEquipment,
    type PersistedMission,
    type SelectedMissions,
} from '../schema';

// --- 汎用ヘルパー ---

function getItem<T>(
    storage: Storage,
    key: string,
    schema: z.ZodType<T>,
): { data: T | null; error?: string } {
    try {
        const raw = storage.getItem(key);
        if (raw === null) return { data: null };
        const parsed = JSON.parse(raw);
        const result = schema.safeParse(parsed);
        if (result.success) return { data: result.data };
        return { data: null, error: `${key}: バリデーションエラー` };
    } catch {
        return { data: null, error: `${key}: 読み込みエラー` };
    }
}

function setItem(storage: Storage, key: string, value: unknown): boolean {
    try {
        storage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        console.error(`${key}: 保存に失敗しました`);
        return false;
    }
}

// --- 個別データの Zod バリデーション付きロード ---
// 配列要素を1件ずつ検証し、壊れたエントリは除外する

function loadArrayWithValidation<T>(
    storage: Storage,
    key: string,
    itemSchema: z.ZodType<T>,
    arrayKey: string,
): { data: T[]; warnings: string[] } {
    const warnings: string[] = [];
    try {
        const raw = storage.getItem(key);
        if (raw === null) return { data: [], warnings };

        const parsed = JSON.parse(raw);

        // まず wrapper の version だけチェック
        if (typeof parsed !== 'object' || parsed === null) {
            warnings.push(`${key}: データ形式が不正です`);
            return { data: [], warnings };
        }

        const items = parsed[arrayKey];
        if (!Array.isArray(items)) {
            warnings.push(`${key}: ${arrayKey}が配列ではありません`);
            return { data: [], warnings };
        }

        // 各要素を個別にバリデーション
        const valid: T[] = [];
        for (const item of items) {
            const result = itemSchema.safeParse(item);
            if (result.success) {
                valid.push(result.data);
            } else {
                const id =
                    typeof item === 'object' && item !== null && 'id' in item
                        ? (item as { id: string }).id
                        : '不明';
                warnings.push(
                    `${key}: ID=${id} のデータが壊れているため除外しました`,
                );
            }
        }

        return { data: valid, warnings };
    } catch {
        warnings.push(`${key}: 読み込みに失敗しました`);
        return { data: [], warnings };
    }
}

// --- カテゴリ ---

export function loadUserCategories(): {
    data: PersistedCategory[];
    warnings: string[];
} {
    return loadArrayWithValidation(
        localStorage,
        STORAGE_KEYS.USER_CATEGORIES,
        persistedCategorySchema,
        'categories',
    );
}

export function saveUserCategories(categories: PersistedCategory[]): boolean {
    return setItem(localStorage, STORAGE_KEYS.USER_CATEGORIES, {
        version: SCHEMA_VERSION,
        categories,
    });
}

// --- 装備 ---

export function loadUserEquipments(): {
    data: PersistedEquipment[];
    warnings: string[];
} {
    return loadArrayWithValidation(
        localStorage,
        STORAGE_KEYS.USER_EQUIPMENTS,
        persistedEquipmentSchema,
        'equipments',
    );
}

export function saveUserEquipments(equipments: PersistedEquipment[]): boolean {
    return setItem(localStorage, STORAGE_KEYS.USER_EQUIPMENTS, {
        version: SCHEMA_VERSION,
        equipments,
    });
}

// --- 任務 ---

export function loadUserMissions(): {
    data: PersistedMission[];
    warnings: string[];
} {
    return loadArrayWithValidation(
        localStorage,
        STORAGE_KEYS.USER_MISSIONS,
        persistedMissionSchema,
        'missions',
    );
}

export function saveUserMissions(missions: PersistedMission[]): boolean {
    return setItem(localStorage, STORAGE_KEYS.USER_MISSIONS, {
        version: SCHEMA_VERSION,
        missions,
    });
}

// --- 選択任務（SessionStorage） ---

export function loadSelectedMissions(): SelectedMissions {
    const result = getItem(
        sessionStorage,
        STORAGE_KEYS.SELECTED_MISSIONS,
        selectedMissionsSchema,
    );
    return result.data ?? null;
}

export function saveSelectedMissions(data: SelectedMissions): boolean {
    if (data === null) {
        try {
            sessionStorage.removeItem(STORAGE_KEYS.SELECTED_MISSIONS);
            return true;
        } catch {
            return false;
        }
    }
    return setItem(sessionStorage, STORAGE_KEYS.SELECTED_MISSIONS, data);
}

// --- About モーダル ---

export function isAboutShown(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ABOUT_SHOWN) === 'true';
}

export function saveAboutShown(): void {
    localStorage.setItem(STORAGE_KEYS.ABOUT_SHOWN, 'true');
}

// --- フィルタ（SessionStorage） ---

export function loadFilterPeriod(): Set<string> {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEYS.FILTER_PERIOD);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch {
        return new Set();
    }
}

export function saveFilterPeriod(periods: Set<string>): void {
    setItem(sessionStorage, STORAGE_KEYS.FILTER_PERIOD, [...periods]);
}

export function loadFilterCategory(): Set<string> {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEYS.FILTER_CATEGORY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch {
        return new Set();
    }
}

export function saveFilterCategory(categories: Set<string>): void {
    setItem(sessionStorage, STORAGE_KEYS.FILTER_CATEGORY, [...categories]);
}

export function loadExpandedMissions(): Set<string> {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEYS.MISSION_LIST_EXPANDED);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch {
        return new Set();
    }
}

export function saveExpandedMissions(ids: Set<string>): void {
    setItem(sessionStorage, STORAGE_KEYS.MISSION_LIST_EXPANDED, [...ids]);
}

// --- 全データクリア ---

export function clearUserData(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.USER_EQUIPMENTS);
    localStorage.removeItem(STORAGE_KEYS.USER_MISSIONS);
}

export function clearAllData(): void {
    clearUserData();
    sessionStorage.removeItem(STORAGE_KEYS.SELECTED_MISSIONS);
    sessionStorage.removeItem(STORAGE_KEYS.FILTER_PERIOD);
    sessionStorage.removeItem(STORAGE_KEYS.FILTER_CATEGORY);
    sessionStorage.removeItem(STORAGE_KEYS.MISSION_LIST_EXPANDED);
}

// --- アプリバージョン ---

export function saveAppVersion(version: string): void {
    localStorage.setItem(STORAGE_KEYS.APP_VERSION, version);
}
