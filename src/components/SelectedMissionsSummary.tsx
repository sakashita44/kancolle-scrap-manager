import { Check, X, ChevronUp, ChevronDown, Target } from 'lucide-react';
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

    const allSelected: { missionId: string; isBase: boolean }[] = [];
    if (baseMission) {
        allSelected.push({ missionId: baseMission.missionId, isBase: true });
    }
    for (const m of auxiliaryMissions) {
        allSelected.push({ missionId: m.missionId, isBase: false });
    }

    return (
        <section className="bg-blue-50/60">
            <div className="flex items-center gap-2 px-3 py-2">
                <button
                    type="button"
                    className="flex items-center gap-2 select-none"
                    onClick={toggle}
                >
                    <Check className="w-4 h-4 text-blue-500 flex-none" />
                    <h3 className="font-bold text-slate-700 text-sm">
                        選択中の任務
                    </h3>
                    <span className="text-xs bg-blue-200 px-2 py-0.5 rounded-full text-blue-700 font-medium tabular-nums">
                        {selectedCount}/{LIMITS.SELECTED_MISSIONS_MAX}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={toggle}
                    className="ml-auto text-blue-400 hover:text-blue-600 transition-colors"
                    title={isOpen ? '折りたたむ' : '展開する'}
                >
                    {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>
            </div>

            {isOpen && (
                <div className="border-t border-blue-200">
                    <p className="px-3 pt-2 text-[11px] text-slate-500 flex items-center gap-1 flex-wrap">
                        <Target className="w-3 h-3 text-amber-600" />
                        <span className="font-semibold text-amber-700">
                            ベース
                        </span>
                        <span>
                            = 達成状況の比較基準にする任務（1件のみ設定可）
                        </span>
                    </p>
                    <ul className="px-3">
                        {allSelected.map((selected) => {
                            const mission = missionMap.get(selected.missionId);
                            if (!mission) return null;

                            const isBase = selected.isBase;

                            return (
                                <li
                                    key={mission.id}
                                    className={cn(
                                        'border-b py-1.5 pl-2 border-l-4',
                                        isBase
                                            ? 'border-b-amber-200 border-l-amber-400 bg-amber-50'
                                            : 'border-b-blue-200/70 border-l-transparent',
                                    )}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {isBase && (
                                            <span className="flex-none flex items-center gap-0.5 text-[10px] font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded">
                                                <Target className="w-3 h-3" />
                                                ベース
                                            </span>
                                        )}
                                        <span
                                            className="font-semibold text-sm text-slate-700 truncate"
                                            title={mission.name}
                                        >
                                            {mission.name}
                                        </span>
                                        <span className="flex-none text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                                            {mission.period}
                                        </span>
                                        <div className="ml-auto flex-none flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    isBase
                                                        ? deselectBaseMission()
                                                        : selectBaseMission(
                                                              mission.id,
                                                          )
                                                }
                                                className={cn(
                                                    'text-[11px] px-1.5 py-0.5 rounded border transition-colors whitespace-nowrap',
                                                    isBase
                                                        ? 'border-amber-400 text-amber-700 hover:bg-amber-100'
                                                        : 'border-slate-300 text-slate-500 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50',
                                                )}
                                            >
                                                {isBase
                                                    ? 'ベース解除'
                                                    : 'ベースに設定'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleMission(mission.id)
                                                }
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                                title="選択を解除"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        className="text-[11px] text-slate-500 truncate"
                                        title={getEquipmentSummary(
                                            selected.missionId,
                                        )}
                                    >
                                        {getEquipmentSummary(
                                            selected.missionId,
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {/* 一括操作は個別行の操作と競合しないよう, リスト末尾に低優先度で置く */}
                    <div className="px-3 pt-2 pb-3">
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 border border-slate-300 rounded py-1.5 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            すべての選択を解除
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
