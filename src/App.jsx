import { useState, useMemo } from 'react'
import { useEquipments } from './hooks/useEquipments'
import { useMissions } from './hooks/useMissions'
import { useSelectedMissions } from './hooks/useSelectedMissions'
import { useScrapCalculation } from './hooks/useScrapCalculation'
import Header from './components/Header'
import StickyDashboard from './components/StickyDashboard'
import ControlBar from './components/ControlBar'
import MissionList from './components/MissionList'
import FooterArea from './components/FooterArea'
import Modal from './components/Modal'
import EquipmentModal from './components/EquipmentModal'
import MissionModal from './components/MissionModal'

function App() {
  const {
    allEquipments: equipments,
    loading: equipmentsLoading,
    error: equipmentsError,
    addUserEquipment,
    deleteUserEquipment
  } = useEquipments()
  const {
    allMissions: missions,
    loading: missionsLoading,
    error: missionsError,
    addUserMission,
    deleteUserMission
  } = useMissions()
  const { selectedMissionIds, toggleMission, clearSelection } = useSelectedMissions()
  const { scrapList, isCalculating } = useScrapCalculation(selectedMissionIds, missions, equipments)

  const [errors, setErrors] = useState([])
  const [activeModal, setActiveModal] = useState(null)
  const [filterText, setFilterText] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')

  // カテゴリ一覧の生成
  const uniqueCategories = useMemo(() =>
    [...new Set(equipments.map(e => e.category))].sort()
  , [equipments])

  // フィルタリング
  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      const matchText = mission.name.includes(filterText)

      let matchCategory = true
      if (filterCategory !== 'ALL') {
        matchCategory = mission.reqs.some(req => {
          const eq = equipments.find(e => e.id === req.targetId)
          return eq && eq.category === filterCategory
        })
      }
      return matchText && matchCategory
    })
  }, [missions, equipments, filterText, filterCategory])

  const handleSettingsClick = () => {
    console.log('Settings clicked')
  }

  const handleAddEquipment = (data) => {
    const newEquipment = {
      id: `u_eq_${crypto.randomUUID()}`,
      ...data
    }
    addUserEquipment(newEquipment)
  }

  const handleDeleteEquipment = (id) => {
    if (!window.confirm('この装備を削除しますか？\n（この装備を使用している任務がある場合、表示がおかしくなる可能性があります）')) return
    deleteUserEquipment(id)
  }

  const handleAddMission = (data) => {
    const newMission = {
      id: `u_ms_${crypto.randomUUID()}`,
      ...data
    }
    addUserMission(newMission)
    setActiveModal(null)
  }

  const handleDeleteMission = (id) => {
    if (!window.confirm('この任務を削除しますか？')) return
    deleteUserMission(id)
  }

  const handleClearErrors = () => {
    setErrors([])
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans relative">
      <Header onSettingsClick={handleSettingsClick} />

      <StickyDashboard
        scrapList={scrapList}
        selectedCount={selectedMissionIds.size}
      />

      <div className="max-w-3xl mx-auto p-4">
        <ControlBar
          filterText={filterText}
          filterCategory={filterCategory}
          categories={uniqueCategories}
          onFilterTextChange={setFilterText}
          onFilterCategoryChange={setFilterCategory}
          onEquipmentClick={() => setActiveModal('equipment')}
          onMissionClick={() => setActiveModal('mission')}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-20">
        {missionsLoading && (
          <p className="text-center py-10 text-slate-400">読み込み中...</p>
        )}
        {missionsError && (
          <p className="text-center py-10 text-red-600">エラー: {missionsError}</p>
        )}
        {!missionsLoading && !missionsError && (
          <MissionList
            missions={filteredMissions}
            equipments={equipments}
            selectedMissionIds={selectedMissionIds}
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
          categories={uniqueCategories}
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
          onSave={handleAddMission}
          onCancel={() => setActiveModal(null)}
        />
      </Modal>
    </div>
  )
}

export default App
