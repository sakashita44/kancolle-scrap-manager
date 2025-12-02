/**
 * カテゴリデータ管理フック
 * 公式マスタカテゴリの取得と管理
 * @module hooks/useCategories
 */

import { useCallback, useMemo } from 'react';
import categoriesData from '../data/categories.json';

/**
 * カテゴリデータを管理するカスタムフック
 * @returns {Object} カテゴリデータと操作関数
 */
export function useCategories() {
  // マスタデータをインポート（isMasterフラグを付与）
  const categories = useMemo(() => {
    return categoriesData.categories.map(cat => ({
      ...cat,
      isMaster: true
    }));
  }, []);

  // カテゴリID→カテゴリオブジェクトのMap
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      map.set(cat.id, cat);
    });
    return map;
  }, [categories]);

  // カテゴリIDからカテゴリ名への変換Map（order順にソート済み）
  const categoryNameMap = useMemo(() => {
    const map = new Map();
    // categoriesは既にorder順にソート済み（isMaster: trueで取得）
    categories.forEach((cat) => {
      map.set(cat.id, cat.name);
    });
    return map;
  }, [categories]);

  // カテゴリIDからカテゴリ名を取得
  const getCategoryName = useCallback((categoryId) => {
    return categoryNameMap.get(categoryId) || categoryId;
  }, [categoryNameMap]);

  // カテゴリIDのリストを取得（order順）
  const categoryIds = useMemo(() => {
    return categories.map(cat => cat.id);
  }, [categories]);

  return {
    // データ
    categories,
    categoryMap,
    categoryNameMap,
    categoryIds,

    // ユーティリティ
    getCategoryName,
  };
}
