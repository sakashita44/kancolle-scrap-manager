import { useMemo, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { PERIOD, LIMITS, TARGET_TYPE } from '../types/schema'
import { validateUniqueName } from '../utils/validation'
import { missionFormSchema } from '../schemas'
import ValidationErrorDisplay from './ValidationErrorDisplay'
import { useCategoryData } from '../contexts/CategoryContext'
import { useEquipmentData } from '../contexts/EquipmentContext'
import { useMissionData } from '../contexts/MissionContext'

const MissionModal = ({
  editingMission = null, // 編集対象の任務（追加時はnull）
  onSave,
  onCancel
}) => {
  const { categoryIds: categories, getCategoryName } = useCategoryData()
  const { equipmentsForUI: equipments } = useEquipmentData()
  const { allMissions } = useMissionData()
  const isEditMode = editingMission !== null

  // react-hook-form設定
  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(missionFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: editingMission?.name || '',
      period: editingMission?.period || 'Weekly',
      reqs: editingMission?.reqs?.length > 0
        ? editingMission.reqs.map(req => ({
            id: crypto.randomUUID(),
            targetId: req.targetId,
            count: req.count,
          }))
        : [{ id: crypto.randomUUID(), targetId: equipments[0]?.id || '', count: 1 }],
    },
  })

  // 動的フィールド配列管理
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'reqs',
  })

  // 現在の入力値を監視
  const watchedName = watch('name', '')

  // 任務名の重複チェック（カスタムバリデーション）
  useEffect(() => {
    if (!watchedName || watchedName.trim() === '') {
      clearErrors('name')
      return
    }

    // 編集モードの場合は自分自身を除外
    const missionsToCheck = isEditMode
      ? allMissions.filter(m => m.id !== editingMission.id)
      : allMissions
    const isUnique = validateUniqueName(watchedName.trim(), missionsToCheck)
    if (!isUnique) {
      setError('name', { type: 'custom', message: '同じ名前の任務が既に存在します' })
    }
  }, [watchedName, allMissions, isEditMode, editingMission, setError, clearErrors])

  // カテゴリ別に装備をグループ化
  const groupedEquipments = useMemo(() => {
    const groups = new Map()
    categories.forEach(catId => {
      const categoryEquipments = equipments.filter(e => e.categoryId === catId)
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
  }, [equipments, categories])

  // フォームが有効かどうか
  const isFormValid = isValid && !errors.name && watchedName.trim() !== '' && fields.length > 0

  // 装備追加
  const addReq = () => {
    if (fields.length < LIMITS.REQUIREMENTS_PER_MISSION_MAX) {
      append({ id: crypto.randomUUID(), targetId: equipments[0]?.id || '', count: 1 })
    }
  }

  // 装備削除（最初の1枠は削除不可）
  const removeReq = (index) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const onSubmit = (data) => {
    if (!isFormValid) return

    // 要求装備データを構築（targetTypeを自動判定）
    const reqsData = data.reqs.map(req => {
      const equipment = equipments.find(e => e.id === req.targetId)
      const targetType = equipment?.type === 'category' ? TARGET_TYPE.CATEGORY : TARGET_TYPE.ITEM
      return {
        id: req.id,
        targetId: req.targetId,
        targetType,
        count: parseInt(req.count, 10)
      }
    })

    // 保存データを構築（ID/order採番は呼び出し側のsaveMissionで行う）
    const saveData = {
      name: data.name,
      period: data.period,
      reqs: reqsData,
      ...(isEditMode && {
        id: editingMission.id,
        order: editingMission.order
      })
    }

    onSave(saveData)
  }

  // reqsの重複エラーを取得（配列全体のエラー）
  const duplicateError = errors.reqs?.message || errors.reqs?.root?.message

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          任務名
          {watchedName && <span className="ml-1 text-[10px] text-slate-400">({watchedName.length}/{LIMITS.MISSION_NAME_MAX})</span>}
        </label>
        <input
          {...register('name')}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
            }`}
          placeholder="例: (単) 新型兵装の廃棄"
        />
        <ValidationErrorDisplay error={errors.name?.message} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">周期</label>
        <select
          {...register('period')}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value={PERIOD.DAILY}>Daily</option>
          <option value={PERIOD.WEEKLY}>Weekly</option>
          <option value={PERIOD.MONTHLY}>Monthly</option>
          <option value={PERIOD.QUARTERLY}>Quarterly</option>
          <option value={PERIOD.YEARLY}>Yearly</option>
          <option value={PERIOD.ONE_TIME}>OneTime</option>
        </select>
      </div>
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs font-bold text-slate-500 mb-2">要求装備 (最大{LIMITS.REQUIREMENTS_PER_MISSION_MAX}枠)</p>
        <ValidationErrorDisplay error={duplicateError} />
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <select
                {...register(`reqs.${index}.targetId`)}
                className={`flex-1 px-2 py-2 border rounded-lg text-sm ${errors.reqs?.[index]?.targetId ? 'border-red-500' : ''
                  }`}
              >
                {Array.from(groupedEquipments.entries()).map(([categoryId, categoryEquipments]) => (
                  <optgroup key={categoryId} label={getCategoryName(categoryId)}>
                    {categoryEquipments.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input
                type="number"
                min={LIMITS.REQUIREMENT_COUNT_MIN}
                max={LIMITS.REQUIREMENT_COUNT_MAX}
                {...register(`reqs.${index}.count`)}
                className={`w-20 px-2 py-2 border rounded-lg text-center text-sm ${errors.reqs?.[index]?.count ? 'border-red-500' : ''
                  }`}
              />
              {/* 最初の1枠のみ削除ボタンを非表示 */}
              {index > 0 ? (
                <button
                  type="button"
                  onClick={() => removeReq(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-10"></div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addReq}
            disabled={fields.length >= LIMITS.REQUIREMENTS_PER_MISSION_MAX}
            className={`w-full py-2 text-sm rounded-lg flex items-center justify-center gap-1 transition-colors ${fields.length >= LIMITS.REQUIREMENTS_PER_MISSION_MAX
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
          >
            <Plus className="w-4 h-4" />
            装備を追加
          </button>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!isFormValid}
          className={`flex-1 py-2 rounded-lg font-bold transition-colors ${isFormValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
        >
          {isEditMode ? '更新' : '追加'}
        </button>
      </div>
    </form>
  )
}

export default MissionModal
