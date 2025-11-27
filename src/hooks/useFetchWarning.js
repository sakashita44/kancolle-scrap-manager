/**
 * マスタデータフェッチ警告フック
 * GitHub Pagesからのフェッチ失敗を検出し、警告メッセージを生成
 * @module hooks/useFetchWarning
 */

import { useMemo } from 'react'

/**
 * マスタデータフェッチ警告を管理
 * @param {Object} dataSources - データソース情報
 * @param {string|null} dataSources.equipments - 装備データソース ('github-pages' | 'local' | null)
 * @param {string|null} dataSources.missions - 任務データソース ('github-pages' | 'local' | null)
 * @param {string|null} dataSources.categories - カテゴリデータソース ('github-pages' | 'local' | null)
 * @returns {Object} 警告情報
 */
export function useFetchWarning({ equipments, missions, categories }) {
  const warningMessage = useMemo(() => {
    const fallbackSources = []

    if (equipments === 'local') fallbackSources.push('装備')
    if (missions === 'local') fallbackSources.push('任務')
    if (categories === 'local') fallbackSources.push('カテゴリ')

    if (fallbackSources.length === 0) {
      return null
    }

    return `マスタデータの取得に失敗しました. アプリに同梱されたバックアップデータを使用しています. ` +
      `最新データが反映されていない可能性があります. (${fallbackSources.join(', ')})`
  }, [equipments, missions, categories])

  const hasFallback = warningMessage !== null

  return {
    warningMessage,
    hasFallback
  }
}
