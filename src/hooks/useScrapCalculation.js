/**
 * 廃棄リスト計算フック
 * 選択任務の変更を監視し、自動的に廃棄リストを計算
 * @module hooks/useScrapCalculation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { calculateScrapList } from '../domain';
import { logError, logInfo } from '../utils';

/**
 * 廃棄リスト計算を管理するカスタムフック
 * @param {Array<{missionId: string, count: number}>} selectedMissions - 選択中の任務リスト（実行回数含む）
 * @param {Object[]} allMissions - 全任務データ
 * @param {Map} equipmentMap - 装備検索用Map（カテゴリ代表は含まない）
 * @param {Map} categoryMap - カテゴリ検索用Map
 * @returns {Object} 廃棄リストと警告情報
 * @returns {import('../types/schema').ScrapListItem[]} scrapList - 廃棄リスト（基本形式）
 * @returns {number} totalCount - 廃棄総数
 * @returns {number} itemCount - アイテム数
 * @returns {Array} warnings - 警告リスト
 * @returns {Array} errors - エラーリスト
 * @returns {Array} warningMessages - 警告メッセージリスト
 * @returns {boolean} hasWarnings - 警告があるか
 * @returns {boolean} hasErrors - エラーがあるか
 * @returns {boolean} calculating - 計算中フラグ
 * @returns {Function} recalculate - 手動再計算関数
 */
export function useScrapCalculation(selectedMissions, allMissions, equipmentMap, categoryMap) {
  const [scrapList, setScrapList] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [calculating, setCalculating] = useState(false);

  // 依存データの変更を検知してメモ化
  const deps = useMemo(
    () => ({
      selectedMissions: selectedMissions || [],
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
      const result = calculateScrapList(
        deps.selectedMissions,
        deps.allMissions,
        deps.equipmentMap,
        deps.categoryMap
      );

      setScrapList(result.scrapList);
      setWarnings(result.warnings);

      logInfo('Scrap list calculated', {
        function: 'useScrapCalculation',
        selectedCount: deps.selectedMissions.length,
        scrapListCount: result.scrapList.length,
        warningsCount: result.warnings.length,
      });
    } catch (error) {
      logError('Calculation error', {
        function: 'useScrapCalculation',
        error,
      });
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
