import { useState } from 'react'
import { Plus, Search, List, Trash2 } from 'lucide-react'

const EquipmentModal = ({ equipments, categories, onSave, onDelete, onCancel }) => {
  const [name, setName] = useState('')
  const [category, setCategory] = useState(categories[0] || '')
  const [type, setType] = useState('Item')
  const [searchText, setSearchText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !category) return
    onSave({ name, category, type })
    setName('') // 連続追加しやすくするためクリア
  }

  const filteredEquipments = equipments.filter(e =>
    e.name.includes(searchText) || e.category.includes(searchText)
  )

  return (
    <div className="space-y-6">
      {/* 1. 新規追加フォーム */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
          <Plus className="w-4 h-4 mr-1" /> 新規登録
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">装備名</label>
            <input
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例: 12.7cm連装砲B型改二"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">カテゴリ</label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                value={category}
                onChange={e => setCategory(e.target.value)}
                list="category-list"
                placeholder="選択または入力"
                required
              />
              <datalist id="category-list">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">区分</label>
            <select
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="Item">個別装備 (Item)</option>
              <option value="Category">カテゴリ代表 (「機銃」など)</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2 bg-teal-600 text-white rounded-lg font-bold text-sm hover:bg-teal-700">
            リストに追加
          </button>
        </form>
      </div>

      {/* 2. 登録済み一覧 */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
          <span className="flex items-center"><List className="w-4 h-4 mr-1" /> 登録済み一覧</span>
          <span className="text-xs font-normal text-slate-500">{filteredEquipments.length}件</span>
        </h4>

        {/* 簡易検索 */}
        <div className="relative mb-2">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="装備を検索..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-400"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="max-h-48 overflow-y-auto border rounded-lg bg-white divide-y divide-slate-100">
          {filteredEquipments.map(eq => (
            <div key={eq.id} className="px-3 py-2 flex justify-between items-center hover:bg-slate-50 group">
              <div className="flex-1 min-w-0 mr-2">
                <div className="text-sm font-medium text-slate-700 truncate">{eq.name}</div>
                <div className="text-xs text-slate-400 flex gap-2">
                  <span>{eq.category}</span>
                  <span className="bg-slate-100 px-1 rounded text-[10px]">{eq.type}</span>
                </div>
              </div>
              {/* ユーザー定義のみ削除可能 */}
              {eq.id.startsWith('u_') ? (
                <button
                  onClick={() => onDelete(eq.id)}
                  className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-[10px] text-slate-300 select-none">公式</span>
              )}
            </div>
          ))}
          {filteredEquipments.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              該当する装備がありません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EquipmentModal
