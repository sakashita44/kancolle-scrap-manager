import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    LIMITS,
    REQUIREMENT_KIND,
    type MissionFormValues,
    type PersistedMission,
} from '../schema';
import { missionFormSchema } from '../schema';
import {
    useStore,
    selectAllMissions,
    selectRequirementOptions,
} from '../store';

interface UseMissionFormOptions {
    editingMission: PersistedMission | null;
    onSave: (formData: MissionFormValues, editingId?: string) => void;
}

export function useMissionForm({
    editingMission,
    onSave,
}: UseMissionFormOptions) {
    const allMissions = useStore(selectAllMissions);
    const requirementOptions = useStore(selectRequirementOptions);
    const isEditMode = editingMission !== null;

    const initializedRef = useRef(false);

    // 最初のオプション
    const firstOption = requirementOptions[0];

    const {
        register,
        control,
        handleSubmit,
        watch,
        trigger,
        reset,
        setValue,
        formState: { errors },
    } = useForm<MissionFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(missionFormSchema) as any,
        mode: 'onChange',
        defaultValues: {
            name: editingMission?.name || '',
            period: editingMission?.period || 'Weekly',
            reqs:
                editingMission?.reqs && editingMission.reqs.length > 0
                    ? editingMission.reqs.map((req) => ({
                          kind: req.kind,
                          id: req.id,
                          count: req.count,
                      }))
                    : [
                          {
                              kind:
                                  firstOption?.kind ||
                                  REQUIREMENT_KIND.EQUIPMENT,
                              id: firstOption?.id || '',
                              count: 1,
                          },
                      ],
        },
    });

    // 装備ロード遅延時の初期値追従
    useEffect(() => {
        if (initializedRef.current) return;
        if (isEditMode) {
            initializedRef.current = true;
            return;
        }
        const currentReqs = watch('reqs');
        if (requirementOptions.length > 0 && currentReqs?.[0]?.id === '') {
            const currentValues = watch();
            reset({
                name: currentValues.name,
                period: currentValues.period,
                reqs: [
                    {
                        kind: requirementOptions[0]
                            .kind as MissionFormValues['reqs'][0]['kind'],
                        id: requirementOptions[0].id,
                        count: 1,
                    },
                ],
            });
            initializedRef.current = true;
        } else if (requirementOptions.length > 0) {
            initializedRef.current = true;
        }
    }, [requirementOptions, isEditMode, reset, watch]);

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'reqs',
        keyName: 'fieldId',
    });

    const watchedValues = watch();

    // 任務名の重複チェック
    const nameDuplicateError = useMemo(() => {
        const name = watchedValues.name;
        if (!name || name.trim() === '') return null;

        const missionsToCheck = isEditMode
            ? allMissions.filter((m) => m.id !== editingMission!.id)
            : allMissions;
        const isDuplicate = missionsToCheck.some((m) => m.name === name.trim());
        return isDuplicate ? '同じ名前の任務が既に存在します' : null;
    }, [watchedValues.name, allMissions, isEditMode, editingMission]);

    // 要求装備の選択肢をグループ化（optgroup用）
    const groupedOptions = useMemo(() => {
        const groups = new Map<string, typeof requirementOptions>();
        for (const opt of requirementOptions) {
            if (!groups.has(opt.group)) {
                groups.set(opt.group, []);
            }
            groups.get(opt.group)!.push(opt);
        }
        return groups;
    }, [requirementOptions]);

    const hasZodErrors = Object.keys(errors).length > 0;
    const isFormValid =
        !hasZodErrors &&
        !nameDuplicateError &&
        watchedValues.name?.trim() !== '' &&
        fields.length > 0;

    // 要求装備の選択変更ハンドラ
    const handleRequirementChange = useCallback(
        (index: number, compositeValue: string) => {
            const separatorIndex = compositeValue.indexOf(':');
            if (separatorIndex === -1) return;
            const kind = compositeValue.slice(0, separatorIndex);
            const id = compositeValue.slice(separatorIndex + 1);
            setValue(
                `reqs.${index}.kind` as const,
                kind as MissionFormValues['reqs'][0]['kind'],
            );
            setValue(`reqs.${index}.id` as const, id);
            setTimeout(() => trigger('reqs'), 0);
        },
        [setValue, trigger],
    );

    const addReq = useCallback(() => {
        if (fields.length < LIMITS.REQUIREMENTS_PER_MISSION_MAX) {
            append({
                kind: firstOption?.kind || REQUIREMENT_KIND.EQUIPMENT,
                id: firstOption?.id || '',
                count: 1,
            });
            setTimeout(() => trigger('reqs'), 0);
        }
    }, [fields.length, append, firstOption, trigger]);

    const removeReq = useCallback(
        (index: number) => {
            if (fields.length > 1) {
                remove(index);
                setTimeout(() => trigger('reqs'), 0);
            }
        },
        [fields.length, remove, trigger],
    );

    const onFormSubmit: SubmitHandler<MissionFormValues> = useCallback(
        (data) => {
            if (nameDuplicateError) return;
            onSave(data, isEditMode ? editingMission!.id : undefined);
        },
        [nameDuplicateError, onSave, isEditMode, editingMission],
    );

    const nameError = errors.name?.message || nameDuplicateError;
    const reqsError = errors.reqs?.message || errors.reqs?.root?.message;

    return {
        register,
        handleSubmit,
        fields,
        errors,
        trigger,
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
    };
}
