import { useReducer, useMemo } from 'react'
import { useEquipmentData } from '../contexts/EquipmentContext'
import { useMissionData } from '../contexts/MissionContext'

/**
 * フィルタ状態の初期値
 */
const initialFilterState = {
  text: '',
  category: 'ALL',
  period: 'ALL',
}

/**
 * フィルタ状態を管理するReducer
 */
function filterReducer(state, action) {
  switch (action.type) {
    case 'SET_TEXT':
      return { ...state, text: action.payload }
    case 'SET_CATEGORY':
      return { ...state, category: action.payload }
    case 'SET_PERIOD':
      return { ...state, period: action.payload }
    case 'RESET':
      return initialFilterState
    default:
      return state
  }
}

/**
 * 任務フィルタリングを管理するカスタムhook
 * @returns {Object} フィルタ状態と操作関数、フィルタ済み任務リスト
 */
export function useMissionFilter() {
  const { allMissions: missions } = useMissionData()
  const { equipmentMap } = useEquipmentData()
  const [filters, dispatch] = useReducer(filterReducer, initialFilterState)

  // フィルタリング処理
  const filteredMissions = useMemo(() => {
    return missions.filter((mission) => {
      // テキストフィルタ
      const matchText = mission.name.includes(filters.text)

      // 周期フィルタ
      let matchPeriod = true
      if (filters.period !== 'ALL') {
        matchPeriod = mission.period === filters.period
      }

      // カテゴリフィルタ
      let matchCategory = true
      if (filters.category !== 'ALL') {
        matchCategory = mission.reqs.some((req) => {
          if (req.targetType === 'category') {
            // カテゴリ指定の場合、targetIdがカテゴリID
            return req.targetId === filters.category
          } else {
            // 装備指定の場合、装備のcategoryIdと比較
            const eq = equipmentMap.get(req.targetId)
            return eq && eq.categoryId === filters.category
          }
        })
      }

      return matchText && matchPeriod && matchCategory
    })
  }, [missions, equipmentMap, filters])

  return {
    filteredMissions,
    filterText: filters.text,
    setFilterText: (text) => dispatch({ type: 'SET_TEXT', payload: text }),
    filterCategory: filters.category,
    setFilterCategory: (category) => dispatch({ type: 'SET_CATEGORY', payload: category }),
    filterPeriod: filters.period,
    setFilterPeriod: (period) => dispatch({ type: 'SET_PERIOD', payload: period }),
    resetFilters: () => dispatch({ type: 'RESET' }),
  }
}
