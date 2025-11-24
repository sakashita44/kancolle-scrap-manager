/**
 * データフェッチユーティリティ
 * GitHub Pages → ローカルフォールバックのハイブリッド戦略を実装
 * @module utils/dataFetch
 */

import { SCHEMA_VERSION } from '../types/schema.js';
import { validateEquipment, validateMission } from './validation.js';

/**
 * GitHub Pages URLを生成
 * @param {string} type - データタイプ ('equipments' | 'missions')
 * @param {string} version - アプリバージョン（キャッシュバスティング用）
 * @returns {string} GitHub Pages URL
 */
function getGitHubPagesUrl(type, version) {
  const repo = 'kancolle-scrap-manager';
  const user = 'sakashita44';
  return `https://${user}.github.io/${repo}/data/${type}.json?v=${version}`;
}

/**
 * ローカルフォールバックURLを生成
 * @param {string} type - データタイプ ('equipments' | 'missions')
 * @param {string} version - アプリバージョン（キャッシュバスティング用）
 * @returns {string} ローカルURL
 */
function getLocalUrl(type, version) {
  return `./data/${type}.json?v=${version}`;
}

/**
 * JSONデータをフェッチ
 * @param {string} url - フェッチするURL
 * @returns {Promise<Object>} JSONデータ
 * @throws {Error} フェッチまたはパースに失敗した場合
 */
async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

/**
 * マスタデータのバリデーション
 * @param {Object} data - バリデーション対象データ
 * @param {string} type - データタイプ ('equipments' | 'missions')
 * @returns {{valid: boolean, invalidItems: Array}} バリデーション結果
 */
function validateMasterData(data, type) {
  const invalidItems = [];

  if (type === 'equipments') {
    if (!data.equipments || !Array.isArray(data.equipments)) {
      throw new Error('Invalid data structure: equipments array is missing');
    }

    data.equipments.forEach((equipment, index) => {
      const result = validateEquipment(equipment);
      if (!result.valid) {
        invalidItems.push({
          index,
          id: equipment.id || 'unknown',
          name: equipment.name || 'unknown',
          errors: result.errors,
        });
      }
    });
  } else if (type === 'missions') {
    if (!data.missions || !Array.isArray(data.missions)) {
      throw new Error('Invalid data structure: missions array is missing');
    }

    data.missions.forEach((mission, index) => {
      const result = validateMission(mission);
      if (!result.valid) {
        invalidItems.push({
          index,
          id: mission.id || 'unknown',
          name: mission.name || 'unknown',
          errors: result.errors,
        });
      }
    });
  }

  return {
    valid: invalidItems.length === 0,
    invalidItems,
  };
}

/**
 * マスタデータをフェッチ（ハイブリッド戦略 + バリデーション）
 * 1. GitHub Pagesから取得を試みる → バリデーション
 * 2. 失敗したらローカルにフォールバック → バリデーション
 * 3. 両方失敗したらエラーをthrow
 *
 * @param {string} type - データタイプ ('equipments' | 'missions')
 * @param {string} [version] - アプリバージョン（デフォルト: package.jsonのバージョン）
 * @returns {Promise<Object>} マスタデータ
 * @throws {Error} 両方のソースから取得・バリデーションに失敗した場合
 */
export async function fetchMasterData(type, version = '1.0.0') {
  const githubUrl = getGitHubPagesUrl(type, version);
  const localUrl = getLocalUrl(type, version);

  // Step 1: GitHub Pagesから取得 + バリデーション
  try {
    console.log(`[DataFetch] Fetching ${type} from GitHub Pages: ${githubUrl}`);
    const data = await fetchJson(githubUrl);

    // バリデーション実行
    const validation = validateMasterData(data, type);
    if (!validation.valid) {
      console.error(`[DataFetch] Validation failed for GitHub Pages ${type}:`, validation.invalidItems);
      throw new Error(
        `Validation failed: ${validation.invalidItems.length} invalid items found. ` +
        `First error: ${validation.invalidItems[0].errors[0]}`
      );
    }

    console.log(`[DataFetch] Successfully fetched and validated ${type} from GitHub Pages`);
    return {
      data,
      source: 'github-pages',
    };
  } catch (githubError) {
    console.warn(`[DataFetch] Failed to fetch/validate from GitHub Pages: ${githubError.message}`);

    // Step 2: ローカルフォールバック + バリデーション
    try {
      console.log(`[DataFetch] Falling back to local: ${localUrl}`);
      const data = await fetchJson(localUrl);

      // バリデーション実行
      const validation = validateMasterData(data, type);
      if (!validation.valid) {
        console.error(`[DataFetch] Validation failed for local ${type}:`, validation.invalidItems);
        throw new Error(
          `Validation failed: ${validation.invalidItems.length} invalid items found. ` +
          `First error: ${validation.invalidItems[0].errors[0]}`
        );
      }

      console.log(`[DataFetch] Successfully fetched and validated ${type} from local`);
      return {
        data,
        source: 'local',
      };
    } catch (localError) {
      console.error(`[DataFetch] Failed to fetch/validate from local: ${localError.message}`);

      // Step 3: 両方失敗
      throw new Error(
        `Failed to fetch ${type} data from both GitHub Pages and local sources. ` +
        `GitHub error: ${githubError.message}, Local error: ${localError.message}`
      );
    }
  }
}

/**
 * 装備マスタデータをフェッチ
 * @param {string} [version] - アプリバージョン
 * @returns {Promise<Object>} 装備マスタデータ
 */
export async function fetchEquipments(version) {
  return fetchMasterData('equipments', version);
}

/**
 * 任務マスタデータをフェッチ
 * @param {string} [version] - アプリバージョン
 * @returns {Promise<Object>} 任務マスタデータ
 */
export async function fetchMissions(version) {
  return fetchMasterData('missions', version);
}

/**
 * 全てのマスタデータを並列でフェッチ
 * @param {string} [version] - アプリバージョン
 * @returns {Promise<Object>} { equipments, missions, sources }
 */
export async function fetchAllMasterData(version) {
  const [equipmentsResult, missionsResult] = await Promise.all([
    fetchEquipments(version),
    fetchMissions(version),
  ]);

  return {
    equipments: equipmentsResult.data,
    missions: missionsResult.data,
    sources: {
      equipments: equipmentsResult.source,
      missions: missionsResult.source,
    },
  };
}
