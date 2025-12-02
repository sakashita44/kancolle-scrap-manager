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
import { useCategories } from './useCategories.js';
import { EQUIPMENT_TYPE } from '../types/schema.js';

/**
 * 装備データを管理するカスタムフック
 * @returns {Object} 装備データと操作関数
 */
export function useEquipments() {
  const [equipments, setEquipments] = useState([]);
  const [crudError, setCrudError] = useState(null);

  // カテゴリデータを取得
  const { categories, categoryMap } = useCategories();

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

  // 公式マスタとユーザー定義をマージしてソート（装備のみ、カテゴリ代表は含まない）
  useEffect(() => {
    const merged = mergeAndSort(masterEquipments, userEquipments, createDefaultSortComparator());
    setEquipments(merged);
  }, [masterEquipments, userEquipments]);

  // 装備検索用Map（カテゴリ代表は含まない）
  const equipmentMap = useMemo(() => {
    return new Map(equipments.map(eq => [eq.id, eq]));
  }, [equipments]);

  // UI表示用にカテゴリ代表を動的生成してマージ
  const allEquipmentsForUI = useMemo(() => {
    // カテゴリ代表を動的生成
    const categoryReps = categories.map(cat => ({
      id: cat.id,                    // カテゴリIDをそのまま使用
      name: cat.name + '（種別不問）',
      categoryId: cat.id,
      isMaster: cat.isMaster,
      type: EQUIPMENT_TYPE.CATEGORY,
      order: cat.order
    }));

    // 装備にtypeフィールドを付与
    const equipmentsWithType = equipments.map(eq => ({
      ...eq,
      type: EQUIPMENT_TYPE.ITEM
    }));

    // マージしてソート
    return [...categoryReps, ...equipmentsWithType].sort((a, b) => {
      if (a.isMaster !== b.isMaster) return b.isMaster ? 1 : -1;
      return a.order - b.order;
    });
  }, [categories, equipments]);

  // CRUD操作を取得
  const { addItem: addUserEquipment, updateItem: updateUserEquipment, deleteItem: deleteUserEquipment } = useUserDataCRUD(
    userEquipments,
    setUserEquipments,
    saveUserEquipments,
    setCrudError,
    'equipment'
  );

  // IDで装備を検索（UI表示用リストから検索）
  const findEquipmentById = useCallback((equipmentId) => {
    return allEquipmentsForUI.find((eq) => eq.id === equipmentId) || null;
  }, [allEquipmentsForUI]);

  // ユーザー定義装備の次の order 値を取得
  const getNextOrder = useCallback(() => {
    return getNextOrderUtil(userEquipments);
  }, [userEquipments]);

  return {
    // データ
    categories,           // カテゴリ配列
    equipments,           // 装備のみ（カテゴリ代表は含まない）
    allEquipmentsForUI,   // UI表示用（カテゴリ代表 + 装備、typeで区別）
    allEquipments: allEquipmentsForUI, // 後方互換性のため
    masterEquipments,
    userEquipments,

    // Map（検索用）
    categoryMap,          // カテゴリ検索用Map
    equipmentMap,         // 装備検索用Map（カテゴリ代表は含まない）

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
