import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { cn } from '../../utils'

/**
 * 装備リストの各行を表示するコンポーネント
 * @param {Object} props
 * @param {Object} props.equipment - 装備データ
 * @param {number} props.equipmentIndex - ユーザー定義装備リスト内のインデックス
 * @param {number} props.userEquipmentCount - ユーザー定義装備の総数
 * @param {Function} props.onMoveUp - 上へ移動ハンドラ
 * @param {Function} props.onMoveDown - 下へ移動ハンドラ
 * @param {Function} props.onDelete - 削除ハンドラ
 */
const EquipmentListItem = ({
  equipment,
  equipmentIndex,
  userEquipmentCount,
  onMoveUp,
  onMoveDown,
  onDelete,
}) => {
  const isCategoryRep = equipment.type === 'category'
  const isUserEquipment = equipment.id.startsWith('u_')
  const canReorder = !isCategoryRep && isUserEquipment

  return (
    <div className="px-3 py-2 flex justify-between items-center hover:bg-slate-50 group">
      <div className="flex-1 min-w-0 mr-2">
        <div className="text-sm font-medium text-slate-700 truncate">
          {equipment.name}
        </div>
        <div className="text-xs text-slate-400 flex gap-2">
          <span className="bg-slate-100 px-1 rounded text-[10px]">{equipment.type}</span>
          {!isUserEquipment && <span className="text-[10px] text-slate-300">公式</span>}
        </div>
      </div>
      {isUserEquipment && !isCategoryRep && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canReorder && (
            <>
              <button
                onClick={onMoveUp}
                disabled={equipmentIndex === 0}
                className={cn(
                  'p-1',
                  equipmentIndex === 0
                    ? 'text-slate-200 cursor-not-allowed'
                    : 'text-slate-400 hover:text-blue-500'
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
                    : 'text-slate-400 hover:text-blue-500'
                )}
                title="下へ移動"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </>
          )}
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
  )
}

export default EquipmentListItem
