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
import { toRuntimeEquipments, generateCategoryRepresentatives, addEquipmentType, createEquipmentMap } from '../utils/dataConverter.js';
import { useErrorHandler, ERROR_TYPE } from '../contexts/ErrorContext.jsx';
import { swapEquipmentOrder } from '../domain/equipmentOperations.js';

/**
 * 装備データを管理するカスタムフック
 * @param {Array} categories - カテゴリ配列
 * @param {Map} categoryMap - カテゴリID→カテゴリオブジェクトのMap
 * @returns {Object} 装備データと操作関数
 */
export function useEquipments(categories, categoryMap) {
  const [equipments, setEquipments] = useState([]);
  const [crudError, setCrudError] = useState(null);

  // エラーハンドラーを取得（Context経由）
  const { syncErrors } = useErrorHandler();

  // マスタデータをインポート（isMasterフラグを付与）
  const masterEquipments = useMemo(() => {
    return toRuntimeEquipments(equipmentsData.equipments, true);
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
    return createEquipmentMap(equipments);
  }, [equipments]);

  // UI表示用にカテゴリ代表を動的生成してマージ
  const equipmentsForUI = useMemo(() => {
    // カテゴリ代表を動的生成
    const categoryReps = generateCategoryRepresentatives(categories);

    // 装備にtypeフィールドを付与
    const equipmentsWithType = addEquipmentType(equipments);

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
    return equipmentsForUI.find((eq) => eq.id === equipmentId) || null;
  }, [equipmentsForUI]);

  // ユーザー定義装備の次の order 値を取得
  const getNextOrder = useCallback(() => {
    return getNextOrderUtil(userEquipments);
  }, [userEquipments]);

  /**
   * ユーザー装備の順序を入れ替えて永続化
   * @param {string} id1 - 装備ID 1
   * @param {string} id2 - 装備ID 2
   * @returns {boolean} 成功したかどうか
   */
  const swapUserEquipmentOrder = useCallback((id1, id2) => {
    const { nextList, swapped } = swapEquipmentOrder(userEquipments, id1, id2);
    if (swapped) {
      setUserEquipments(nextList);
      saveUserEquipments(nextList);
    }
    return swapped;
  }, [userEquipments, setUserEquipments]);

  // 破損データを統合エラーハンドラーに登録（Pub/Subモデル）
  useEffect(() => {
    if (corruptedItems.length > 0) {
      const errors = corruptedItems.map((item) => ({
        type: ERROR_TYPE.WARNING,
        message: `装備 "${item.name || item.id}": ${item.reason}`,
        context: { source: 'data-integrity', dataType: 'equipment', item },
      }));
      syncErrors('corrupted-equipments', errors);
    } else {
      syncErrors('corrupted-equipments', []);
    }
  }, [corruptedItems, syncErrors]);

  // CRUDエラーを統合エラーハンドラーに登録
  useEffect(() => {
    if (crudError) {
      syncErrors('equipment-crud-error', [{
        type: ERROR_TYPE.ERROR,
        message: `装備の操作に失敗しました: ${crudError}`,
        context: { source: 'crud', dataType: 'equipment' },
      }]);
    } else {
      syncErrors('equipment-crud-error', []);
    }
  }, [crudError, syncErrors]);

  return {
    // データ
    equipments,           // 装備のみ（カテゴリ代表は含まない）
    equipmentsForUI,      // UI表示用（カテゴリ代表 + 装備、typeで区別）
    allEquipments: equipmentsForUI, // 後方互換性のため
    masterEquipments,
    userEquipments,

    // Map（検索用）
    equipmentMap,         // 装備検索用Map（カテゴリ代表は含まない）

    // 状態
    crudError,
    corruptedItems,

    // 操作関数
    addUserEquipment,
    updateUserEquipment,
    deleteUserEquipment,
    setUserEquipments,          // カテゴリ削除時の一括処理用
    swapUserEquipmentOrder,     // 順序入れ替え（set+save集約）

    // ユーティリティ
    findEquipmentById,
    getNextOrder,
  };
}
