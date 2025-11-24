import { useState, useMemo } from 'react'
import { AlertCircle, Plus, Trash2 } from 'lucide-react'
import { PERIOD, LIMITS } from '../types/schema'

const MissionModal = ({ equipments, missions, onSave, onCancel }) => {
  const [name, setName] = useState('')
  const [period, setPeriod] = useState('Weekly')
  // 複数の要求装備を管理（最初の1枠は必須）
  const [reqs, setReqs] = useState([
    { id: crypto.randomUUID(), targetId: equipments[0]?.id || '', count: 1 }
  ])

  // 装備追加
  const addReq = () => {
    if (reqs.length < LIMITS.REQUIREMENTS_PER_MISSION_MAX) {
      setReqs([...reqs, { id: crypto.randomUUID(), targetId: equipments[0]?.id || '', count: 1 }])
    }
  }

  // 装備削除（最初の1枠は削除不可）
  const removeReq = (id) => {
    if (reqs.length > 1) {
      setReqs(reqs.filter(req => req.id !== id))
    }
  }

  // 装備の更新
  const updateReq = (id, field, value) => {
    setReqs(reqs.map(req => req.id === id ? { ...req, [field]: value } : req))
  }

  // リアルタイムバリデーション
  const validationErrors = useMemo(() => {
    const errors = {}

    // 任務名の検証
    if (name.trim() === '') {
      errors.name = '任務名は必須です'
    } else if (name.length > LIMITS.MISSION_NAME_MAX) {
      errors.name = `任務名は${LIMITS.MISSION_NAME_MAX}文字以内で入力してください (現在: ${name.length}文字)`
    }

    // 要求装備の検証
    reqs.forEach((req, index) => {
      if (!req.targetId) {
        errors[`req_${req.id}_target`] = '要求装備を選択してください'
      }

      const count = parseInt(req.count)
      if (isNaN(count) || count < LIMITS.REQUIREMENT_COUNT_MIN) {
        errors[`req_${req.id}_count`] = `必要数は${LIMITS.REQUIREMENT_COUNT_MIN}以上である必要があります`
      } else if (count > LIMITS.REQUIREMENT_COUNT_MAX) {
        errors[`req_${req.id}_count`] = `必要数は${LIMITS.REQUIREMENT_COUNT_MAX}以下である必要があります`
      }
    })

    // 重複チェック
    const targetIds = reqs.map(r => r.targetId).filter(Boolean)
    const duplicates = targetIds.filter((id, index) => targetIds.indexOf(id) !== index)
    if (duplicates.length > 0) {
      errors.duplicate = '同じ装備が複数回選択されています'
    }

    return errors
  }, [name, reqs])

  // フォームが有効かどうか
  const isFormValid = Object.keys(validationErrors).length === 0 && name.trim() !== '' && reqs.length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isFormValid) return
    // 複数の装備要求に対応
    onSave({
      name,
      period,
      reqs: reqs.map(req => ({ targetId: req.targetId, count: parseInt(req.count) }))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          任務名
          {name && <span className="ml-1 text-[10px] text-slate-400">({name.length}/{LIMITS.MISSION_NAME_MAX})</span>}
        </label>
        <input
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${
            validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
          }`}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例: (単) 新型兵装の廃棄"
          required
        />
        {validationErrors.name && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.name}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">周期</label>
        <select
          className="w-full px-3 py-2 border rounded-lg"
          value={period}
          onChange={e => setPeriod(e.target.value)}
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
        {validationErrors.duplicate && (
          <p className="text-xs text-red-500 flex items-center gap-1 mb-2">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.duplicate}
          </p>
        )}
        <div className="space-y-2">
          {reqs.map((req, index) => (
            <div key={req.id} className="flex gap-2">
              <select
                className={`flex-1 px-2 py-2 border rounded-lg text-sm ${
                  validationErrors[`req_${req.id}_target`] ? 'border-red-500' : ''
                }`}
                value={req.targetId}
                onChange={e => updateReq(req.id, 'targetId', e.target.value)}
              >
                {equipments.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.category} - {e.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={LIMITS.REQUIREMENT_COUNT_MIN}
                max={LIMITS.REQUIREMENT_COUNT_MAX}
                className={`w-20 px-2 py-2 border rounded-lg text-center text-sm ${
                  validationErrors[`req_${req.id}_count`] ? 'border-red-500' : ''
                }`}
                value={req.count}
                onChange={e => updateReq(req.id, 'count', e.target.value)}
              />
              {/* 最初の1枠のみ削除ボタンを非表示 */}
              {index > 0 ? (
                <button
                  type="button"
                  onClick={() => removeReq(req.id)}
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
            disabled={reqs.length >= LIMITS.REQUIREMENTS_PER_MISSION_MAX}
            className={`w-full py-2 text-sm rounded-lg flex items-center justify-center gap-1 transition-colors ${
              reqs.length >= LIMITS.REQUIREMENTS_PER_MISSION_MAX
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
          className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
            isFormValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          追加
        </button>
      </div>
    </form>
  )
}

export default MissionModal
