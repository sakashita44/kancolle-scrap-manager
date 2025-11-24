import MissionCard from './MissionCard'

const MissionList = ({
  missions,
  equipmentMap,
  selectedMissionIds,
  onToggle,
  onDelete
}) => {
  if (missions.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        条件に一致する任務がありません
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {missions.map(mission => (
        <MissionCard
          key={mission.id}
          mission={mission}
          equipmentMap={equipmentMap}
          isSelected={selectedMissionIds.includes(mission.id)}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export default MissionList
