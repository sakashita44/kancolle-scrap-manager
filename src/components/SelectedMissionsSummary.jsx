import { Check, X, ChevronUp, ChevronDown, Plus, Minus, Target } from 'lucide-react'
import { LIMITS } from '../types/schema'
import { useToggle } from '../hooks/useToggle'
import { useData } from '../contexts/DataContext'

/**
 * 選択中の任務一覧を表示する折り畳み可能なコンポーネント
 * 選択中の任務からベース任務を指定可能
 * @param {Object} props
 * @param {{missionId: string, count: number} | null} props.baseMission - ベース任務
 * @param {Array<{missionId: string, count: number}>} props.auxiliaryMissions - 補助任務リスト
 * @param {number} props.selectedCount - 選択中の任務数
 * @param {Function} props.isBaseMission - ベース任務かチェック
 * @param {Function} props.onSelectBaseMission - ベース任務設定ハンドラ
 * @param {Function} props.onDeselectBaseMission - ベース任務解除ハンドラ
 * @param {Function} props.onDeselectAuxiliaryMission - 補助任務選択解除ハンドラ
 * @param {Function} props.onToggleMission - 任務選択トグルハンドラ
 * @param {Function} props.onUpdateBaseMissionCount - ベース任務実行回数更新ハンドラ
 * @param {Function} props.onUpdateAuxiliaryMissionCount - 補助任務実行回数更新ハンドラ
 * @param {Function} props.onClearSelection - 全選択解除ハンドラ
 */
const SelectedMissionsSummary = ({
  baseMission,
  auxiliaryMissions,
  selectedCount,
  onSelectBaseMission,
  onDeselectBaseMission,
  onDeselectAuxiliaryMission,
  onToggleMission,
  onUpdateBaseMissionCount,
  onUpdateAuxiliaryMissionCount,
  onClearSelection
}) => {
  const { allMissions, equipmentMap, categoryMap } = useData()
  const [isOpen, { toggle }] = useToggle(true)

  // 必要装備の概要を生成
  const getEquipmentSummary = (mission) => {
    if (!mission.reqs || mission.reqs.length === 0) {
      return '廃棄なし'
    }

    return mission.reqs.map((req) => {
      let name = req.targetId

      if (req.targetType === 'category') {
        const category = categoryMap.get(req.targetId)
        name = category ? category.name : req.targetId
      } else {
        const equipment = equipmentMap.get(req.targetId)
        name = equipment ? equipment.name : req.targetId
      }

      return `${name}×${req.count}`
    }).join(', ')
  }

  // 選択中の任務が0件の場合は表示しない
  if (selectedCount === 0) {
    return null
  }

  // 全選択中の任務（ベース+補助）を配列で取得
  const allSelected = []
  if (baseMission) {
    allSelected.push({ ...baseMission, isBase: true })
  }
  auxiliaryMissions.forEach((mission) => {
    allSelected.push({ ...mission, isBase: false })
  })

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-3xl mx-auto px-4 py-2">
        <div
          className="flex items-center gap-2 cursor-pointer py-1 select-none"
          onClick={toggle}
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
              {allSelected.map((selected) => {
                const mission = allMissions.find((m) => m.id === selected.missionId)
                if (!mission) return null

                const isBase = selected.isBase

                return (
                  <div
                    key={mission.id}
                    className={`flex-none rounded-lg p-2 shadow-sm snap-center min-w-[200px] max-w-[250px] hover:shadow-md transition-shadow group ${
                      isBase
                        ? 'bg-amber-50 border-2 border-amber-300'
                        : 'bg-white border border-blue-300'
                    }`}
                  >
                    {/* ヘッダー: 任務名と選択解除ボタン */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-700 truncate" title={mission.name}>
                          {mission.name}
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded inline-block mt-1 ${
                          isBase ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {mission.period}
                        </span>
                      </div>
                      <button
                        onClick={() => onToggleMission(mission.id)}
                        className={`flex-none transition-colors p-1 -m-1 ${
                          isBase ? 'text-slate-300 hover:text-amber-600' : 'text-slate-300 hover:text-blue-500'
                        }`}
                        title="選択を解除"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 必要装備の概要 */}
                    <div className="text-xs text-slate-600 mb-2 line-clamp-2" title={getEquipmentSummary(mission)}>
                      {getEquipmentSummary(mission)}
                    </div>

                    {/* 実行回数選択 */}
                    <div className={`flex items-center gap-2 pt-2 mb-2 ${
                      isBase ? 'border-t border-amber-200' : 'border-t border-blue-100'
                    }`}>
                      <span className="text-xs text-slate-600 font-medium">実行回数:</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => isBase
                            ? onUpdateBaseMissionCount(selected.count - 1)
                            : onUpdateAuxiliaryMissionCount(mission.id, selected.count - 1)
                          }
                          disabled={selected.count <= 1}
                          className={`p-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
                            isBase
                              ? 'bg-amber-100 hover:bg-amber-200'
                              : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                          title="回数を減らす"
                        >
                          <Minus className={`w-3 h-3 ${isBase ? 'text-amber-700' : 'text-slate-600'}`} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={selected.count}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10)
                            if (!isNaN(value)) {
                              if (isBase) {
                                onUpdateBaseMissionCount(value)
                              } else {
                                onUpdateAuxiliaryMissionCount(mission.id, value)
                              }
                            }
                          }}
                          className={`w-10 text-center text-sm font-semibold text-slate-700 border rounded px-1 py-0.5 focus:outline-none focus:ring-1 ${
                            isBase
                              ? 'border-amber-300 focus:ring-amber-400'
                              : 'border-slate-200 focus:ring-blue-400'
                          }`}
                        />
                        <button
                          onClick={() => isBase
                            ? onUpdateBaseMissionCount(selected.count + 1)
                            : onUpdateAuxiliaryMissionCount(mission.id, selected.count + 1)
                          }
                          disabled={selected.count >= 99}
                          className={`p-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
                            isBase
                              ? 'bg-amber-100 hover:bg-amber-200'
                              : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                          title="回数を増やす"
                        >
                          <Plus className={`w-3 h-3 ${isBase ? 'text-amber-700' : 'text-slate-600'}`} />
                        </button>
                      </div>
                    </div>

                    {/* ベース任務設定ボタン */}
                    <button
                      onClick={() => {
                        if (isBase) {
                          // 既にベース任務の場合は解除
                          onDeselectBaseMission()
                        } else {
                          // ベース任務として設定
                          onSelectBaseMission(mission.id)
                        }
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isBase
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Target className="w-4 h-4" />
                      <span className="text-xs font-medium">
                        {isBase ? 'ベース任務 (設定中)' : 'ベース任務に設定'}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SelectedMissionsSummary
