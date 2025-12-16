/**
 * EquipmentContext - 装備データの管理
 * 装備に関するデータとCRUD操作を提供
 * @module contexts/EquipmentContext
 */

import { createContext, useContext } from 'react'
import { useEquipments } from '../hooks/useEquipments'
import { useCategoryData } from './CategoryContext'

const EquipmentContext = createContext(null)

/**
 * EquipmentProvider - 装備データを管理するProvider
 * CategoryProviderの内側で使用する必要がある
 */
export function EquipmentProvider({ children }) {
  const { allCategories, categoryMap } = useCategoryData()
  const equipmentData = useEquipments(allCategories, categoryMap)

  return (
    <EquipmentContext.Provider value={equipmentData}>
      {children}
    </EquipmentContext.Provider>
  )
}

/**
 * useEquipmentData - EquipmentContextを使用するカスタムフック
 * @returns {object} 装備データと操作関数
 * @throws {Error} EquipmentProvider外で使用された場合
 */
export function useEquipmentData() {
  const context = useContext(EquipmentContext)
  if (!context) {
    throw new Error('useEquipmentData must be used within EquipmentProvider (or DataProvider)')
  }
  return context
}
