/**
 * MissionContext - 任務データの管理
 * 任務に関するデータとCRUD操作を提供
 * @module contexts/MissionContext
 */

import { createContext, useContext } from 'react'
import { useMissions } from '../hooks/useMissions'

const MissionContext = createContext(null)

/**
 * MissionProvider - 任務データを管理するProvider
 */
export function MissionProvider({ children }) {
  const missionData = useMissions()

  return (
    <MissionContext.Provider value={missionData}>
      {children}
    </MissionContext.Provider>
  )
}

/**
 * useMissionData - MissionContextを使用するカスタムフック
 * @returns {object} 任務データと操作関数
 * @throws {Error} MissionProvider外で使用された場合
 */
export function useMissionData() {
  const context = useContext(MissionContext)
  if (!context) {
    throw new Error('useMissionData must be used within MissionProvider (or DataProvider)')
  }
  return context
}
