/**
 * ユーザーデータ読込汎用フック
 * LocalStorageからのユーザーデータ読込処理を共通化
 * @module hooks/useUserDataLoader
 */

import { useState, useEffect } from 'react';
import { logError } from '../utils/logger.js';

/**
 * ユーザーデータを読み込む汎用フック
 * @param {Function} loadFn - ロード関数（loadUserEquipments/loadUserMissions）
 * @param {string} dataType - データ種別名（エラーログ用）
 * @returns {Object} ユーザーデータと破損アイテム
 */
export function useUserDataLoader(loadFn, dataType) {
  const [userData, setUserData] = useState([]);
  const [corruptedItems, setCorruptedItems] = useState([]);

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
    }
  }, [loadFn, dataType]);

  return {
    userData,
    setUserData,
    corruptedItems,
  };
}
