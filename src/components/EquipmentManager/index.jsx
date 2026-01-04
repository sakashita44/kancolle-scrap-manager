import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, ChevronDown } from 'lucide-react'
import { validateUniqueName } from '../../utils/validation'
import { equipmentFormSchema, categoryFormSchema } from '../../schemas'
import { useCategoryData } from '../../contexts/CategoryContext'
import { useEquipmentData } from '../../contexts/EquipmentContext'
import { cn } from '../../utils/cn'
import EquipmentForm from './EquipmentForm'
import CategoryForm from './CategoryForm'
import EquipmentList from './EquipmentList'

/**
 * 装備管理モーダルの統合コンポーネント
 * 状態管理とレイアウトを担当し、フォームと一覧を統合
 * @param {Object} props
 * @param {Function} props.onSave - 保存ハンドラ
 * @param {Function} props.onDelete - 削除ハンドラ
 * @param {Function} props.onDeleteCategory - カテゴリ削除ハンドラ
 * @param {Function} props.onSwapOrder - 装備の並び替えハンドラ
 * @param {Function} props.onSwapCategoryOrder - カテゴリの並び替えハンドラ
 */
const EquipmentManager = ({
  onSave,
  onDelete,
  onDeleteCategory,
  onSwapOrder,
  onSwapCategoryOrder,
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
  const [isAddFormExpanded, setIsAddFormExpanded] = useState(true)

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
              <EquipmentForm
                register={register}
                watchedName={watchedValues.name}
                nameError={nameError}
                categoryError={errors.categoryId?.message}
                categories={categories}
                getCategoryName={getCategoryName}
              />
            ) : (
              <CategoryForm
                register={register}
                watchedName={watchedValues.name}
                nameError={nameError}
              />
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
      <EquipmentList
        equipments={equipments}
        categories={categories}
        getCategoryName={getCategoryName}
        isAddFormExpanded={isAddFormExpanded}
        onSwapOrder={onSwapOrder}
        onSwapCategoryOrder={onSwapCategoryOrder}
        onDelete={onDelete}
        onDeleteCategory={onDeleteCategory}
      />
    </div>
  )
}

export default EquipmentManager
