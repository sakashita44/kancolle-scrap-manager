/**
 * ユーザーデータ読込汎用フック
 * LocalStorageからのユーザーデータ読込処理を共通化
 * @module hooks/useUserDataLoader
 */

import { useState, useEffect } from 'react';
import { logError } from '../utils/logger.js';
import { useErrorHandler, ERROR_TYPE } from './useErrorHandler.js';

/**
 * ユーザーデータを読み込む汎用フック
 * @param {Function} loadFn - ロード関数（loadUserEquipments/loadUserMissions）
 * @param {string} dataType - データ種別名（エラーログ用）
 * @returns {Object} ユーザーデータと破損アイテム
 */
export function useUserDataLoader(loadFn, dataType) {
  const [userData, setUserData] = useState([]);
  const [corruptedItems, setCorruptedItems] = useState([]);
  const { addError } = useErrorHandler();

  useEffect(() => {
    try {
      const result = loadFn();
      setUserData(result.data);
      setCorruptedItems(result.corruptedItems);
    } catch (err) {
      logError(`Failed to load ${dataType}`, {
        function: 'useUserDataLoader',
        dataType,
        error: err,
      });
      setUserData([]);
      setCorruptedItems([]);
      // 統合エラーハンドラーに通知
      addError(ERROR_TYPE.WARNING, `データの読み込みに失敗しました（${dataType}）`, {
        source: 'data-loader',
        dataType,
        error: err.message,
      });
    }
  }, [loadFn, dataType, addError]);

  return {
    userData,
    setUserData,
    corruptedItems,
  };
}
