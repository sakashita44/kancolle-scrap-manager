import { AlertCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { ERROR_TYPE } from '../hooks/useErrorHandler';

/**
 * エラー表示コンポーネント
 * エラーハンドラーで管理されるエラーを種別ごとに表示
 * @param {Object} props
 * @param {Array} props.errors - エラー配列
 * @param {Function} props.onClear - エラークリア関数
 */
const ErrorDisplay = ({ errors, onClear }) => {
  if (errors.length === 0) return null;

  // エラー種別ごとのスタイルとアイコン
  const getErrorStyle = (type) => {
    switch (type) {
      case ERROR_TYPE.CRITICAL:
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-800',
          icon: 'text-red-600',
          label: '致命的エラー',
          IconComponent: XCircle,
        };
      case ERROR_TYPE.ERROR:
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          text: 'text-orange-800',
          icon: 'text-orange-600',
          label: 'エラー',
          IconComponent: AlertCircle,
        };
      case ERROR_TYPE.WARNING:
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          label: '警告',
          IconComponent: AlertTriangle,
        };
      case ERROR_TYPE.INFO:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          label: '情報',
          IconComponent: Info,
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          label: 'メッセージ',
          IconComponent: Info,
        };
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-2 space-y-2">
      {errors.map((error) => {
        const style = getErrorStyle(error.type);
        const IconComponent = style.IconComponent;

        return (
          <div
            key={error.id}
            className={`${style.bg} ${style.border} border-l-4 p-4`}
          >
            <div className="flex items-start">
              <IconComponent
                className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`}
              />
              <div className={`ml-3 flex-1 ${style.text}`}>
                <p className="text-sm font-bold">{style.label}</p>
                <p className="text-sm mt-1">{error.message}</p>
              </div>
              <button
                onClick={() => onClear(error.id)}
                className={`ml-3 flex-shrink-0 ${style.text} hover:${style.icon} transition-colors`}
                title="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ErrorDisplay;
