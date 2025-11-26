/**
 * マスタデータフェッチ汎用フック
 * 公式マスタデータの取得処理を共通化
 * @module hooks/useMasterData
 */

import { useState, useEffect } from 'react';

/**
 * マスタデータを取得する汎用フック
 * @param {Function} fetchFn - フェッチ関数（fetchEquipments/fetchMissions/fetchCategories）
 * @param {string} dataKey - 取得するデータのキー名（'equipments'/'missions'/'categories'）
 * @param {string} [appVersion='1.0.0'] - アプリバージョン
 * @returns {Object} マスタデータと状態
 */
export function useMasterData(fetchFn, dataKey, appVersion = '1.0.0') {
  const [masterData, setMasterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMasterData() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchFn(appVersion);

        if (isMounted) {
          setMasterData(result.data[dataKey] || []);
          setDataSource(result.source);
        }
      } catch (err) {
        if (isMounted) {
          console.error(`[useMasterData] Failed to load master ${dataKey}:`, err);
          setError(err.message);
          setMasterData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMasterData();

    return () => {
      isMounted = false;
    };
  }, [fetchFn, dataKey, appVersion]);

  return {
    masterData,
    loading,
    error,
    dataSource,
  };
}
