import { ExternalLink } from 'lucide-react';
import Modal from './Modal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: Props) {
    const version = import.meta.env.VITE_APP_VERSION || '1.0.0';
    const repoUrl = 'https://github.com/sakashita44/kancolle-scrap-manager';

    return (
        <Modal isOpen={isOpen} title="About" onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <h4 className="font-bold text-lg text-slate-800">
                        艦これ 工廠任務廃棄マネージャー
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                        Version {version}
                    </p>
                </div>

                <div>
                    <h5 className="font-semibold text-slate-700 mb-2">
                        アプリの概要
                    </h5>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        複数の工廠任務を並列遂行する際の、最適な（必要最小限の）廃棄装備リストを算出します。
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        ※ウィークリー任務「資源の再利用」での使用は想定していません。
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h5 className="font-semibold text-blue-800 mb-2">
                        マスタデータについて
                    </h5>
                    <p className="text-sm text-blue-700 leading-relaxed">
                        本アプリに同梱されている任務・装備データは不完全な可能性があります。必要に応じてご自身で装備・任務を追加してください。
                    </p>
                </div>

                <div>
                    <h5 className="font-semibold text-slate-700 mb-2">
                        データの取り扱い
                    </h5>
                    <div className="text-sm text-slate-600 space-y-1 leading-relaxed">
                        <p>本アプリはサーバーレスで動作します。</p>
                        <p>
                            すべてのユーザーデータ（装備・任務・設定）は、お使いのブラウザ内（LocalStorage）にのみ保存されます。
                        </p>
                        <p>
                            入力されたデータが外部サーバーへ送信されることはありません。
                        </p>
                        <p className="text-amber-700 font-medium">
                            シークレットモード（プライベートブラウジング）ではブラウザを閉じるとデータが消失します。通常モードでのご利用を推奨します。
                        </p>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                    <h5 className="font-semibold text-slate-700 mb-2">
                        ライセンス・リンク
                    </h5>
                    <div className="space-y-2">
                        <p className="text-sm text-slate-600">
                            ライセンス: MIT License
                        </p>
                        <a
                            href={repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 hover:underline"
                        >
                            <ExternalLink className="w-4 h-4" />
                            GitHub: sakashita44/kancolle-scrap-manager
                        </a>
                        <p className="text-sm text-slate-600">
                            開発者: Y Sakashita
                        </p>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                    <h5 className="font-semibold text-slate-700 mb-2">
                        免責事項
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        本アプリの使用によって生じたいかなる損害に対しても、開発者は一切の責任を負いません。本アプリは「現状のまま（AS
                        IS）」提供され、いかなる保証も伴いません。
                    </p>
                </div>
            </div>
        </Modal>
    );
}
