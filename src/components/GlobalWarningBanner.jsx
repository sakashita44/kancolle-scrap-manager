import { useState, useMemo, useEffect, useRef } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { useErrorHandler } from '../contexts/ErrorContext'
import { cn } from '../utils'

/**
 * グローバル警告バナーコンポーネント
 * 破損データ検出時やエラー発生時に警告を表示
 * @param {Object} props
 * @param {string[]} props.tags - ErrorContextから取得するエラーのタグ配列
 * @param {string} props.type - バナータイプ ('critical' | 'error' | 'warning' | 'info')
 * @param {string} props.customMessage - カスタムメッセージ（破損データがない場合）
 */
const GlobalWarningBanner = ({
  tags = [],
  type = 'warning',
  customMessage = null
}) => {
  const [dismissed, setDismissed] = useState(false)
  const { getErrorsByTag } = useErrorHandler()

  const normalizedTags = useMemo(() => {
    const list = Array.isArray(tags) ? tags : []
    return [...new Set(list.filter(Boolean))]
  }, [tags])

  // ErrorContextからエラーを取得して加工
  const { corruptedEquipments, corruptedMissions, genericErrors } = useMemo(() => {
    const equipmentErrors = normalizedTags.includes('corrupted-equipments')
      ? getErrorsByTag('corrupted-equipments')
      : []
    const missionErrors = normalizedTags.includes('corrupted-missions')
      ? getErrorsByTag('corrupted-missions')
      : []

    const messageTags = normalizedTags.filter((t) => t !== 'corrupted-equipments' && t !== 'corrupted-missions')
    const messageErrors = messageTags.flatMap((t) => getErrorsByTag(t))

    return {
      corruptedEquipments: equipmentErrors.map((err) => ({
        name: err.context.item?.name,
        id: err.context.item?.id,
        reason: err.message.split(': ')[1] || err.message
      })),
      corruptedMissions: missionErrors.map((err) => ({
        name: err.context.item?.name,
        id: err.context.item?.id,
        reason: err.message.split(': ')[1] || err.message
      })),
      genericErrors: messageErrors.map((err) => err.message)
    }
  }, [normalizedTags, getErrorsByTag])

  // 表示するかどうか
  const hasCorruptedData = corruptedEquipments.length > 0 || corruptedMissions.length > 0
  const hasGenericErrors = genericErrors.length > 0

  // エラー内容のフィンガープリントを計算（件数だけでなく内容の変化も検出）
  const errorFingerprint = useMemo(() => {
    const parts = [
      ...corruptedEquipments.map(e => `eq:${e.id}:${e.reason}`),
      ...corruptedMissions.map(e => `ms:${e.id}:${e.reason}`),
      ...genericErrors
    ]
    return parts.join('|')
  }, [corruptedEquipments, corruptedMissions, genericErrors])

  // エラー内容が変化したらdismissedをリセット（新しいエラーを表示するため）
  const prevFingerprintRef = useRef(errorFingerprint)
  useEffect(() => {
    // 空→空の変化は無視、それ以外で内容が変わったらリセット
    if (errorFingerprint !== prevFingerprintRef.current && errorFingerprint !== '') {
      setDismissed(false)
    }
    prevFingerprintRef.current = errorFingerprint
  }, [errorFingerprint])

  const shouldShow = !dismissed && (hasCorruptedData || hasGenericErrors || customMessage)

  if (!shouldShow) return null

  // タイプに応じたスタイル
  const typeStyles = {
    critical: {
      bg: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-900',
      icon: 'text-red-700',
      iconHover: 'hover:text-red-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-800',
      icon: 'text-red-600',
      iconHover: 'hover:text-red-600'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-800',
      icon: 'text-amber-600',
      iconHover: 'hover:text-amber-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      iconHover: 'hover:text-blue-600'
    }
  }

  // CRITICALタイプはdismiss不可
  const isDismissable = type !== 'critical'

  const style = typeStyles[type] || typeStyles.warning

  // 表示内容を決定
  const renderContent = () => {
    // customMessageが指定されている場合はそれを優先
    if (customMessage) {
      return <p className="text-sm font-medium">{customMessage}</p>
    }

    // 汎用エラーがある場合
    if (hasGenericErrors) {
      if (genericErrors.length === 1) {
        return <p className="text-sm font-medium">{genericErrors[0]}</p>
      }
      return (
        <ul className="text-sm space-y-1 list-disc ml-4">
          {genericErrors.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      )
    }

    // 破損データがある場合
    if (hasCorruptedData) {
      return (
        <>
          <p className="text-sm font-bold mb-2">
            データ整合性の問題を検出しました
          </p>
          <p className="text-sm mb-2">
            以下のデータを自動的に削除しました:
          </p>
          <ul className="text-xs space-y-1 ml-4 list-disc">
            {corruptedEquipments.map((item, index) => (
              <li key={`eq-${index}`}>
                装備 "{item.name || item.id}": {item.reason}
              </li>
            ))}
            {corruptedMissions.map((item, index) => (
              <li key={`ms-${index}`}>
                任務 "{item.name || item.id}": {item.reason}
              </li>
            ))}
          </ul>
          <p className="text-sm mt-2">
            正常なデータのみで動作しています.
          </p>
        </>
      )
    }

    return null
  }

  return (
    <div className={cn(style.bg, style.border, 'border-l-4 p-4')}>
      <div className="flex items-start">
        <AlertCircle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.icon)} />
        <div className={cn('ml-3 flex-1', style.text)}>
          {renderContent()}
        </div>
        {isDismissable && (
          <button
            onClick={() => setDismissed(true)}
            className={cn('ml-3 flex-shrink-0 transition-colors', style.text, style.iconHover)}
            title="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default GlobalWarningBanner
