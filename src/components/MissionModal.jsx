import { useState } from 'react'
import { PERIOD } from '../types/schema'

const MissionModal = ({ equipments, onSave, onCancel }) => {
  const [name, setName] = useState('')
  const [period, setPeriod] = useState('Weekly')
  const [reqTargetId, setReqTargetId] = useState(equipments[0]?.id || '')
  const [reqCount, setReqCount] = useState(1)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !reqTargetId) return
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
        <label className="block text-sm font-medium text-slate-700 mb-1">任務名</label>
        <input
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例: (単) 新型兵装の廃棄"
          required
        />
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
            className="flex-1 px-2 py-2 border rounded-lg text-sm"
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
            min="1"
            className="w-16 px-2 py-2 border rounded-lg text-center"
            value={reqCount}
            onChange={e => setReqCount(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 bg-slate-100 rounded-lg text-slate-600"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold"
        >
          追加
        </button>
      </div>
    </form>
  )
}

export default MissionModal
