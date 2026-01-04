import { useState, useMemo } from 'react'
import { Search, List, ChevronDown, ChevronRight, ChevronUp, Trash2 } from 'lucide-react'
import EquipmentListItem from './EquipmentListItem'
import { cn } from '../../utils/cn'

/**
 * 装備一覧コンポーネント（カテゴリ別グループ化、検索、並び替え機能付き）
 * @param {Object} props
 * @param {Array<Object>} props.equipments - 装備リスト
 * @param {Array<string>} props.categories - カテゴリIDリスト
 * @param {Function} props.getCategoryName - カテゴリIDから名前を取得する関数
 * @param {boolean} props.isAddFormExpanded - 追加フォームが展開されているか
 * @param {Function} props.onSwapOrder - 装備の並び替えハンドラ
 * @param {Function} props.onSwapCategoryOrder - カテゴリの並び替えハンドラ
 * @param {Function} props.onDelete - 装備の削除ハンドラ
 * @param {Function} props.onDeleteCategory - カテゴリの削除ハンドラ
 */
const EquipmentList = ({
  equipments,
  categories,
  getCategoryName,
  isAddFormExpanded,
  onSwapOrder,
  onSwapCategoryOrder,
  onDelete,
  onDeleteCategory,
}) => {
  const [searchText, setSearchText] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(new Set())

  // カテゴリ別に装備をグループ化（検索フィルタリング後）
  const groupedEquipments = useMemo(() => {
    const filtered = equipments.filter(e =>
      e.name.includes(searchText) || getCategoryName(e.categoryId).includes(searchText)
    )

    const groups = new Map()
    categories.forEach(catId => {
      const categoryEquipments = filtered.filter(e => e.categoryId === catId)
      if (categoryEquipments.length > 0) {
        groups.set(catId, categoryEquipments.sort((a, b) => {
          // カテゴリ代表を先頭に
          if (a.type === 'category' && b.type !== 'category') return -1
          if (a.type !== 'category' && b.type === 'category') return 1
          // 公式→ユーザーの順（isMasterフラグ）
          if (a.isMaster && !b.isMaster) return -1
          if (!a.isMaster && b.isMaster) return 1
          // 同じタイプ内ではorder順
          return a.order - b.order
        }))
      }
    })
    return groups
  }, [equipments, categories, searchText, getCategoryName])

  // 表示されるユーザー定義カテゴリのリスト
  const visibleUserCategories = useMemo(() => {
    return Array.from(groupedEquipments.keys()).filter(catId => catId.startsWith('u_cat_'))
  }, [groupedEquipments])

  // カテゴリの展開/折りたたみトグル
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // カテゴリの並び替え（ユーザー定義のみ）
  const handleMoveCategoryUp = (categoryId) => {
    const index = visibleUserCategories.findIndex(c => c === categoryId)
    if (index <= 0) return
    onSwapCategoryOrder(visibleUserCategories[index], visibleUserCategories[index - 1])
  }

  const handleMoveCategoryDown = (categoryId) => {
    const index = visibleUserCategories.findIndex(c => c === categoryId)
    if (index < 0 || index >= visibleUserCategories.length - 1) return
    onSwapCategoryOrder(visibleUserCategories[index], visibleUserCategories[index + 1])
  }

  // カテゴリ内装備の並び替え（カテゴリ代表を除く）
  const handleMoveEquipmentUp = (categoryId, equipmentId) => {
    const categoryEquipments = (groupedEquipments.get(categoryId) ?? []).filter(e =>
      e.type !== 'category' && e.id.startsWith('u_')
    )
    const index = categoryEquipments.findIndex(e => e.id === equipmentId)
    if (index <= 0) return
    onSwapOrder(categoryEquipments[index].id, categoryEquipments[index - 1].id)
  }

  const handleMoveEquipmentDown = (categoryId, equipmentId) => {
    const categoryEquipments = (groupedEquipments.get(categoryId) ?? []).filter(e =>
      e.type !== 'category' && e.id.startsWith('u_')
    )
    const index = categoryEquipments.findIndex(e => e.id === equipmentId)
    if (index < 0 || index >= categoryEquipments.length - 1) return
    onSwapOrder(categoryEquipments[index].id, categoryEquipments[index + 1].id)
  }

  return (
    <div>
      <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
        <span className="flex items-center"><List className="w-4 h-4 mr-1" /> 登録済み一覧</span>
        <span className="text-xs font-normal text-slate-500">{equipments.length}件</span>
      </h4>

      {/* 簡易検索 */}
      <div className="relative mb-2">
        <Search className="w-3 h-3 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="装備を検索..."
          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-400"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className={cn(
        'overflow-y-auto border rounded-lg bg-white',
        isAddFormExpanded ? 'max-h-96' : 'max-h-[32rem]'
      )}>
        {groupedEquipments.size === 0 && (
          <div className="p-4 text-center text-xs text-slate-400">
            該当する装備がありません
          </div>
        )}

        {Array.from(groupedEquipments.entries()).map(([categoryId, categoryEquipments]) => {
          const isExpanded = expandedCategories.has(categoryId)
          const isUserCategory = categoryId.startsWith('u_cat_')
          const categoryIndex = visibleUserCategories.findIndex(c => c === categoryId)
          const userEquipmentList = categoryEquipments.filter(e =>
            e.type !== 'category' && e.id.startsWith('u_')
          )

          return (
            <div key={categoryId} className="border-b border-slate-100 last:border-b-0">
              {/* カテゴリヘッダー */}
              <div className="bg-slate-50 hover:bg-slate-100 transition-colors group">
                <div className="px-3 py-2 flex items-center justify-between">
                  <button
                    onClick={() => toggleCategory(categoryId)}
                    className="flex-1 flex items-center text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500 mr-1" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500 mr-1" />
                    )}
                    <span className="text-sm font-bold text-slate-700">{getCategoryName(categoryId)}</span>
                    <span className="ml-2 text-xs text-slate-400">({categoryEquipments.length})</span>
                  </button>
                  {isUserCategory && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMoveCategoryUp(categoryId)}
                        disabled={categoryIndex === 0}
                        className={cn(
                          'p-1',
                          categoryIndex === 0
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-400 hover:text-blue-500'
                        )}
                        title="カテゴリを上へ"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveCategoryDown(categoryId)}
                        disabled={categoryIndex === visibleUserCategories.length - 1}
                        className={cn(
                          'p-1',
                          categoryIndex === visibleUserCategories.length - 1
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-400 hover:text-blue-500'
                        )}
                        title="カテゴリを下へ"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(categoryId)}
                        className="text-slate-300 hover:text-red-500 p-1"
                        title="カテゴリを削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* カテゴリ内装備リスト */}
              {isExpanded && (
                <div className="divide-y divide-slate-100">
                  {categoryEquipments.map((eq) => {
                    const equipmentIndex = userEquipmentList.findIndex(e => e.id === eq.id)
                    return (
                      <EquipmentListItem
                        key={eq.id}
                        equipment={eq}
                        equipmentIndex={equipmentIndex}
                        userEquipmentCount={userEquipmentList.length}
                        onMoveUp={() => handleMoveEquipmentUp(categoryId, eq.id)}
                        onMoveDown={() => handleMoveEquipmentDown(categoryId, eq.id)}
                        onDelete={() => onDelete(eq.id)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EquipmentList
