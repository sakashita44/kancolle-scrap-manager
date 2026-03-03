/**
 * 定数定義
 * アプリ全体で使用する列挙型・制限値・キー名
 */

// --- スキーマバージョン ---

export const SCHEMA_VERSION = '2.0.0';

// --- 周期 ---

export const PERIOD = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    YEARLY: 'Yearly',
    ONE_TIME: 'OneTime',
} as const;

export type Period = (typeof PERIOD)[keyof typeof PERIOD];

export const PERIOD_VALUES = Object.values(PERIOD);

export const PERIOD_ORDER: readonly Period[] = [
    'Daily',
    'Weekly',
    'Monthly',
    'Quarterly',
    'Yearly',
    'OneTime',
];

// --- 要求装備の種別 ---

export const REQUIREMENT_KIND = {
    CATEGORY: 'category',
    EQUIPMENT: 'equipment',
    CATEGORY_GROUP: 'categoryGroup',
} as const;

export type RequirementKind =
    (typeof REQUIREMENT_KIND)[keyof typeof REQUIREMENT_KIND];

// --- データソース ---

export const SOURCE = {
    MASTER: 'master',
    USER: 'user',
} as const;

export type Source = (typeof SOURCE)[keyof typeof SOURCE];

// --- IDプレフィックス ---

export const ID_PREFIX = {
    MASTER_CATEGORY: 'm_cat_',
    MASTER_REQUIREMENT_CATEGORY_GROUP: 'm_rcg_',
    MASTER_EQUIPMENT: 'm_eq_',
    MASTER_MISSION: 'm_ms_',
    USER_CATEGORY: 'u_cat_',
    USER_EQUIPMENT: 'u_eq_',
    USER_MISSION: 'u_ms_',
} as const;

// --- ストレージキー ---

export const STORAGE_KEYS = {
    APP_VERSION: 'ksp_app_version',
    USER_CATEGORIES: 'ksp_user_categories',
    USER_EQUIPMENTS: 'ksp_user_equipments',
    USER_MISSIONS: 'ksp_user_missions',
    SELECTED_MISSIONS: 'ksp_selected_missions',
    ABOUT_SHOWN: 'ksp_about_shown',
    FILTER_PERIOD: 'ksp_filter_period',
    FILTER_CATEGORY: 'ksp_filter_category',
    MISSION_LIST_EXPANDED: 'ksp_mission_list_expanded',
} as const;

// --- 制限値 ---

export const LIMITS = {
    EQUIPMENT_NAME_MAX: 40,
    CATEGORY_NAME_MAX: 20,
    MISSION_NAME_MAX: 50,
    REQUIREMENT_COUNT_MIN: 1,
    REQUIREMENT_COUNT_MAX: 30,
    REQUIREMENTS_PER_MISSION_MAX: 10,
    SELECTED_MISSIONS_MAX: 8,
    MISSION_COUNT_MAX: 99,
} as const;
