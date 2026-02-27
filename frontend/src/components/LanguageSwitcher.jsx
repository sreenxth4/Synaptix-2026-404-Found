import React from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('hi') ? 'hi' : 'en'

  return (
    <div className="flex rounded-md overflow-hidden border border-indigo-400">
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-2.5 py-1 text-xs font-medium transition-colors ${
          current === 'en' ? 'bg-white text-indigo-700' : 'text-indigo-100 hover:bg-indigo-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => i18n.changeLanguage('hi')}
        className={`px-2.5 py-1 text-xs font-medium transition-colors ${
          current === 'hi' ? 'bg-white text-indigo-700' : 'text-indigo-100 hover:bg-indigo-700'
        }`}
      >
        हिं
      </button>
    </div>
  )
}
