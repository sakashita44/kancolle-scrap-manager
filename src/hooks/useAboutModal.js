/**
 * Aboutモーダルの状態管理フック
 * 初回起動時の自動表示と表示済みフラグの管理
 * @module hooks/useAboutModal
 */

import { useState, useEffect, useCallback } from 'react';
import { isAboutShown, saveAboutShown, logInfo } from '../utils';

/**
 * Aboutモーダルを管理するカスタムフック
 * @returns {Object} モーダルの開閉状態と操作関数
 */
export function useAboutModal() {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // 初回マウント時に表示済みフラグをチェック
  useEffect(() => {
    const shown = isAboutShown();
    if (!shown) {
      // 初回起動時は自動表示
      setIsAboutModalOpen(true);
      logInfo('About modal auto-opened on first launch', {
        function: 'useAboutModal',
      });
    }
  }, []);

  // モーダルを開く
  const openAboutModal = useCallback(() => {
    setIsAboutModalOpen(true);
  }, []);

  // モーダルを閉じる
  const closeAboutModal = useCallback(() => {
    setIsAboutModalOpen(false);
    // 閉じた時点で表示済みフラグを保存
    saveAboutShown();
    logInfo('About modal closed, saved as shown', {
      function: 'useAboutModal',
    });
  }, []);

  return {
    isAboutModalOpen,
    openAboutModal,
    closeAboutModal,
  };
}
