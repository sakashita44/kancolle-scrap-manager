import MissionCard from './MissionCard'
import { LIMITS } from '../types/schema'
import { useSelection } from '../contexts/SelectionContext'

const MissionList = ({
  missions,
  onToggle,
  onDelete,
  onEdit
}) => {
  const { selectedCount, isBaseMission, getAllSelectedIds } = useSelection()
  const selectedMissionIds = getAllSelectedIds()
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
        const isSelected = selectedMissionIds.includes(mission.id)
        const isMissionBaseMission = isBaseMission(mission.id)
        const isDisabled = isMaxSelected && !isSelected
        return (
          <MissionCard
            key={mission.id}
            mission={mission}
            isSelected={isSelected}
            isBaseMission={isMissionBaseMission}
            isDisabled={isDisabled}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )
      })}
    </div>
  )
}

export default MissionList
