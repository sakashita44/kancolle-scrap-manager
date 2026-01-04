// Barrel File for domain
// ドメインロジック（純粋関数）を一括でエクスポート

// 廃棄計算
export {
  calculateScrapList,
  calculateScrapComparison,
} from './scrapCalculation'

// 装備操作
export { swapEquipmentOrder } from './equipmentOperations'

// カテゴリ操作
export {
  swapCategoryOrder,
  analyzeCategoryDeletionImpact,
  calculateCategoryDeletionResult,
} from './categoryOperations'

// 任務ルール
export { prepareMissionForSave } from './missionRules'
