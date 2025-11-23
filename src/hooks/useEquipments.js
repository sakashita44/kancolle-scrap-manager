/**
 * 装備データ管理フック
 * 公式マスタ + ユーザー定義装備のマージと管理
 * @module hooks/useEquipments
 */

import { useState, useEffect, useCallback } from 'react';
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

  // ユーザー定義装備をLocalStorageから読込
  useEffect(() => {
    try {
      const loaded = loadUserEquipments();
      setUserEquipments(loaded);
    } catch (err) {
      console.error('[useEquipments] Failed to load user equipments:', err);
      setUserEquipments([]);
    }
  }, []);

  // 公式マスタとユーザー定義をマージ
  useEffect(() => {
    const merged = [...masterEquipments, ...userEquipments];
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

  // カテゴリで装備をフィルタ
  const filterByCategory = useCallback((category) => {
    return allEquipments.filter((eq) => eq.category === category);
  }, [allEquipments]);

  // 全カテゴリのリストを取得（重複なし）
  const getCategories = useCallback(() => {
    const categories = allEquipments.map((eq) => eq.category);
    return [...new Set(categories)].sort();
  }, [allEquipments]);

  return {
    // データ
    masterEquipments,
    userEquipments,
    allEquipments,

    // 状態
    loading,
    error,
    dataSource,

    // 操作関数
    addUserEquipment,
    updateUserEquipment,
    deleteUserEquipment,

    // ユーティリティ
    findEquipmentById,
    filterByCategory,
    getCategories,
  };
}
