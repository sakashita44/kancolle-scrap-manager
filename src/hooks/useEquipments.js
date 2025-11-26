/**
 * 装備データ管理フック
 * 公式マスタ + ユーザー定義装備のマージと管理
 * @module hooks/useEquipments
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchEquipments } from '../utils/dataFetch.js';
import { loadUserEquipments, saveUserEquipments } from '../utils/localStorage.js';
import { getNextOrder as getNextOrderUtil, mergeAndSort, createDefaultSortComparator } from '../utils/dataManagement.js';
import { useMasterData } from './useMasterData.js';
import { useUserDataLoader } from './useUserDataLoader.js';
import { useUserDataCRUD } from './useUserDataCRUD.js';

/**
 * 装備データを管理するカスタムフック
 * @param {string} [appVersion='1.0.0'] - アプリバージョン
 * @returns {Object} 装備データと操作関数
 */
export function useEquipments(appVersion = '1.0.0') {
  const [allEquipments, setAllEquipments] = useState([]);

  // マスタデータをフェッチ
  const { masterData: masterEquipments, loading, error, dataSource } = useMasterData(
    fetchEquipments,
    'equipments',
    appVersion
  );

  // ユーザー定義装備をLocalStorageから読込
  const { userData: userEquipments, setUserData: setUserEquipments, corruptedItems } = useUserDataLoader(
    loadUserEquipments,
    'equipment'
  );

  // 公式マスタとユーザー定義をマージしてソート
  useEffect(() => {
    const merged = mergeAndSort(masterEquipments, userEquipments, createDefaultSortComparator());
    setAllEquipments(merged);
  }, [masterEquipments, userEquipments]);

  // CRUD操作を取得
  const { addItem: addUserEquipment, updateItem: updateUserEquipment, deleteItem: deleteUserEquipment } = useUserDataCRUD(
    userEquipments,
    setUserEquipments,
    saveUserEquipments,
    () => {}, // setError は不要（useMasterDataで管理）
    'equipment'
  );

  // IDで装備を検索
  const findEquipmentById = useCallback((equipmentId) => {
    return allEquipments.find((eq) => eq.id === equipmentId) || null;
  }, [allEquipments]);

  // ユーザー定義装備の次の order 値を取得
  const getNextOrder = useCallback(() => {
    return getNextOrderUtil(userEquipments);
  }, [userEquipments]);

  return {
    // データ
    masterEquipments,
    userEquipments,
    allEquipments,

    // 状態
    loading,
    error,
    dataSource,
    corruptedItems,

    // 操作関数
    addUserEquipment,
    updateUserEquipment,
    deleteUserEquipment,

    // ユーティリティ
    findEquipmentById,
    getNextOrder,
  };
}
