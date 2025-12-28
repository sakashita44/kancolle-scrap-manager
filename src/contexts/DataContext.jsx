/**
 * DataContext - データ管理のFacade
 * CategoryContext, EquipmentContext, MissionContextを統合し、
 * 統一的なインターフェースを提供
 * @module contexts/DataContext
 */

import { CategoryProvider, useCategoryData } from './CategoryContext'
import { EquipmentProvider, useEquipmentData } from './EquipmentContext'
import { MissionProvider, useMissionData } from './MissionContext'

/**
 * DataProvider - 3つのデータContextをラップするFacade Provider
 *
 * アーキテクチャ: Facadeパターン
 * - CategoryProvider, EquipmentProvider, MissionProviderを階層的にラップ
 * - 各Providerは独立して再レンダリングを制御
 * - useData()で統一的なインターフェースを提供
 */
export function DataProvider({ children }) {
  return (
    <CategoryProvider>
      <EquipmentProvider>
        <MissionProvider>
          {children}
        </MissionProvider>
      </EquipmentProvider>
    </CategoryProvider>
  )
}

/**
 * useData - 統一的なデータアクセスのFacade hook
 *
 * 3つのContextから必要なデータを取得し、統一的なインターフェースで提供
 * @returns {object} 全データと操作関数
 */
export function useData() {
  const {
    userCategories,
    setUserCategories,
    getCategoryName,
    getCategoryById,
    addUserCategory,
    updateUserCategory,
    deleteUserCategory,
  } = useCategoryData()

  const {
    userEquipments,
    addUserEquipment,
    updateUserEquipment,
    deleteUserEquipment,
    setUserEquipments,
    crudError: equipmentsCrudError,
  } = useEquipmentData()

  const {
    allMissions,
    addUserMission,
    updateUserMission,
    deleteUserMission,
    crudError: missionsCrudError,
  } = useMissionData()

  return {
    userCategories,
    setUserCategories,
    getCategoryName,
    getCategoryById,
    addUserCategory,
    updateUserCategory,
    deleteUserCategory,

    userEquipments,
    addUserEquipment,
    updateUserEquipment,
    deleteUserEquipment,
    setUserEquipments,
    equipmentsCrudError,

    allMissions,
    addUserMission,
    updateUserMission,
    deleteUserMission,
    missionsCrudError,
  }
}
