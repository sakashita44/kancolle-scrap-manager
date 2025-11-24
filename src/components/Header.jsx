import { Anchor, Settings } from 'lucide-react'

const Header = ({ onSettingsClick }) => {
  return (
    <header className="bg-slate-800 text-white shadow-md p-4">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Anchor className="w-6 h-6 text-teal-400" />
          <h1 className="font-bold text-lg">工廠任務廃棄マネージャー</h1>
        </div>
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-full hover:bg-slate-700 transition-colors"
          title="設定・データ管理"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}

export default Header
