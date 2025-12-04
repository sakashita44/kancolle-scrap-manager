import { useState, useMemo } from 'react'
import { useEquipments } from './hooks/useEquipments'
import { useMissions } from './hooks/useMissions'
import { useCategories } from './hooks/useCategories'
import { useSelectedMissions } from './hooks/useSelectedMissions'
import { useScrapCalculation } from './hooks/useScrapCalculation'
import { useMissionFilter } from './hooks/useMissionFilter'
import { generateCategoryId, generateEquipmentId, generateMissionId } from './utils/idGenerator'
import { logInfo } from './utils/logger'
import {
  analyzeCategoryDeletionImpact,
  buildCategoryDeletionMessage,
  executeCategoryDeletion
} from './domain/categoryOperations'
import { swapEquipmentOrder } from './domain/equipmentOperations'
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

function App() {
  const {
    allCategories,
    categoryIds: categories,
    categoryMap,
    categoryNameMap,
    getCategoryName,
    addUserCategory,
    deleteUserCategory,
    getNextOrder: getNextCategoryOrder
  } = useCategories()
  const {
    equipmentsForUI: equipments,
    equipmentMap,
    userEquipments,
    getNextOrder: getNextEquipmentOrder,
    crudError: equipmentsCrudError,
    corruptedItems: corruptedEquipments,
    addUserEquipment,
    updateUserEquipment,
    deleteUserEquipment
  } = useEquipments(allCategories, categoryMap)
  const {
    allMissions: missions,
    crudError: missionsCrudError,
    corruptedItems: corruptedMissions,
    addUserMission,
    deleteUserMission,
    getNextOrder: getNextMissionOrder
  } = useMissions()
  const { selectedMissionIds, selectedCount, toggleMission, clearSelection } = useSelectedMissions()
  const { scrapList, calculating: _calculating } = useScrapCalculation(selectedMissionIds, missions, equipmentMap, categoryMap)

  const [errors, setErrors] = useState([])
  const [activeModal, setActiveModal] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, id: null, message: '' })
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)

  // 選択中の任務一覧を取得
  const selectedMissions = useMemo(() =>
    missions.filter(mission => selectedMissionIds.includes(mission.id))
  , [missions, selectedMissionIds])

  // フィルタリング
  const {
    filteredMissions,
    filterText,
    setFilterText,
    filterCategory,
    setFilterCategory,
    filterPeriod,
    setFilterPeriod
  } = useMissionFilter(missions, equipmentMap)

  // エラー状態の統合
  const errorMessage = equipmentsCrudError || missionsCrudError

  const handleAboutOpen = () => {
    setIsAboutModalOpen(true)
  }

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

  const handleSwapEquipmentOrder = (id1, id2) => {
    swapEquipmentOrder(id1, id2, userEquipments, updateUserEquipment)
  }

  const handleDeleteEquipment = (id) => {
    setConfirmDialog({
      isOpen: true,
      type: 'equipment',
      id,
      message: 'この装備を削除しますか？\n（この装備を使用している任務がある場合、表示がおかしくなる可能性があります）'
    })
  }

  const handleDeleteCategory = (categoryId) => {
    const impact = analyzeCategoryDeletionImpact(categoryId, userEquipments, missions, getCategoryName)
    const message = buildCategoryDeletionMessage(impact)

    setConfirmDialog({
      isOpen: true,
      type: 'category',
      id: categoryId,
      message
    })
  }

  const handleAddMission = (data) => {
    const newMission = {
      id: generateMissionId(),
      ...data
    }
    addUserMission(newMission)
    setActiveModal(null)
  }

  const handleDeleteMission = (id) => {
    setConfirmDialog({
      isOpen: true,
      type: 'mission',
      id,
      message: 'この任務を削除しますか？'
    })
  }

  const handleConfirmDelete = () => {
    if (confirmDialog.type === 'equipment') {
      deleteUserEquipment(confirmDialog.id)
    } else if (confirmDialog.type === 'mission') {
      deleteUserMission(confirmDialog.id)
    } else if (confirmDialog.type === 'category') {
      executeCategoryDeletion(
        confirmDialog.id,
        userEquipments,
        deleteUserEquipment,
        deleteUserCategory
      )
    }
    setConfirmDialog({ isOpen: false, type: null, id: null, message: '' })
  }

  const handleCancelDelete = () => {
    setConfirmDialog({ isOpen: false, type: null, id: null, message: '' })
  }

  const handleClearErrors = () => {
    setErrors([])
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans relative">
      <Header
        onAboutOpen={handleAboutOpen}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* 破損データ警告バナー */}
      <GlobalWarningBanner
        corruptedEquipments={corruptedEquipments}
        corruptedMissions={corruptedMissions}
        type="warning"
      />

      {/* ベータ版警告バナー */}
      <GlobalWarningBanner
        customMessage="ベータ版です。マスタデータ（任務・装備）にはダミーデータが含まれています。必要に応じてご自身で追加してください。"
        type="info"
      />

      <StickyDashboard
        scrapList={scrapList}
      />

      <SelectedMissionsSummary
        selectedMissions={selectedMissions}
        selectedCount={selectedCount}
        onToggleMission={toggleMission}
        onClearSelection={clearSelection}
      />

      <div className="max-w-3xl mx-auto p-4">
        <ControlBar
          filterText={filterText}
          filterCategory={filterCategory}
          filterPeriod={filterPeriod}
          categories={categories}
          getCategoryName={getCategoryName}
          onFilterTextChange={setFilterText}
          onFilterCategoryChange={setFilterCategory}
          onFilterPeriodChange={setFilterPeriod}
          onEquipmentClick={() => setActiveModal('equipment')}
          onMissionClick={() => setActiveModal('mission')}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-20">
        {errorMessage && (
          <p className="text-center py-10 text-red-600">エラー: {errorMessage}</p>
        )}
        {!errorMessage && (
          <MissionList
            missions={filteredMissions}
            equipmentMap={equipmentMap}
            categoryMap={categoryMap}
            selectedMissionIds={selectedMissionIds}
            selectedCount={selectedCount}
            onToggle={toggleMission}
            onDelete={handleDeleteMission}
          />
        )}
      </div>

      <FooterArea errors={errors} onClearErrors={handleClearErrors} />

      <Modal
        isOpen={activeModal === 'equipment'}
        title="装備の管理・追加"
        onClose={() => setActiveModal(null)}
      >
        <EquipmentModal
          equipments={equipments}
          categories={categories}
          getCategoryName={getCategoryName}
          getNextOrder={getNextEquipmentOrder}
          getNextCategoryOrder={getNextCategoryOrder}
          onSave={handleAddEquipment}
          onSwapOrder={handleSwapEquipmentOrder}
          onDelete={handleDeleteEquipment}
          onDeleteCategory={handleDeleteCategory}
          onCancel={() => setActiveModal(null)}
        />
      </Modal>

      <Modal
        isOpen={activeModal === 'mission'}
        title="任務を追加"
        onClose={() => setActiveModal(null)}
      >
        <MissionModal
          equipments={equipments}
          missions={missions}
          getCategoryName={getCategoryName}
          getNextOrder={getNextMissionOrder}
          onSave={handleAddMission}
          onCancel={() => setActiveModal(null)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.type === 'equipment' ? '装備の削除' :
          confirmDialog.type === 'mission' ? '任務の削除' :
          'カテゴリの削除'
        }
        message={confirmDialog.message}
        confirmText="削除"
        cancelText="キャンセル"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  )
}

export default App
