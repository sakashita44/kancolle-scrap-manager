import { useEffect, useMemo, useCallback } from 'react';
import {
    useStore,
    selectAllMissions,
    selectAllEquipments,
    selectCategoryMap,
    selectEquipmentMap,
    selectRequirementCategoryGroupMap,
} from './store';
import { calculateScrapComparison, calculateScrapList } from './domain';
import {
    analyzeCategoryDeletionImpact,
    buildCategoryDeletionMessage,
} from './domain';
import { matchesCategoryFilter } from './domain/missionFilter';
import { type Mission, type MissionFormValues } from './schema';
import {
    Header,
    StickyDashboard,
    SelectedMissionsSummary,
    ControlBar,
    MissionList,
    Modal,
    EquipmentManager,
    MissionModal,
    GlobalWarningBanner,
    ConfirmDialog,
    AboutModal,
} from './components';

// --- 確認ダイアログの設定 ---

const CONFIRM_CONFIG: Record<string, { title: string; confirmText: string }> = {
    deleteEquipment: { title: '装備の削除', confirmText: '削除' },
    deleteCategory: { title: 'カテゴリの削除', confirmText: '削除' },
    deleteMission: { title: '任務の削除', confirmText: '削除' },
    resetData: { title: 'データの初期化', confirmText: '初期化' },
};

const DEFAULT_CONFIRM = { title: '確認', confirmText: '実行' };

export default function App() {
    // --- ストア接続 ---

    const initData = useStore((s) => s.initData);
    const initSelection = useStore((s) => s.initSelection);
    const initAbout = useStore((s) => s.initAbout);
    const initFilters = useStore((s) => s.initFilters);
    const initExpanded = useStore((s) => s.initExpanded);

    const dataWarnings = useStore((s) => s.dataWarnings);
    const allMissions = useStore(selectAllMissions);
    const allEquipments = useStore(selectAllEquipments);
    const categoryMap = useStore(selectCategoryMap);
    const equipmentMap = useStore(selectEquipmentMap);
    const requirementCategoryGroupMap = useStore(
        selectRequirementCategoryGroupMap,
    );

    const baseMission = useStore((s) => s.baseMission);
    const auxiliaryMissions = useStore((s) => s.auxiliaryMissions);

    const activeModal = useStore((s) => s.activeModal);
    const editingMission = useStore((s) => s.editingMission);
    const confirmDialog = useStore((s) => s.confirmDialog);
    const aboutShown = useStore((s) => s.aboutShown);
    const filterPeriods = useStore((s) => s.filterPeriods);
    const filterCategories = useStore((s) => s.filterCategories);
    const filterText = useStore((s) => s.filterText);

    const openEquipmentModal = useStore((s) => s.openEquipmentModal);
    const openMissionModal = useStore((s) => s.openMissionModal);
    const closeModal = useStore((s) => s.closeModal);
    const openConfirmDialog = useStore((s) => s.openConfirmDialog);
    const closeConfirmDialog = useStore((s) => s.closeConfirmDialog);
    const openAbout = useStore((s) => s.openAbout);
    const markAboutShown = useStore((s) => s.markAboutShown);
    const setFilterText = useStore((s) => s.setFilterText);
    const setFilterPeriods = useStore((s) => s.setFilterPeriods);
    const setFilterCategories = useStore((s) => s.setFilterCategories);

    const saveMission = useStore((s) => s.saveMission);
    const deleteUserEquipment = useStore((s) => s.deleteUserEquipment);
    const deleteUserMission = useStore((s) => s.deleteUserMission);
    const deselectMission = useStore((s) => s.deselectMission);
    const deleteCategoryWithDependents = useStore(
        (s) => s.deleteCategoryWithDependents,
    );
    const resetAllUserData = useStore((s) => s.resetAllUserData);
    const clearSelection = useStore((s) => s.clearSelection);

    // --- 初期化 ---

    useEffect(() => {
        initData();
        // initData 後のストアから全任務IDを取得し、選択復元時の整合性チェックに使用
        const missionIds = new Set(
            selectAllMissions(useStore.getState()).map((m) => m.id),
        );
        initSelection(missionIds);
        initAbout();
        initFilters();
        initExpanded();
    }, [initData, initSelection, initAbout, initFilters, initExpanded]);

    // --- 廃棄リスト計算 ---

    const selectedMissions = useMemo(
        () => ({ baseMission, auxiliaryMissions }),
        [baseMission, auxiliaryMissions],
    );

    const comparisonResult = useMemo(
        () =>
            calculateScrapComparison(
                selectedMissions,
                allMissions,
                equipmentMap,
                categoryMap,
                requirementCategoryGroupMap,
            ),
        [
            selectedMissions,
            allMissions,
            equipmentMap,
            categoryMap,
            requirementCategoryGroupMap,
        ],
    );

    // 全選択任務の統合廃棄リスト
    const allScrapList = useMemo(() => {
        const allSelectedEntries = [];
        if (baseMission) allSelectedEntries.push(baseMission);
        allSelectedEntries.push(...auxiliaryMissions);
        return calculateScrapList(
            allSelectedEntries,
            allMissions,
            equipmentMap,
            categoryMap,
            requirementCategoryGroupMap,
        ).scrapList;
    }, [
        baseMission,
        auxiliaryMissions,
        allMissions,
        equipmentMap,
        categoryMap,
        requirementCategoryGroupMap,
    ]);

    // --- フィルタリング ---

    const filteredMissions = useMemo(() => {
        return allMissions.filter((m) => {
            if (filterText && !m.name.includes(filterText)) return false;
            if (filterPeriods.size > 0 && !filterPeriods.has(m.period))
                return false;
            if (filterCategories.size > 0) {
                if (
                    !matchesCategoryFilter(
                        m.reqs,
                        filterCategories,
                        equipmentMap,
                        requirementCategoryGroupMap,
                    )
                )
                    return false;
            }
            return true;
        });
    }, [
        allMissions,
        filterText,
        filterPeriods,
        filterCategories,
        equipmentMap,
        requirementCategoryGroupMap,
    ]);

    // --- フィルタハンドラ（単一選択） ---

    const handleFilterPeriodChange = useCallback(
        (period: string) => {
            if (period === 'ALL' || filterPeriods.has(period)) {
                setFilterPeriods(new Set());
            } else {
                setFilterPeriods(new Set([period]));
            }
        },
        [filterPeriods, setFilterPeriods],
    );

    const handleFilterCategoryChange = useCallback(
        (categoryId: string) => {
            if (categoryId === 'ALL' || filterCategories.has(categoryId)) {
                setFilterCategories(new Set());
            } else {
                setFilterCategories(new Set([categoryId]));
            }
        },
        [filterCategories, setFilterCategories],
    );

    // --- 確認ダイアログ ---

    const requestDeleteEquipment = useCallback(
        (id: string) => {
            openConfirmDialog(
                'deleteEquipment',
                id,
                'この装備を削除しますか？',
            );
        },
        [openConfirmDialog],
    );

    const requestDeleteCategory = useCallback(
        (categoryId: string) => {
            const impact = analyzeCategoryDeletionImpact(
                categoryId,
                allEquipments,
                allMissions,
                (id) => categoryMap.get(id)?.name ?? '不明',
            );
            const message = buildCategoryDeletionMessage(impact);
            openConfirmDialog('deleteCategory', categoryId, message);
        },
        [openConfirmDialog, allEquipments, allMissions, categoryMap],
    );

    const requestDeleteMission = useCallback(
        (id: string) => {
            openConfirmDialog('deleteMission', id, 'この任務を削除しますか？');
        },
        [openConfirmDialog],
    );

    const requestDataReset = useCallback(() => {
        openConfirmDialog(
            'resetData',
            '',
            'すべてのユーザーデータ（カテゴリ・装備・任務）を削除します。この操作は取り消せません。',
        );
    }, [openConfirmDialog]);

    const executeConfirmedAction = useCallback(() => {
        const { type, id } = confirmDialog;
        switch (type) {
            case 'deleteEquipment':
                deleteUserEquipment(id);
                break;
            case 'deleteCategory':
                deleteCategoryWithDependents(id);
                break;
            case 'deleteMission':
                deselectMission(id);
                deleteUserMission(id);
                break;
            case 'resetData':
                clearSelection();
                resetAllUserData();
                break;
        }
        closeConfirmDialog();
    }, [
        confirmDialog,
        deleteUserEquipment,
        deleteCategoryWithDependents,
        deselectMission,
        deleteUserMission,
        clearSelection,
        resetAllUserData,
        closeConfirmDialog,
    ]);

    // --- 任務保存 ---

    const handleSaveMission = useCallback(
        (formData: MissionFormValues, editingId?: string) => {
            saveMission(formData, editingId);
            closeModal();
        },
        [saveMission, closeModal],
    );

    const handleEditMission = useCallback(
        (mission: Mission) => {
            openMissionModal(mission);
        },
        [openMissionModal],
    );

    // --- About ---

    const isAboutModalOpen = !aboutShown;

    // --- 確認ダイアログの設定 ---

    const confirmConfig = CONFIRM_CONFIG[confirmDialog.type] ?? DEFAULT_CONFIRM;

    // --- フィルタの現在値（select向け） ---
    const currentFilterPeriod =
        filterPeriods.size === 1 ? Array.from(filterPeriods)[0] : 'ALL';
    const currentFilterCategory =
        filterCategories.size === 1 ? Array.from(filterCategories)[0] : 'ALL';

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 font-sans relative">
            <Header
                onAboutOpen={openAbout}
                onExport={() => {
                    /* TODO: issue #12 */
                }}
                onImport={() => {
                    /* TODO: issue #12 */
                }}
                onDataReset={requestDataReset}
            />

            {dataWarnings.length > 0 && (
                <GlobalWarningBanner messages={dataWarnings} type="warning" />
            )}

            <GlobalWarningBanner
                messages={[
                    'Beta版です。マスタデータ（任務・装備）にはダミーデータが含まれています。必要に応じてご自身で追加してください。',
                ]}
                type="info"
            />

            <StickyDashboard
                scrapList={allScrapList}
                comparison={comparisonResult.comparison}
                hasBaseMission={!!baseMission}
            />

            <SelectedMissionsSummary />

            <div className="max-w-3xl mx-auto p-4">
                <ControlBar
                    filterText={filterText}
                    filterCategory={currentFilterCategory}
                    filterPeriod={currentFilterPeriod}
                    onFilterTextChange={setFilterText}
                    onFilterCategoryChange={handleFilterCategoryChange}
                    onFilterPeriodChange={handleFilterPeriodChange}
                    onEquipmentClick={openEquipmentModal}
                    onMissionClick={() => openMissionModal()}
                />
            </div>

            <div className="max-w-3xl mx-auto px-4 pb-20">
                <MissionList
                    missions={filteredMissions}
                    onDelete={requestDeleteMission}
                    onEdit={handleEditMission}
                />
            </div>

            <Modal
                isOpen={activeModal === 'equipment'}
                title="装備の管理・追加"
                onClose={closeModal}
            >
                <EquipmentManager
                    onDeleteEquipment={requestDeleteEquipment}
                    onDeleteCategory={requestDeleteCategory}
                />
            </Modal>

            <Modal
                isOpen={activeModal === 'mission'}
                title={editingMission ? '任務を編集' : '任務を追加'}
                onClose={closeModal}
            >
                <MissionModal
                    editingMission={editingMission}
                    onSave={handleSaveMission}
                    onCancel={closeModal}
                />
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmConfig.title}
                message={confirmDialog.message}
                confirmText={confirmConfig.confirmText}
                cancelText="キャンセル"
                variant="danger"
                onConfirm={executeConfirmedAction}
                onCancel={closeConfirmDialog}
            />

            <AboutModal isOpen={isAboutModalOpen} onClose={markAboutShown} />
        </div>
    );
}
