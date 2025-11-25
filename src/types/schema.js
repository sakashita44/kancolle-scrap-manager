/**
 * データスキーマの型定義
 * @module types/schema
 */

/**
 * 装備区分の列挙型
 * @typedef {'Item' | 'Category'} EquipmentType
 */

/**
 * 任務周期の列挙型
 * @typedef {'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'OneTime'} Period
 */

/**
 * カテゴリデータ
 * @typedef {Object} Category
 * @property {string} id - カテゴリID
 * @property {string} name - カテゴリ名 (1-20文字)
 * @property {number} order - 表示順序
 * @property {boolean} isMaster - 公式マスタ(true) or ユーザー定義(false) (データ取得時に自動付与)
 */

/**
 * 装備データ
 * @typedef {Object} Equipment
 * @property {string} id - 装備ID
 * @property {string} name - 装備名 (1-40文字)
 * @property {string} categoryId - カテゴリID
 * @property {EquipmentType} type - 装備区分
 * @property {number} order - カテゴリ内表示順序
 * @property {boolean} isMaster - 公式マスタ(true) or ユーザー定義(false) (データ取得時に自動付与)
 */

/**
 * 装備マスタデータ (equipments.json)
 * @typedef {Object} EquipmentsData
 * @property {string} version - スキーマバージョン (SemVer)
 * @property {Equipment[]} equipments - 装備データの配列
 */

/**
 * 要求装備
 * @typedef {Object} Requirement
 * @property {string} id - 要求装備の識別子 (同一任務内で一意)
 * @property {string} targetId - 要求する装備のID
 * @property {number} count - 必要数 (1-30)
 */

/**
 * 任務データ
 * @typedef {Object} Mission
 * @property {string} id - 任務ID
 * @property {string} name - 任務名 (1-50文字)
 * @property {Period} period - 任務周期
 * @property {number} order - 周期内表示順序
 * @property {boolean} isMaster - 公式マスタ(true) or ユーザー定義(false) (データ取得時に自動付与)
 * @property {Requirement[]} reqs - 要求装備のリスト (1-10件)
 */

/**
 * 任務マスタデータ (missions.json)
 * @typedef {Object} MissionsData
 * @property {string} version - スキーマバージョン (SemVer)
 * @property {Mission[]} missions - 任務データの配列
 */

/**
 * 選択中の任務データ (SessionStorage)
 * @typedef {Object} SelectedMissionsData
 * @property {string} version - スキーマバージョン (SemVer)
 * @property {string[]} selectedMissionIds - 選択中の任務IDリスト (最大8件)
 */

/**
 * 廃棄リスト項目 (基本形式)
 * calculateScrapListの戻り値要素
 * @typedef {Object} ScrapListItem
 * @property {string} equipmentId - 装備ID
 * @property {string} equipmentName - 装備名
 * @property {string} category - カテゴリ名
 * @property {number} count - 廃棄数
 * @property {EquipmentType} type - 装備区分
 */

/**
 * カテゴリ別集計データ
 * UI表示用の集計形式
 * @typedef {Object} CategoryGroup
 * @property {string} categoryName - カテゴリ名
 * @property {number} totalCount - カテゴリ内の総数
 * @property {Array<{name: string, count: number}>} items - 個別装備リスト
 * @property {number} remainder - カテゴリ代表の数（何でもOK）
 */

/**
 * エラー/警告情報
 * @typedef {Object} ValidationWarning
 * @property {string} missionId - 任務ID
 * @property {string} missionName - 任務名
 * @property {string} message - エラーメッセージ
 */

// 定数定義
export const SCHEMA_VERSION = '1.0.0';

export const EQUIPMENT_TYPE = {
  ITEM: 'Item',
  CATEGORY: 'Category',
};

export const PERIOD = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  ONE_TIME: 'OneTime',
};

export const PERIOD_ORDER = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'OneTime'];

export const ID_PREFIX = {
  MASTER_CATEGORY: 'm_cat_',
  MASTER_EQUIPMENT: 'm_eq_',
  MASTER_MISSION: 'm_ms_',
  USER_CATEGORY: 'u_cat_',
  USER_EQUIPMENT: 'u_eq_',
  USER_MISSION: 'u_ms_',
};

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
};

export const LIMITS = {
  EQUIPMENT_NAME_MAX: 40,
  CATEGORY_NAME_MAX: 20,
  MISSION_NAME_MAX: 50,
  REQUIREMENT_COUNT_MIN: 1,
  REQUIREMENT_COUNT_MAX: 30,
  REQUIREMENTS_PER_MISSION_MAX: 10,
  SELECTED_MISSIONS_MAX: 8,
};
