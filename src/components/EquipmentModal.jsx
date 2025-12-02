import { useState, useMemo } from 'react'
import { Plus, Search, List, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { validateEquipment, validateUniqueName, validateName } from '../utils/validation'
import { LIMITS } from '../types/schema'
import ValidationErrorDisplay from './ValidationErrorDisplay'

const EquipmentModal = ({ equipments, categories, getCategoryName, getNextOrder, onSave, onDelete, onSwapOrder, onCancel }) => {
  const [mode, setMode] = useState('equipment') // 'equipment' | 'category'
  const [name, setName] = useState('')
  const [category, setCategory] = useState(categories[0] || '')
  const [searchText, setSearchText] = useState('')
  const [isAddFormExpanded, setIsAddFormExpanded] = useState(true)

  // リアルタイムバリデーション
  const validationErrors = useMemo(() => {
    const errors = {}

    if (mode === 'equipment') {
      // 装備モード: 装備名とカテゴリを検証
      const nameValidation = validateName(name, LIMITS.EQUIPMENT_NAME_MAX)
      if (!nameValidation.valid) {
        errors.name = nameValidation.error
      } else if (name.length > 0) {
        if (name.length > LIMITS.EQUIPMENT_NAME_MAX * 0.9) {
          errors.name = `装備名は${LIMITS.EQUIPMENT_NAME_MAX}文字以内で入力してください (現在: ${name.length}文字)`
        }
      }

      // カテゴリ選択のチェック
      if (!category || category.trim() === '') {
        errors.category = 'カテゴリを選択してください'
      }
    } else {
      // カテゴリモード: カテゴリ名のみ検証
      const categoryValidation = validateName(name, LIMITS.CATEGORY_NAME_MAX)
      if (!categoryValidation.valid) {
        errors.name = categoryValidation.error
      } else if (name.length > 0) {
        if (name.length > LIMITS.CATEGORY_NAME_MAX * 0.9) {
          errors.name = `カテゴリ名は${LIMITS.CATEGORY_NAME_MAX}文字以内で入力してください (現在: ${name.length}文字)`
        }
      }
    }

    return errors
  }, [mode, name, category])

  // 同名チェック（警告）
  const nameWarning = useMemo(() => {
    if (name.trim() !== '' && !validationErrors.name) {
      if (mode === 'equipment') {
        const isUnique = validateUniqueName(name, equipments)
        if (!isUnique) {
          return '同じ名前の装備が既に存在します'
        }
      }
    }
    return null
  }, [mode, name, equipments, validationErrors.name])

  // フォームが有効かどうか
  const isFormValid = Object.keys(validationErrors).length === 0 && name.trim() !== ''

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    if (mode === 'equipment') {
      // 装備を追加
      onSave({ name, categoryId: category, order: getNextOrder() })
    } else {
      // カテゴリを追加（TODO: カテゴリ追加機能の実装が必要）
      onSave({ mode: 'category', name, order: getNextOrder() })
    }

    setName('') // 連続追加しやすくするためクリア
  }

  const filteredEquipments = equipments.filter(e =>
    e.name.includes(searchText) || getCategoryName(e.categoryId).includes(searchText)
  )

  // ユーザー定義装備のみ抽出してソート
  const userEquipmentsFiltered = filteredEquipments.filter(e => e.id.startsWith('u_')).sort((a, b) => a.order - b.order)
  const masterEquipmentsFiltered = filteredEquipments.filter(e => !e.id.startsWith('u_'))

  // 並び替え処理
  const handleMoveUp = (equipmentId) => {
    const index = userEquipmentsFiltered.findIndex(e => e.id === equipmentId)
    if (index <= 0) return
    const current = userEquipmentsFiltered[index]
    const previous = userEquipmentsFiltered[index - 1]
    onSwapOrder(current.id, previous.id)
  }

  const handleMoveDown = (equipmentId) => {
    const index = userEquipmentsFiltered.findIndex(e => e.id === equipmentId)
    if (index < 0 || index >= userEquipmentsFiltered.length - 1) return
    const current = userEquipmentsFiltered[index]
    const next = userEquipmentsFiltered[index + 1]
    onSwapOrder(current.id, next.id)
  }

  return (
    <div className="space-y-6">
      {/* 1. 新規追加フォーム */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setIsAddFormExpanded(!isAddFormExpanded)}
          className="w-full text-left mb-3 flex items-center justify-between hover:text-blue-600 transition-colors"
        >
          <h4 className="text-sm font-bold text-slate-700 flex items-center">
            <Plus className="w-4 h-4 mr-1" /> 新規登録
          </h4>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isAddFormExpanded ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {isAddFormExpanded && (
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* モード切替 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">追加モード</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="equipment"
                  checked={mode === 'equipment'}
                  onChange={() => setMode('equipment')}
                  className="mr-2"
                />
                <span className="text-sm">装備を追加</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="category"
                  checked={mode === 'category'}
                  onChange={() => setMode('category')}
                  className="mr-2"
                />
                <span className="text-sm">カテゴリを追加</span>
              </label>
            </div>
          </div>

          {mode === 'equipment' ? (
            /* 装備追加モード */
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  装備名 *
                  {name && <span className="ml-1 text-[10px] text-slate-400">({name.length}/{LIMITS.EQUIPMENT_NAME_MAX})</span>}
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm ${
                    validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例: 12.7cm連装砲B型改二"
                  required
                />
                <ValidationErrorDisplay
                  error={validationErrors.name}
                  warning={!validationErrors.name ? nameWarning : null}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">カテゴリ *</label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    validationErrors.category ? 'border-red-500' : ''
                  }`}
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{getCategoryName(c)}</option>
                  ))}
                </select>
                <ValidationErrorDisplay error={validationErrors.category} />
              </div>
            </>
          ) : (
            /* カテゴリ追加モード */
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                カテゴリ名 *
                {name && <span className="ml-1 text-[10px] text-slate-400">({name.length}/{LIMITS.CATEGORY_NAME_MAX})</span>}
              </label>
              <input
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm ${
                  validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例: カスタムカテゴリA"
                required
              />
              <ValidationErrorDisplay error={validationErrors.name} />
              <p className="mt-1 text-[10px] text-slate-500">
                ℹ️ カテゴリ代表装備が自動で作成されます
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${
              isFormValid
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {mode === 'equipment' ? 'リストに追加' : 'カテゴリを追加'}
          </button>
        </form>
        )}
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

        <div className={`overflow-y-auto border rounded-lg bg-white divide-y divide-slate-100 ${isAddFormExpanded ? 'max-h-64' : 'max-h-96'}`}>
          {/* 公式装備 */}
          {masterEquipmentsFiltered.map(eq => (
            <div key={eq.id} className="px-3 py-2 flex justify-between items-center hover:bg-slate-50">
              <div className="flex-1 min-w-0 mr-2">
                <div className="text-sm font-medium text-slate-700 truncate">{eq.name}</div>
                <div className="text-xs text-slate-400 flex gap-2">
                  <span>{getCategoryName(eq.categoryId)}</span>
                  <span className="bg-slate-100 px-1 rounded text-[10px]">{eq.type}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-300 select-none">公式</span>
            </div>
          ))}
          {/* ユーザー定義装備 */}
          {userEquipmentsFiltered.map((eq, index) => (
            <div key={eq.id} className="px-3 py-2 flex justify-between items-center hover:bg-slate-50 group">
              <div className="flex-1 min-w-0 mr-2">
                <div className="text-sm font-medium text-slate-700 truncate">{eq.name}</div>
                <div className="text-xs text-slate-400 flex gap-2">
                  <span>{getCategoryName(eq.categoryId)}</span>
                  <span className="bg-slate-100 px-1 rounded text-[10px]">{eq.type}</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleMoveUp(eq.id)}
                  disabled={index === 0}
                  className={`p-1 ${index === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-500'}`}
                  title="上へ移動"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(eq.id)}
                  disabled={index === userEquipmentsFiltered.length - 1}
                  className={`p-1 ${index === userEquipmentsFiltered.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-500'}`}
                  title="下へ移動"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(eq.id)}
                  className="text-slate-300 hover:text-red-500 p-1"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
