/**
 * 任務データ管理フック
 * 公式マスタ + ユーザー定義任務のマージと管理
 * @module hooks/useMissions
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchMissions } from '../utils/dataFetch.js';
import { loadUserMissions, saveUserMissions } from '../utils/localStorage.js';
import { PERIOD_ORDER } from '../types/schema.js';

/**
 * 任務データを管理するカスタムフック
 * @param {string} [appVersion='1.0.0'] - アプリバージョン
 * @returns {Object} 任務データと操作関数
 */
export function useMissions(appVersion = '1.0.0') {
  const [masterMissions, setMasterMissions] = useState([]);
  const [userMissions, setUserMissions] = useState([]);
  const [allMissions, setAllMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [corruptedItems, setCorruptedItems] = useState([]);

  // マスタデータをフェッチ
  useEffect(() => {
    let isMounted = true;

    async function loadMasterMissions() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchMissions(appVersion);

        if (isMounted) {
          setMasterMissions(result.data.missions || []);
          setDataSource(result.source);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useMissions] Failed to load master missions:', err);
          setError(err.message);
          setMasterMissions([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMasterMissions();

    return () => {
      isMounted = false;
    };
  }, [appVersion]);

  // ユーザー定義任務をLocalStorageから読込（起動時バリデーション付き）
  useEffect(() => {
    try {
      const result = loadUserMissions();
      setUserMissions(result.data);
      setCorruptedItems(result.corruptedItems);
    } catch (err) {
      console.error('[useMissions] Failed to load user missions:', err);
      setUserMissions([]);
      setCorruptedItems([]);
    }
  }, []);

  // 公式マスタとユーザー定義をマージしてソート
  useEffect(() => {
    const merged = [...masterMissions, ...userMissions];

    // ソート: 周期順（PERIOD_ORDER） → isMaster優先（公式が先） → order昇順
    merged.sort((a, b) => {
      // 周期順（PERIOD_ORDERに基づく）
      const periodIndexA = PERIOD_ORDER.indexOf(a.period);
      const periodIndexB = PERIOD_ORDER.indexOf(b.period);
      if (periodIndexA !== periodIndexB) return periodIndexA - periodIndexB;

      // 同じ周期内では公式優先（isMasterは取得時に自動付与済み）
      if (a.isMaster !== b.isMaster) return b.isMaster ? 1 : -1;

      // 同じグループ内ではorder順
      return a.order - b.order;
    });

    setAllMissions(merged);
  }, [masterMissions, userMissions]);

  // ユーザー定義任務を追加
  const addUserMission = useCallback((mission) => {
    try {
      const updated = [...userMissions, mission];
      setUserMissions(updated);
      saveUserMissions(updated);
      return true;
    } catch (err) {
      console.error('[useMissions] Failed to add user mission:', err);
      setError(err.message);
      return false;
    }
  }, [userMissions]);

  // ユーザー定義任務を更新
  const updateUserMission = useCallback((missionId, updatedMission) => {
    try {
      const updated = userMissions.map((ms) =>
        ms.id === missionId ? updatedMission : ms
      );
      setUserMissions(updated);
      saveUserMissions(updated);
      return true;
    } catch (err) {
      console.error('[useMissions] Failed to update user mission:', err);
      setError(err.message);
      return false;
    }
  }, [userMissions]);

  // ユーザー定義任務を削除
  const deleteUserMission = useCallback((missionId) => {
    try {
      const updated = userMissions.filter((ms) => ms.id !== missionId);
      setUserMissions(updated);
      saveUserMissions(updated);
      return true;
    } catch (err) {
      console.error('[useMissions] Failed to delete user mission:', err);
      setError(err.message);
      return false;
    }
  }, [userMissions]);

  // IDで任務を検索
  const findMissionById = useCallback((missionId) => {
    return allMissions.find((ms) => ms.id === missionId) || null;
  }, [allMissions]);

  // 周期でフィルタ
  const filterByPeriod = useCallback((period) => {
    return allMissions.filter((ms) => ms.period === period);
  }, [allMissions]);

  // 全周期のリストを取得（重複なし）
  const getPeriods = useCallback(() => {
    const periods = allMissions.map((ms) => ms.period);
    return [...new Set(periods)].sort();
  }, [allMissions]);

  // ユーザー定義任務の次の order 値を取得
  const getNextOrder = useCallback(() => {
    if (userMissions.length === 0) return 1;
    const maxOrder = Math.max(...userMissions.map(ms => ms.order || 0));
    return maxOrder + 1;
  }, [userMissions]);

  return {
    // データ
    masterMissions,
    userMissions,
    allMissions,

    // 状態
    loading,
    error,
    dataSource,
    corruptedItems,

    // 操作関数
    addUserMission,
    updateUserMission,
    deleteUserMission,

    // ユーティリティ
    findMissionById,
    filterByPeriod,
    getPeriods,
    getNextOrder,
  };
}
