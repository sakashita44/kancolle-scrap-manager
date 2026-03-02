import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { SOURCE, type Equipment } from '../../schema';
import { cn } from '../../utils';

interface EquipmentListItemProps {
    equipment: Equipment;
    equipmentIndex: number;
    userEquipmentCount: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
}

export default function EquipmentListItem({
    equipment,
    equipmentIndex,
    userEquipmentCount,
    onMoveUp,
    onMoveDown,
    onDelete,
}: EquipmentListItemProps) {
    const isUserEquipment = equipment.source === SOURCE.USER;

    return (
        <div className="px-3 py-2 flex justify-between items-center hover:bg-slate-50 group">
            <div className="flex-1 min-w-0 mr-2">
                <div className="text-sm font-medium text-slate-700 truncate">
                    {equipment.name}
                </div>
                <div className="text-xs text-slate-400 flex gap-2">
                    {!isUserEquipment && (
                        <span className="text-[10px] text-slate-300">公式</span>
                    )}
                </div>
            </div>
            {isUserEquipment && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onMoveUp}
                        disabled={equipmentIndex === 0}
                        className={cn(
                            'p-1',
                            equipmentIndex === 0
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-blue-500',
                        )}
                        title="上へ移動"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={equipmentIndex === userEquipmentCount - 1}
                        className={cn(
                            'p-1',
                            equipmentIndex === userEquipmentCount - 1
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-blue-500',
                        )}
                        title="下へ移動"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="text-slate-300 hover:text-red-500 p-1"
                        title="削除"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
