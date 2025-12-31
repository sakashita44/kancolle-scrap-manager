import { useMemo, useCallback, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LIMITS, TARGET_TYPE } from '../types/schema'
import { validateUniqueName } from '../utils/validation'
import { missionFormSchema } from '../schemas'
import { useCategoryData } from '../contexts/CategoryContext'
import { useEquipmentData } from '../contexts/EquipmentContext'
import { useMissionData } from '../contexts/MissionContext'

/**
 * 任務編集フォームのロジックを管理するカスタムフック
 * @param {Object} options
 * @param {Object|null} options.editingMission - 編集対象の任務（追加時はnull）
 * @param {Function} options.onSave - 保存時のコールバック
 * @returns {Object} フォーム状態とハンドラー
 */
export const useMissionForm = ({ editingMission = null, onSave }) => {
  const { categoryIds: categories, getCategoryName } = useCategoryData()
  const { equipmentsForUI: equipments } = useEquipmentData()
  const { allMissions } = useMissionData()
  const isEditMode = editingMission !== null

  // 初期化済みフラグ（装備ロード遅延時のreset用）
  const initializedRef = useRef(false)

  // react-hook-form設定
  const {
    register,
    control,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors },
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

  // 装備ロード遅延時の初期値追従
  // 新規追加モードで、装備が後からロードされた場合にtargetIdを更新
  useEffect(() => {
    if (initializedRef.current) return
    if (isEditMode) {
      initializedRef.current = true
      return
    }
    // 装備がロードされ、現在のtargetIdが空の場合にreset
    const currentReqs = watch('reqs')
    if (equipments.length > 0 && currentReqs?.[0]?.targetId === '') {
      // ユーザー入力済みのname/periodを維持
      const currentValues = watch()
      reset({
        name: currentValues.name,
        period: currentValues.period,
        reqs: [{ id: crypto.randomUUID(), targetId: equipments[0].id, count: 1 }],
      })
      initializedRef.current = true
    } else if (equipments.length > 0) {
      initializedRef.current = true
    }
  }, [equipments, isEditMode, reset, watch])

  // 動的フィールド配列管理（keyName指定でデータ側のidとの衝突を回避）
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'reqs',
    keyName: 'fieldId',
  })

  // フォーム全体を監視
  const watchedValues = watch()

  // 任務名の重複チェック（カスタムバリデーション）
  const nameDuplicateError = useMemo(() => {
    const name = watchedValues.name
    if (!name || name.trim() === '') return null

    // 編集モードの場合は自分自身を除外
    const missionsToCheck = isEditMode
      ? allMissions.filter(m => m.id !== editingMission.id)
      : allMissions
    const isUnique = validateUniqueName(name.trim(), missionsToCheck)
    return isUnique ? null : '同じ名前の任務が既に存在します'
  }, [watchedValues.name, allMissions, isEditMode, editingMission])

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

  // フォームが有効かどうか（Zodエラー + カスタムエラー）
  const hasZodErrors = Object.keys(errors).length > 0
  const isFormValid = !hasZodErrors && !nameDuplicateError && watchedValues.name?.trim() !== '' && fields.length > 0

  // 装備追加（追加後にZod再評価）
  const addReq = useCallback(() => {
    if (fields.length < LIMITS.REQUIREMENTS_PER_MISSION_MAX) {
      append({ id: crypto.randomUUID(), targetId: equipments[0]?.id || '', count: 1 })
      // 非同期でtriggerを呼び出してreqs全体のバリデーションを再評価
      setTimeout(() => trigger('reqs'), 0)
    }
  }, [fields.length, append, equipments, trigger])

  // 装備削除（最初の1枠は削除不可、削除後にZod再評価）
  const removeReq = useCallback((index) => {
    if (fields.length > 1) {
      remove(index)
      // 非同期でtriggerを呼び出してreqs全体のバリデーションを再評価
      setTimeout(() => trigger('reqs'), 0)
    }
  }, [fields.length, remove, trigger])

  // フォーム送信処理
  const onFormSubmit = useCallback((data) => {
    // カスタムバリデーションもチェック
    if (nameDuplicateError) return

    // 要求装備データを構築（targetTypeを自動判定）
    // countはZodのz.coerceで既にnumber化済み
    const reqsData = data.reqs.map(req => {
      const equipment = equipments.find(e => e.id === req.targetId)
      const targetType = equipment?.type === 'category' ? TARGET_TYPE.CATEGORY : TARGET_TYPE.ITEM
      return {
        id: req.id,
        targetId: req.targetId,
        targetType,
        count: req.count
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
  }, [nameDuplicateError, equipments, isEditMode, editingMission, onSave])

  // 表示用のエラーメッセージを統合
  const nameError = errors.name?.message || nameDuplicateError
  const reqsError = errors.reqs?.message || errors.reqs?.root?.message

  return {
    // react-hook-form関連
    register,
    handleSubmit,
    fields,
    errors,
    trigger,

    // 監視値
    watchedValues,

    // 派生データ
    groupedEquipments,
    getCategoryName,
    isFormValid,
    isEditMode,

    // エラーメッセージ
    nameError,
    reqsError,

    // ハンドラー
    addReq,
    removeReq,
    onFormSubmit,
  }
}
