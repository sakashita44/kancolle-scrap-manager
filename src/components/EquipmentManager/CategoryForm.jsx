import { LIMITS } from '../../types/schema'
import ValidationErrorDisplay from '../ValidationErrorDisplay'
import { cn } from '../../utils/cn'

/**
 * カテゴリ追加フォーム
 * @param {Object} props
 * @param {Function} props.register - react-hook-formのregister関数
 * @param {string} props.watchedName - 監視中の名前フィールド値
 * @param {string|null} props.nameError - 名前フィールドのエラーメッセージ
 */
const CategoryForm = ({
  register,
  watchedName,
  nameError,
}) => {
  const maxLength = LIMITS.CATEGORY_NAME_MAX

  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        カテゴリ名 *
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
        placeholder="例: カスタムカテゴリA"
      />
      <ValidationErrorDisplay error={nameError} />
      <p className="mt-1 text-[10px] text-slate-500">
        ℹ️ カテゴリ代表装備が自動で作成されます
      </p>
    </div>
  )
}

export default CategoryForm
