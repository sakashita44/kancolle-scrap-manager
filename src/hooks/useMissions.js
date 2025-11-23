/**
 * 任務データ管理フック
 * 公式マスタ + ユーザー定義任務のマージと管理
 * @module hooks/useMissions
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchMissions } from '../utils/dataFetch.js';
import { loadUserMissions, saveUserMissions } from '../utils/localStorage.js';

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

  // ユーザー定義任務をLocalStorageから読込
  useEffect(() => {
    try {
      const loaded = loadUserMissions();
      setUserMissions(loaded);
    } catch (err) {
      console.error('[useMissions] Failed to load user missions:', err);
      setUserMissions([]);
    }
  }, []);

  // 公式マスタとユーザー定義をマージ
  useEffect(() => {
    const merged = [...masterMissions, ...userMissions];
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

  return {
    // データ
    masterMissions,
    userMissions,
    allMissions,

    // 状態
    loading,
    error,
    dataSource,

    // 操作関数
    addUserMission,
    updateUserMission,
    deleteUserMission,

    // ユーティリティ
    findMissionById,
    filterByPeriod,
    getPeriods,
  };
}
