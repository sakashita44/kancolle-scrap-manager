/**
 * 選択任務の状態管理フック
 * SessionStorageと連携して選択状態を永続化
 * @module hooks/useSelectedMissions
 */

import { useState, useEffect, useCallback } from 'react';
import {
  loadSelectedMissions,
  saveSelectedMissions,
  clearSelectedMissions,
} from '../utils/sessionStorage.js';
import { LIMITS } from '../types/schema.js';
import { logError, logWarning } from '../utils/logger.js';

/**
 * 選択任務を管理するカスタムフック
 * @returns {Object} 選択任務IDリストと操作関数
 */
export function useSelectedMissions() {
  const [selectedMissionIds, setSelectedMissionIds] = useState([]);

  // 初回マウント時にSessionStorageから読込
  useEffect(() => {
    try {
      const loaded = loadSelectedMissions();
      setSelectedMissionIds(loaded);
    } catch (err) {
      logError('Failed to load selected missions', {
        function: 'useSelectedMissions',
        error: err,
      });
    }
  }, []);

  // 選択状態が変更されたらSessionStorageに保存
  useEffect(() => {
    try {
      saveSelectedMissions(selectedMissionIds);
    } catch (err) {
      logError('Failed to save selected missions', {
        function: 'useSelectedMissions',
        error: err,
      });
    }
  }, [selectedMissionIds]);

  // 任務を選択
  const selectMission = useCallback((missionId) => {
    setSelectedMissionIds((prev) => {
      // 既に選択済みの場合は何もしない
      if (prev.includes(missionId)) {
        return prev;
      }

      // 最大選択数チェック
      if (prev.length >= LIMITS.SELECTED_MISSIONS_MAX) {
        logWarning('Maximum missions can be selected', {
          function: 'useSelectedMissions.selectMission',
          maxSelections: LIMITS.SELECTED_MISSIONS_MAX,
        });
        return prev;
      }

      return [...prev, missionId];
    });
  }, []);

  // 任務の選択を解除
  const deselectMission = useCallback((missionId) => {
    setSelectedMissionIds((prev) => prev.filter((id) => id !== missionId));
  }, []);

  // 任務の選択状態をトグル
  const toggleMission = useCallback((missionId) => {
    setSelectedMissionIds((prev) => {
      // 選択解除
      if (prev.includes(missionId)) {
        return prev.filter((id) => id !== missionId);
      }

      // 最大数チェック
      if (prev.length >= LIMITS.SELECTED_MISSIONS_MAX) {
        logWarning('Maximum missions can be selected', {
          function: 'useSelectedMissions.toggleMission',
          maxSelections: LIMITS.SELECTED_MISSIONS_MAX,
        });
        return prev;
      }

      // 選択
      return [...prev, missionId];
    });
  }, []);

  // 全ての選択を解除
  const clearSelection = useCallback(() => {
    setSelectedMissionIds([]);
    clearSelectedMissions();
  }, []);

  // 任務が選択されているかチェック
  const isSelected = useCallback(
    (missionId) => {
      return selectedMissionIds.includes(missionId);
    },
    [selectedMissionIds]
  );

  // 選択可能かチェック（最大数に達していないか）
  const canSelect = useCallback(() => {
    return selectedMissionIds.length < LIMITS.SELECTED_MISSIONS_MAX;
  }, [selectedMissionIds]);

  return {
    // データ
    selectedMissionIds,
    selectedCount: selectedMissionIds.length,
    maxSelections: LIMITS.SELECTED_MISSIONS_MAX,

    // 操作関数
    selectMission,
    deselectMission,
    toggleMission,
    clearSelection,

    // ユーティリティ
    isSelected,
    canSelect,
  };
}
