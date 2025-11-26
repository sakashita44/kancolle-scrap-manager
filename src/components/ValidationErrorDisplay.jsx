/**
 * バリデーションエラー・警告表示コンポーネント
 * フォームのエラーと警告を統一的に表示
 * @module components/ValidationErrorDisplay
 */

import { AlertCircle } from 'lucide-react'

/**
 * バリデーションエラー・警告を表示する共通コンポーネント
 * @param {Object} props
 * @param {string|null} props.error - エラーメッセージ（赤色表示）
 * @param {string|null} props.warning - 警告メッセージ（黄色表示）
 * @returns {JSX.Element|null}
 */
export default function ValidationErrorDisplay({ error, warning }) {
  if (error) {
    return (
      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )
  }

  if (warning) {
    return (
      <p className="mt-1 text-xs text-amber-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {warning}
      </p>
    )
  }

  return null
}
