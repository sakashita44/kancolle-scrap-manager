import { useState, useEffect } from 'react'
import { ErrorProvider, useErrorHandler, ERROR_TYPE } from './contexts/ErrorContext'
import { useEquipments } from './hooks/useEquipments'
import { useMissions } from './hooks/useMissions'
import { useCategories } from './hooks/useCategories'
import { useSelectedMissions } from './hooks/useSelectedMissions'
import { useScrapComparison } from './hooks/useScrapComparison'
import { useMissionFilter } from './hooks/useMissionFilter'
import { useAboutModal } from './hooks/useAboutModal'
import { generateCategoryId, generateEquipmentId, generateMissionId } from './utils/idGenerator'
import { logInfo } from './utils/logger'
import { saveUserEquipments, clearAllData } from './utils/localStorage'
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
import FooterArea from './components/FooterArea'
import Modal from './components/Modal'
import EquipmentModal from './components/EquipmentModal'
import MissionModal from './components/MissionModal'
import GlobalWarningBanner from './components/GlobalWarningBanner'
import ConfirmDialog from './components/ConfirmDialog'
import AboutModal from './components/AboutModal'

function AppContent() {
  // エラーハンドラーを取得（Context経由）
  const { errors, syncErrors, getErrorsByTag } = useErrorHandler()

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
    crudError: equipmentsCrudError,
    addUserEquipment,
    updateUserEquipment,
    deleteUserEquipment,
    setUserEquipments
  } = useEquipments(allCategories, categoryMap)
  const {
    allMissions: missions,
    crudError: missionsCrudError,
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
    hasAuxiliaryMissions
  } = useScrapComparison(selectedMissions, missions, equipmentMap, categoryMap)
  const { isAboutModalOpen, openAboutModal, closeAboutModal } = useAboutModal()

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

  // エラー状態の統合
  const errorMessage = equipmentsCrudError || missionsCrudError

  // ベータ版情報をエラーハンドラーに登録（初期化時のみ）
  useEffect(() => {
    syncErrors('beta-info', [
      {
        type: ERROR_TYPE.INFO,
        message: 'ベータ版です。マスタデータ（任務・装備）にはダミーデータが含まれています。必要に応じてご自身で追加してください。',
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

  const handleDataReset = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'data-reset',
      id: null,
      message: '本当に全てのユーザーデータを削除しますか？この操作は取り消せません。'
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
    } else if (confirmDialog.type === 'data-reset') {
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
        onDataReset={handleDataReset}
      />

      {/* 破損データ警告バナー（ErrorContext経由） */}
      {(() => {
        const corruptedEquipmentErrors = getErrorsByTag('corrupted-equipments')
        const corruptedMissionErrors = getErrorsByTag('corrupted-missions')
        const corruptedEquipments = corruptedEquipmentErrors.map((err) => ({
          name: err.context.item?.name,
          id: err.context.item?.id,
          reason: err.message.split(': ')[1] || err.message
        }))
        const corruptedMissions = corruptedMissionErrors.map((err) => ({
          name: err.context.item?.name,
          id: err.context.item?.id,
          reason: err.message.split(': ')[1] || err.message
        }))
        return (
          <GlobalWarningBanner
            corruptedEquipments={corruptedEquipments}
            corruptedMissions={corruptedMissions}
            type="warning"
          />
        )
      })()}

      {/* ベータ版警告バナー（ErrorContext経由） */}
      {(() => {
        const betaInfoErrors = getErrorsByTag('beta-info')
        return betaInfoErrors.length > 0 && (
          <GlobalWarningBanner
            customMessage={betaInfoErrors[0].message}
            type="info"
          />
        )
      })()}

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
        {errorMessage && (
          <p className="text-center py-10 text-red-600">エラー: {errorMessage}</p>
        )}
        {!errorMessage && (
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
        )}
      </div>

      {/* FooterArea: ErrorContextに移行したため現在未使用 */}
      <FooterArea errors={[]} onClearErrors={() => {}} />

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
          confirmDialog.type === 'data-reset' ? 'データの初期化' :
          'カテゴリの削除'
        }
        message={confirmDialog.message}
        confirmText={confirmDialog.type === 'data-reset' ? '初期化' : '削除'}
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
      <AppContent />
    </ErrorProvider>
  )
}
