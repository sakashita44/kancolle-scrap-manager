/**
 * 装備データ管理フック
 * 公式マスタ + ユーザー定義装備のマージと管理
 * @module hooks/useEquipments
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchEquipments } from '../utils/dataFetch.js';
import { loadUserEquipments, saveUserEquipments } from '../utils/localStorage.js';

/**
 * 装備データを管理するカスタムフック
 * @param {string} [appVersion='1.0.0'] - アプリバージョン
 * @returns {Object} 装備データと操作関数
 */
export function useEquipments(appVersion = '1.0.0') {
  const [masterEquipments, setMasterEquipments] = useState([]);
  const [userEquipments, setUserEquipments] = useState([]);
  const [allEquipments, setAllEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [corruptedItems, setCorruptedItems] = useState([]);

  // マスタデータをフェッチ
  useEffect(() => {
    let isMounted = true;

    async function loadMasterEquipments() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchEquipments(appVersion);

        if (isMounted) {
          setMasterEquipments(result.data.equipments || []);
          setDataSource(result.source);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useEquipments] Failed to load master equipments:', err);
          setError(err.message);
          setMasterEquipments([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMasterEquipments();

    return () => {
      isMounted = false;
    };
  }, [appVersion]);

  // ユーザー定義装備をLocalStorageから読込（起動時バリデーション付き）
  useEffect(() => {
    try {
      const result = loadUserEquipments();
      setUserEquipments(result.data);
      setCorruptedItems(result.corruptedItems);
    } catch (err) {
      console.error('[useEquipments] Failed to load user equipments:', err);
      setUserEquipments([]);
      setCorruptedItems([]);
    }
  }, []);

  // 公式マスタとユーザー定義をマージしてソート
  useEffect(() => {
    const merged = [...masterEquipments, ...userEquipments];

    // ソート: isMaster優先（公式が先）→ order昇順
    merged.sort((a, b) => {
      // 公式優先（isMasterは取得時に自動付与済み）
      if (a.isMaster !== b.isMaster) return b.isMaster ? 1 : -1;
      // 同じグループ内ではorder順
      return a.order - b.order;
    });

    setAllEquipments(merged);
  }, [masterEquipments, userEquipments]);

  // ユーザー定義装備を追加
  const addUserEquipment = useCallback((equipment) => {
    try {
      const updated = [...userEquipments, equipment];
      setUserEquipments(updated);
      saveUserEquipments(updated);
      return true;
    } catch (err) {
      console.error('[useEquipments] Failed to add user equipment:', err);
      setError(err.message);
      return false;
    }
  }, [userEquipments]);

  // ユーザー定義装備を更新
  const updateUserEquipment = useCallback((equipmentId, updatedEquipment) => {
    try {
      const updated = userEquipments.map((eq) =>
        eq.id === equipmentId ? updatedEquipment : eq
      );
      setUserEquipments(updated);
      saveUserEquipments(updated);
      return true;
    } catch (err) {
      console.error('[useEquipments] Failed to update user equipment:', err);
      setError(err.message);
      return false;
    }
  }, [userEquipments]);

  // ユーザー定義装備を削除
  const deleteUserEquipment = useCallback((equipmentId) => {
    try {
      const updated = userEquipments.filter((eq) => eq.id !== equipmentId);
      setUserEquipments(updated);
      saveUserEquipments(updated);
      return true;
    } catch (err) {
      console.error('[useEquipments] Failed to delete user equipment:', err);
      setError(err.message);
      return false;
    }
  }, [userEquipments]);

  // IDで装備を検索
  const findEquipmentById = useCallback((equipmentId) => {
    return allEquipments.find((eq) => eq.id === equipmentId) || null;
  }, [allEquipments]);

  // ユーザー定義装備の次の order 値を取得
  const getNextOrder = useCallback(() => {
    if (userEquipments.length === 0) return 1;
    const maxOrder = Math.max(...userEquipments.map(eq => eq.order || 0));
    return maxOrder + 1;
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
