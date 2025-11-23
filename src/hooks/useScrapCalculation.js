/**
 * 廃棄リスト計算フック
 * 選択任務の変更を監視し、自動的に廃棄リストを計算
 * @module hooks/useScrapCalculation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { calculateScrapList } from '../utils/calculateScrapList.js';

/**
 * 廃棄リスト計算を管理するカスタムフック
 * @param {string[]} selectedMissionIds - 選択中の任務IDリスト
 * @param {Object[]} allMissions - 全任務データ
 * @param {Object[]} allEquipments - 全装備データ
 * @returns {Object} 廃棄リストと警告情報
 */
export function useScrapCalculation(selectedMissionIds, allMissions, allEquipments) {
  const [scrapList, setScrapList] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [calculating, setCalculating] = useState(false);

  // 依存データの変更を検知してメモ化
  const deps = useMemo(
    () => ({
      selectedMissionIds: selectedMissionIds || [],
      allMissions: allMissions || [],
      allEquipments: allEquipments || [],
    }),
    [selectedMissionIds, allMissions, allEquipments]
  );

  // 計算処理
  const calculate = useCallback(() => {
    setCalculating(true);

    try {
      const result = calculateScrapList(
        deps.selectedMissionIds,
        deps.allMissions,
        deps.allEquipments
      );

      setScrapList(result.scrapList);
      setWarnings(result.warnings);

      console.log('[useScrapCalculation] Calculated:', {
        selectedCount: deps.selectedMissionIds.length,
        scrapListCount: result.scrapList.length,
        warningsCount: result.warnings.length,
      });
    } catch (error) {
      console.error('[useScrapCalculation] Calculation error:', error);
      setScrapList([]);
      setWarnings([
        {
          type: 'error',
          message: `計算エラー: ${error.message}`,
        },
      ]);
    } finally {
      setCalculating(false);
    }
  }, [deps]);

  // 選択任務・装備・任務データが変更されたら再計算
  useEffect(() => {
    calculate();
  }, [calculate]);

  // 手動再計算用の関数
  const recalculate = useCallback(() => {
    calculate();
  }, [calculate]);

  // カテゴリ別に廃棄リストをグループ化
  const scrapListByCategory = useMemo(() => {
    const grouped = {};

    for (const item of scrapList) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }

    return grouped;
  }, [scrapList]);

  // 廃棄総数
  const totalCount = useMemo(() => {
    return scrapList.reduce((sum, item) => sum + item.count, 0);
  }, [scrapList]);

  // エラー・警告の分類
  const { errors, warningMessages } = useMemo(() => {
    const errors = warnings.filter((w) => w.type === 'error');
    const warningMessages = warnings.filter((w) => w.type === 'warning');
    return { errors, warningMessages };
  }, [warnings]);

  return {
    // データ
    scrapList,
    scrapListByCategory,
    warnings,
    errors,
    warningMessages,

    // 集計情報
    totalCount,
    itemCount: scrapList.length,
    hasWarnings: warnings.length > 0,
    hasErrors: errors.length > 0,

    // 状態
    calculating,

    // 操作
    recalculate,
  };
}
