import { useState, useCallback } from 'react';

interface ToggleActions {
    toggle: () => void;
    setTrue: () => void;
    setFalse: () => void;
    setValue: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useToggle(initialValue = false): [boolean, ToggleActions] {
    const [value, setValue] = useState(initialValue);

    const toggle = useCallback(() => setValue((v) => !v), []);
    const setTrue = useCallback(() => setValue(true), []);
    const setFalse = useCallback(() => setValue(false), []);

    return [value, { toggle, setTrue, setFalse, setValue }];
}
