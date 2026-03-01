import { AlertCircle } from 'lucide-react';

interface Props {
    error?: string | null;
    warning?: string | null;
}

export default function ValidationErrorDisplay({ error, warning }: Props) {
    if (error) {
        return (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
            </p>
        );
    }
    if (warning) {
        return (
            <p className="mt-1 text-xs text-amber-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {warning}
            </p>
        );
    }
    return null;
}
