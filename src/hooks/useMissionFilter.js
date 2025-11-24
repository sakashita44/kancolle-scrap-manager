import { useState, useMemo } from 'react'

/**
 * 任務フィルタリングを管理するカスタムhook
 * @param {Array} missions - 任務データの配列
 * @param {Map} equipmentMap - 装備データのMap (id -> equipment)
 * @returns {Object} フィルタ状態と操作関数、フィルタ済み任務リスト
 */
export function useMissionFilter(missions, equipmentMap) {
  const [filterText, setFilterText] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterPeriod, setFilterPeriod] = useState('ALL')

  // フィルタリング処理
  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      // テキストフィルタ
      const matchText = mission.name.includes(filterText)

      // 周期フィルタ
      let matchPeriod = true
      if (filterPeriod !== 'ALL') {
        matchPeriod = mission.period === filterPeriod
      }

      // カテゴリフィルタ
      let matchCategory = true
      if (filterCategory !== 'ALL') {
        matchCategory = mission.reqs.some(req => {
          const eq = equipmentMap.get(req.targetId)
          return eq && eq.category === filterCategory
        })
      }

      return matchText && matchPeriod && matchCategory
    })
  }, [missions, equipmentMap, filterText, filterPeriod, filterCategory])

  return {
    filteredMissions,
    filterText,
    setFilterText,
    filterCategory,
    setFilterCategory,
    filterPeriod,
    setFilterPeriod
  }
}
