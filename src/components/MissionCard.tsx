import { Trash2, Target, Edit2 } from 'lucide-react';
import { REQUIREMENT_KIND, SOURCE, type Mission } from '../schema';
import {
    useStore,
    selectCategoryMap,
    selectEquipmentMap,
    selectRequirementCategoryGroupMap,
} from '../store';
import { getRequirementDisplayName, cn } from '../utils';

interface MissionCardProps {
    mission: Mission;
    isSelected: boolean;
    isBaseMission?: boolean;
    isDisabled?: boolean;
    onToggle: (missionId: string) => void;
    onDelete: (missionId: string) => void;
    onEdit: (mission: Mission) => void;
}

export default function MissionCard({
    mission,
    isSelected,
    isBaseMission = false,
    isDisabled = false,
    onToggle,
    onDelete,
    onEdit,
}: MissionCardProps) {
    const categoryMap = useStore(selectCategoryMap);
    const equipmentMap = useStore(selectEquipmentMap);
    const requirementCategoryGroupMap = useStore(
        selectRequirementCategoryGroupMap,
    );
    const isUserDefined = mission.source === SOURCE.USER;

    return (
        <label
            className={cn(
                'block bg-white rounded-lg border shadow-sm transition-colors group relative',
                isDisabled &&
                    'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed',
                !isDisabled &&
                    isBaseMission &&
                    'border-amber-400 bg-amber-50 cursor-pointer',
                !isDisabled &&
                    !isBaseMission &&
                    isSelected &&
                    'border-blue-400 bg-blue-50 cursor-pointer',
                !isDisabled &&
                    !isBaseMission &&
                    !isSelected &&
                    'border-slate-200 hover:border-blue-300 cursor-pointer',
            )}
        >
            <div className="p-4 flex items-start gap-3">
                <div className="flex items-center gap-2">
                    <input
                        id={`mission-select-${mission.id}`}
                        type="checkbox"
                        className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => onToggle(mission.id)}
                    />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-slate-700">
                            {isBaseMission && (
                                <span className="inline-flex items-center gap-0.5 align-middle mr-1.5 text-[10px] font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded">
                                    <Target className="w-3 h-3" />
                                    ベース
                                </span>
                            )}
                            {mission.name}
                        </span>
                        <span className="flex-none text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                            {mission.period}
                        </span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-2">
                        {mission.reqs.map((req, i) => {
                            const baseName = getRequirementDisplayName(
                                req,
                                categoryMap,
                                equipmentMap,
                                requirementCategoryGroupMap,
                            );
                            const isGenericRequirement =
                                req.kind === REQUIREMENT_KIND.CATEGORY ||
                                req.kind === REQUIREMENT_KIND.CATEGORY_GROUP;
                            const name = isGenericRequirement
                                ? `${baseName}（種別不問）`
                                : baseName;
                            return (
                                <span
                                    key={i}
                                    className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200"
                                >
                                    {name} x{req.count}
                                </span>
                            );
                        })}
                    </div>
                </div>
                {isUserDefined && (
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onEdit(mission);
                            }}
                            className="text-slate-300 hover:text-blue-500 p-1"
                            title="編集"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete(mission.id);
                            }}
                            className="text-slate-300 hover:text-red-500 p-1"
                            title="削除"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </label>
    );
}
