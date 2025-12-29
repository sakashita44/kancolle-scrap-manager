import { useEffect } from 'react'
import { ErrorProvider, useErrorHandler, ERROR_TYPE } from './contexts/ErrorContext'
import { DataProvider, useData } from './contexts/DataContext'
import { SelectionProvider, useSelection } from './contexts/SelectionContext'
import { UIProvider, useUI, getConfirmDialogConfig } from './contexts/UIContext'
import { useScrapComparison } from './hooks/useScrapComparison'
import { useMissionFilter } from './hooks/useMissionFilter'
import { useAboutModal } from './hooks/useAboutModal'
import { useDestructiveOperations } from './hooks/useDestructiveOperations'
import { generateCategoryId, generateEquipmentId } from './utils/idGenerator'
import { logInfo } from './utils/logger'
import Header from './components/Header'
import StickyDashboard from './components/StickyDashboard'
import SelectedMissionsSummary from './components/SelectedMissionsSummary'
import ControlBar from './components/ControlBar'
import MissionList from './components/MissionList'
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
    addUserCategory,
    swapUserCategoryOrder,
    addUserEquipment,
    swapUserEquipmentOrder,
    saveMission,
  } = useData()

  // 破壊的操作（削除, リセット）を取得
  const {
    requestDeleteEquipment,
    requestDeleteCategory,
    requestDeleteMission,
    requestDataReset,
    executeConfirmedAction,
  } = useDestructiveOperations()

  // 選択任務を取得
  const { selectedMissions } = useSelection()

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

  const handleEditMission = (mission) => {
    openMissionModalForEdit(mission)
  }

  const handleSaveMission = (data) => {
    saveMission(data)
    closeModal()
  }

  // 確認ダイアログの設定を取得（未知のtypeは警告ログ + デフォルト値）
  const confirmDialogConfig = getConfirmDialogConfig(confirmDialog.type)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans relative">
      <Header
        onAboutOpen={openAboutModal}
        onExport={handleExport}
        onImport={handleImport}
        onDataReset={requestDataReset}
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

      {/* CRUD操作エラーバナー（ErrorContext経由） */}
      <GlobalWarningBanner
        tags={['equipment-crud-error', 'mission-crud-error']}
        type="error"
      />

      {/* 破壊的操作エラーバナー（ErrorContext経由） */}
      <GlobalWarningBanner
        tags={['destructive-op-error']}
        type="error"
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
        <MissionList
          missions={filteredMissions}
          onDelete={requestDeleteMission}
          onEdit={handleEditMission}
        />
      </div>

      <Modal
        isOpen={isEquipmentModalOpen}
        title="装備の管理・追加"
        onClose={closeModal}
      >
        <EquipmentModal
          onSave={handleAddEquipment}
          onSwapOrder={swapUserEquipmentOrder}
          onSwapCategoryOrder={swapUserCategoryOrder}
          onDelete={requestDeleteEquipment}
          onDeleteCategory={requestDeleteCategory}
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
        onConfirm={executeConfirmedAction}
        onCancel={closeConfirmDialog}
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
