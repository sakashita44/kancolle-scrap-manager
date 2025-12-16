/**
 * ベース任務と補助任務の過不足計算フック
 * 選択任務の変更を監視し、自動的に過不足を計算
 * @module hooks/useScrapComparison
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { calculateScrapComparison, calculateScrapList } from '../domain/scrapCalculation.js';
import { logError, logInfo } from '../utils/logger.js';
import { useErrorHandler, ERROR_TYPE } from '../contexts/ErrorContext.jsx';
import { useCategoryData } from '../contexts/CategoryContext.jsx';
import { useEquipmentData } from '../contexts/EquipmentContext.jsx';
import { useMissionData } from '../contexts/MissionContext.jsx';

/**
 * ベース任務と補助任務の過不足を計算するカスタムフック
 * @param {{baseMission: {missionId: string, count: number} | null, auxiliaryMissions: Array<{missionId: string, count: number}>}} selectedMissions - 選択中の任務（ベース/補助分離）
 * @returns {Object} 過不足情報と警告
 */
export function useScrapComparison(selectedMissions) {
  const [baseRequirements, setBaseRequirements] = useState([]);
  const [auxiliaryScrapList, setAuxiliaryScrapList] = useState([]);
  const [allScrapList, setAllScrapList] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [calculating, setCalculating] = useState(false);

  const { categoryMap } = useCategoryData();
  const { equipmentMap } = useEquipmentData();
  const { allMissions } = useMissionData();

  // エラーハンドラーを取得（Context経由）
  const { syncErrors } = useErrorHandler();

  // 依存データの変更を検知してメモ化
  const deps = useMemo(
    () => ({
      selectedMissions: selectedMissions || { baseMission: null, auxiliaryMissions: [] },
      allMissions: allMissions || [],
      equipmentMap: equipmentMap || new Map(),
      categoryMap: categoryMap || new Map(),
    }),
    [selectedMissions, allMissions, equipmentMap, categoryMap]
  );

  // 計算処理
  const calculate = useCallback(() => {
    setCalculating(true);

    try {
      const result = calculateScrapComparison(
        deps.selectedMissions,
        deps.allMissions,
        deps.equipmentMap,
        deps.categoryMap
      );

      setBaseRequirements(result.baseRequirements);
      setAuxiliaryScrapList(result.auxiliaryScrapList);
      setComparison(result.comparison);
      setWarnings(result.warnings);

      // 全選択任務（ベース+補助）の廃棄リストを計算
      const allSelectedMissions = [];
      if (deps.selectedMissions.baseMission) {
        allSelectedMissions.push(deps.selectedMissions.baseMission);
      }
      allSelectedMissions.push(...deps.selectedMissions.auxiliaryMissions);

      const allScrapResult = calculateScrapList(
        allSelectedMissions,
        deps.allMissions,
        deps.equipmentMap,
        deps.categoryMap
      );
      setAllScrapList(allScrapResult.scrapList);

      logInfo('Scrap comparison calculated', {
        function: 'useScrapComparison',
        hasBaseMission: !!deps.selectedMissions.baseMission,
        auxiliaryCount: deps.selectedMissions.auxiliaryMissions.length,
        comparisonCount: result.comparison.length,
        warningsCount: result.warnings.length,
      });
    } catch (error) {
      logError('Comparison calculation error', {
        function: 'useScrapComparison',
        error,
      });
      setBaseRequirements([]);
      setAuxiliaryScrapList([]);
      setAllScrapList([]);
      setComparison([]);
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

  // 計算警告を統合エラーハンドラーに登録（Pub/Subモデル）
  useEffect(() => {
    if (warnings.length > 0) {
      const calculationErrors = warnings.map((warning) => ({
        type: warning.type === 'error' ? ERROR_TYPE.ERROR : ERROR_TYPE.WARNING,
        message: warning.message,
        context: { source: 'calculation', ...warning },
      }));
      syncErrors('calculation', calculationErrors);
    } else {
      syncErrors('calculation', []);
    }
  }, [warnings, syncErrors]);

  // 手動再計算用の関数
  const recalculate = useCallback(() => {
    calculate();
  }, [calculate]);

  // 廃棄総数（補助任務ベース）
  const totalCount = useMemo(() => {
    return auxiliaryScrapList.reduce((sum, item) => sum + item.count, 0);
  }, [auxiliaryScrapList]);

  // ベース任務の必要総数
  const baseTotalCount = useMemo(() => {
    return baseRequirements.reduce((sum, item) => sum + item.count, 0);
  }, [baseRequirements]);

  // 過不足の集計
  const { insufficientCount, excessCount, sufficientCount } = useMemo(() => {
    let insufficient = 0;
    let excess = 0;
    let sufficient = 0;

    for (const item of comparison) {
      if (item.status === 'insufficient') {
        insufficient++;
      } else if (item.status === 'excess') {
        excess++;
      } else if (item.status === 'sufficient') {
        sufficient++;
      }
    }

    return { insufficientCount: insufficient, excessCount: excess, sufficientCount: sufficient };
  }, [comparison]);

  // エラー・警告の分類
  const { errors, warningMessages } = useMemo(() => {
    const errors = warnings.filter((w) => w.type === 'error');
    const warningMessages = warnings.filter((w) => w.type === 'warning');
    return { errors, warningMessages };
  }, [warnings]);

  return {
    // データ
    baseRequirements,
    auxiliaryScrapList,
    allScrapList,
    comparison,
    warnings,
    errors,
    warningMessages,

    // 集計情報
    totalCount,
    baseTotalCount,
    insufficientCount,
    excessCount,
    sufficientCount,
    hasBaseMission: !!selectedMissions?.baseMission,
    hasAuxiliaryMissions: (selectedMissions?.auxiliaryMissions?.length || 0) > 0,
    hasWarnings: warnings.length > 0,
    hasErrors: errors.length > 0,

    // 状態
    calculating,

    // 操作
    recalculate,
  };
}
