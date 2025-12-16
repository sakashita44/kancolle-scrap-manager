import { useMemo } from 'react'
import MissionCard from './MissionCard'
import { LIMITS } from '../types/schema'
import { useSelection } from '../contexts/SelectionContext'

/**
 * 任務リストを表示するContainerコンポーネント
 * SelectionContextから選択状態と操作を取得
 */
const MissionList = ({
  missions,
  onDelete,
  onEdit
}) => {
  const { selectedCount, isBaseMission, getAllSelectedIds, toggleMission } = useSelection()

  // 選択IDをSetに変換してO(1)判定に最適化
  const selectedIdSet = useMemo(() => new Set(getAllSelectedIds()), [getAllSelectedIds])
  const isMaxSelected = selectedCount >= LIMITS.SELECTED_MISSIONS_MAX
  if (missions.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        条件に一致する任務がありません
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {missions.map(mission => {
        const isSelected = selectedIdSet.has(mission.id)
        const isMissionBaseMission = isBaseMission(mission.id)
        const isDisabled = isMaxSelected && !isSelected
        return (
          <MissionCard
            key={mission.id}
            mission={mission}
            isSelected={isSelected}
            isBaseMission={isMissionBaseMission}
            isDisabled={isDisabled}
            onToggle={toggleMission}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )
      })}
    </div>
  )
}

export default MissionList
