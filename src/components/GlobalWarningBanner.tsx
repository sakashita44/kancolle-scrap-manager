import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '../utils';
import { type NoticeType } from '../schema';

type BannerType = NoticeType;

interface GlobalWarningBannerProps {
    messages: string[];
    type?: BannerType;
}

const typeStyles: Record<
    BannerType,
    {
        bg: string;
        border: string;
        text: string;
        icon: string;
        iconHover: string;
    }
> = {
    critical: {
        bg: 'bg-red-100',
        border: 'border-red-500',
        text: 'text-red-900',
        icon: 'text-red-700',
        iconHover: 'hover:text-red-700',
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-800',
        icon: 'text-red-600',
        iconHover: 'hover:text-red-600',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-800',
        icon: 'text-amber-600',
        iconHover: 'hover:text-amber-600',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-800',
        icon: 'text-blue-600',
        iconHover: 'hover:text-blue-600',
    },
};

export default function GlobalWarningBanner({
    messages,
    type = 'warning',
}: GlobalWarningBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    const messageFingerprint = useMemo(() => messages.join('\n'), [messages]);
    const previousFingerprintRef = useRef(messageFingerprint);

    useEffect(() => {
        if (
            messageFingerprint !== previousFingerprintRef.current &&
            messageFingerprint !== ''
        ) {
            setDismissed(false);
        }
        previousFingerprintRef.current = messageFingerprint;
    }, [messageFingerprint]);

    if (dismissed || messages.length === 0) return null;

    const isDismissable = type !== 'critical';
    const style = typeStyles[type];

    return (
        <div className={cn(style.bg, style.border, 'border-l-4 p-4')}>
            <div className="flex items-start">
                <AlertCircle
                    className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.icon)}
                />
                <div className={cn('ml-3 flex-1', style.text)}>
                    {messages.length === 1 ? (
                        <p className="text-sm font-medium">{messages[0]}</p>
                    ) : (
                        <ul className="text-sm space-y-1 list-disc ml-4">
                            {messages.map((msg, i) => (
                                <li key={i}>{msg}</li>
                            ))}
                        </ul>
                    )}
                </div>
                {isDismissable && (
                    <button
                        onClick={() => setDismissed(true)}
                        className={cn(
                            'ml-3 flex-shrink-0 transition-colors',
                            style.text,
                            style.iconHover,
                        )}
                        title="閉じる"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
