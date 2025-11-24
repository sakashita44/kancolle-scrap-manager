import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FooterArea = ({ errors, onClearErrors }) => {
  const [isOpen, setIsOpen] = useState(false)

  if (errors.length === 0) {
    return null
  }

  return (
    <footer className="max-w-3xl mx-auto px-4 py-4">
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            <span className="text-sm font-medium text-slate-600">
              エラーログ ({errors.length})
            </span>
          </div>
          {isOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClearErrors()
              }}
              className="text-xs px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
            >
              クリア
            </button>
          )}
        </button>

        {isOpen && (
          <div className="border-t border-slate-200 p-4 space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-slate-700">{error}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </footer>
  )
}

export default FooterArea
