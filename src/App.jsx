import { useState, useEffect } from 'react'
import { useEquipments } from './hooks/useEquipments'
import { useMissions } from './hooks/useMissions'
import { useCategories } from './hooks/useCategories'
import { useSelectedMissions } from './hooks/useSelectedMissions'
import { useScrapComparison } from './hooks/useScrapComparison'
import { useMissionFilter } from './hooks/useMissionFilter'
import { useAboutModal } from './hooks/useAboutModal'
import { useErrorHandler, ERROR_TYPE } from './hooks/useErrorHandler'
import { generateCategoryId, generateEquipmentId, generateMissionId } from './utils/idGenerator'
import { logInfo } from './utils/logger'
import { saveUserEquipments } from './utils/localStorage'
import {
  analyzeCategoryDeletionImpact,
  buildCategoryDeletionMessage,
  executeCategoryDeletion,
  swapCategoryOrder
} from './domain/categoryOperations'
import { swapEquipmentOrder } from './domain/equipmentOperations'
import Header from './components/Header'
import StickyDashboard from './components/StickyDashboard'
import SelectedMissionsSummary from './components/SelectedMissionsSummary'
import ControlBar from './components/ControlBar'
import MissionList from './components/MissionList'
import ErrorDisplay from './components/ErrorDisplay'
import Modal from './components/Modal'
import EquipmentModal from './components/EquipmentModal'
import MissionModal from './components/MissionModal'
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
    updateUserCategory,
    deleteUserCategory,
    getNextOrder: getNextCategoryOrder
  } = useCategories()
  const {
    equipmentsForUI: equipments,
    equipmentMap,
    userEquipments,
    getNextOrder: getNextEquipmentOrder,
    corruptedItems: corruptedEquipments,
    addUserEquipment,
    updateUserEquipment,
    deleteUserEquipment,
    setUserEquipments
  } = useEquipments(allCategories, categoryMap)
  const {
    allMissions: missions,
    corruptedItems: corruptedMissions,
    addUserMission,
    updateUserMission,
    deleteUserMission,
    getNextOrder: getNextMissionOrder
  } = useMissions()
  const {
    selectedMissions,
    baseMission,
    auxiliaryMissions,
    selectedCount,
    selectBaseMission,
    deselectBaseMission,
    updateBaseMissionCount,
    selectAuxiliaryMission,
    deselectAuxiliaryMission,
    updateAuxiliaryMissionCount,
    toggleMission,
    clearSelection,
    isSelected,
    isBaseMission,
    isAuxiliaryMission,
    getAllSelectedIds,
    getAllSelectedMissions
  } = useSelectedMissions()
  const {
    baseRequirements,
    auxiliaryScrapList,
    allScrapList,
    comparison,
    hasBaseMission,
    hasAuxiliaryMissions,
    warnings
  } = useScrapComparison(selectedMissions, missions, equipmentMap, categoryMap)
  const { isAboutModalOpen, openAboutModal, closeAboutModal } = useAboutModal()
  const { errors, addError, syncErrors, clearError } = useErrorHandler()

  const [activeModal, setActiveModal] = useState(null)
  const [editingMission, setEditingMission] = useState(null) // 編集中の任務
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, id: null, message: '' })

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

  // 破損データ警告を統合エラーハンドラーに同期
  useEffect(() => {
    const corruptedErrors = []

    corruptedEquipments.forEach((item) => {
      corruptedErrors.push({
        type: ERROR_TYPE.WARNING,
        message: `装備 "${item.name || item.id}": ${item.reason}`,
        context: { source: 'data-integrity', dataType: 'equipment', item },
      })
    })

    corruptedMissions.forEach((item) => {
      corruptedErrors.push({
        type: ERROR_TYPE.WARNING,
        message: `任務 "${item.name || item.id}": ${item.reason}`,
        context: { source: 'data-integrity', dataType: 'mission', item },
      })
    })

    syncErrors('corrupted-data', corruptedErrors)
  }, [corruptedEquipments, corruptedMissions, syncErrors])

  // 計算処理の警告を統合エラーハンドラーに同期
  useEffect(() => {
    if (warnings && warnings.length > 0) {
      const calculationErrors = warnings.map((warning) => ({
        type: warning.type === 'error' ? ERROR_TYPE.ERROR : ERROR_TYPE.WARNING,
        message: warning.message,
        context: { source: 'calculation', ...warning },
      }))
      syncErrors('calculation', calculationErrors)
    } else {
      syncErrors('calculation', [])
    }
  }, [warnings, syncErrors])

  // ベータ版警告を初期化時に同期
  useEffect(() => {
    syncErrors('beta-info', [
      {
        type: ERROR_TYPE.INFO,
        message:
          'ベータ版です。マスタデータ（任務・装備）にはダミーデータが含まれています。必要に応じてご自身で追加してください。',
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

  const handleSwapEquipmentOrder = (id1, id2) => {
    swapEquipmentOrder(id1, id2, userEquipments, updateUserEquipment)
  }

  const handleSwapCategoryOrder = (id1, id2) => {
    swapCategoryOrder(id1, id2, allCategories, updateUserCategory)
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

  const handleEditMission = (mission) => {
    setEditingMission(mission)
    setActiveModal('mission')
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
    setActiveModal(null)
    setEditingMission(null)
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
        setUserEquipments,
        saveUserEquipments,
        deleteUserCategory
      )
    }
    setConfirmDialog({ isOpen: false, type: null, id: null, message: '' })
  }

  const handleCancelDelete = () => {
    setConfirmDialog({ isOpen: false, type: null, id: null, message: '' })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans relative">
      <Header
        onAboutOpen={openAboutModal}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* エラー表示 */}
      <ErrorDisplay errors={errors} onClear={clearError} />

      <StickyDashboard
        scrapList={allScrapList}
        comparison={comparison}
        hasBaseMission={hasBaseMission}
      />

      <SelectedMissionsSummary
        baseMission={baseMission}
        auxiliaryMissions={auxiliaryMissions}
        missions={missions}
        equipmentMap={equipmentMap}
        categoryMap={categoryMap}
        selectedCount={selectedCount}
        onSelectBaseMission={selectBaseMission}
        onDeselectBaseMission={deselectBaseMission}
        onDeselectAuxiliaryMission={deselectAuxiliaryMission}
        onToggleMission={toggleMission}
        onUpdateBaseMissionCount={updateBaseMissionCount}
        onUpdateAuxiliaryMissionCount={updateAuxiliaryMissionCount}
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
        <MissionList
          missions={filteredMissions}
          equipmentMap={equipmentMap}
          categoryMap={categoryMap}
          selectedMissionIds={getAllSelectedIds()}
          selectedCount={selectedCount}
          isBaseMission={isBaseMission}
          onToggle={toggleMission}
          onDelete={handleDeleteMission}
          onEdit={handleEditMission}
        />
      </div>

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
          onSwapCategoryOrder={handleSwapCategoryOrder}
          onDelete={handleDeleteEquipment}
          onDeleteCategory={handleDeleteCategory}
          onCancel={() => setActiveModal(null)}
        />
      </Modal>

      <Modal
        isOpen={activeModal === 'mission'}
        title={editingMission ? '任務を編集' : '任務を追加'}
        onClose={() => {
          setActiveModal(null)
          setEditingMission(null)
        }}
      >
        <MissionModal
          editingMission={editingMission}
          equipments={equipments}
          categories={categories}
          missions={missions}
          getCategoryName={getCategoryName}
          getNextOrder={getNextMissionOrder}
          onSave={handleSaveMission}
          onCancel={() => {
            setActiveModal(null)
            setEditingMission(null)
          }}
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
        onClose={closeAboutModal}
      />
    </div>
  )
}

export default App
