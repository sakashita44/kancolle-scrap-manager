import { useState, useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { PERIOD, LIMITS } from '../types/schema'

const MissionModal = ({ equipments, missions, onSave, onCancel }) => {
  const [name, setName] = useState('')
  const [period, setPeriod] = useState('Weekly')
  const [reqTargetId, setReqTargetId] = useState(equipments[0]?.id || '')
  const [reqCount, setReqCount] = useState(1)

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
    if (!reqTargetId) {
      errors.reqTargetId = '要求装備を選択してください'
    }

    // 必要数の検証
    const count = parseInt(reqCount)
    if (isNaN(count) || count < LIMITS.REQUIREMENT_COUNT_MIN) {
      errors.reqCount = `必要数は${LIMITS.REQUIREMENT_COUNT_MIN}以上である必要があります`
    } else if (count > LIMITS.REQUIREMENT_COUNT_MAX) {
      errors.reqCount = `必要数は${LIMITS.REQUIREMENT_COUNT_MAX}以下である必要があります`
    }

    return errors
  }, [name, reqTargetId, reqCount])

  // フォームが有効かどうか
  const isFormValid = Object.keys(validationErrors).length === 0 && name.trim() !== '' && reqTargetId

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isFormValid) return
    // 簡易的に1つの装備要求のみ対応
    onSave({
      name,
      period,
      reqs: [{ targetId: reqTargetId, count: parseInt(reqCount) }]
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
        <p className="text-xs font-bold text-slate-500 mb-2">要求装備 (簡易版:1枠のみ)</p>
        <div className="flex gap-2 mb-2">
          <select
            className={`flex-1 px-2 py-2 border rounded-lg text-sm ${
              validationErrors.reqTargetId ? 'border-red-500' : ''
            }`}
            value={reqTargetId}
            onChange={e => setReqTargetId(e.target.value)}
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
              validationErrors.reqCount ? 'border-red-500' : ''
            }`}
            value={reqCount}
            onChange={e => setReqCount(e.target.value)}
          />
        </div>
        {validationErrors.reqTargetId && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.reqTargetId}
          </p>
        )}
        {validationErrors.reqCount && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.reqCount}
          </p>
        )}
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
