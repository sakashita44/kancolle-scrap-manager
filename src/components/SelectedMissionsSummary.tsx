import {
    Check,
    X,
    ChevronUp,
    ChevronDown,
    Plus,
    Minus,
    Target,
} from 'lucide-react';
import { LIMITS, REQUIREMENT_KIND } from '../schema';
import { useToggle } from '../hooks';
import {
    useStore,
    selectCategoryMap,
    selectEquipmentMap,
    selectMissionMap,
    selectRequirementCategoryGroupMap,
    selectSelectedCount,
} from '../store';
import { getRequirementDisplayName, cn } from '../utils';

export default function SelectedMissionsSummary() {
    const categoryMap = useStore(selectCategoryMap);
    const equipmentMap = useStore(selectEquipmentMap);
    const requirementCategoryGroupMap = useStore(
        selectRequirementCategoryGroupMap,
    );
    const missionMap = useStore(selectMissionMap);
    const baseMission = useStore((s) => s.baseMission);
    const auxiliaryMissions = useStore((s) => s.auxiliaryMissions);
    const selectedCount = useStore(selectSelectedCount);
    const selectBaseMission = useStore((s) => s.selectBaseMission);
    const deselectBaseMission = useStore((s) => s.deselectBaseMission);
    const toggleMission = useStore((s) => s.toggleMission);
    const updateBaseMissionCount = useStore((s) => s.updateBaseMissionCount);
    const updateAuxiliaryMissionCount = useStore(
        (s) => s.updateAuxiliaryMissionCount,
    );
    const clearSelection = useStore((s) => s.clearSelection);

    const [isOpen, { toggle }] = useToggle(true);

    const getEquipmentSummary = (missionId: string) => {
        const mission = missionMap.get(missionId);
        if (!mission || !mission.reqs || mission.reqs.length === 0) {
            return '廃棄なし';
        }
        return mission.reqs
            .map((req) => {
                const name = getRequirementDisplayName(
                    req,
                    categoryMap,
                    equipmentMap,
                    requirementCategoryGroupMap,
                );
                const suffix =
                    req.kind === REQUIREMENT_KIND.CATEGORY ||
                    req.kind === REQUIREMENT_KIND.CATEGORY_GROUP
                        ? '（種別不問）'
                        : '';
                return `${name}${suffix}×${req.count}`;
            })
            .join(', ');
    };

    if (selectedCount === 0) return null;

    const allSelected: {
        missionId: string;
        count: number;
        isBase: boolean;
    }[] = [];
    if (baseMission) {
        allSelected.push({ ...baseMission, isBase: true });
    }
    for (const m of auxiliaryMissions) {
        allSelected.push({ ...m, isBase: false });
    }

    return (
        <div className="bg-blue-50 border-b border-blue-200">
            <div className="max-w-3xl mx-auto px-4 py-2">
                <div
                    className="flex items-center gap-2 cursor-pointer py-1 select-none"
                    onClick={toggle}
                >
                    <Check className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-slate-700 text-sm">
                        選択中の任務
                    </h3>
                    <div className="ml-auto flex items-center gap-3">
                        <span className="text-xs bg-blue-200 px-2 py-1 rounded-full text-blue-700 font-medium">
                            {selectedCount}/{LIMITS.SELECTED_MISSIONS_MAX}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearSelection();
                            }}
                            className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                            title="全解除"
                        >
                            <X className="w-3 h-3" />
                            全解除
                        </button>
                        <button className="text-blue-400 hover:text-blue-600 transition-colors">
                            {isOpen ? (
                                <ChevronUp className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {isOpen && (
                    <div className="mt-2 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                            {allSelected.map((selected) => {
                                const mission = missionMap.get(
                                    selected.missionId,
                                );
                                if (!mission) return null;

                                const isBase = selected.isBase;

                                return (
                                    <div
                                        key={mission.id}
                                        className={cn(
                                            'flex-none rounded-lg p-2 shadow-sm snap-center min-w-[200px] max-w-[250px] hover:shadow-md transition-shadow group',
                                            isBase
                                                ? 'bg-amber-50 border-2 border-amber-300'
                                                : 'bg-white border border-blue-300',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className="font-semibold text-sm text-slate-700 truncate"
                                                    title={mission.name}
                                                >
                                                    {mission.name}
                                                </div>
                                                <span
                                                    className={cn(
                                                        'text-xs px-1.5 py-0.5 rounded inline-block mt-1',
                                                        isBase
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-slate-100 text-slate-600',
                                                    )}
                                                >
                                                    {mission.period}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    toggleMission(mission.id)
                                                }
                                                className={cn(
                                                    'flex-none transition-colors p-1 -m-1',
                                                    isBase
                                                        ? 'text-slate-300 hover:text-amber-600'
                                                        : 'text-slate-300 hover:text-blue-500',
                                                )}
                                                title="選択を解除"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div
                                            className="text-xs text-slate-600 mb-2 line-clamp-2"
                                            title={getEquipmentSummary(
                                                selected.missionId,
                                            )}
                                        >
                                            {getEquipmentSummary(
                                                selected.missionId,
                                            )}
                                        </div>

                                        <div
                                            className={cn(
                                                'flex items-center gap-2 pt-2 mb-2',
                                                isBase
                                                    ? 'border-t border-amber-200'
                                                    : 'border-t border-blue-100',
                                            )}
                                        >
                                            <span className="text-xs text-slate-600 font-medium">
                                                実行回数:
                                            </span>
                                            <div className="flex items-center gap-1 ml-auto">
                                                <button
                                                    onClick={() =>
                                                        isBase
                                                            ? updateBaseMissionCount(
                                                                  selected.count -
                                                                      1,
                                                              )
                                                            : updateAuxiliaryMissionCount(
                                                                  mission.id,
                                                                  selected.count -
                                                                      1,
                                                              )
                                                    }
                                                    disabled={
                                                        selected.count <= 1
                                                    }
                                                    className={cn(
                                                        'p-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors',
                                                        isBase
                                                            ? 'bg-amber-100 hover:bg-amber-200'
                                                            : 'bg-slate-100 hover:bg-slate-200',
                                                    )}
                                                    title="回数を減らす"
                                                >
                                                    <Minus
                                                        className={cn(
                                                            'w-3 h-3',
                                                            isBase
                                                                ? 'text-amber-700'
                                                                : 'text-slate-600',
                                                        )}
                                                    />
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={
                                                        LIMITS.MISSION_COUNT_MAX
                                                    }
                                                    value={selected.count}
                                                    onChange={(e) => {
                                                        const value = parseInt(
                                                            e.target.value,
                                                            10,
                                                        );
                                                        if (!isNaN(value)) {
                                                            if (isBase) {
                                                                updateBaseMissionCount(
                                                                    value,
                                                                );
                                                            } else {
                                                                updateAuxiliaryMissionCount(
                                                                    mission.id,
                                                                    value,
                                                                );
                                                            }
                                                        }
                                                    }}
                                                    className={cn(
                                                        'w-10 text-center text-sm font-semibold text-slate-700 border rounded px-1 py-0.5 focus:outline-none focus:ring-1',
                                                        isBase
                                                            ? 'border-amber-300 focus:ring-amber-400'
                                                            : 'border-slate-200 focus:ring-blue-400',
                                                    )}
                                                />
                                                <button
                                                    onClick={() =>
                                                        isBase
                                                            ? updateBaseMissionCount(
                                                                  selected.count +
                                                                      1,
                                                              )
                                                            : updateAuxiliaryMissionCount(
                                                                  mission.id,
                                                                  selected.count +
                                                                      1,
                                                              )
                                                    }
                                                    disabled={
                                                        selected.count >=
                                                        LIMITS.MISSION_COUNT_MAX
                                                    }
                                                    className={cn(
                                                        'p-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors',
                                                        isBase
                                                            ? 'bg-amber-100 hover:bg-amber-200'
                                                            : 'bg-slate-100 hover:bg-slate-200',
                                                    )}
                                                    title="回数を増やす"
                                                >
                                                    <Plus
                                                        className={cn(
                                                            'w-3 h-3',
                                                            isBase
                                                                ? 'text-amber-700'
                                                                : 'text-slate-600',
                                                        )}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (isBase) {
                                                    deselectBaseMission();
                                                } else {
                                                    selectBaseMission(
                                                        mission.id,
                                                    );
                                                }
                                            }}
                                            className={cn(
                                                'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors',
                                                isBase
                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
                                            )}
                                        >
                                            <Target className="w-4 h-4" />
                                            <span className="text-xs font-medium">
                                                {isBase
                                                    ? 'ベース任務 (設定中)'
                                                    : 'ベース任務に設定'}
                                            </span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
