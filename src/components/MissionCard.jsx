import { Trash2 } from 'lucide-react'

const MissionCard = ({
  mission,
  equipments,
  isSelected,
  onToggle,
  onDelete
}) => {
  const isUserDefined = mission.id.startsWith('u_')

  return (
    <label
      className={`block bg-white rounded-lg border shadow-sm transition-colors cursor-pointer group relative ${
        isSelected ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
      }`}
    >
      <div className="p-4 flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300"
          checked={isSelected}
          onChange={() => onToggle(mission.id)}
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <span className="font-bold text-slate-700">{mission.name}</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
              {mission.period}
            </span>
          </div>
          <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-2">
            {mission.reqs.map((req, i) => {
              const eq = equipments.find(e => e.id === req.targetId)
              return (
                <span key={i} className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                  {eq ? eq.name : '削除済み装備'} x{req.count}
                </span>
              )
            })}
          </div>
        </div>

        {/* ユーザー定義削除ボタン */}
        {isUserDefined && (
          <button
            onClick={(e) => {
              e.preventDefault()
              onDelete(mission.id)
            }}
            className="text-slate-300 hover:text-red-500 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </label>
  )
}

export default MissionCard
