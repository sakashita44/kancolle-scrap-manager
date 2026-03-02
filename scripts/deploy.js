import { execSync } from 'child_process'
import FtpDeploy from 'ftp-deploy'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// .envファイルを読み込む (プロジェクトルートの.env)
dotenv.config({ path: join(__dirname, '..', '.env') })

// ============================================================
// デプロイ設定
// ============================================================

/**
 * FTP接続設定
 * 認証情報のみ環境変数から取得、その他はここで管理
 */
const FTP_CONFIG = {
  port: 21,
  deleteRemote: true, // サーバー上の不要ファイル（旧ハッシュのアセット等）を削除
  forcePasv: true,
  secure: false, // 通常のFTP接続
}

/**
 * アップロード対象ファイル設定
 */
const UPLOAD_SETTINGS = {
  include: ['**/*'],
  exclude: [],
}

// ============================================================

/**
 * 現在のGitブランチを取得
 * @returns {string} ブランチ名
 */
function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim()
  } catch (error) {
    console.warn('⚠️  Gitブランチの取得に失敗しました（Git管理外の可能性があります）')
    return 'unknown'
  }
}

/**
 * ビルドを実行
 */
function runBuild() {
  console.log('\n📦 ビルドを開始します...')
  try {
    execSync('npm run build', { stdio: 'inherit' })
    console.log('✅ ビルドが完了しました')
  } catch (error) {
    console.error('❌ ビルドに失敗しました')
    process.exit(1)
  }
}

/**
 * FTPデプロイを実行
 */
async function deployToFTP() {
  const ftpDeploy = new FtpDeploy()

  // パスを生成
  const relativePath = process.env.FTP_LOCAL_PATH || 'dist'
  const absolutePath = resolve(process.cwd(), relativePath)
  const localRoot = absolutePath.replace(/\\/g, '/')

  // ディレクトリの存在確認
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ ディレクトリが存在しません: ${absolutePath}`)
    process.exit(1)
  }

  const config = {
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    host: process.env.FTP_HOST,
    port: FTP_CONFIG.port,
    localRoot: localRoot,
    remoteRoot: process.env.FTP_REMOTE_PATH,
    include: UPLOAD_SETTINGS.include,
    exclude: UPLOAD_SETTINGS.exclude,
    deleteRemote: FTP_CONFIG.deleteRemote,
    forcePasv: FTP_CONFIG.forcePasv,
    secure: FTP_CONFIG.secure,
  }

  // 環境変数のバリデーション
  if (!config.host || !config.user || !config.password || !config.remoteRoot) {
    console.error('❌ FTP接続情報が不足しています')
    console.error('   .envファイルを確認してください')
    console.error('   必要な変数: FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_PATH')
    process.exit(1)
  }

  console.log('\n🚀 FTPデプロイを開始します...')
  console.log(`   ホスト: ${config.host}`)
  console.log(`   送信先: ${config.remoteRoot}`)
  console.log(`   送信元: ${config.localRoot}`)

  try {
    // 進捗表示
    ftpDeploy.on('uploading', (data) => {
      console.log(`   📤 アップロード中: ${data.filename}`)
    })

    ftpDeploy.on('uploaded', (data) => {
      console.log(`   ✅ アップロード完了: ${data.filename}`)
    })

    await ftpDeploy.deploy(config)
    console.log('\n🎉 デプロイが完了しました!')
  } catch (error) {
    console.error('\n❌ デプロイに失敗しました:', error.message)
    process.exit(1)
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚢 艦これ工廠任務廃棄マネージャー - デプロイスクリプト\n')

  // 1. ブランチチェック
  const currentBranch = getCurrentBranch()
  console.log(`📍 現在のブランチ: ${currentBranch}`)

  if (currentBranch !== 'main' && currentBranch !== 'unknown') {
    console.error('❌ mainブランチではありません')
    console.error('   事故防止のため、デプロイはmainブランチからのみ実行できます')
    process.exit(1)
  }

  // 2. ビルド実行
  runBuild()

  // 3. FTPデプロイ
  await deployToFTP()
}

// スクリプト実行
main().catch((error) => {
  console.error('❌ 予期しないエラーが発生しました:', error)
  process.exit(1)
})
