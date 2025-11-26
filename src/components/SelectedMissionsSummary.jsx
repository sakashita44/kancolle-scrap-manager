import { useState } from 'react'
import { Check, X, ChevronUp, ChevronDown } from 'lucide-react'
import { LIMITS } from '../types/schema'

/**
 * 選択中の任務一覧を表示する折り畳み可能なコンポーネント
 * フィルタ適用時でも選択中の任務を常に確認可能にする
 * @param {Object} props
 * @param {import('../types/schema').Mission[]} props.selectedMissions - 選択中の任務一覧
 * @param {number} props.selectedCount - 選択中の任務数
 * @param {Function} props.onToggleMission - 任務の選択状態をトグルするハンドラ
 * @param {Function} props.onClearSelection - 全選択解除ハンドラ
 */
const SelectedMissionsSummary = ({ selectedMissions, selectedCount, onToggleMission, onClearSelection }) => {
  const [isOpen, setIsOpen] = useState(true)

  // 選択中の任務が0件の場合は表示しない
  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-3xl mx-auto px-4 py-2">
        <div
          className="flex items-center gap-2 cursor-pointer py-1 select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Check className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-slate-700 text-sm">選択中の任務</h3>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs bg-blue-200 px-2 py-1 rounded-full text-blue-700 font-medium">
              {selectedCount}/{LIMITS.SELECTED_MISSIONS_MAX}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClearSelection()
              }}
              className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
              title="全解除"
            >
              <X className="w-3 h-3" />
              全解除
            </button>
            <button className="text-blue-400 hover:text-blue-600 transition-colors">
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 折り畳み可能なコンテンツエリア */}
        {isOpen && (
          <div className="mt-2 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
              {selectedMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex-none bg-white border border-blue-300 rounded-lg p-2 shadow-sm snap-center min-w-[200px] max-w-[250px] hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-700 truncate" title={mission.name}>
                        {mission.name}
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded inline-block mt-1">
                        {mission.period}
                      </span>
                    </div>
                    <button
                      onClick={() => onToggleMission(mission.id)}
                      className="flex-none text-slate-300 hover:text-blue-500 transition-colors p-1 -m-1"
                      title="選択を解除"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SelectedMissionsSummary
