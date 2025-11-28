/**
 * 装備データ管理フック
 * 公式マスタ + ユーザー定義装備のマージと管理
 * @module hooks/useEquipments
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import equipmentsData from '../data/equipments.json';
import { loadUserEquipments, saveUserEquipments } from '../utils/localStorage.js';
import { getNextOrder as getNextOrderUtil, mergeAndSort, createDefaultSortComparator } from '../utils/dataManagement.js';
import { useUserDataLoader } from './useUserDataLoader.js';
import { useUserDataCRUD } from './useUserDataCRUD.js';

/**
 * 装備データを管理するカスタムフック
 * @returns {Object} 装備データと操作関数
 */
export function useEquipments() {
  const [allEquipments, setAllEquipments] = useState([]);
  const [crudError, setCrudError] = useState(null);

  // マスタデータをインポート（isMasterフラグを付与）
  const masterEquipments = useMemo(() => {
    return equipmentsData.equipments.map(eq => ({
      ...eq,
      isMaster: true
    }));
  }, []);

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
    setCrudError,
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
    crudError,
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
