/**
 * カテゴリデータ管理フック
 * 公式マスタカテゴリの取得と管理
 * @module hooks/useCategories
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchCategories } from '../utils/dataFetch.js';

/**
 * カテゴリデータを管理するカスタムフック
 * @param {string} [appVersion='1.0.0'] - アプリバージョン
 * @returns {Object} カテゴリデータと操作関数
 */
export function useCategories(appVersion = '1.0.0') {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  // マスタデータをフェッチ
  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchCategories(appVersion);

        if (isMounted) {
          setCategories(result.data.categories || []);
          setDataSource(result.source);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useCategories] Failed to load categories:', err);
          setError(err.message);
          setCategories([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [appVersion]);

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
    categoryNameMap,
    categoryIds,

    // 状態
    loading,
    error,
    dataSource,

    // ユーティリティ
    getCategoryName,
  };
}
