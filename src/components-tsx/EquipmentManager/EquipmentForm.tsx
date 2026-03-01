import type { UseFormRegister } from 'react-hook-form';
import { LIMITS } from '../../schema';
import type { Category } from '../../schema';
import ValidationErrorDisplay from '../ValidationErrorDisplay';
import { cn } from '../../utils-ts';

interface EquipmentFormProps {
    register: UseFormRegister<{ name: string; categoryId: string }>;
    watchedName: string;
    nameError?: string | null;
    categoryError?: string | null;
    categories: Category[];
}

export default function EquipmentForm({
    register,
    watchedName,
    nameError,
    categoryError,
    categories,
}: EquipmentFormProps) {
    const maxLength = LIMITS.EQUIPMENT_NAME_MAX;

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
                        nameError
                            ? 'border-red-500 focus:ring-red-500'
                            : 'focus:ring-blue-500',
                    )}
                    placeholder="例: 12.7cm連装砲B型改二"
                />
                <ValidationErrorDisplay error={nameError} />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                    カテゴリ *
                </label>
                <select
                    {...register('categoryId')}
                    className={cn(
                        'w-full px-3 py-2 border rounded-lg text-sm',
                        categoryError && 'border-red-500',
                    )}
                >
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <ValidationErrorDisplay error={categoryError} />
            </div>
        </>
    );
}
