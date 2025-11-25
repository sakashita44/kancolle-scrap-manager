import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * 汎用確認ダイアログ
 * @param {Object} props
 * @param {boolean} props.isOpen - 表示状態
 * @param {string} props.title - ダイアログタイトル
 * @param {string} props.message - 確認メッセージ
 * @param {string} [props.confirmText="削除"] - 確認ボタンテキスト
 * @param {string} [props.cancelText="キャンセル"] - キャンセルボタンテキスト
 * @param {Function} props.onConfirm - 確認時のコールバック
 * @param {Function} props.onCancel - キャンセル時のコールバック
 * @param {'danger'|'warning'|'info'} [props.variant='danger'] - ダイアログの種類
 */
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = '削除',
  cancelText = 'キャンセル',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    // キャンセルボタンにフォーカス
    cancelButtonRef.current?.focus()

    // キーボード操作
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter') {
        onConfirm()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onConfirm, onCancel])

  if (!isOpen) return null

  // variantに応じたスタイル設定
  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: 'text-yellow-500',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      icon: 'text-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          {/* アイコンとタイトル */}
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
            <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          </div>

          {/* メッセージ */}
          <p className="text-slate-600 text-sm whitespace-pre-line mb-6">
            {message}
          </p>

          {/* ボタン */}
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
