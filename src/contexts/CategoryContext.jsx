/**
 * CategoryContext - カテゴリデータの管理
 * カテゴリに関するデータとCRUD操作を提供
 * @module contexts/CategoryContext
 */

import { createContext, useContext } from 'react'
import { useCategories } from '../hooks/useCategories'

const CategoryContext = createContext(null)

/**
 * CategoryProvider - カテゴリデータを管理するProvider
 */
export function CategoryProvider({ children }) {
  const categoryData = useCategories()

  return (
    <CategoryContext.Provider value={categoryData}>
      {children}
    </CategoryContext.Provider>
  )
}

/**
 * useCategoryData - CategoryContextを使用するカスタムフック
 * @returns {object} カテゴリデータと操作関数
 * @throws {Error} CategoryProvider外で使用された場合
 */
export function useCategoryData() {
  const context = useContext(CategoryContext)
  if (!context) {
    throw new Error('useCategoryData must be used within CategoryProvider')
  }
  return context
}
