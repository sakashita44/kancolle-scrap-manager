/**
 * SelectionContext - 選択任務の状態管理
 * SessionStorageと連携して選択状態を永続化
 * @module contexts/SelectionContext
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  loadSelectedMissions,
  saveSelectedMissions,
  clearSelectedMissions,
} from '../utils/sessionStorage.js'
import { LIMITS } from '../types/schema.js'
import { logError, logWarning } from '../utils/logger.js'

const SelectionContext = createContext(null)

/**
 * SelectionProvider - 選択任務の状態管理Provider
 * @param {object} props - プロパティ
 * @param {React.ReactNode} props.children - 子コンポーネント
 */
export function SelectionProvider({ children }) {
  const [selectedMissions, setSelectedMissions] = useState({
    baseMission: null,
    auxiliaryMissions: [],
  })
  const [isInitialized, setIsInitialized] = useState(false)

  // 初回マウント時にSessionStorageから読込
  useEffect(() => {
    try {
      const loaded = loadSelectedMissions()
      setSelectedMissions(loaded)
      setIsInitialized(true)
    } catch (err) {
      logError('Failed to load selected missions', {
        function: 'SelectionProvider',
        error: err,
      })
      setIsInitialized(true)
    }
  }, [])

  // 選択状態が変更されたらSessionStorageに保存（初回読み込み完了後のみ）
  useEffect(() => {
    if (!isInitialized) return

    try {
      saveSelectedMissions(selectedMissions)
    } catch (err) {
      logError('Failed to save selected missions', {
        function: 'SelectionProvider',
        error: err,
      })
    }
  }, [selectedMissions, isInitialized])

  // ベース任務を選択（既存のベース任務を置き換え）
  const selectBaseMission = useCallback((missionId) => {
    setSelectedMissions((prev) => {
      // 既にベース任務として選択済みの場合は何もしない
      if (prev.baseMission && prev.baseMission.missionId === missionId) {
        return prev
      }

      // 元のベース任務を補助任務に戻す
      const newAuxiliaryMissions = [...prev.auxiliaryMissions]
      if (prev.baseMission) {
        newAuxiliaryMissions.push(prev.baseMission)
      }

      // 補助任務に含まれている場合は削除
      const filteredAuxiliaryMissions = newAuxiliaryMissions.filter((m) => m.missionId !== missionId)

      // 補助任務から選択された任務を探して、その実行回数を引き継ぐ
      const selectedMission = prev.auxiliaryMissions.find((m) => m.missionId === missionId)

      return {
        baseMission: selectedMission || { missionId, count: 1 },
        auxiliaryMissions: filteredAuxiliaryMissions,
      }
    })
  }, [])

  // ベース任務の選択を解除（補助任務に戻す）
  const deselectBaseMission = useCallback(() => {
    setSelectedMissions((prev) => {
      if (!prev.baseMission) return prev

      // ベース任務を補助任務に戻す
      return {
        baseMission: null,
        auxiliaryMissions: [...prev.auxiliaryMissions, prev.baseMission],
      }
    })
  }, [])

  // 補助任務を選択
  const selectAuxiliaryMission = useCallback((missionId) => {
    setSelectedMissions((prev) => {
      // ベース任務として選択済みの場合は何もしない
      if (prev.baseMission && prev.baseMission.missionId === missionId) {
        return prev
      }

      // 既に補助任務として選択済みの場合は何もしない
      if (prev.auxiliaryMissions.some((m) => m.missionId === missionId)) {
        return prev
      }

      // 最大選択数チェック（ベース1 + 補助7 = 合計8）
      const totalCount = (prev.baseMission ? 1 : 0) + prev.auxiliaryMissions.length
      if (totalCount >= LIMITS.SELECTED_MISSIONS_MAX) {
        logWarning('Maximum missions can be selected', {
          function: 'SelectionProvider.selectAuxiliaryMission',
          maxSelections: LIMITS.SELECTED_MISSIONS_MAX,
        })
        return prev
      }

      return {
        ...prev,
        auxiliaryMissions: [...prev.auxiliaryMissions, { missionId, count: 1 }],
      }
    })
  }, [])

  // 補助任務の選択を解除
  const deselectAuxiliaryMission = useCallback((missionId) => {
    setSelectedMissions((prev) => ({
      ...prev,
      auxiliaryMissions: prev.auxiliaryMissions.filter((m) => m.missionId !== missionId),
    }))
  }, [])

  // 任務の選択状態をトグル（デフォルトは補助任務として扱う）
  const toggleMission = useCallback((missionId) => {
    setSelectedMissions((prev) => {
      // ベース任務として選択されている場合は解除
      if (prev.baseMission && prev.baseMission.missionId === missionId) {
        return {
          ...prev,
          baseMission: null,
        }
      }

      // 補助任務として選択されている場合は解除
      if (prev.auxiliaryMissions.some((m) => m.missionId === missionId)) {
        return {
          ...prev,
          auxiliaryMissions: prev.auxiliaryMissions.filter((m) => m.missionId !== missionId),
        }
      }

      // 最大数チェック
      const totalCount = (prev.baseMission ? 1 : 0) + prev.auxiliaryMissions.length
      if (totalCount >= LIMITS.SELECTED_MISSIONS_MAX) {
        logWarning('Maximum missions can be selected', {
          function: 'SelectionProvider.toggleMission',
          maxSelections: LIMITS.SELECTED_MISSIONS_MAX,
        })
        return prev
      }

      // 補助任務として選択
      return {
        ...prev,
        auxiliaryMissions: [...prev.auxiliaryMissions, { missionId, count: 1 }],
      }
    })
  }, [])

  // ベース任務の実行回数を更新
  const updateBaseMissionCount = useCallback((count) => {
    setSelectedMissions((prev) => {
      if (!prev.baseMission) return prev

      return {
        ...prev,
        baseMission: {
          ...prev.baseMission,
          count: Math.max(1, Math.min(99, count)),
        },
      }
    })
  }, [])

  // 補助任務の実行回数を更新
  const updateAuxiliaryMissionCount = useCallback((missionId, count) => {
    setSelectedMissions((prev) => ({
      ...prev,
      auxiliaryMissions: prev.auxiliaryMissions.map((m) =>
        m.missionId === missionId ? { ...m, count: Math.max(1, Math.min(99, count)) } : m
      ),
    }))
  }, [])

  // 全ての選択を解除
  const clearSelection = useCallback(() => {
    setSelectedMissions({ baseMission: null, auxiliaryMissions: [] })
    clearSelectedMissions()
  }, [])

  // 任務が選択されているかチェック（ベース/補助問わず）
  const isSelected = useCallback(
    (missionId) => {
      if (selectedMissions.baseMission && selectedMissions.baseMission.missionId === missionId) {
        return true
      }
      return selectedMissions.auxiliaryMissions.some((m) => m.missionId === missionId)
    },
    [selectedMissions]
  )

  // ベース任務として選択されているかチェック
  const isBaseMission = useCallback(
    (missionId) => {
      return selectedMissions.baseMission && selectedMissions.baseMission.missionId === missionId
    },
    [selectedMissions]
  )

  // 補助任務として選択されているかチェック
  const isAuxiliaryMission = useCallback(
    (missionId) => {
      return selectedMissions.auxiliaryMissions.some((m) => m.missionId === missionId)
    },
    [selectedMissions]
  )

  // 選択可能かチェック（最大数に達していないか）
  const canSelect = useCallback(() => {
    const totalCount = (selectedMissions.baseMission ? 1 : 0) + selectedMissions.auxiliaryMissions.length
    return totalCount < LIMITS.SELECTED_MISSIONS_MAX
  }, [selectedMissions])

  // 全選択中任務のIDリストを取得（ベース+補助）
  const getAllSelectedIds = useCallback(() => {
    const ids = []
    if (selectedMissions.baseMission) {
      ids.push(selectedMissions.baseMission.missionId)
    }
    ids.push(...selectedMissions.auxiliaryMissions.map((m) => m.missionId))
    return ids
  }, [selectedMissions])

  // 全選択中任務を配列形式で取得（ベース+補助）
  const getAllSelectedMissions = useCallback(() => {
    const missions = []
    if (selectedMissions.baseMission) {
      missions.push(selectedMissions.baseMission)
    }
    missions.push(...selectedMissions.auxiliaryMissions)
    return missions
  }, [selectedMissions])

  const value = {
    // データ
    selectedMissions,
    baseMission: selectedMissions.baseMission,
    auxiliaryMissions: selectedMissions.auxiliaryMissions,
    selectedCount: (selectedMissions.baseMission ? 1 : 0) + selectedMissions.auxiliaryMissions.length,
    maxSelections: LIMITS.SELECTED_MISSIONS_MAX,

    // 操作関数（ベース任務）
    selectBaseMission,
    deselectBaseMission,
    updateBaseMissionCount,

    // 操作関数（補助任務）
    selectAuxiliaryMission,
    deselectAuxiliaryMission,
    updateAuxiliaryMissionCount,

    // 操作関数（共通）
    toggleMission,
    clearSelection,

    // ユーティリティ
    isSelected,
    isBaseMission,
    isAuxiliaryMission,
    canSelect,
    getAllSelectedIds,
    getAllSelectedMissions,
  }

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  )
}

/**
 * useSelection - 選択任務の状態を取得するカスタムフック
 * @returns {object} 選択任務の状態と操作関数
 */
export function useSelection() {
  const context = useContext(SelectionContext)
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider')
  }
  return context
}
