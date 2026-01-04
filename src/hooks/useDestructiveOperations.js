/**
 * useDestructiveOperations - 破壊的操作（削除, リセット）の統合管理
 *
 * UIは「requestXxx」を呼ぶだけで確認ダイアログを表示.
 * 確認押下時はexecuteConfirmedActionで最新stateから実行内容を組み立てる.
 * （古いclosureリスクを回避）
 *
 * @module hooks/useDestructiveOperations
 */

import { useCallback } from 'react'
import { useData } from '../contexts/DataContext'
import { useSelection } from '../contexts/SelectionContext'
import { useUI, CONFIRM_DIALOG_TYPE, buildCategoryDeletionMessage } from '../contexts/UIContext'
import { useErrorHandler, ERROR_TYPE } from '../contexts/ErrorContext'
import { analyzeCategoryDeletionImpact, calculateCategoryDeletionResult } from '../domain'
import { saveUserEquipments, clearAllData } from '../utils'

/**
 * 破壊的操作を統合管理するカスタムフック
 * @returns {Object} 破壊的操作のリクエスト関数群とexecuteConfirmedAction
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
  const { openConfirmDialog, closeConfirmDialog, confirmDialog } = useUI()
  const { syncErrors } = useErrorHandler()

  /**
   * 装備削除をリクエスト
   * @param {string} id - 削除対象の装備ID
   */
  const requestDeleteEquipment = useCallback((id) => {
    const message = 'この装備を削除しますか？\n（この装備を使用している任務がある場合、表示がおかしくなる可能性があります）'
    openConfirmDialog(CONFIRM_DIALOG_TYPE.EQUIPMENT, id, message)
  }, [openConfirmDialog])

  /**
   * カテゴリ削除をリクエスト（カスケード削除）
   * @param {string} categoryId - 削除対象のカテゴリID
   */
  const requestDeleteCategory = useCallback((categoryId) => {
    const impact = analyzeCategoryDeletionImpact(categoryId, userEquipments, allMissions, getCategoryName)
    const message = buildCategoryDeletionMessage(impact)
    openConfirmDialog(CONFIRM_DIALOG_TYPE.CATEGORY, categoryId, message)
  }, [userEquipments, allMissions, getCategoryName, openConfirmDialog])

  /**
   * 任務削除をリクエスト
   * @param {string} id - 削除対象の任務ID
   */
  const requestDeleteMission = useCallback((id) => {
    const message = 'この任務を削除しますか？'
    openConfirmDialog(CONFIRM_DIALOG_TYPE.MISSION, id, message)
  }, [openConfirmDialog])

  /**
   * 全データリセットをリクエスト
   */
  const requestDataReset = useCallback(() => {
    const message = '本当に全てのユーザーデータを削除しますか？この操作は取り消せません。'
    openConfirmDialog(CONFIRM_DIALOG_TYPE.DATA_RESET, null, message)
  }, [openConfirmDialog])

  /**
   * 確認ダイアログの確認アクションを実行
   * confirmDialog.type/idから最新stateで実行内容を組み立てる（古いclosureリスク回避）
   * try/finallyでcloseConfirmDialogを保証
   */
  const executeConfirmedAction = useCallback(() => {
    const { type, id } = confirmDialog

    try {
      if (type === CONFIRM_DIALOG_TYPE.EQUIPMENT) {
        deleteUserEquipment(id)
      } else if (type === CONFIRM_DIALOG_TYPE.MISSION) {
        // 選択中の任務を削除する場合は、先に選択解除
        if (isSelected(id)) {
          toggleMission(id)
        }
        deleteUserMission(id)
      } else if (type === CONFIRM_DIALOG_TYPE.CATEGORY) {
        // カテゴリ削除: 装備を先に削除してからカテゴリを削除
        // 最新のuserEquipmentsを使用
        const { remainingEquipments } = calculateCategoryDeletionResult(id, userEquipments)
        setUserEquipments(remainingEquipments)
        saveUserEquipments(remainingEquipments)
        deleteUserCategory(id)
      } else if (type === CONFIRM_DIALOG_TYPE.DATA_RESET) {
        // 全データを削除してリロード
        const success = clearAllData()
        if (success) {
          window.location.reload()
        } else {
          // エラー時はErrorContext経由で通知
          syncErrors('destructive-op-error', [{
            type: ERROR_TYPE.ERROR,
            message: 'データの削除に失敗しました',
            context: { source: 'data-reset' }
          }])
        }
      }
    } finally {
      // 成功/失敗に関わらず必ずダイアログを閉じる
      closeConfirmDialog()
    }
  }, [
    confirmDialog,
    deleteUserEquipment,
    isSelected,
    toggleMission,
    deleteUserMission,
    userEquipments,
    setUserEquipments,
    deleteUserCategory,
    syncErrors,
    closeConfirmDialog
  ])

  return {
    requestDeleteEquipment,
    requestDeleteCategory,
    requestDeleteMission,
    requestDataReset,
    executeConfirmedAction,
  }
}
