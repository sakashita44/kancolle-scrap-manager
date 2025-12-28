/**
 * UIContext - UI状態の管理（モーダル, 確認ダイアログ等）
 * App.jsxからUI制御stateを分離し、各コンポーネントがContext参照で状態を操作可能にする
 * @module contexts/UIContext
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const UIContext = createContext(null)

/**
 * モーダルの種類
 * @readonly
 * @enum {string}
 */
export const MODAL_TYPE = {
  EQUIPMENT: 'equipment',
  MISSION: 'mission',
}

/**
 * 確認ダイアログの種類
 * @readonly
 * @enum {string}
 */
export const CONFIRM_DIALOG_TYPE = {
  EQUIPMENT: 'equipment',
  MISSION: 'mission',
  CATEGORY: 'category',
  DATA_RESET: 'data-reset',
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
