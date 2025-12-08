import { createContext, useContext, useState, useCallback } from 'react'

/**
 * エラー種別の定数定義
 */
export const ERROR_TYPE = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

const ErrorContext = createContext(null)

/**
 * ErrorProvider - アプリ全体のエラー状態を管理するProvider
 *
 * Pub/Subモデルを採用し、各フックやコンポーネントが独立してエラーを登録できる.
 * App.jxでの手動同期が不要になり、エラー管理が一元化される.
 */
export function ErrorProvider({ children }) {
  const [errors, setErrors] = useState([])

  /**
   * 単一エラーを追加
   * @param {string} type - ERROR_TYPE のいずれか
   * @param {string} message - エラーメッセージ
   * @param {object} context - エラーコンテキスト（任意）
   */
  const addError = useCallback((type, message, context = {}) => {
    const error = {
      id: `error_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      message,
      context,
      tag: context.tag || null,
      timestamp: new Date().toISOString(),
    }
    setErrors((prev) => [...prev, error])
  }, [])

  /**
   * タグ付きエラーリストを同期
   * 同じタグを持つ既存エラーを削除し、新しいエラーリストに置き換える.
   * @param {string} tag - エラーを識別するタグ
   * @param {Array} errorList - エラーオブジェクトの配列
   */
  const syncErrors = useCallback((tag, errorList) => {
    setErrors((prev) => {
      // 同じタグのエラーを削除
      const filtered = prev.filter((e) => e.tag !== tag)

      // 新しいエラーを追加
      const newErrors = errorList.map((err) => ({
        id: `error_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: err.type || ERROR_TYPE.WARNING,
        message: err.message,
        context: err.context || {},
        tag,
        timestamp: new Date().toISOString(),
      }))

      return [...filtered, ...newErrors]
    })
  }, [])

  /**
   * エラーをクリア
   * @param {string} id - エラーID（指定しない場合は全てクリア）
   */
  const clearError = useCallback((id) => {
    if (id) {
      setErrors((prev) => prev.filter((e) => e.id !== id))
    } else {
      setErrors([])
    }
  }, [])

  /**
   * タグでエラーをクリア
   * @param {string} tag - クリアするエラーのタグ
   */
  const clearErrorsByTag = useCallback((tag) => {
    setErrors((prev) => prev.filter((e) => e.tag !== tag))
  }, [])

  /**
   * エラー種別でフィルタリング
   * @param {string} type - ERROR_TYPE のいずれか
   * @returns {Array} 該当するエラーの配列
   */
  const getErrorsByType = useCallback((type) => {
    return errors.filter((e) => e.type === type)
  }, [errors])

  /**
   * タグでフィルタリング
   * @param {string} tag - 検索するタグ
   * @returns {Array} 該当するエラーの配列
   */
  const getErrorsByTag = useCallback((tag) => {
    return errors.filter((e) => e.tag === tag)
  }, [errors])

  const value = {
    errors,
    addError,
    syncErrors,
    clearError,
    clearErrorsByTag,
    getErrorsByType,
    getErrorsByTag,
    hasErrors: errors.length > 0,
    hasCriticalErrors: errors.some((e) => e.type === ERROR_TYPE.CRITICAL),
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  )
}

/**
 * useErrorHandler - ErrorContextを使用するカスタムフック
 * @returns {object} エラー管理用のメソッドと状態
 * @throws {Error} ErrorProvider外で使用された場合
 */
export function useErrorHandler() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useErrorHandler must be used within ErrorProvider')
  }
  return context
}
