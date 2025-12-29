import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, List, Trash2, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import { validateUniqueName } from '../utils/validation'
import { LIMITS } from '../types/schema'
import { equipmentFormSchema, categoryFormSchema } from '../schemas'
import ValidationErrorDisplay from './ValidationErrorDisplay'
import { useCategoryData } from '../contexts/CategoryContext'
import { useEquipmentData } from '../contexts/EquipmentContext'
import { cn } from '../utils/cn'

const EquipmentModal = ({
  onSave,
  onDelete,
  onDeleteCategory,
  onSwapOrder,
  onSwapCategoryOrder,
  onCancel
}) => {
  const {
    categoryIds: categories,
    getCategoryName,
    getNextOrder: getNextCategoryOrder,
  } = useCategoryData()
  const {
    equipmentsForUI: equipments,
    getNextOrder: getNextOrder,
  } = useEquipmentData()
  const [mode, setMode] = useState('equipment') // 'equipment' | 'category'
  const [searchText, setSearchText] = useState('')
  const [isAddFormExpanded, setIsAddFormExpanded] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState(new Set()) // デフォルトクローズ

  // react-hook-form設定（モードに応じてスキーマを切り替え）
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mode === 'equipment' ? equipmentFormSchema : categoryFormSchema),
    mode: 'onChange',
    defaultValues: mode === 'equipment'
      ? { name: '', categoryId: categories[0] || '' }
      : { name: '' },
  })

  // モード切り替え時にフォームをリセット（modeのみ依存）
  useEffect(() => {
    reset(mode === 'equipment'
      ? { name: '', categoryId: categories[0] || '' }
      : { name: '' }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, reset])

  // フォーム全体を監視
  const watchedValues = watch()

  // 名前の重複チェック（カスタムバリデーション）
  const nameDuplicateError = useMemo(() => {
    const name = watchedValues.name
    if (!name || name.trim() === '') return null

    if (mode === 'equipment') {
      const isUnique = validateUniqueName(name.trim(), equipments)
      return isUnique ? null : '同じ名前の装備が既に存在します'
    } else {
      const existingCategoryNames = categories.map(catId => getCategoryName(catId))
      const isDuplicate = existingCategoryNames.some(catName => catName === name.trim())
      return isDuplicate ? '同じ名前のカテゴリが既に存在します' : null
    }
  }, [watchedValues.name, mode, equipments, categories, getCategoryName])

  // フォームが有効かどうか（Zodエラー + カスタムエラー）
  const hasZodErrors = Object.keys(errors).length > 0
  const isFormValid = !hasZodErrors && !nameDuplicateError && watchedValues.name?.trim() !== ''

  const onSubmit = (data) => {
    // カスタムバリデーションもチェック
    if (nameDuplicateError) return

    if (mode === 'equipment') {
      onSave({ name: data.name, categoryId: data.categoryId, order: getNextOrder() })
    } else {
      onSave({ mode: 'category', name: data.name, order: getNextCategoryOrder() })
    }

    // 連続追加しやすくするためクリア
    reset(mode === 'equipment'
      ? { name: '', categoryId: data.categoryId }
      : { name: '' }
    )
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

  // 文字数カウンターの表示用
  const maxLength = mode === 'equipment' ? LIMITS.EQUIPMENT_NAME_MAX : LIMITS.CATEGORY_NAME_MAX

  // 表示用のエラーメッセージを統合
  const nameError = errors.name?.message || nameDuplicateError

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
          <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', !isAddFormExpanded && '-rotate-90')} />
        </button>
        {isAddFormExpanded && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    {watchedValues.name && <span className="ml-1 text-[10px] text-slate-400">({watchedValues.name.length}/{maxLength})</span>}
                  </label>
                  <input
                    {...register('name')}
                    autoComplete="off"
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm',
                      nameError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                    )}
                    placeholder="例: 12.7cm連装砲B型改二"
                  />
                  <ValidationErrorDisplay error={nameError} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">カテゴリ *</label>
                  <select
                    {...register('categoryId')}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg text-sm',
                      errors.categoryId && 'border-red-500'
                    )}
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{getCategoryName(c)}</option>
                    ))}
                  </select>
                  <ValidationErrorDisplay error={errors.categoryId?.message} />
                </div>
              </>
            ) : (
              /* カテゴリ追加モード */
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  カテゴリ名 *
                  {watchedValues.name && <span className="ml-1 text-[10px] text-slate-400">({watchedValues.name.length}/{maxLength})</span>}
                </label>
                <input
                  {...register('name')}
                  autoComplete="off"
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm',
                    nameError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  )}
                  placeholder="例: カスタムカテゴリA"
                />
                <ValidationErrorDisplay error={nameError} />
                <p className="mt-1 text-[10px] text-slate-500">
                  ℹ️ カテゴリ代表装備が自動で作成されます
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid}
              className={cn(
                'w-full py-2 rounded-lg font-bold text-sm transition-colors',
                isFormValid
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
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

        <div className={cn('overflow-y-auto border rounded-lg bg-white', isAddFormExpanded ? 'max-h-96' : 'max-h-[32rem]')}>
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
                          className={cn('p-1', categoryIndex === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-500')}
                          title="カテゴリを上へ"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveCategoryDown(categoryId)}
                          disabled={categoryIndex === visibleUserCategories.length - 1}
                          className={cn('p-1', categoryIndex === visibleUserCategories.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-500')}
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
                                    className={cn('p-1', equipmentIndex === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-500')}
                                    title="上へ移動"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveEquipmentDown(categoryId, eq.id)}
                                    disabled={equipmentIndex === userEquipmentList.length - 1}
                                    className={cn('p-1', equipmentIndex === userEquipmentList.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-500')}
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
