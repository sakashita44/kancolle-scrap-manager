import type { UseFormRegister } from 'react-hook-form';
import { LIMITS } from '../../schema';
import ValidationErrorDisplay from '../ValidationErrorDisplay';
import { cn } from '../../utils';

interface CategoryFormProps {
    register: UseFormRegister<{ name: string }>;
    watchedName: string;
    nameError?: string | null;
}

export default function CategoryForm({
    register,
    watchedName,
    nameError,
}: CategoryFormProps) {
    const maxLength = LIMITS.CATEGORY_NAME_MAX;

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
                    nameError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'focus:ring-blue-500',
                )}
                placeholder="例: カスタムカテゴリA"
            />
            <ValidationErrorDisplay error={nameError} />
        </div>
    );
}
