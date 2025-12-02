import MissionCard from './MissionCard'
import { LIMITS } from '../types/schema'

const MissionList = ({
  missions,
  equipmentMap,
  categoryMap,
  selectedMissionIds,
  selectedCount,
  onToggle,
  onDelete
}) => {
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
        const isDisabled = isMaxSelected && !isSelected
        return (
          <MissionCard
            key={mission.id}
            mission={mission}
            equipmentMap={equipmentMap}
            categoryMap={categoryMap}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        )
      })}
    </div>
  )
}

export default MissionList
