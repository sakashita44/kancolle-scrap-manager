import { useState, useMemo } from 'react';
import {
    Search,
    List,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Trash2,
} from 'lucide-react';
import EquipmentListItem from './EquipmentListItem';
import { SOURCE, type Category, type Equipment } from '../../schema';
import { cn } from '../../utils';

interface EquipmentListProps {
    equipments: Equipment[];
    categories: Category[];
    isAddFormExpanded: boolean;
    onSwapOrder: (id1: string, id2: string) => void;
    onSwapCategoryOrder: (id1: string, id2: string) => void;
    onDelete: (id: string) => void;
    onDeleteCategory: (categoryId: string) => void;
}

export default function EquipmentList({
    equipments,
    categories,
    isAddFormExpanded,
    onSwapOrder,
    onSwapCategoryOrder,
    onDelete,
    onDeleteCategory,
}: EquipmentListProps) {
    const [searchText, setSearchText] = useState('');
    const [expandedCategories, setExpandedCategories] = useState(
        new Set<string>(),
    );

    // カテゴリ別に装備をグループ化
    const groupedEquipments = useMemo(() => {
        const filtered = equipments.filter(
            (e) =>
                e.name.includes(searchText) ||
                categories
                    .find((c) => c.id === e.categoryId)
                    ?.name.includes(searchText),
        );

        const groups = new Map<string, Equipment[]>();
        for (const cat of categories) {
            const catEquipments = filtered
                .filter((e) => e.categoryId === cat.id)
                .sort((a, b) => {
                    // source でソート（master先）
                    if (a.source !== b.source) {
                        return a.source === SOURCE.MASTER ? -1 : 1;
                    }
                    return a.order - b.order;
                });
            if (catEquipments.length > 0 || cat.source === SOURCE.USER) {
                groups.set(cat.id, catEquipments);
            }
        }
        return groups;
    }, [equipments, categories, searchText]);

    // ユーザー定義カテゴリのみ
    const visibleUserCategories = useMemo(() => {
        return Array.from(groupedEquipments.keys()).filter((catId) =>
            categories.find((c) => c.id === catId && c.source === SOURCE.USER),
        );
    }, [groupedEquipments, categories]);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const handleMoveCategoryUp = (categoryId: string) => {
        const index = visibleUserCategories.indexOf(categoryId);
        if (index <= 0) return;
        onSwapCategoryOrder(
            visibleUserCategories[index],
            visibleUserCategories[index - 1],
        );
    };

    const handleMoveCategoryDown = (categoryId: string) => {
        const index = visibleUserCategories.indexOf(categoryId);
        if (index < 0 || index >= visibleUserCategories.length - 1) return;
        onSwapCategoryOrder(
            visibleUserCategories[index],
            visibleUserCategories[index + 1],
        );
    };

    const handleMoveEquipmentUp = (categoryId: string, equipmentId: string) => {
        const catEquipments = (groupedEquipments.get(categoryId) ?? []).filter(
            (e) => e.source === SOURCE.USER,
        );
        const index = catEquipments.findIndex((e) => e.id === equipmentId);
        if (index <= 0) return;
        onSwapOrder(catEquipments[index].id, catEquipments[index - 1].id);
    };

    const handleMoveEquipmentDown = (
        categoryId: string,
        equipmentId: string,
    ) => {
        const catEquipments = (groupedEquipments.get(categoryId) ?? []).filter(
            (e) => e.source === SOURCE.USER,
        );
        const index = catEquipments.findIndex((e) => e.id === equipmentId);
        if (index < 0 || index >= catEquipments.length - 1) return;
        onSwapOrder(catEquipments[index].id, catEquipments[index + 1].id);
    };

    const getCategoryName = (catId: string) =>
        categories.find((c) => c.id === catId)?.name ?? '不明';

    return (
        <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span className="flex items-center">
                    <List className="w-4 h-4 mr-1" /> 登録済み一覧
                </span>
                <span className="text-xs font-normal text-slate-500">
                    {equipments.length}件
                </span>
            </h4>

            <div className="relative mb-2">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                    id="equipment-search"
                    type="text"
                    placeholder="装備を検索..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-400"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>

            <div
                className={cn(
                    'overflow-y-auto border rounded-lg bg-white',
                    isAddFormExpanded ? 'max-h-96' : 'max-h-[32rem]',
                )}
            >
                {groupedEquipments.size === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                        該当する装備がありません
                    </div>
                )}

                {Array.from(groupedEquipments.entries()).map(
                    ([categoryId, categoryEquipments]) => {
                        const isExpanded = expandedCategories.has(categoryId);
                        const cat = categories.find((c) => c.id === categoryId);
                        const isUserCategory = cat?.source === SOURCE.USER;
                        const categoryIndex =
                            visibleUserCategories.indexOf(categoryId);
                        const userEquipmentList = categoryEquipments.filter(
                            (e) => e.source === SOURCE.USER,
                        );

                        return (
                            <div
                                key={categoryId}
                                className="border-b border-slate-100 last:border-b-0"
                            >
                                <div className="bg-slate-50 hover:bg-slate-100 transition-colors group">
                                    <div className="px-3 py-2 flex items-center justify-between">
                                        <button
                                            onClick={() =>
                                                toggleCategory(categoryId)
                                            }
                                            className="flex-1 flex items-center text-left"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-slate-500 mr-1" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-slate-500 mr-1" />
                                            )}
                                            <span className="text-sm font-bold text-slate-700">
                                                {getCategoryName(categoryId)}
                                            </span>
                                            <span className="ml-2 text-xs text-slate-400">
                                                ({categoryEquipments.length})
                                            </span>
                                        </button>
                                        {isUserCategory && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() =>
                                                        handleMoveCategoryUp(
                                                            categoryId,
                                                        )
                                                    }
                                                    disabled={
                                                        categoryIndex === 0
                                                    }
                                                    className={cn(
                                                        'p-1',
                                                        categoryIndex === 0
                                                            ? 'text-slate-200 cursor-not-allowed'
                                                            : 'text-slate-400 hover:text-blue-500',
                                                    )}
                                                    title="カテゴリを上へ"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleMoveCategoryDown(
                                                            categoryId,
                                                        )
                                                    }
                                                    disabled={
                                                        categoryIndex ===
                                                        visibleUserCategories.length -
                                                            1
                                                    }
                                                    className={cn(
                                                        'p-1',
                                                        categoryIndex ===
                                                            visibleUserCategories.length -
                                                                1
                                                            ? 'text-slate-200 cursor-not-allowed'
                                                            : 'text-slate-400 hover:text-blue-500',
                                                    )}
                                                    title="カテゴリを下へ"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        onDeleteCategory(
                                                            categoryId,
                                                        )
                                                    }
                                                    className="text-slate-300 hover:text-red-500 p-1"
                                                    title="カテゴリを削除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="divide-y divide-slate-100">
                                        {categoryEquipments.map((eq) => {
                                            const equipmentIndex =
                                                userEquipmentList.findIndex(
                                                    (e) => e.id === eq.id,
                                                );
                                            return (
                                                <EquipmentListItem
                                                    key={eq.id}
                                                    equipment={eq}
                                                    equipmentIndex={
                                                        equipmentIndex
                                                    }
                                                    userEquipmentCount={
                                                        userEquipmentList.length
                                                    }
                                                    onMoveUp={() =>
                                                        handleMoveEquipmentUp(
                                                            categoryId,
                                                            eq.id,
                                                        )
                                                    }
                                                    onMoveDown={() =>
                                                        handleMoveEquipmentDown(
                                                            categoryId,
                                                            eq.id,
                                                        )
                                                    }
                                                    onDelete={() =>
                                                        onDelete(eq.id)
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    },
                )}
            </div>
        </div>
    );
}
