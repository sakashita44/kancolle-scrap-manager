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
import { toRuntimeCategories, createCategoryMaps } from '../utils/dataConverter.js';

/**
 * カテゴリデータを管理するカスタムフック
 * @returns {Object} カテゴリデータと操作関数
 */
export function useCategories() {
  const [allCategories, setAllCategories] = useState([]);
  const [crudError, setCrudError] = useState(null);

  // マスタデータをインポート（isMasterフラグを付与）
  const masterCategories = useMemo(() => {
    return toRuntimeCategories(categoriesData.categories, true);
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

  // カテゴリ関連のMap生成
  const { categoryMap, categoryNameMap, categoryIds } = useMemo(() => {
    return createCategoryMaps(categories);
  }, [categories]);

  // カテゴリIDからカテゴリ名を取得
  const getCategoryName = useCallback((categoryId) => {
    return categoryNameMap.get(categoryId) || categoryId;
  }, [categoryNameMap]);

  // カテゴリIDからカテゴリオブジェクトを取得
  const getCategoryById = useCallback((categoryId) => {
    return categoryMap.get(categoryId) || null;
  }, [categoryMap]);

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
    getCategoryById,
    getNextOrder,
  };
}
