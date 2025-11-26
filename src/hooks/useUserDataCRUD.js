/**
 * ユーザーデータCRUD操作汎用フック
 * add/update/delete操作を共通化
 * @module hooks/useUserDataCRUD
 */

import { useCallback } from 'react';

/**
 * ユーザーデータのCRUD操作を提供する汎用フック
 * @param {Array} userData - ユーザーデータ配列
 * @param {Function} setUserData - ユーザーデータ更新関数
 * @param {Function} saveUserData - ストレージ保存関数
 * @param {Function} setError - エラー設定関数
 * @param {string} dataType - データ種別名（エラーログ用）
 * @returns {Object} CRUD操作関数
 */
export function useUserDataCRUD(userData, setUserData, saveUserData, setError, dataType) {
  /**
   * ユーザーデータを追加
   * @param {Object} item - 追加するアイテム
   * @returns {boolean} 成功時true
   */
  const addItem = useCallback((item) => {
    try {
      const updated = [...userData, item];
      setUserData(updated);
      saveUserData(updated);
      return true;
    } catch (err) {
      console.error(`[useUserDataCRUD] Failed to add ${dataType}:`, err);
      setError(err.message);
      return false;
    }
  }, [userData, setUserData, saveUserData, setError, dataType]);

  /**
   * ユーザーデータを更新
   * @param {string} id - 更新するアイテムのID
   * @param {Object} updatedItem - 更新後のアイテム
   * @returns {boolean} 成功時true
   */
  const updateItem = useCallback((id, updatedItem) => {
    try {
      const updated = userData.map((item) =>
        item.id === id ? updatedItem : item
      );
      setUserData(updated);
      saveUserData(updated);
      return true;
    } catch (err) {
      console.error(`[useUserDataCRUD] Failed to update ${dataType}:`, err);
      setError(err.message);
      return false;
    }
  }, [userData, setUserData, saveUserData, setError, dataType]);

  /**
   * ユーザーデータを削除
   * @param {string} id - 削除するアイテムのID
   * @returns {boolean} 成功時true
   */
  const deleteItem = useCallback((id) => {
    try {
      const updated = userData.filter((item) => item.id !== id);
      setUserData(updated);
      saveUserData(updated);
      return true;
    } catch (err) {
      console.error(`[useUserDataCRUD] Failed to delete ${dataType}:`, err);
      setError(err.message);
      return false;
    }
  }, [userData, setUserData, saveUserData, setError, dataType]);

  return {
    addItem,
    updateItem,
    deleteItem,
  };
}
