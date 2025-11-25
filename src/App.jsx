import { useState, useMemo } from 'react'
import { useEquipments } from './hooks/useEquipments'
import { useMissions } from './hooks/useMissions'
import { useCategories } from './hooks/useCategories'
import { useSelectedMissions } from './hooks/useSelectedMissions'
import { useScrapCalculation } from './hooks/useScrapCalculation'
import { useMissionFilter } from './hooks/useMissionFilter'
import { generateEquipmentId, generateMissionId } from './utils/idGenerator'
import Header from './components/Header'
import StickyDashboard from './components/StickyDashboard'
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
    allEquipments: equipments,
    getNextOrder: getNextEquipmentOrder,
    loading: equipmentsLoading,
    error: equipmentsError,
    corruptedItems: corruptedEquipments,
    addUserEquipment,
    deleteUserEquipment
  } = useEquipments()
  const {
    allMissions: missions,
    loading: missionsLoading,
    error: missionsError,
    corruptedItems: corruptedMissions,
    addUserMission,
    deleteUserMission,
    getNextOrder: getNextMissionOrder
  } = useMissions()
  const {
    categoryIds: categories,
    categoryNameMap,
    getCategoryName,
    loading: categoriesLoading,
    error: categoriesError
  } = useCategories()
  const { selectedMissionIds, selectedCount, toggleMission, clearSelection } = useSelectedMissions()
  const { scrapList, calculating: _calculating } = useScrapCalculation(selectedMissionIds, missions, equipments, categoryNameMap)

  const [errors, setErrors] = useState([])
  const [activeModal, setActiveModal] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, id: null, message: '' })
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)

  // 装備検索の高速化: Map生成 (O(n) → O(1)アクセス)
  const equipmentMap = useMemo(() =>
    new Map(equipments.map(eq => [eq.id, eq]))
  , [equipments])

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

  // ローディング・エラー状態の統合
  const isLoading = equipmentsLoading || missionsLoading
  const errorMessage = equipmentsError || missionsError

  const handleAboutOpen = () => {
    setIsAboutModalOpen(true)
  }

  const handleExport = () => {
    // TODO: issue #12で実装予定
    console.log('エクスポート機能は issue #12 で実装予定')
  }

  const handleImport = () => {
    // TODO: issue #12で実装予定
    console.log('インポート機能は issue #12 で実装予定')
  }

  const handleAddEquipment = (data) => {
    const newEquipment = {
      id: generateEquipmentId(),
      ...data
    }
    addUserEquipment(newEquipment)
  }

  const handleDeleteEquipment = (id) => {
    setConfirmDialog({
      isOpen: true,
      type: 'equipment',
      id,
      message: 'この装備を削除しますか？\n（この装備を使用している任務がある場合、表示がおかしくなる可能性があります）'
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

      <StickyDashboard
        scrapList={scrapList}
        selectedCount={selectedCount}
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
        {isLoading && (
          <p className="text-center py-10 text-slate-400">読み込み中...</p>
        )}
        {errorMessage && (
          <p className="text-center py-10 text-red-600">エラー: {errorMessage}</p>
        )}
        {!isLoading && !errorMessage && (
          <MissionList
            missions={filteredMissions}
            equipmentMap={equipmentMap}
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
          onSave={handleAddEquipment}
          onDelete={handleDeleteEquipment}
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
        title={confirmDialog.type === 'equipment' ? '装備の削除' : '任務の削除'}
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
