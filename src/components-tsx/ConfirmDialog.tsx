import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../utils-ts';

type Variant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: Variant;
}

const variantStyles: Record<Variant, { icon: string; button: string }> = {
    danger: {
        icon: 'text-red-500',
        button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
        icon: 'text-yellow-500',
        button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
        icon: 'text-blue-500',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
};

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = '削除',
    cancelText = 'キャンセル',
    onConfirm,
    onCancel,
    variant = 'danger',
}: ConfirmDialogProps) {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        cancelButtonRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
            else if (e.key === 'Enter') onConfirm();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onConfirm, onCancel]);

    if (!isOpen) return null;

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className={cn('w-6 h-6', styles.icon)} />
                        <h3 className="font-bold text-lg text-slate-800">
                            {title}
                        </h3>
                    </div>
                    <p className="text-slate-600 text-sm whitespace-pre-line mb-6">
                        {message}
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button
                            ref={cancelButtonRef}
                            onClick={onCancel}
                            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={cn(
                                'px-4 py-2 rounded-lg font-medium transition-colors',
                                styles.button,
                            )}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
