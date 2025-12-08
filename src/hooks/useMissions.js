/**
 * 任務データ管理フック
 * 公式マスタ + ユーザー定義任務のマージと管理
 * @module hooks/useMissions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import missionsData from '../data/missions.json';
import { loadUserMissions, saveUserMissions } from '../utils/localStorage.js';
import { PERIOD_ORDER } from '../types/schema.js';
import { getNextOrder as getNextOrderUtil, mergeAndSort, createMissionSortComparator } from '../utils/dataManagement.js';
import { useUserDataLoader } from './useUserDataLoader.js';
import { useUserDataCRUD } from './useUserDataCRUD.js';
import { toRuntimeMissions } from '../utils/dataConverter.js';

/**
 * 任務データを管理するカスタムフック
 * @returns {Object} 任務データと操作関数
 */
export function useMissions() {
  const [allMissions, setAllMissions] = useState([]);

  // マスタデータをインポート（isMasterフラグを付与）
  const masterMissions = useMemo(() => {
    return toRuntimeMissions(missionsData.missions, true);
  }, []);

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
