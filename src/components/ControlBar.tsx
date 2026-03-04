import { Plus, Search } from 'lucide-react';
import { PERIOD } from '../schema';
import { useStore, selectAllCategories } from '../store';

interface ControlBarProps {
    filterText: string;
    filterCategory: string;
    filterPeriod: string;
    onFilterTextChange: (text: string) => void;
    onFilterCategoryChange: (categoryId: string) => void;
    onFilterPeriodChange: (period: string) => void;
    onEquipmentClick: () => void;
    onMissionClick: () => void;
}

export default function ControlBar({
    filterText,
    filterCategory,
    filterPeriod,
    onFilterTextChange,
    onFilterCategoryChange,
    onFilterPeriodChange,
    onEquipmentClick,
    onMissionClick,
}: ControlBarProps) {
    const categories = useStore(selectAllCategories);

    return (
        <div className="bg-white p-3 rounded-xl shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative sm:flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="任務名を検索..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={filterText}
                    onChange={(e) => onFilterTextChange(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <select
                    className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none"
                    value={filterPeriod}
                    onChange={(e) => onFilterPeriodChange(e.target.value)}
                >
                    <option value="ALL">全周期</option>
                    <option value={PERIOD.DAILY}>Daily</option>
                    <option value={PERIOD.WEEKLY}>Weekly</option>
                    <option value={PERIOD.MONTHLY}>Monthly</option>
                    <option value={PERIOD.QUARTERLY}>Quarterly</option>
                    <option value={PERIOD.YEARLY}>Yearly</option>
                    <option value={PERIOD.ONE_TIME}>OneTime</option>
                </select>
                <select
                    className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none"
                    value={filterCategory}
                    onChange={(e) => onFilterCategoryChange(e.target.value)}
                >
                    <option value="ALL">全種別</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={onEquipmentClick}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 text-sm font-medium transition-colors whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> 装備管理
                </button>
                <button
                    onClick={onMissionClick}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> 任務追加
                </button>
            </div>
        </div>
    );
}
