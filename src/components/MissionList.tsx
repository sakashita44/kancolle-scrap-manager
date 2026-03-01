import { useMemo } from 'react';
import MissionCard from './MissionCard';
import { LIMITS, type Mission } from '../schema';
import {
    useStore,
    selectAllSelectedIds,
    selectSelectedCount,
    selectIsBaseMission,
} from '../store';

interface MissionListProps {
    missions: Mission[];
    onDelete: (missionId: string) => void;
    onEdit: (mission: Mission) => void;
}

export default function MissionList({
    missions,
    onDelete,
    onEdit,
}: MissionListProps) {
    const selectedIds = useStore(selectAllSelectedIds);
    const selectedCount = useStore(selectSelectedCount);
    const toggleMission = useStore((s) => s.toggleMission);

    const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const isMaxSelected = selectedCount >= LIMITS.SELECTED_MISSIONS_MAX;

    if (missions.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400">
                条件に一致する任務がありません
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {missions.map((mission) => {
                const isSelected = selectedIdSet.has(mission.id);
                const isMissionBaseMission = selectIsBaseMission(
                    useStore.getState(),
                    mission.id,
                );
                const isDisabled = isMaxSelected && !isSelected;
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
                );
            })}
        </div>
    );
}
