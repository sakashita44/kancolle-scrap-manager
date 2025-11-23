import { Settings } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              艦これ 工廠任務廃棄マネージャー
            </h1>
            <button className="p-2 rounded-md hover:bg-gray-100">
              <Settings className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            開発環境セットアップ完了
          </h2>
          <p className="text-gray-600">
            React, Vite, Tailwind CSSが正常に動作しています.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
