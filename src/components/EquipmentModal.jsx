import { useState, useMemo } from 'react'
import { Plus, Search, List, Trash2, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import { validateUniqueName, validateName } from '../utils/validation'
import { LIMITS } from '../types/schema'
import ValidationErrorDisplay from './ValidationErrorDisplay'
import { useData } from '../contexts/DataContext'

const EquipmentModal = ({
  onSave,
  onDelete,
  onDeleteCategory,
  onSwapOrder,
  onSwapCategoryOrder,
  onCancel
}) => {
  const {
    equipmentsForUI: equipments,
    categoryIds: categories,
    getCategoryName,
    getNextEquipmentOrder: getNextOrder,
    getNextCategoryOrder,
  } = useData()
  const [mode, setMode] = useState('equipment') // 'equipment' | 'category'
  const [name, setName] = useState('')
  const [category, setCategory] = useState(categories[0] || '')
  const [searchText, setSearchText] = useState('')
  const [isAddFormExpanded, setIsAddFormExpanded] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState(new Set()) // デフォルトクローズ

  // リアルタイムバリデーション
  const validationErrors = useMemo(() => {
    const errors = {}

    if (mode === 'equipment') {
      // 装備モード: 装備名とカテゴリを検証
      const nameValidation = validateName(name, LIMITS.EQUIPMENT_NAME_MAX)
      if (!nameValidation.valid) {
        errors.name = nameValidation.error
      } else if (name.length > 0) {
        if (name.length > LIMITS.EQUIPMENT_NAME_MAX * 0.9) {
          errors.name = `装備名は${LIMITS.EQUIPMENT_NAME_MAX}文字以内で入力してください (現在: ${name.length}文字)`
        } else {
          // 装備名の重複チェック（エラー扱い）
          const isUnique = validateUniqueName(name, equipments)
          if (!isUnique) {
            errors.name = '同じ名前の装備が既に存在します'
          }
        }
      }

      // カテゴリ選択のチェック
      if (!category || category.trim() === '') {
        errors.category = 'カテゴリを選択してください'
      }
    } else {
      // カテゴリモード: カテゴリ名のみ検証
      const categoryValidation = validateName(name, LIMITS.CATEGORY_NAME_MAX)
      if (!categoryValidation.valid) {
        errors.name = categoryValidation.error
      } else if (name.length > 0) {
        if (name.length > LIMITS.CATEGORY_NAME_MAX * 0.9) {
          errors.name = `カテゴリ名は${LIMITS.CATEGORY_NAME_MAX}文字以内で入力してください (現在: ${name.length}文字)`
        } else {
          // カテゴリ名の重複チェック（エラー扱い）
          const existingCategoryNames = categories.map(catId => getCategoryName(catId))
          const isDuplicate = existingCategoryNames.some(catName => catName === name.trim())
          if (isDuplicate) {
            errors.name = '同じ名前のカテゴリが既に存在します'
          }
        }
      }
    }

    return errors
  }, [mode, name, category, categories, getCategoryName, equipments])

  // 同名チェック（警告） - 現在は使用されていない（validationErrorsでチェック済み）
  const nameWarning = useMemo(() => {
    return null
  }, [])

  // フォームが有効かどうか
  const isFormValid = Object.keys(validationErrors).length === 0 && name.trim() !== ''

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    if (mode === 'equipment') {
      // 装備を追加
      onSave({ name, categoryId: category, order: getNextOrder() })
    } else {
      // カテゴリを追加
      onSave({ mode: 'category', name, order: getNextCategoryOrder() })
    }

    setName('') // 連続追加しやすくするためクリア
  }

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

  // 表示されるユーザー定義カテゴリのリスト（groupedEquipmentsの表示順序に従う）
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
    const categoryEquipments = groupedEquipments.get(categoryId).filter(e =>
      e.type !== 'category' && e.id.startsWith('u_')
    )
    const index = categoryEquipments.findIndex(e => e.id === equipmentId)
    if (index <= 0) return
    onSwapOrder(categoryEquipments[index].id, categoryEquipments[index - 1].id)
  }

  const handleMoveEquipmentDown = (categoryId, equipmentId) => {
    const categoryEquipments = groupedEquipments.get(categoryId).filter(e =>
      e.type !== 'category' && e.id.startsWith('u_')
    )
    const index = categoryEquipments.findIndex(e => e.id === equipmentId)
    if (index < 0 || index >= categoryEquipments.length - 1) return
    onSwapOrder(categoryEquipments[index].id, categoryEquipments[index + 1].id)
  }

  return (
    <div className="space-y-6">
      {/* 1. 新規追加フォーム */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setIsAddFormExpanded(!isAddFormExpanded)}
          className="w-full text-left mb-3 flex items-center justify-between hover:text-blue-600 transition-colors"
        >
          <h4 className="text-sm font-bold text-slate-700 flex items-center">
            <Plus className="w-4 h-4 mr-1" /> 新規登録
          </h4>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isAddFormExpanded ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {isAddFormExpanded && (
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* モード切替 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">追加モード</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="equipment"
                  checked={mode === 'equipment'}
                  onChange={() => setMode('equipment')}
                  className="mr-2"
                />
                <span className="text-sm">装備を追加</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="category"
                  checked={mode === 'category'}
                  onChange={() => setMode('category')}
                  className="mr-2"
                />
                <span className="text-sm">カテゴリを追加</span>
              </label>
            </div>
          </div>

          {mode === 'equipment' ? (
            /* 装備追加モード */
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  装備名 *
                  {name && <span className="ml-1 text-[10px] text-slate-400">({name.length}/{LIMITS.EQUIPMENT_NAME_MAX})</span>}
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm ${
                    validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例: 12.7cm連装砲B型改二"
                  required
                />
                <ValidationErrorDisplay
                  error={validationErrors.name}
                  warning={!validationErrors.name ? nameWarning : null}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">カテゴリ *</label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    validationErrors.category ? 'border-red-500' : ''
                  }`}
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{getCategoryName(c)}</option>
                  ))}
                </select>
                <ValidationErrorDisplay error={validationErrors.category} />
              </div>
            </>
          ) : (
            /* カテゴリ追加モード */
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                カテゴリ名 *
                {name && <span className="ml-1 text-[10px] text-slate-400">({name.length}/{LIMITS.CATEGORY_NAME_MAX})</span>}
              </label>
              <input
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm ${
                  validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例: カスタムカテゴリA"
                required
              />
              <ValidationErrorDisplay error={validationErrors.name} />
              <p className="mt-1 text-[10px] text-slate-500">
                ℹ️ カテゴリ代表装備が自動で作成されます
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${
              isFormValid
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {mode === 'equipment' ? 'リストに追加' : 'カテゴリを追加'}
          </button>
        </form>
        )}
      </div>

      {/* 2. 登録済み一覧 */}
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

        <div className={`overflow-y-auto border rounded-lg bg-white ${isAddFormExpanded ? 'max-h-96' : 'max-h-[32rem]'}`}>
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
                          className={`p-1 ${categoryIndex === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-500'}`}
                          title="カテゴリを上へ"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveCategoryDown(categoryId)}
                          disabled={categoryIndex === visibleUserCategories.length - 1}
                          className={`p-1 ${categoryIndex === visibleUserCategories.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-500'}`}
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
                      const isCategoryRep = eq.type === 'category'
                      const isUserEquipment = eq.id.startsWith('u_')
                      const equipmentIndex = userEquipmentList.findIndex(e => e.id === eq.id)
                      const canReorder = !isCategoryRep && isUserEquipment

                      return (
                        <div key={eq.id} className="px-3 py-2 flex justify-between items-center hover:bg-slate-50 group">
                          <div className="flex-1 min-w-0 mr-2">
                            <div className="text-sm font-medium text-slate-700 truncate">
                              {eq.name}
                            </div>
                            <div className="text-xs text-slate-400 flex gap-2">
                              <span className="bg-slate-100 px-1 rounded text-[10px]">{eq.type}</span>
                              {!isUserEquipment && <span className="text-[10px] text-slate-300">公式</span>}
                            </div>
                          </div>
                          {isUserEquipment && !isCategoryRep && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canReorder && (
                                <>
                                  <button
                                    onClick={() => handleMoveEquipmentUp(categoryId, eq.id)}
                                    disabled={equipmentIndex === 0}
                                    className={`p-1 ${equipmentIndex === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-500'}`}
                                    title="上へ移動"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveEquipmentDown(categoryId, eq.id)}
                                    disabled={equipmentIndex === userEquipmentList.length - 1}
                                    className={`p-1 ${equipmentIndex === userEquipmentList.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-500'}`}
                                    title="下へ移動"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => onDelete(eq.id)}
                                className="text-slate-300 hover:text-red-500 p-1"
                                title="削除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default EquipmentModal
