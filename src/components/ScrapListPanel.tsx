import { useMemo } from 'react';
import {
    Trash2,
    ChevronUp,
    ChevronDown,
    TrendingUp,
    TrendingDown,
    Check,
    AlertTriangle,
} from 'lucide-react';
import { groupScrapListByCategory, cn } from '../utils';
import { useToggle } from '../hooks';
import type { ScrapListItem, ComparisonItem } from '../domain';

interface ScrapListPanelProps {
    scrapList: ScrapListItem[];
    comparison: ComparisonItem[];
    hasBaseMission: boolean;
}

export default function ScrapListPanel({
    scrapList,
    comparison,
    hasBaseMission,
}: ScrapListPanelProps) {
    const [isOpen, { toggle }] = useToggle(true);
    const [isComparisonOpen, { toggle: toggleComparison }] = useToggle(true);

    const categoryGroups = useMemo(
        () => groupScrapListByCategory(scrapList),
        [scrapList],
    );

    const comparisonSummary = useMemo(() => {
        const insufficient = comparison.filter(
            (i) => i.status === 'insufficient',
        ).length;
        const exact = comparison.filter((i) => i.difference === 0).length;
        const surplus = comparison.filter(
            (i) => i.difference > 0 && i.status !== 'excess',
        ).length;
        const excess = comparison.filter((i) => i.status === 'excess').length;
        return { insufficient, exact, surplus, excess };
    }, [comparison]);

    const totalCount = useMemo(
        () => categoryGroups.reduce((sum, g) => sum + g.totalCount, 0),
        [categoryGroups],
    );

    return (
        <div className="divide-y divide-slate-200">
            <section>
                <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 select-none"
                    onClick={toggle}
                >
                    <Trash2 className="w-5 h-5 text-red-500 flex-none" />
                    <h2 className="font-bold text-slate-700">廃棄リスト</h2>
                    {totalCount > 0 && (
                        <span className="text-xs bg-slate-700 text-white font-bold px-2 py-0.5 rounded-full tabular-nums">
                            計 {totalCount}
                        </span>
                    )}
                    <span className="ml-auto text-slate-400">
                        {isOpen ? (
                            <ChevronUp className="w-5 h-5" />
                        ) : (
                            <ChevronDown className="w-5 h-5" />
                        )}
                    </span>
                </button>

                {isOpen && (
                    <div className="px-3 pb-3">
                        {categoryGroups.length === 0 ? (
                            <div className="text-center py-4 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                任務一覧から任務を選択してください
                            </div>
                        ) : (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-6 border-t border-slate-200">
                                {categoryGroups.map((group, idx) => {
                                    // 個別装備を含まないグループは合計と内訳が同値になるため1行に畳む
                                    const isRemainderOnly =
                                        group.items.length === 0;

                                    return (
                                        <li
                                            key={idx}
                                            className="border-b border-slate-200 py-1.5"
                                        >
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-bold text-sm text-slate-700 truncate">
                                                    {group.categoryName}
                                                </span>
                                                {isRemainderOnly ? (
                                                    <>
                                                        <span className="flex-none text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded">
                                                            種別不問
                                                        </span>
                                                        <span className="ml-auto font-bold text-red-600 tabular-nums">
                                                            {group.totalCount}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="ml-auto flex-none text-xs text-slate-500 tabular-nums">
                                                        計 {group.totalCount}
                                                    </span>
                                                )}
                                            </div>

                                            {!isRemainderOnly && (
                                                <ul className="mt-0.5 pl-3 text-sm">
                                                    {group.items.map(
                                                        (item, i) => (
                                                            <li
                                                                key={i}
                                                                className="flex items-baseline gap-2"
                                                            >
                                                                <span className="text-slate-600 truncate">
                                                                    {item.name}
                                                                </span>
                                                                <span className="ml-auto font-bold text-red-600 tabular-nums">
                                                                    {item.count}
                                                                </span>
                                                            </li>
                                                        ),
                                                    )}
                                                    {group.remainder > 0 && (
                                                        <li className="flex items-baseline gap-2">
                                                            <span className="text-amber-700">
                                                                種別不問
                                                            </span>
                                                            <span className="ml-auto font-bold text-amber-700 tabular-nums">
                                                                {
                                                                    group.remainder
                                                                }
                                                            </span>
                                                        </li>
                                                    )}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </section>

            {hasBaseMission && comparison.length > 0 && (
                <section className="bg-amber-50/50">
                    <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 select-none"
                        onClick={toggleComparison}
                    >
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-none" />
                        <h3 className="font-bold text-slate-700 text-sm">
                            ベース任務の達成状況
                        </h3>
                        {comparisonSummary.insufficient > 0 && (
                            <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full tabular-nums">
                                不足 {comparisonSummary.insufficient}
                            </span>
                        )}
                        <span className="ml-auto text-slate-400">
                            {isComparisonOpen ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </span>
                    </button>

                    {isComparisonOpen && (
                        <div className="px-3 pb-3">
                            <ul className="border-t border-amber-200">
                                {comparison.map((item, index) => {
                                    const isInsufficient =
                                        item.status === 'insufficient';
                                    const isSufficient = item.difference === 0;
                                    const isNotRequiredByBase =
                                        item.baseCount === 0;

                                    return (
                                        <li
                                            key={index}
                                            className="border-b border-amber-200/70 py-1"
                                        >
                                            <div className="flex items-baseline gap-1.5">
                                                {isNotRequiredByBase ? (
                                                    <TrendingUp className="w-3.5 h-3.5 flex-none text-slate-400 self-center" />
                                                ) : isInsufficient ? (
                                                    <TrendingDown className="w-3.5 h-3.5 flex-none text-red-600 self-center" />
                                                ) : isSufficient ? (
                                                    <Check className="w-3.5 h-3.5 flex-none text-green-600 self-center" />
                                                ) : (
                                                    <TrendingUp className="w-3.5 h-3.5 flex-none text-blue-600 self-center" />
                                                )}
                                                <span
                                                    className={cn(
                                                        'text-sm font-semibold truncate',
                                                        isNotRequiredByBase
                                                            ? 'text-slate-500'
                                                            : 'text-slate-700',
                                                    )}
                                                >
                                                    {item.name}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'ml-auto flex-none text-xs font-bold tabular-nums',
                                                        isNotRequiredByBase &&
                                                            'text-slate-500',
                                                        !isNotRequiredByBase &&
                                                            isInsufficient &&
                                                            'text-red-700',
                                                        !isNotRequiredByBase &&
                                                            !isInsufficient &&
                                                            'text-blue-700',
                                                    )}
                                                >
                                                    {isInsufficient
                                                        ? '不足'
                                                        : '余剰'}{' '}
                                                    {item.difference > 0
                                                        ? '+'
                                                        : ''}
                                                    {item.difference}
                                                </span>
                                            </div>
                                            <div className="pl-5 text-[11px] text-slate-500 tabular-nums">
                                                ベース {item.baseCount}・補助{' '}
                                                {item.auxiliaryCount}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                <span className="text-slate-600">
                                    全{comparison.length}種類
                                </span>
                                {comparisonSummary.insufficient > 0 && (
                                    <span className="text-red-600">
                                        不足: {comparisonSummary.insufficient}種
                                    </span>
                                )}
                                {comparisonSummary.exact > 0 && (
                                    <span className="text-green-600">
                                        過不足なし: {comparisonSummary.exact}種
                                    </span>
                                )}
                                {comparisonSummary.surplus > 0 && (
                                    <span className="text-blue-600">
                                        余剰: {comparisonSummary.surplus}種
                                    </span>
                                )}
                                {comparisonSummary.excess > 0 && (
                                    <span className="text-slate-500">
                                        ベース不要: {comparisonSummary.excess}種
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
