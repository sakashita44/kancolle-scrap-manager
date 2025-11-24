import { useState, useMemo } from 'react'
import { Trash2, ChevronUp, ChevronDown, X } from 'lucide-react'
import { groupScrapListByCategory } from '../utils/scrapListFormatters'

/**
 * 廃棄リストを表示するスティッキーダッシュボード
 * @param {Object} props
 * @param {import('../types/schema').ScrapListItem[]} props.scrapList - 廃棄リスト（基本形式）
 * @param {number} props.selectedCount - 選択中の任務数
 * @param {Function} props.onClearSelection - 全選択解除ハンドラ
 */
const StickyDashboard = ({ scrapList, selectedCount, onClearSelection }) => {
  const [isOpen, setIsOpen] = useState(true)

  // 廃棄リストをカテゴリ別にグループ化
  const categoryGroups = useMemo(
    () => groupScrapListByCategory(scrapList),
    [scrapList]
  )

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur shadow-md border-b border-slate-200 transition-all">
      <div className="max-w-3xl mx-auto px-4 py-2">
        <div
          className="flex items-center gap-2 cursor-pointer py-1 select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Trash2 className="w-5 h-5 text-red-500" />
          <h2 className="font-bold text-slate-700">本日の廃棄リスト</h2>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">
              選択中: {selectedCount}
            </span>
            {selectedCount > 0 && (
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
            )}
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 開閉するコンテンツエリア */}
        {isOpen && (
          <div className="mt-2 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {categoryGroups.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-300">
                下の一覧から任務を選択してください
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {categoryGroups.map((group, idx) => (
                  <div key={idx} className="flex-none w-64 bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm snap-center">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1">
                      <span className="font-bold text-sm text-slate-700">{group.categoryName}</span>
                      <span className="bg-slate-700 text-white text-xs font-bold px-2 py-0.5 rounded">
                        計 {group.totalCount}
                      </span>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {group.items.map((item, i) => (
                        <li key={i} className="flex justify-between">
                          <span className="text-slate-600 truncate max-w-[70%]">{item.name}</span>
                          <span className="font-bold text-red-600">{item.count}</span>
                        </li>
                      ))}
                      {group.remainder > 0 && (
                        <li className="flex justify-between text-yellow-700 font-medium bg-yellow-50 px-1 rounded">
                          <span>何でもOK</span>
                          <span>{group.remainder}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StickyDashboard
