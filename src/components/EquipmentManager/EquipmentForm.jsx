import { LIMITS } from '../../types/schema'
import { ValidationErrorDisplay } from '../'
import { cn } from '../../utils'

/**
 * 装備追加フォーム
 * @param {Object} props
 * @param {Function} props.register - react-hook-formのregister関数
 * @param {string} props.watchedName - 監視中の名前フィールド値
 * @param {string|null} props.nameError - 名前フィールドのエラーメッセージ
 * @param {string|null} props.categoryError - カテゴリフィールドのエラーメッセージ
 * @param {Array<string>} props.categories - カテゴリIDリスト
 * @param {Function} props.getCategoryName - カテゴリIDから名前を取得する関数
 */
const EquipmentForm = ({
  register,
  watchedName,
  nameError,
  categoryError,
  categories,
  getCategoryName,
}) => {
  const maxLength = LIMITS.EQUIPMENT_NAME_MAX

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          装備名 *
          {watchedName && (
            <span className="ml-1 text-[10px] text-slate-400">
              ({watchedName.length}/{maxLength})
            </span>
          )}
        </label>
        <input
          {...register('name')}
          autoComplete="off"
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm',
            nameError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
          )}
          placeholder="例: 12.7cm連装砲B型改二"
        />
        <ValidationErrorDisplay error={nameError} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">カテゴリ *</label>
        <select
          {...register('categoryId')}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm',
            categoryError && 'border-red-500'
          )}
        >
          {categories.map(c => (
            <option key={c} value={c}>{getCategoryName(c)}</option>
          ))}
        </select>
        <ValidationErrorDisplay error={categoryError} />
      </div>
    </>
  )
}

export default EquipmentForm
