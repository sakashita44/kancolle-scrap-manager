// Barrel File for utils
// ユーティリティ関数を一括でエクスポート

// ロギング
export { logError, logWarning, logInfo } from './logger'

// ストレージ
export { createStorageHelper } from './storageHelper'
export {
  saveUserCategories,
  loadUserCategories,
  saveUserEquipments,
  loadUserEquipments,
  saveUserMissions,
  loadUserMissions,
  saveAppVersion,
  loadAppVersion,
  saveAboutShown,
  isAboutShown,
  clearUserData,
  clearAllData,
} from './localStorage'
export {
  saveSelectedMissions,
  loadSelectedMissions,
  clearSelectedMissions,
} from './sessionStorage'

// データ変換
export {
  toRuntimeCategories,
  toRuntimeEquipments,
  toRuntimeMissions,
  generateCategoryRepresentatives,
  addEquipmentType,
  createCategoryMaps,
  createEquipmentMap,
  toPersistCategories,
  toPersistEquipments,
  toPersistMissions,
} from './dataConverter'

// データ管理
export {
  createIdMap,
  getNextOrder,
  createFindById,
  mergeAndSort,
  createDefaultSortComparator,
  createMissionSortComparator,
} from './dataManagement'

// ID生成
export {
  generateEquipmentId,
  generateMissionId,
  generateCategoryId,
} from './idGenerator'

// バリデーション
export {
  isSafeString,
  validateEquipmentExists,
  validateMissionExists,
  validateUniqueId,
  validateUniqueName,
  validateNoDuplicateIds,
  validateNoDuplicateNames,
  isValidUserEquipmentId,
  isValidUserMissionId,
  validateEquipment,
  validateMission,
  validateSelectedMissions,
  validateName,
} from './validation'

// 表示関連
export { DELETED_LABELS, getRequirementDisplayName } from './displayUtils'
export {
  groupScrapListByCategory,
  calculateCategoryTotals,
} from './scrapListFormatters'

// データサニタイズ
export { sanitizeDataList } from './dataSanitizer'

// 警告収集
export { WarningCollector } from './warningCollector'

// スタイリング
export { cn } from './cn'
