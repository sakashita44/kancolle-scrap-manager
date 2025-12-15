import { useState, useMemo } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { useErrorHandler } from '../contexts/ErrorContext'

/**
 * グローバル警告バナーコンポーネント
 * 破損データ検出時やマスタデータフェッチ失敗時に警告を表示
 * @param {Object} props
 * @param {string} props.tag - ErrorContextから取得するエラーのタグ
 * @param {string} props.type - バナータイプ ('warning' | 'error' | 'info')
 * @param {string} props.customMessage - カスタムメッセージ（破損データがない場合）
 */
const GlobalWarningBanner = ({
  tag = null,
  type = 'warning',
  customMessage = null
}) => {
  const [dismissed, setDismissed] = useState(false)
  const { getErrorsByTag } = useErrorHandler()

  // ErrorContextからエラーを取得して加工
  const { corruptedEquipments, corruptedMissions, message } = useMemo(() => {
    if (tag === 'corrupted-data') {
      const equipmentErrors = getErrorsByTag('corrupted-equipments')
      const missionErrors = getErrorsByTag('corrupted-missions')
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
        message: null
      }
    } else if (tag) {
      // その他のタグ（alpha-infoなど）の場合
      const errors = getErrorsByTag(tag)
      return {
        corruptedEquipments: [],
        corruptedMissions: [],
        message: errors.length > 0 ? errors[0].message : null
      }
    }
    return { corruptedEquipments: [], corruptedMissions: [], message: null }
  }, [tag, getErrorsByTag])

  // customMessageが指定されている場合はそちらを優先
  const displayMessage = customMessage || message

  // 表示するかどうか
  const hasCorruptedData = corruptedEquipments.length > 0 || corruptedMissions.length > 0
  const shouldShow = !dismissed && (hasCorruptedData || displayMessage)

  if (!shouldShow) return null

  // タイプに応じたスタイル
  const typeStyles = {
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-800',
      icon: 'text-amber-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-800',
      icon: 'text-red-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    }
  }

  const style = typeStyles[type] || typeStyles.warning

  return (
    <div className={`${style.bg} ${style.border} border-l-4 p-4`}>
      <div className="flex items-start">
        <AlertCircle className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
        <div className={`ml-3 flex-1 ${style.text}`}>
          {displayMessage ? (
            <p className="text-sm font-medium">{displayMessage}</p>
          ) : (
            <>
              <p className="text-sm font-bold mb-2">
                ⚠️ データ整合性の問題を検出しました
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
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={`ml-3 flex-shrink-0 ${style.text} hover:${style.icon} transition-colors`}
          title="閉じる"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default GlobalWarningBanner
