import { useEffect } from 'react'
import { ErrorProvider, useErrorHandler, ERROR_TYPE } from './contexts/ErrorContext'
import { DataProvider, useData } from './contexts/DataContext'
import { SelectionProvider, useSelection } from './contexts/SelectionContext'
import { UIProvider, useUI, CONFIRM_DIALOG_TYPE, getConfirmDialogConfig, buildCategoryDeletionMessage } from './contexts/UIContext'
import { useScrapComparison } from './hooks/useScrapComparison'
import { useMissionFilter } from './hooks/useMissionFilter'
import { useAboutModal } from './hooks/useAboutModal'
import { generateCategoryId, generateEquipmentId, generateMissionId } from './utils/idGenerator'
import { logInfo } from './utils/logger'
import { saveUserEquipments, clearAllData } from './utils/localStorage'
import {
  analyzeCategoryDeletionImpact,
  calculateCategoryDeletionResult
} from './domain/categoryOperations'
import Header from './components/Header'
import StickyDashboard from './components/StickyDashboard'
import SelectedMissionsSummary from './components/SelectedMissionsSummary'
import ControlBar from './components/ControlBar'
import MissionList from './components/MissionList'
import FooterArea from './components/FooterArea'
import Modal from './components/Modal'
import EquipmentModal from './components/EquipmentModal'
import MissionModal from './components/MissionModal'
import GlobalWarningBanner from './components/GlobalWarningBanner'
import ConfirmDialog from './components/ConfirmDialog'
import AboutModal from './components/AboutModal'

function AppContent() {
  // エラーハンドラーを取得（Context経由）
  const { syncErrors } = useErrorHandler()

  // データ管理を取得（Context経由）
  const {
    userCategories,
    getCategoryName,
    getCategoryById,
    addUserCategory,
    updateUserCategory,
    deleteUserCategory,
    swapUserCategoryOrder,
    userEquipments,
    equipmentsCrudError,
    addUserEquipment,
    updateUserEquipment,
    deleteUserEquipment,
    setUserEquipments,
    swapUserEquipmentOrder,
    allMissions,
    missionsCrudError,
    addUserMission,
    updateUserMission,
    deleteUserMission,
  } = useData()
  const {
    selectedMissions,
    isSelected,
    toggleMission
  } = useSelection()
  const {
    allScrapList,
    comparison,
    hasBaseMission,
  } = useScrapComparison(selectedMissions)
  const { isAboutModalOpen, openAboutModal, closeAboutModal } = useAboutModal()

  // UI状態管理（Context経由）
  const {
    editingMission,
    isEquipmentModalOpen,
    isMissionModalOpen,
    openEquipmentModal,
    openMissionModal,
    openMissionModalForEdit,
    closeModal,
    confirmDialog,
    openConfirmDialog,
    closeConfirmDialog,
  } = useUI()

  // フィルタリング
  const {
    filteredMissions,
    filterText,
    setFilterText,
    filterCategory,
    setFilterCategory,
    filterPeriod,
    setFilterPeriod
  } = useMissionFilter()

  // エラー状態の統合
  const errorMessage = equipmentsCrudError || missionsCrudError

  // Alpha版情報をエラーハンドラーに登録（初期化時のみ）
  useEffect(() => {
    syncErrors('alpha-info', [
      {
        type: ERROR_TYPE.INFO,
        message: 'Alpha版です。マスタデータ（任務・装備）にはダミーデータが含まれています。必要に応じてご自身で追加してください。',
        context: { source: 'app-info' },
      },
    ])
  }, [syncErrors])

  const handleExport = () => {
    // TODO: issue #12で実装予定
    logInfo('エクスポート機能は issue #12 で実装予定', { function: 'App.handleExport' })
  }

  const handleImport = () => {
    // TODO: issue #12で実装予定
    logInfo('インポート機能は issue #12 で実装予定', { function: 'App.handleImport' })
  }

  const handleAddEquipment = (data) => {
    if (data.mode === 'category') {
      // カテゴリを追加
      const newCategory = {
        id: generateCategoryId(),
        name: data.name,
        order: data.order
      }
      addUserCategory(newCategory)
    } else {
      // 装備を追加
      const newEquipment = {
        id: generateEquipmentId(),
        ...data
      }
      addUserEquipment(newEquipment)
    }
  }

  const handleDeleteEquipment = (id) => {
    openConfirmDialog(
      CONFIRM_DIALOG_TYPE.EQUIPMENT,
      id,
      'この装備を削除しますか？\n（この装備を使用している任務がある場合、表示がおかしくなる可能性があります）'
    )
  }

  const handleDeleteCategory = (categoryId) => {
    const impact = analyzeCategoryDeletionImpact(categoryId, userEquipments, allMissions, getCategoryName)
    const message = buildCategoryDeletionMessage(impact)
    openConfirmDialog(CONFIRM_DIALOG_TYPE.CATEGORY, categoryId, message)
  }

  const handleAddMission = (data) => {
    const newMission = {
      id: generateMissionId(),
      ...data
    }
    addUserMission(newMission)
    closeModal()
  }

  const handleEditMission = (mission) => {
    openMissionModalForEdit(mission)
  }

  const handleSaveMission = (data) => {
    if (data.id) {
      // 編集モード: 既存の任務を更新
      updateUserMission(data.id, data)
    } else {
      // 追加モード: 新規任務を追加
      const newMission = {
        ...data,
        id: generateMissionId() // dataを先に展開してからidで上書き
      }
      addUserMission(newMission)
    }
    closeModal()
  }

  const handleDeleteMission = (id) => {
    openConfirmDialog(CONFIRM_DIALOG_TYPE.MISSION, id, 'この任務を削除しますか？')
  }

  const handleDataReset = () => {
    openConfirmDialog(
      CONFIRM_DIALOG_TYPE.DATA_RESET,
      null,
      '本当に全てのユーザーデータを削除しますか？この操作は取り消せません。'
    )
  }

  const handleConfirmDelete = () => {
    if (confirmDialog.type === CONFIRM_DIALOG_TYPE.EQUIPMENT) {
      deleteUserEquipment(confirmDialog.id)
    } else if (confirmDialog.type === CONFIRM_DIALOG_TYPE.MISSION) {
      // 選択中の任務を削除する場合は、先に選択解除
      if (isSelected(confirmDialog.id)) {
        toggleMission(confirmDialog.id)
      }
      deleteUserMission(confirmDialog.id)
    } else if (confirmDialog.type === CONFIRM_DIALOG_TYPE.CATEGORY) {
      // カテゴリ削除: 装備を先に削除してからカテゴリを削除
      const { remainingEquipments } = calculateCategoryDeletionResult(confirmDialog.id, userEquipments)
      setUserEquipments(remainingEquipments)
      saveUserEquipments(remainingEquipments)
      deleteUserCategory(confirmDialog.id)
    } else if (confirmDialog.type === CONFIRM_DIALOG_TYPE.DATA_RESET) {
      // 全データを削除してリロード
      const success = clearAllData()
      if (success) {
        window.location.reload()
      } else {
        // エラー時は ErrorContext 経由で通知
        syncErrors('data-reset-error', [{
          type: ERROR_TYPE.ERROR,
          message: 'データの削除に失敗しました',
          context: { source: 'data-reset' }
        }])
      }
    }
    closeConfirmDialog()
  }

  const handleCancelDelete = () => {
    closeConfirmDialog()
  }

  // 確認ダイアログの設定を取得（未知のtypeは警告ログ + デフォルト値）
  const confirmDialogConfig = getConfirmDialogConfig(confirmDialog.type)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans relative">
      <Header
        onAboutOpen={openAboutModal}
        onExport={handleExport}
        onImport={handleImport}
        onDataReset={handleDataReset}
      />

      {/* 破損データ警告バナー（ErrorContext経由） */}
      <GlobalWarningBanner
        tags={['corrupted-equipments', 'corrupted-missions']}
        type="warning"
      />

      {/* Alpha版情報バナー（ErrorContext経由） */}
      <GlobalWarningBanner
        tags={['alpha-info']}
        type="info"
      />

      <StickyDashboard
        scrapList={allScrapList}
        comparison={comparison}
        hasBaseMission={hasBaseMission}
      />

      <SelectedMissionsSummary />

      <div className="max-w-3xl mx-auto p-4">
        <ControlBar
          filterText={filterText}
          filterCategory={filterCategory}
          filterPeriod={filterPeriod}
          onFilterTextChange={setFilterText}
          onFilterCategoryChange={setFilterCategory}
          onFilterPeriodChange={setFilterPeriod}
          onEquipmentClick={openEquipmentModal}
          onMissionClick={openMissionModal}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-20">
        {errorMessage && (
          <p className="text-center py-10 text-red-600">エラー: {errorMessage}</p>
        )}
        {!errorMessage && (
          <MissionList
            missions={filteredMissions}
            onDelete={handleDeleteMission}
            onEdit={handleEditMission}
          />
        )}
      </div>

      {/* FooterArea: ErrorContextに移行したため現在未使用 */}
      <FooterArea errors={[]} onClearErrors={() => { }} />

      <Modal
        isOpen={isEquipmentModalOpen}
        title="装備の管理・追加"
        onClose={closeModal}
      >
        <EquipmentModal
          onSave={handleAddEquipment}
          onSwapOrder={swapUserEquipmentOrder}
          onSwapCategoryOrder={swapUserCategoryOrder}
          onDelete={handleDeleteEquipment}
          onDeleteCategory={handleDeleteCategory}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        isOpen={isMissionModalOpen}
        title={editingMission ? '任務を編集' : '任務を追加'}
        onClose={closeModal}
      >
        <MissionModal
          editingMission={editingMission}
          onSave={handleSaveMission}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialogConfig.title}
        message={confirmDialog.message}
        confirmText={confirmDialogConfig.confirmText}
        cancelText="キャンセル"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={closeAboutModal}
      />
    </div>
  )
}

export default function App() {
  return (
    <ErrorProvider>
      <DataProvider>
        <SelectionProvider>
          <UIProvider>
            <AppContent />
          </UIProvider>
        </SelectionProvider>
      </DataProvider>
    </ErrorProvider>
  )
}
