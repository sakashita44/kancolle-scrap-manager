/**
 * DataContext - アプリ全体のデータ状態を管理するContext
 * categories, equipments, missions とそのCRUD操作を一元管理
 * @module contexts/DataContext
 */

import { createContext, useContext } from 'react'
import { useCategories } from '../hooks/useCategories'
import { useEquipments } from '../hooks/useEquipments'
import { useMissions } from '../hooks/useMissions'

const DataContext = createContext(null)

/**
 * DataProvider - アプリ全体のデータ状態を管理するProvider
 *
 * categories, equipments, missions とそのCRUD操作を一元管理し,
 * Props バケツリレーを解消する.
 */
export function DataProvider({ children }) {
  // カテゴリデータ管理
  const {
    allCategories,
    categories,
    masterCategories,
    userCategories,
    categoryMap,
    categoryNameMap,
    categoryIds,
    crudError: categoriesCrudError,
    corruptedItems: corruptedCategories,
    addUserCategory,
    updateUserCategory,
    deleteUserCategory,
    getCategoryName,
    getNextOrder: getNextCategoryOrder,
  } = useCategories()

  // 装備データ管理（カテゴリに依存）
  const {
    equipments,
    equipmentsForUI,
    allEquipments,
    masterEquipments,
    userEquipments,
    equipmentMap,
    crudError: equipmentsCrudError,
    corruptedItems: corruptedEquipments,
    addUserEquipment,
    updateUserEquipment,
    deleteUserEquipment,
    setUserEquipments,
    findEquipmentById,
    getNextOrder: getNextEquipmentOrder,
  } = useEquipments(allCategories, categoryMap)

  // 任務データ管理
  const {
    masterMissions,
    userMissions,
    allMissions,
    crudError: missionsCrudError,
    corruptedItems: corruptedMissions,
    addUserMission,
    updateUserMission,
    deleteUserMission,
    findMissionById,
    filterByPeriod,
    getPeriods,
    getNextOrder: getNextMissionOrder,
  } = useMissions()

  const value = {
    // カテゴリ関連
    allCategories,
    categories,
    masterCategories,
    userCategories,
    categoryMap,
    categoryNameMap,
    categoryIds,
    categoriesCrudError,
    corruptedCategories,
    addUserCategory,
    updateUserCategory,
    deleteUserCategory,
    getCategoryName,
    getNextCategoryOrder,

    // 装備関連
    equipments,
    equipmentsForUI,
    allEquipments,
    masterEquipments,
    userEquipments,
    equipmentMap,
    equipmentsCrudError,
    corruptedEquipments,
    addUserEquipment,
    updateUserEquipment,
    deleteUserEquipment,
    setUserEquipments,
    findEquipmentById,
    getNextEquipmentOrder,

    // 任務関連
    masterMissions,
    userMissions,
    allMissions,
    missions: allMissions, // 後方互換性のため
    missionsCrudError,
    corruptedMissions,
    addUserMission,
    updateUserMission,
    deleteUserMission,
    findMissionById,
    filterByPeriod,
    getPeriods,
    getNextMissionOrder,
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

/**
 * useData - DataContextを使用するカスタムフック
 * @returns {object} データ管理用のメソッドと状態
 * @throws {Error} DataProvider外で使用された場合
 */
export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}
