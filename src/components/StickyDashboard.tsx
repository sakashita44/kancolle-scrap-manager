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

interface StickyDashboardProps {
    scrapList: ScrapListItem[];
    comparison: ComparisonItem[];
    hasBaseMission: boolean;
}

export default function StickyDashboard({
    scrapList,
    comparison,
    hasBaseMission,
}: StickyDashboardProps) {
    const [isOpen, { toggle }] = useToggle(true);

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

    return (
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur shadow-md border-b border-slate-200 transition-all">
            <div className="max-w-3xl mx-auto px-4 py-2">
                <div
                    className="flex items-center gap-2 cursor-pointer py-1 select-none"
                    onClick={toggle}
                >
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <h2 className="font-bold text-slate-700">廃棄リスト</h2>
                    <div className="ml-auto flex items-center gap-3">
                        <button className="text-slate-400 hover:text-slate-600 transition-colors">
                            {isOpen ? (
                                <ChevronUp className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {isOpen && (
                    <div className="mt-2 pb-2 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
                        {categoryGroups.length === 0 ? (
                            <div className="text-center py-4 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                下の一覧から任務を選択してください
                            </div>
                        ) : (
                            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                                {categoryGroups.map((group, idx) => (
                                    <div
                                        key={idx}
                                        className="flex-none w-64 bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm snap-center"
                                    >
                                        <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1">
                                            <span className="font-bold text-sm text-slate-700">
                                                {group.categoryName}
                                            </span>
                                            <span className="bg-slate-700 text-white text-xs font-bold px-2 py-0.5 rounded">
                                                計 {group.totalCount}
                                            </span>
                                        </div>
                                        <ul className="space-y-1 text-sm">
                                            {group.items.map((item, i) => (
                                                <li
                                                    key={i}
                                                    className="flex justify-between"
                                                >
                                                    <span className="text-slate-600 truncate max-w-[70%]">
                                                        {item.name}
                                                    </span>
                                                    <span className="font-bold text-red-600">
                                                        {item.count}
                                                    </span>
                                                </li>
                                            ))}
                                            {group.remainder > 0 && (
                                                <li className="flex justify-between text-yellow-700 font-medium bg-yellow-50 px-1 rounded">
                                                    <span>何でもOK</span>
                                                    <span>
                                                        {group.remainder}
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}

                        {hasBaseMission &&
                            comparison &&
                            comparison.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2 text-sm">
                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                        ベース任務の達成状況
                                    </h3>
                                    <div className="space-y-2">
                                        {comparison.map((item, index) => {
                                            const isInsufficient =
                                                item.status === 'insufficient';
                                            const isSufficient =
                                                item.difference === 0;
                                            const isNotRequiredByBase =
                                                item.baseCount === 0;

                                            return (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        'p-2 rounded border text-xs',
                                                        isNotRequiredByBase &&
                                                            'bg-slate-100 border-slate-300',
                                                        !isNotRequiredByBase &&
                                                            isInsufficient &&
                                                            'bg-red-50 border-red-200',
                                                        !isNotRequiredByBase &&
                                                            !isInsufficient &&
                                                            isSufficient &&
                                                            'bg-green-50 border-green-200',
                                                        !isNotRequiredByBase &&
                                                            !isInsufficient &&
                                                            !isSufficient &&
                                                            'bg-blue-50 border-blue-200',
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                {!isNotRequiredByBase &&
                                                                    isInsufficient && (
                                                                        <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                                                                    )}
                                                                {!isNotRequiredByBase &&
                                                                    isSufficient && (
                                                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                                                    )}
                                                                {!isNotRequiredByBase &&
                                                                    !isInsufficient &&
                                                                    !isSufficient && (
                                                                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                                                                    )}
                                                                {isNotRequiredByBase && (
                                                                    <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                                                                )}
                                                                <span
                                                                    className={cn(
                                                                        'font-semibold',
                                                                        isNotRequiredByBase
                                                                            ? 'text-slate-500'
                                                                            : 'text-slate-700',
                                                                    )}
                                                                >
                                                                    {item.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-center gap-2">
                                                            <div className="text-xs">
                                                                <span className="text-slate-500">
                                                                    ベース{' '}
                                                                </span>
                                                                <span
                                                                    className={cn(
                                                                        'font-semibold',
                                                                        isNotRequiredByBase
                                                                            ? 'text-slate-400'
                                                                            : 'text-slate-700',
                                                                    )}
                                                                >
                                                                    {
                                                                        item.baseCount
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="text-xs">
                                                                <span className="text-slate-500">
                                                                    補助{' '}
                                                                </span>
                                                                <span
                                                                    className={cn(
                                                                        'font-semibold',
                                                                        isNotRequiredByBase
                                                                            ? 'text-slate-400'
                                                                            : 'text-slate-700',
                                                                    )}
                                                                >
                                                                    {
                                                                        item.auxiliaryCount
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="text-xs min-w-[60px] text-right">
                                                                <span
                                                                    className={cn(
                                                                        'font-medium',
                                                                        isNotRequiredByBase &&
                                                                            'text-slate-500',
                                                                        !isNotRequiredByBase &&
                                                                            isInsufficient &&
                                                                            'text-red-600',
                                                                        !isNotRequiredByBase &&
                                                                            !isInsufficient &&
                                                                            'text-blue-600',
                                                                    )}
                                                                >
                                                                    {isInsufficient
                                                                        ? '不足'
                                                                        : '余剰'}{' '}
                                                                </span>
                                                                <span
                                                                    className={cn(
                                                                        'font-bold',
                                                                        isNotRequiredByBase &&
                                                                            'text-slate-600',
                                                                        !isNotRequiredByBase &&
                                                                            isInsufficient &&
                                                                            'text-red-700',
                                                                        !isNotRequiredByBase &&
                                                                            !isInsufficient &&
                                                                            'text-blue-700',
                                                                    )}
                                                                >
                                                                    {item.difference >
                                                                    0
                                                                        ? '+'
                                                                        : ''}
                                                                    {
                                                                        item.difference
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-amber-200">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600">
                                                全{comparison.length}種類
                                            </span>
                                            <div className="flex gap-3">
                                                {comparisonSummary.insufficient >
                                                    0 && (
                                                    <span className="text-red-600">
                                                        不足:{' '}
                                                        {
                                                            comparisonSummary.insufficient
                                                        }
                                                        種
                                                    </span>
                                                )}
                                                {comparisonSummary.exact >
                                                    0 && (
                                                    <span className="text-green-600">
                                                        過不足なし:{' '}
                                                        {
                                                            comparisonSummary.exact
                                                        }
                                                        種
                                                    </span>
                                                )}
                                                {comparisonSummary.surplus >
                                                    0 && (
                                                    <span className="text-blue-600">
                                                        余剰:{' '}
                                                        {
                                                            comparisonSummary.surplus
                                                        }
                                                        種
                                                    </span>
                                                )}
                                                {comparisonSummary.excess >
                                                    0 && (
                                                    <span className="text-slate-500">
                                                        ベース不要:{' '}
                                                        {
                                                            comparisonSummary.excess
                                                        }
                                                        種
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
