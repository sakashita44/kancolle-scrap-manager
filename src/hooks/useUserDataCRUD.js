/**
 * ユーザーデータCRUD操作汎用フック
 * add/update/delete操作を共通化
 * @module hooks/useUserDataCRUD
 */

import { useCallback } from 'react';
import { useErrorHandler, ERROR_TYPE } from './useErrorHandler.js';
import { logError } from '../utils/logger.js';

/**
 * ユーザーデータのCRUD操作を提供する汎用フック
 * @param {Array} userData - ユーザーデータ配列
 * @param {Function} setUserData - ユーザーデータ更新関数
 * @param {Function} saveUserData - ストレージ保存関数
 * @param {string} dataType - データ種別名（エラーログ用）
 * @returns {Object} CRUD操作関数
 */
export function useUserDataCRUD(userData, setUserData, saveUserData, dataType) {
  const { addError } = useErrorHandler();
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
      logError(`Failed to add ${dataType}`, {
        function: 'useUserDataCRUD.addItem',
        dataType,
        error: err,
      });
      addError(ERROR_TYPE.ERROR, `${dataType}の追加に失敗しました: ${err.message}`, {
        tag: `crud-${dataType}`,
        source: 'crud',
        operation: 'add',
        dataType,
      });
      return false;
    }
  }, [userData, setUserData, saveUserData, addError, dataType]);

  /**
   * ユーザーデータを更新
   * @param {string} id - 更新するアイテムのID
   * @param {Object} updatedItem - 更新後のアイテム
   * @returns {boolean} 成功時true
   */
  const updateItem = useCallback((id, updatedItem) => {
    try {
      setUserData((prevData) => {
        const updated = prevData.map((item) =>
          item.id === id ? updatedItem : item
        );
        saveUserData(updated);
        return updated;
      });
      return true;
    } catch (err) {
      logError(`Failed to update ${dataType}`, {
        function: 'useUserDataCRUD.updateItem',
        dataType,
        id,
        error: err,
      });
      addError(ERROR_TYPE.ERROR, `${dataType}の更新に失敗しました: ${err.message}`, {
        tag: `crud-${dataType}`,
        source: 'crud',
        operation: 'update',
        dataType,
        id,
      });
      return false;
    }
  }, [setUserData, saveUserData, addError, dataType]);

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
      logError(`Failed to delete ${dataType}`, {
        function: 'useUserDataCRUD.deleteItem',
        dataType,
        id,
        error: err,
      });
      addError(ERROR_TYPE.ERROR, `${dataType}の削除に失敗しました: ${err.message}`, {
        tag: `crud-${dataType}`,
        source: 'crud',
        operation: 'delete',
        dataType,
        id,
      });
      return false;
    }
  }, [userData, setUserData, saveUserData, addError, dataType]);

  return {
    addItem,
    updateItem,
    deleteItem,
  };
}
