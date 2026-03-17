import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, ChevronDown } from 'lucide-react';
import {
    equipmentFormSchema,
    categoryFormSchema,
    type EquipmentFormValues,
    type CategoryFormValues,
} from '../../schema';
import { cn } from '../../utils';
import {
    useStore,
    selectAllCategories,
    selectAllEquipments,
} from '../../store';
import EquipmentForm from './EquipmentForm';
import CategoryForm from './CategoryForm';
import EquipmentList from './EquipmentList';

interface EquipmentManagerProps {
    onDeleteEquipment: (id: string) => void;
    onDeleteCategory: (categoryId: string) => void;
}

export default function EquipmentManager({
    onDeleteEquipment,
    onDeleteCategory,
}: EquipmentManagerProps) {
    const categories = useStore(selectAllCategories);
    const equipments = useStore(selectAllEquipments);
    const addUserCategory = useStore((s) => s.addUserCategory);
    const addUserEquipment = useStore((s) => s.addUserEquipment);
    const swapUserEquipmentOrder = useStore((s) => s.swapUserEquipmentOrder);
    const swapUserCategoryOrder = useStore((s) => s.swapUserCategoryOrder);

    const [mode, setMode] = useState<'equipment' | 'category'>('equipment');
    const [isAddFormExpanded, setIsAddFormExpanded] = useState(true);

    const isEquipmentMode = mode === 'equipment';

    // react-hook-form（モードでスキーマ切り替え）
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<EquipmentFormValues | CategoryFormValues>({
        resolver: zodResolver(
            isEquipmentMode ? equipmentFormSchema : categoryFormSchema,
        ),
        mode: 'onChange',
        defaultValues: isEquipmentMode
            ? { name: '', categoryId: categories[0]?.id || '' }
            : { name: '' },
    });

    useEffect(() => {
        reset(
            isEquipmentMode
                ? { name: '', categoryId: categories[0]?.id || '' }
                : { name: '' },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, reset]);

    const watchedValues = watch();

    // 名前の重複チェック
    const nameDuplicateError = useMemo(() => {
        const name = watchedValues.name;
        if (!name || name.trim() === '') return null;

        if (isEquipmentMode) {
            const isDuplicate = equipments.some((e) => e.name === name.trim());
            return isDuplicate ? '同じ名前の装備が既に存在します' : null;
        } else {
            const isDuplicate = categories.some((c) => c.name === name.trim());
            return isDuplicate ? '同じ名前のカテゴリが既に存在します' : null;
        }
    }, [watchedValues.name, isEquipmentMode, equipments, categories]);

    const hasZodErrors = Object.keys(errors).length > 0;
    const isFormValid =
        !hasZodErrors &&
        !nameDuplicateError &&
        watchedValues.name?.trim() !== '';

    const onSubmit = (data: EquipmentFormValues | CategoryFormValues) => {
        if (nameDuplicateError) return;

        if (isEquipmentMode && 'categoryId' in data) {
            addUserEquipment(data.name, data.categoryId);
            reset({ name: '', categoryId: data.categoryId });
        } else {
            addUserCategory(data.name);
            reset({ name: '' });
        }
    };

    const nameError = errors.name?.message || nameDuplicateError;

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <button
                    type="button"
                    onClick={() => setIsAddFormExpanded(!isAddFormExpanded)}
                    className="w-full text-left mb-3 flex items-center justify-between hover:text-blue-600 transition-colors"
                >
                    <h4 className="text-sm font-bold text-slate-700 flex items-center">
                        <Plus className="w-4 h-4 mr-1" /> 新規登録
                    </h4>
                    <ChevronDown
                        className={cn(
                            'w-4 h-4 text-slate-500 transition-transform',
                            !isAddFormExpanded && '-rotate-90',
                        )}
                    />
                </button>
                {isAddFormExpanded && (
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <fieldset>
                            <legend className="block text-xs font-medium text-slate-500 mb-2">
                                追加モード
                            </legend>
                            <div className="flex gap-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="mode"
                                        value="equipment"
                                        checked={isEquipmentMode}
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
                                        checked={!isEquipmentMode}
                                        onChange={() => setMode('category')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">
                                        カテゴリを追加
                                    </span>
                                </label>
                            </div>
                        </fieldset>

                        {isEquipmentMode ? (
                            <EquipmentForm
                                register={
                                    register as unknown as Parameters<
                                        typeof EquipmentForm
                                    >[0]['register']
                                }
                                watchedName={watchedValues.name || ''}
                                nameError={nameError}
                                categoryError={
                                    'categoryId' in errors
                                        ? (
                                              errors as {
                                                  categoryId?: {
                                                      message?: string;
                                                  };
                                              }
                                          ).categoryId?.message
                                        : undefined
                                }
                                categories={categories}
                            />
                        ) : (
                            <CategoryForm
                                register={
                                    register as unknown as Parameters<
                                        typeof CategoryForm
                                    >[0]['register']
                                }
                                watchedName={watchedValues.name || ''}
                                nameError={nameError}
                            />
                        )}

                        <button
                            type="submit"
                            disabled={!isFormValid}
                            className={cn(
                                'w-full py-2 rounded-lg font-bold text-sm transition-colors',
                                isFormValid
                                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed',
                            )}
                        >
                            {isEquipmentMode
                                ? 'リストに追加'
                                : 'カテゴリを追加'}
                        </button>
                    </form>
                )}
            </div>

            <EquipmentList
                equipments={equipments}
                categories={categories}
                isAddFormExpanded={isAddFormExpanded}
                onSwapOrder={swapUserEquipmentOrder}
                onSwapCategoryOrder={swapUserCategoryOrder}
                onDelete={onDeleteEquipment}
                onDeleteCategory={onDeleteCategory}
            />
        </div>
    );
}
