import { Plus, Search } from 'lucide-react'
import { PERIOD } from '../types/schema'

const ControlBar = ({
  filterText,
  filterCategory,
  filterPeriod,
  categories,
  getCategoryName,
  onFilterTextChange,
  onFilterCategoryChange,
  onFilterPeriodChange,
  onEquipmentClick,
  onMissionClick
}) => {
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm flex flex-col sm:flex-row gap-3">
      {/* フィルタ */}
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="任務名を検索..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={filterText}
            onChange={(e) => onFilterTextChange(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none"
          value={filterPeriod}
          onChange={(e) => onFilterPeriodChange(e.target.value)}
        >
          <option value="ALL">全周期</option>
          <option value={PERIOD.DAILY}>Daily</option>
          <option value={PERIOD.WEEKLY}>Weekly</option>
          <option value={PERIOD.MONTHLY}>Monthly</option>
          <option value={PERIOD.QUARTERLY}>Quarterly</option>
          <option value={PERIOD.YEARLY}>Yearly</option>
          <option value={PERIOD.ONE_TIME}>OneTime</option>
        </select>
        <select
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none"
          value={filterCategory}
          onChange={(e) => onFilterCategoryChange(e.target.value)}
        >
          <option value="ALL">全種別</option>
          {categories.map(c => <option key={c} value={c}>{getCategoryName(c)}</option>)}
        </select>
      </div>

      {/* 追加ボタン群 */}
      <div className="flex gap-2">
        <button
          onClick={onEquipmentClick}
          className="flex items-center gap-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 text-sm font-medium transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> 装備管理
        </button>
        <button
          onClick={onMissionClick}
          className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> 任務追加
        </button>
      </div>
    </div>
  )
}

export default ControlBar
