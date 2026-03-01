import { Plus, Trash2 } from 'lucide-react';
import {
    PERIOD,
    LIMITS,
    type PersistedMission,
    type MissionFormValues,
} from '../schema';
import ValidationErrorDisplay from './ValidationErrorDisplay';
import { useMissionForm } from '../hooks-ts';
import { cn } from '../utils-ts';

interface MissionModalProps {
    editingMission: PersistedMission | null;
    onSave: (formData: MissionFormValues, editingId?: string) => void;
    onCancel: () => void;
}

export default function MissionModal({
    editingMission = null,
    onSave,
    onCancel,
}: MissionModalProps) {
    const {
        register,
        handleSubmit,
        fields,
        errors,
        watchedValues,
        groupedOptions,
        isFormValid,
        isEditMode,
        nameError,
        reqsError,
        addReq,
        removeReq,
        onFormSubmit,
        handleRequirementChange,
    } = useMissionForm({ editingMission, onSave });

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    任務名
                    {watchedValues.name && (
                        <span className="ml-1 text-[10px] text-slate-400">
                            ({watchedValues.name.length}/
                            {LIMITS.MISSION_NAME_MAX})
                        </span>
                    )}
                </label>
                <input
                    {...register('name')}
                    autoComplete="off"
                    className={cn(
                        'w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none',
                        nameError
                            ? 'border-red-500 focus:ring-red-500'
                            : 'focus:ring-blue-500',
                    )}
                    placeholder="例: (単) 新型兵装の廃棄"
                />
                <ValidationErrorDisplay error={nameError} />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    周期
                </label>
                <select
                    {...register('period')}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    <option value={PERIOD.DAILY}>Daily</option>
                    <option value={PERIOD.WEEKLY}>Weekly</option>
                    <option value={PERIOD.MONTHLY}>Monthly</option>
                    <option value={PERIOD.QUARTERLY}>Quarterly</option>
                    <option value={PERIOD.YEARLY}>Yearly</option>
                    <option value={PERIOD.ONE_TIME}>OneTime</option>
                </select>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-500 mb-2">
                    要求装備 (最大{LIMITS.REQUIREMENTS_PER_MISSION_MAX}枠)
                </p>
                <ValidationErrorDisplay error={reqsError} />
                <div className="space-y-2">
                    {fields.map((field, index) => {
                        const currentKind =
                            watchedValues.reqs?.[index]?.kind || '';
                        const currentId = watchedValues.reqs?.[index]?.id || '';
                        const compositeValue =
                            currentKind && currentId
                                ? `${currentKind}:${currentId}`
                                : '';

                        return (
                            <div key={field.fieldId} className="flex gap-2">
                                {/* hidden fields for react-hook-form */}
                                <input
                                    type="hidden"
                                    {...register(`reqs.${index}.kind` as const)}
                                />
                                <input
                                    type="hidden"
                                    {...register(`reqs.${index}.id` as const)}
                                />
                                <select
                                    value={compositeValue}
                                    onChange={(e) =>
                                        handleRequirementChange(
                                            index,
                                            e.target.value,
                                        )
                                    }
                                    className={cn(
                                        'flex-1 px-2 py-2 border rounded-lg text-sm',
                                        errors.reqs?.[index]?.id &&
                                            'border-red-500',
                                    )}
                                >
                                    {Array.from(groupedOptions.entries()).map(
                                        ([group, opts]) => (
                                            <optgroup key={group} label={group}>
                                                {opts.map((opt) => (
                                                    <option
                                                        key={`${opt.kind}:${opt.id}`}
                                                        value={`${opt.kind}:${opt.id}`}
                                                    >
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ),
                                    )}
                                </select>
                                <input
                                    type="number"
                                    min={LIMITS.REQUIREMENT_COUNT_MIN}
                                    max={LIMITS.REQUIREMENT_COUNT_MAX}
                                    {...register(
                                        `reqs.${index}.count` as const,
                                    )}
                                    className={cn(
                                        'w-20 px-2 py-2 border rounded-lg text-center text-sm',
                                        errors.reqs?.[index]?.count &&
                                            'border-red-500',
                                    )}
                                />
                                {index > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => removeReq(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                        title="削除"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <div className="w-8 flex-shrink-0" />
                                )}
                            </div>
                        );
                    })}
                    <button
                        type="button"
                        onClick={addReq}
                        disabled={
                            fields.length >= LIMITS.REQUIREMENTS_PER_MISSION_MAX
                        }
                        className={cn(
                            'w-full py-2 text-sm rounded-lg flex items-center justify-center gap-1 transition-colors',
                            fields.length >= LIMITS.REQUIREMENTS_PER_MISSION_MAX
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300',
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        装備を追加
                    </button>
                </div>
            </div>
            <div className="flex gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"
                >
                    キャンセル
                </button>
                <button
                    type="submit"
                    disabled={!isFormValid}
                    className={cn(
                        'flex-1 py-2 rounded-lg font-bold transition-colors',
                        isFormValid
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed',
                    )}
                >
                    {isEditMode ? '更新' : '追加'}
                </button>
            </div>
        </form>
    );
}
