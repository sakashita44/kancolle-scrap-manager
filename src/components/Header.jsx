import { Anchor, Settings, Download, Upload, Info, ExternalLink } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useToggle } from '../hooks/useToggle'

const Header = ({ onAboutOpen, onExport, onImport }) => {
  const [isMenuOpen, { toggle, setFalse }] = useToggle(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  // メニュー外クリック検出
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setFalse()
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setFalse()
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen, setFalse])

  const handleMenuItemClick = (action) => {
    setFalse()
    action()
  }

  const handleGitHubClick = () => {
    window.open('https://github.com/sakashita44/kancolle-scrap-manager', '_blank', 'noopener,noreferrer')
  }

  return (
    <header className="bg-slate-800 text-white shadow-md p-4">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Anchor className="w-6 h-6 text-teal-400" />
          <h1 className="font-bold text-lg">工廠任務廃棄マネージャー</h1>
        </div>
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={toggle}
            className="p-2 rounded-full hover:bg-slate-700 transition-colors"
            title="設定・データ管理"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* 設定ドロップダウンメニュー */}
          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden z-50"
            >
              {/* データ管理 */}
              <div className="py-1">
                <button
                  onClick={() => handleMenuItemClick(onExport)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  エクスポート（WIP）
                </button>
                <button
                  onClick={() => handleMenuItemClick(onImport)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  インポート（WIP）
                </button>
              </div>

              {/* 区切り線 */}
              <div className="border-t border-slate-200" />

              {/* About */}
              <div className="py-1">
                <button
                  onClick={() => handleMenuItemClick(onAboutOpen)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  About
                </button>
              </div>

              {/* 区切り線 */}
              <div className="border-t border-slate-200" />

              {/* GitHub */}
              <div className="py-1">
                <button
                  onClick={() => handleMenuItemClick(handleGitHubClick)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  GitHub
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
