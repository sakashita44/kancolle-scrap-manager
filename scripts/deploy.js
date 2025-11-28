import { execSync } from 'child_process'
import FtpDeploy from 'ftp-deploy'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// .envファイルを読み込む
dotenv.config({ path: join(__dirname, '..', '.env') })

/**
 * 現在のGitブランチを取得
 * @returns {string} ブランチ名
 */
function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim()
  } catch (error) {
    console.error('❌ Gitブランチの取得に失敗しました:', error.message)
    process.exit(1)
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

  const config = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    localRoot: join(__dirname, '..', process.env.FTP_LOCAL_PATH || 'dist'),
    remoteRoot: process.env.FTP_REMOTE_PATH,
    include: ['*', '**/*'],
    exclude: [],
    deleteRemote: false,
    forcePasv: true,
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
  console.log(`   リモートパス: ${config.remoteRoot}`)
  console.log(`   ローカルパス: ${config.localRoot}`)

  try {
    // 進捗表示
    ftpDeploy.on('uploading', (data) => {
      console.log(`   📤 アップロード中: ${data.filename}`)
    })

    ftpDeploy.on('uploaded', (data) => {
      console.log(`   ✅ アップロード完了: ${data.filename}`)
    })

    ftpDeploy.on('log', (data) => {
      console.log(`   ℹ️  ${data}`)
    })

    await ftpDeploy.deploy(config)
    console.log('\n✅ デプロイが完了しました!')
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

  if (currentBranch !== 'main') {
    console.error('❌ mainブランチではありません')
    console.error('   デプロイはmainブランチからのみ実行できます')
    process.exit(1)
  }

  // 2. ビルド実行
  runBuild()

  // 3. FTPデプロイ
  await deployToFTP()

  console.log('\n🎉 すべての処理が完了しました!')
}

// スクリプト実行
main().catch((error) => {
  console.error('❌ 予期しないエラーが発生しました:', error)
  process.exit(1)
})
