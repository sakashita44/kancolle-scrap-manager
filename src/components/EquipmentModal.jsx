import { useState, useMemo } from 'react'
import { Plus, Search, List, Trash2 } from 'lucide-react'
import { validateEquipment, validateUniqueName, validateName } from '../utils/validation'
import { LIMITS } from '../types/schema'
import ValidationErrorDisplay from './ValidationErrorDisplay'

const EquipmentModal = ({ equipments, categories, getCategoryName, getNextOrder, onSave, onDelete, onCancel }) => {
  const [name, setName] = useState('')
  const [category, setCategory] = useState(categories[0] || '')
  const [type, setType] = useState('Item')
  const [searchText, setSearchText] = useState('')
  const [isNewCategory, setIsNewCategory] = useState(false)

  // リアルタイムバリデーション
  const validationErrors = useMemo(() => {
    const errors = {}

    // 名前の検証（XSS対策込み）
    const nameValidation = validateName(name, LIMITS.EQUIPMENT_NAME_MAX)
    if (!nameValidation.valid) {
      errors.name = nameValidation.error
    } else if (name.length > 0) {
      // 文字数カウンター用のメッセージ（エラーではない）
      if (name.length > LIMITS.EQUIPMENT_NAME_MAX * 0.9) {
        errors.name = `装備名は${LIMITS.EQUIPMENT_NAME_MAX}文字以内で入力してください (現在: ${name.length}文字)`
      }
    }

    // カテゴリの検証（XSS対策込み）
    const categoryValidation = validateName(category, LIMITS.CATEGORY_NAME_MAX)
    if (!categoryValidation.valid) {
      errors.category = categoryValidation.error
    } else if (category.length > 0) {
      // 文字数カウンター用のメッセージ（エラーではない）
      if (category.length > LIMITS.CATEGORY_NAME_MAX * 0.9) {
        errors.category = `カテゴリは${LIMITS.CATEGORY_NAME_MAX}文字以内で入力してください (現在: ${category.length}文字)`
      }
    }

    return errors
  }, [name, category])

  // 同名チェック（警告）
  const nameWarning = useMemo(() => {
    if (name.trim() !== '' && !validationErrors.name) {
      const isUnique = validateUniqueName(name, equipments)
      if (!isUnique) {
        return '同じ名前の装備が既に存在します'
      }
    }
    return null
  }, [name, equipments, validationErrors.name])

  // フォームが有効かどうか
  const isFormValid = Object.keys(validationErrors).length === 0 && name.trim() !== '' && category.trim() !== ''

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isFormValid) return
    onSave({ name, categoryId: category, type, order: getNextOrder() })
    setName('') // 連続追加しやすくするためクリア
  }

  const filteredEquipments = equipments.filter(e =>
    e.name.includes(searchText) || getCategoryName(e.categoryId).includes(searchText)
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
            <label className="block text-xs font-medium text-slate-500 mb-1">
              装備名
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
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-500">
                カテゴリ
                {category && <span className="ml-1 text-[10px] text-slate-400">({category.length}/{LIMITS.CATEGORY_NAME_MAX})</span>}
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsNewCategory(!isNewCategory)
                  if (!isNewCategory) setCategory('')
                  else setCategory(categories[0] || '')
                }}
                className="text-[10px] text-blue-600 hover:text-blue-700 underline"
              >
                {isNewCategory ? '既存から選択' : '新規作成'}
              </button>
            </div>
            {isNewCategory ? (
              <input
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  validationErrors.category ? 'border-red-500' : ''
                }`}
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="新しいカテゴリ名を入力"
                required
              />
            ) : (
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
            )}
            <ValidationErrorDisplay error={validationErrors.category} />
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
            <p className="mt-1 text-[10px] text-slate-500">
              ℹ️ 個別装備: 具体的な装備名（例: 25mm単装機銃）/ カテゴリ代表: カテゴリ全体を指す（例: 機銃）
            </p>
          </div>
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${
              isFormValid
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
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
                  <span>{getCategoryName(eq.categoryId)}</span>
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
