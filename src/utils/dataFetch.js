/**
 * データフェッチユーティリティ
 * GitHub Pages → ローカルフォールバックのハイブリッド戦略を実装
 * @module utils/dataFetch
 */

import { SCHEMA_VERSION } from '../types/schema.js';

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
 * マスタデータをフェッチ（ハイブリッド戦略）
 * 1. GitHub Pagesから取得を試みる
 * 2. 失敗したらローカルにフォールバック
 * 3. 両方失敗したらエラーをthrow
 *
 * @param {string} type - データタイプ ('equipments' | 'missions')
 * @param {string} [version] - アプリバージョン（デフォルト: package.jsonのバージョン）
 * @returns {Promise<Object>} マスタデータ
 * @throws {Error} 両方のソースから取得に失敗した場合
 */
export async function fetchMasterData(type, version = '1.0.0') {
  const githubUrl = getGitHubPagesUrl(type, version);
  const localUrl = getLocalUrl(type, version);

  // Step 1: GitHub Pagesから取得を試みる
  try {
    console.log(`[DataFetch] Fetching ${type} from GitHub Pages: ${githubUrl}`);
    const data = await fetchJson(githubUrl);
    console.log(`[DataFetch] Successfully fetched ${type} from GitHub Pages`);
    return {
      data,
      source: 'github-pages',
    };
  } catch (githubError) {
    console.warn(`[DataFetch] Failed to fetch from GitHub Pages: ${githubError.message}`);

    // Step 2: ローカルフォールバック
    try {
      console.log(`[DataFetch] Falling back to local: ${localUrl}`);
      const data = await fetchJson(localUrl);
      console.log(`[DataFetch] Successfully fetched ${type} from local`);
      return {
        data,
        source: 'local',
      };
    } catch (localError) {
      console.error(`[DataFetch] Failed to fetch from local: ${localError.message}`);

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
