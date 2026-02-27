import React, { createContext, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation()
  const [language, setLanguage] = useState(i18n.language || 'en')

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang)
    setLanguage(lang)
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
