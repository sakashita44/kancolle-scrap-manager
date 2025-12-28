/**
 * UIContext - UI状態の管理（モーダル, 確認ダイアログ等）
 * App.jsxからUI制御stateを分離し、各コンポーネントがContext参照で状態を操作可能にする
 * @module contexts/UIContext
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const UIContext = createContext(null)

/**
 * モーダルの種類
 * 値にprefixを付けてCONFIRM_DIALOG_TYPEとの誤用を防止
 * @readonly
 * @enum {string}
 */
export const MODAL_TYPE = {
  EQUIPMENT: 'modal:equipment',
  MISSION: 'modal:mission',
}

/**
 * 確認ダイアログの種類
 * 値にprefixを付けてMODAL_TYPEとの誤用を防止
 * @readonly
 * @enum {string}
 */
export const CONFIRM_DIALOG_TYPE = {
  EQUIPMENT: 'confirm:equipment',
  MISSION: 'confirm:mission',
  CATEGORY: 'confirm:category',
  DATA_RESET: 'confirm:data-reset',
}

/**
 * 確認ダイアログの設定マッピング
 * 各タイプに対応するタイトルと確認ボタンテキストを定義
 * @readonly
 */
export const CONFIRM_DIALOG_CONFIG = {
  [CONFIRM_DIALOG_TYPE.EQUIPMENT]: {
    title: '装備の削除',
    confirmText: '削除',
  },
  [CONFIRM_DIALOG_TYPE.MISSION]: {
    title: '任務の削除',
    confirmText: '削除',
  },
  [CONFIRM_DIALOG_TYPE.CATEGORY]: {
    title: 'カテゴリの削除',
    confirmText: '削除',
  },
  [CONFIRM_DIALOG_TYPE.DATA_RESET]: {
    title: 'データの初期化',
    confirmText: '初期化',
  },
}

/**
 * 確認ダイアログの設定を取得
 * 未知のtypeの場合は警告ログを出力しデフォルト値を返す
 * @param {string} type - ダイアログの種類
 * @returns {{ title: string, confirmText: string }}
 */
export function getConfirmDialogConfig(type) {
  const config = CONFIRM_DIALOG_CONFIG[type]
  if (!config) {
    console.warn(`[UIContext] Unknown confirm dialog type: ${type}`)
    return { title: '', confirmText: '確認' }
  }
  return config
}

/**
 * カテゴリ削除確認メッセージを構築（UI文言生成）
 *
 * @param {Object} impact - 影響分析結果
 * @param {Array} impact.affectedEquipments - 影響を受ける装備配列
 * @param {Array} impact.affectedMissions - 影響を受ける任務配列
 * @param {string} impact.categoryName - カテゴリ名
 * @returns {string} 確認メッセージ
 */
export function buildCategoryDeletionMessage(impact) {
  const { affectedEquipments, affectedMissions, categoryName } = impact
  const messageLines = []

  if (affectedEquipments.length > 0) {
    messageLines.push(`⚠️ このカテゴリ「${categoryName}」に含まれる装備：`)
    affectedEquipments.forEach(eq => {
      messageLines.push(`  • ${eq.name}`)
    })
    messageLines.push(`  計${affectedEquipments.length}件が削除されます`)
    messageLines.push('')
  }

  if (affectedMissions.length > 0) {
    messageLines.push(`⚠️ このカテゴリを参照する任務：`)
    affectedMissions.forEach(ms => {
      messageLines.push(`  • ${ms.name}`)
    })
    messageLines.push(`  計${affectedMissions.length}件の任務に影響があります`)
    messageLines.push(`  （任務は削除されません）`)
  }

  if (messageLines.length === 0) {
    messageLines.push(`カテゴリ「${categoryName}」を削除しますか？`)
  }

  return messageLines.join('\n')
}

/**
 * 確認ダイアログの初期状態
 */
const INITIAL_CONFIRM_DIALOG = {
  isOpen: false,
  type: null,
  id: null,
  message: '',
}

/**
 * UIProvider - UI状態管理Provider
 * @param {object} props - プロパティ
 * @param {React.ReactNode} props.children - 子コンポーネント
 */
export function UIProvider({ children }) {
  // モーダル状態
  const [activeModal, setActiveModal] = useState(null)
  const [editingMission, setEditingMission] = useState(null)

  // 確認ダイアログ状態
  const [confirmDialog, setConfirmDialog] = useState(INITIAL_CONFIRM_DIALOG)

  // --- モーダル操作 ---

  /**
   * 装備管理モーダルを開く
   */
  const openEquipmentModal = useCallback(() => {
    setActiveModal(MODAL_TYPE.EQUIPMENT)
    setEditingMission(null)
  }, [])

  /**
   * 任務モーダルを開く（新規追加）
   */
  const openMissionModal = useCallback(() => {
    setActiveModal(MODAL_TYPE.MISSION)
    setEditingMission(null)
  }, [])

  /**
   * 任務モーダルを開く（編集モード）
   * @param {object} mission - 編集対象の任務データ
   */
  const openMissionModalForEdit = useCallback((mission) => {
    setEditingMission(mission)
    setActiveModal(MODAL_TYPE.MISSION)
  }, [])

  /**
   * モーダルを閉じる
   */
  const closeModal = useCallback(() => {
    setActiveModal(null)
    setEditingMission(null)
  }, [])

  // --- 確認ダイアログ操作 ---

  /**
   * 確認ダイアログを開く
   * @param {string} type - ダイアログの種類 (CONFIRM_DIALOG_TYPE)
   * @param {string|null} id - 対象のID（装備/任務/カテゴリ）
   * @param {string} message - 表示メッセージ
   */
  const openConfirmDialog = useCallback((type, id, message) => {
    setConfirmDialog({
      isOpen: true,
      type,
      id,
      message,
    })
  }, [])

  /**
   * 確認ダイアログを閉じる
   */
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(INITIAL_CONFIRM_DIALOG)
  }, [])

  // --- ユーティリティ ---

  /**
   * 装備モーダルが開いているか
   */
  const isEquipmentModalOpen = activeModal === MODAL_TYPE.EQUIPMENT

  /**
   * 任務モーダルが開いているか
   */
  const isMissionModalOpen = activeModal === MODAL_TYPE.MISSION

  /**
   * 編集モードか（任務モーダル）
   */
  const isEditMode = editingMission !== null

  const value = useMemo(
    () => ({
      // モーダル状態
      activeModal,
      editingMission,
      isEquipmentModalOpen,
      isMissionModalOpen,
      isEditMode,

      // モーダル操作
      openEquipmentModal,
      openMissionModal,
      openMissionModalForEdit,
      closeModal,

      // 確認ダイアログ状態
      confirmDialog,

      // 確認ダイアログ操作
      openConfirmDialog,
      closeConfirmDialog,
    }),
    [
      activeModal,
      editingMission,
      isEquipmentModalOpen,
      isMissionModalOpen,
      isEditMode,
      openEquipmentModal,
      openMissionModal,
      openMissionModalForEdit,
      closeModal,
      confirmDialog,
      openConfirmDialog,
      closeConfirmDialog,
    ]
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

/**
 * useUI - UI状態を取得するカスタムフック
 * @returns {object} UI状態と操作関数
 */
export function useUI() {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}
