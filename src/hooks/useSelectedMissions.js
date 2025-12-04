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
 * @returns {Object} 選択任務リストと操作関数
 */
export function useSelectedMissions() {
  const [selectedMissions, setSelectedMissions] = useState([]);

  // 初回マウント時にSessionStorageから読込
  useEffect(() => {
    try {
      const loaded = loadSelectedMissions();
      setSelectedMissions(loaded);
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
      saveSelectedMissions(selectedMissions);
    } catch (err) {
      logError('Failed to save selected missions', {
        function: 'useSelectedMissions',
        error: err,
      });
    }
  }, [selectedMissions]);

  // 任務を選択
  const selectMission = useCallback((missionId) => {
    setSelectedMissions((prev) => {
      // 既に選択済みの場合は何もしない
      if (prev.some((m) => m.missionId === missionId)) {
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

      return [...prev, { missionId, count: 1 }];
    });
  }, []);

  // 任務の選択を解除
  const deselectMission = useCallback((missionId) => {
    setSelectedMissions((prev) => prev.filter((m) => m.missionId !== missionId));
  }, []);

  // 任務の選択状態をトグル
  const toggleMission = useCallback((missionId) => {
    setSelectedMissions((prev) => {
      // 選択解除
      if (prev.some((m) => m.missionId === missionId)) {
        return prev.filter((m) => m.missionId !== missionId);
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
      return [...prev, { missionId, count: 1 }];
    });
  }, []);

  // 任務の実行回数を更新
  const updateMissionCount = useCallback((missionId, count) => {
    setSelectedMissions((prev) => {
      return prev.map((m) =>
        m.missionId === missionId ? { ...m, count: Math.max(1, Math.min(99, count)) } : m
      );
    });
  }, []);

  // 全ての選択を解除
  const clearSelection = useCallback(() => {
    setSelectedMissions([]);
    clearSelectedMissions();
  }, []);

  // 任務が選択されているかチェック
  const isSelected = useCallback(
    (missionId) => {
      return selectedMissions.some((m) => m.missionId === missionId);
    },
    [selectedMissions]
  );

  // 選択可能かチェック（最大数に達していないか）
  const canSelect = useCallback(() => {
    return selectedMissions.length < LIMITS.SELECTED_MISSIONS_MAX;
  }, [selectedMissions]);

  return {
    // データ
    selectedMissions,
    selectedMissionIds: selectedMissions.map((m) => m.missionId),
    selectedCount: selectedMissions.length,
    maxSelections: LIMITS.SELECTED_MISSIONS_MAX,

    // 操作関数
    selectMission,
    deselectMission,
    toggleMission,
    updateMissionCount,
    clearSelection,

    // ユーティリティ
    isSelected,
    canSelect,
  };
}
