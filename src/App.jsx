import { useState } from 'react'
import { useEquipments } from './hooks/useEquipments'
import { useMissions } from './hooks/useMissions'
import { useSelectedMissions } from './hooks/useSelectedMissions'
import { useScrapCalculation } from './hooks/useScrapCalculation'
import Header from './components/Header'

function App() {
  const { equipments, loading: equipmentsLoading, error: equipmentsError } = useEquipments()
  const { missions, loading: missionsLoading, error: missionsError } = useMissions()
  const { selectedMissionIds, toggleMission, clearSelection } = useSelectedMissions()
  const { scrapList, isCalculating } = useScrapCalculation(selectedMissionIds, missions, equipments)

  const [errors, setErrors] = useState([])

  const handleSettingsClick = () => {
    console.log('Settings clicked')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header onSettingsClick={handleSettingsClick} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Sticky Dashboard Placeholder */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🗑️ 本日の廃棄リスト
          </h2>
          <p className="text-gray-600">
            選択中: {selectedMissionIds.length} / 廃棄リスト表示予定
          </p>
        </div>

        {/* Control Bar Placeholder */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
              + 装備管理
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              + 任務追加
            </button>
          </div>
        </div>

        {/* Mission List Placeholder */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 任務一覧
          </h3>
          {missionsLoading && (
            <p className="text-gray-600">読み込み中...</p>
          )}
          {missionsError && (
            <p className="text-red-600">エラー: {missionsError}</p>
          )}
          {!missionsLoading && !missionsError && (
            <p className="text-gray-600">
              {missions.length} 件の任務が読み込まれました
            </p>
          )}
        </div>
      </main>

      {/* Footer Area Placeholder */}
      <footer className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">
            ▼ エラーログ ({errors.length})
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
