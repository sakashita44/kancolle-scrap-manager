/**
 * エラーハンドリング統合フック
 * アプリ全体のエラーを一元管理
 * @module hooks/useErrorHandler
 */

import { useState, useCallback } from 'react';

/**
 * エラー種別
 */
export const ERROR_TYPE = {
  CRITICAL: 'critical', // アプリが動作しない
  ERROR: 'error', // 機能がブロックされる
  WARNING: 'warning', // 動作は継続
  INFO: 'info', // 情報通知
};

/**
 * エラーハンドリングフック
 * @returns {Object} エラー状態と操作関数
 * @property {Array} errors - エラー配列
 * @property {Function} addError - エラーを追加
 * @property {Function} syncErrors - 特定タグのエラーを同期
 * @property {Function} clearError - エラーをクリア
 * @property {Function} clearErrorsByTag - 特定タグのエラーをクリア
 * @property {Function} getErrorsByType - 特定種別のエラーを取得
 * @property {Function} getErrorsByTag - 特定タグのエラーを取得
 * @property {boolean} hasErrors - エラーが存在するか
 * @property {boolean} hasCriticalErrors - 致命的エラーが存在するか
 */
export function useErrorHandler() {
  const [errors, setErrors] = useState([]);

  /**
   * エラーを追加
   * @param {string} type - エラー種別（ERROR_TYPE）
   * @param {string} message - エラーメッセージ
   * @param {Object} context - エラーコンテキスト（オプション）
   * @param {string} context.tag - エラータグ（同期管理用）
   */
  const addError = useCallback((type, message, context = {}) => {
    const error = {
      id: `error_${Date.now()}_${Math.random()}`,
      type,
      message,
      context,
      tag: context.tag || null,
      timestamp: new Date().toISOString(),
    };
    setErrors((prev) => [...prev, error]);
  }, []);

  /**
   * 特定タグのエラーを同期（既存の同タグエラーを削除して新規追加）
   * @param {string} tag - エラータグ
   * @param {Array} errorList - エラーリスト（各要素: {type, message, context?}）
   */
  const syncErrors = useCallback((tag, errorList) => {
    setErrors((prev) => {
      // 既存の同タグエラーを削除
      const filtered = prev.filter((e) => e.tag !== tag);

      // 新しいエラーを追加
      const newErrors = errorList.map((err) => ({
        id: `error_${Date.now()}_${Math.random()}`,
        type: err.type || ERROR_TYPE.WARNING,
        message: err.message,
        context: err.context || {},
        tag,
        timestamp: new Date().toISOString(),
      }));

      return [...filtered, ...newErrors];
    });
  }, []);

  /**
   * エラーをクリア
   * @param {string} id - エラーID（指定しない場合は全てクリア）
   */
  const clearError = useCallback((id) => {
    if (id) {
      setErrors((prev) => prev.filter((e) => e.id !== id));
    } else {
      setErrors([]);
    }
  }, []);

  /**
   * 特定タグのエラーをクリア
   * @param {string} tag - エラータグ
   */
  const clearErrorsByTag = useCallback((tag) => {
    setErrors((prev) => prev.filter((e) => e.tag !== tag));
  }, []);

  /**
   * 特定種別のエラーを取得
   * @param {string} type - エラー種別
   * @returns {Array} 該当エラー配列
   */
  const getErrorsByType = useCallback(
    (type) => {
      return errors.filter((e) => e.type === type);
    },
    [errors]
  );

  /**
   * 特定タグのエラーを取得
   * @param {string} tag - エラータグ
   * @returns {Array} 該当エラー配列
   */
  const getErrorsByTag = useCallback(
    (tag) => {
      return errors.filter((e) => e.tag === tag);
    },
    [errors]
  );

  return {
    errors,
    addError,
    syncErrors,
    clearError,
    clearErrorsByTag,
    getErrorsByType,
    getErrorsByTag,
    hasErrors: errors.length > 0,
    hasCriticalErrors: errors.some((e) => e.type === ERROR_TYPE.CRITICAL),
  };
}
