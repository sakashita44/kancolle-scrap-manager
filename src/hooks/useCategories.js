/**
 * カテゴリデータ管理フック
 * 公式マスタ + ユーザー定義カテゴリのマージと管理
 * @module hooks/useCategories
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import categoriesData from '../data/categories.json';
import { loadUserCategories, saveUserCategories } from '../utils/localStorage.js';
import { getNextOrder as getNextOrderUtil, mergeAndSort, createDefaultSortComparator } from '../utils/dataManagement.js';
import { useUserDataLoader } from './useUserDataLoader.js';
import { useUserDataCRUD } from './useUserDataCRUD.js';

/**
 * カテゴリデータを管理するカスタムフック
 * @returns {Object} カテゴリデータと操作関数
 */
export function useCategories() {
  const [allCategories, setAllCategories] = useState([]);
  const [crudError, setCrudError] = useState(null);

  // マスタデータをインポート（isMasterフラグを付与）
  const masterCategories = useMemo(() => {
    return categoriesData.categories.map(cat => ({
      ...cat,
      isMaster: true
    }));
  }, []);

  // ユーザー定義カテゴリをLocalStorageから読込
  const { userData: userCategories, setUserData: setUserCategories, corruptedItems } = useUserDataLoader(
    loadUserCategories,
    'category'
  );

  // 公式マスタとユーザー定義をマージしてソート
  useEffect(() => {
    const merged = mergeAndSort(masterCategories, userCategories, createDefaultSortComparator());
    setAllCategories(merged);
  }, [masterCategories, userCategories]);

  // CRUD操作を取得
  const { addItem: addUserCategory, updateItem: updateUserCategory, deleteItem: deleteUserCategory } = useUserDataCRUD(
    userCategories,
    setUserCategories,
    saveUserCategories,
    setCrudError,
    'category'
  );

  // categories配列（後方互換性のため）
  const categories = useMemo(() => allCategories, [allCategories]);

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

  // ユーザー定義カテゴリの次の order 値を取得
  const getNextOrder = useCallback(() => {
    return getNextOrderUtil(userCategories);
  }, [userCategories]);

  return {
    // データ
    allCategories,
    categories,
    masterCategories,
    userCategories,
    categoryMap,
    categoryNameMap,
    categoryIds,

    // 状態
    crudError,
    corruptedItems,

    // 操作関数
    addUserCategory,
    updateUserCategory,
    deleteUserCategory,

    // ユーティリティ
    getCategoryName,
    getNextOrder,
  };
}
