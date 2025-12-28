/**
 * useDestructiveOperations - 破壊的操作（削除, リセット）の統合管理
 *
 * UIは「requestXxx」を呼ぶだけで、確認ダイアログ表示〜実行〜エラー通知を一括処理。
 * 確認文言生成、実行手順、失敗時通知を1箇所に集約する。
 *
 * @module hooks/useDestructiveOperations
 */

import { useCallback } from 'react'
import { useData } from '../contexts/DataContext'
import { useSelection } from '../contexts/SelectionContext'
import { useUI, CONFIRM_DIALOG_TYPE, buildCategoryDeletionMessage } from '../contexts/UIContext'
import { useErrorHandler, ERROR_TYPE } from '../contexts/ErrorContext'
import {
  analyzeCategoryDeletionImpact,
  calculateCategoryDeletionResult
} from '../domain/categoryOperations'
import { saveUserEquipments, clearAllData } from '../utils/localStorage'

/**
 * 破壊的操作を統合管理するカスタムフック
 * @returns {Object} 破壊的操作のリクエスト関数群
 */
export function useDestructiveOperations() {
  const {
    userEquipments,
    getCategoryName,
    deleteUserEquipment,
    deleteUserCategory,
    setUserEquipments,
    allMissions,
    deleteUserMission,
  } = useData()

  const { isSelected, toggleMission } = useSelection()
  const { openConfirmDialog } = useUI()
  const { syncErrors } = useErrorHandler()

  /**
   * 装備削除をリクエスト
   * @param {string} id - 削除対象の装備ID
   */
  const requestDeleteEquipment = useCallback((id) => {
    const message = 'この装備を削除しますか？\n（この装備を使用している任務がある場合、表示がおかしくなる可能性があります）'
    const onConfirm = () => {
      deleteUserEquipment(id)
    }
    openConfirmDialog(CONFIRM_DIALOG_TYPE.EQUIPMENT, id, message, onConfirm)
  }, [deleteUserEquipment, openConfirmDialog])

  /**
   * カテゴリ削除をリクエスト（カスケード削除）
   * @param {string} categoryId - 削除対象のカテゴリID
   */
  const requestDeleteCategory = useCallback((categoryId) => {
    const impact = analyzeCategoryDeletionImpact(categoryId, userEquipments, allMissions, getCategoryName)
    const message = buildCategoryDeletionMessage(impact)
    const onConfirm = () => {
      // 装備を先に削除してからカテゴリを削除
      const { remainingEquipments } = calculateCategoryDeletionResult(categoryId, userEquipments)
      setUserEquipments(remainingEquipments)
      saveUserEquipments(remainingEquipments)
      deleteUserCategory(categoryId)
    }
    openConfirmDialog(CONFIRM_DIALOG_TYPE.CATEGORY, categoryId, message, onConfirm)
  }, [userEquipments, allMissions, getCategoryName, setUserEquipments, deleteUserCategory, openConfirmDialog])

  /**
   * 任務削除をリクエスト
   * @param {string} id - 削除対象の任務ID
   */
  const requestDeleteMission = useCallback((id) => {
    const message = 'この任務を削除しますか？'
    const onConfirm = () => {
      // 選択中の任務を削除する場合は、先に選択解除
      if (isSelected(id)) {
        toggleMission(id)
      }
      deleteUserMission(id)
    }
    openConfirmDialog(CONFIRM_DIALOG_TYPE.MISSION, id, message, onConfirm)
  }, [isSelected, toggleMission, deleteUserMission, openConfirmDialog])

  /**
   * 全データリセットをリクエスト
   */
  const requestDataReset = useCallback(() => {
    const message = '本当に全てのユーザーデータを削除しますか？この操作は取り消せません。'
    const onConfirm = () => {
      const success = clearAllData()
      if (success) {
        window.location.reload()
      } else {
        // エラー時はErrorContext経由で通知
        syncErrors('data-reset-error', [{
          type: ERROR_TYPE.ERROR,
          message: 'データの削除に失敗しました',
          context: { source: 'data-reset' }
        }])
      }
    }
    openConfirmDialog(CONFIRM_DIALOG_TYPE.DATA_RESET, null, message, onConfirm)
  }, [openConfirmDialog, syncErrors])

  return {
    requestDeleteEquipment,
    requestDeleteCategory,
    requestDeleteMission,
    requestDataReset,
  }
}
