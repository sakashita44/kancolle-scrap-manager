/**
 * 任務データ管理フック
 * 公式マスタ + ユーザー定義任務のマージと管理
 * @module hooks/useMissions
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchMissions } from '../utils/dataFetch.js';
import { loadUserMissions, saveUserMissions } from '../utils/localStorage.js';
import { PERIOD_ORDER } from '../types/schema.js';
import { getNextOrder as getNextOrderUtil, mergeAndSort, createMissionSortComparator } from '../utils/dataManagement.js';
import { useMasterData } from './useMasterData.js';
import { useUserDataLoader } from './useUserDataLoader.js';
import { useUserDataCRUD } from './useUserDataCRUD.js';

/**
 * 任務データを管理するカスタムフック
 * @param {string} [appVersion='1.0.0'] - アプリバージョン
 * @returns {Object} 任務データと操作関数
 */
export function useMissions(appVersion = '1.0.0') {
  const [allMissions, setAllMissions] = useState([]);

  // マスタデータをフェッチ
  const { masterData: masterMissions, loading, error, dataSource } = useMasterData(
    fetchMissions,
    'missions',
    appVersion
  );

  // ユーザー定義任務をLocalStorageから読込
  const { userData: userMissions, setUserData: setUserMissions, corruptedItems } = useUserDataLoader(
    loadUserMissions,
    'mission'
  );

  // 公式マスタとユーザー定義をマージしてソート
  useEffect(() => {
    const merged = mergeAndSort(masterMissions, userMissions, createMissionSortComparator(PERIOD_ORDER));
    setAllMissions(merged);
  }, [masterMissions, userMissions]);

  // CRUD操作を取得
  const { addItem: addUserMission, updateItem: updateUserMission, deleteItem: deleteUserMission } = useUserDataCRUD(
    userMissions,
    setUserMissions,
    saveUserMissions,
    () => {}, // setError は不要（useMasterDataで管理）
    'mission'
  );

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
    return getNextOrderUtil(userMissions);
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
