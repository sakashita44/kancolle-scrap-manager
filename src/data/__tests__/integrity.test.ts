import { describe, it, expect } from 'vitest';
import { validateMasterDataIntegrity, type MasterData } from '../integrity';
import categoriesJson from '../categories.json';
import equipmentsJson from '../equipments.json';
import missionsJson from '../missions.json';
import requirementCategoryGroupsJson from '../requirementCategoryGroups.json';

const masterData: MasterData = {
    categories: categoriesJson.categories,
    equipments: equipmentsJson.equipments,
    missions: missionsJson.missions as MasterData['missions'],
    requirementCategoryGroups:
        requirementCategoryGroupsJson.requirementCategoryGroups,
};

describe('同梱マスタデータの整合性', () => {
    it('参照整合性・ID一意性の違反が存在しない', () => {
        const errors = validateMasterDataIntegrity(masterData);
        expect(errors).toEqual([]);
    });
});

describe('validateMasterDataIntegrity', () => {
    it('任務が未登録の装備を参照している場合に検出する', () => {
        const errors = validateMasterDataIntegrity({
            categories: [{ id: 'm_cat_a' }],
            equipments: [{ id: 'm_eq_1', categoryId: 'm_cat_a' }],
            missions: [
                {
                    id: 'm_ms_1',
                    name: 'テスト任務',
                    reqs: [{ kind: 'equipment', id: 'm_eq_missing' }],
                },
            ],
            requirementCategoryGroups: [],
        });
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('m_eq_missing');
    });

    it('装備が未登録のカテゴリを参照している場合に検出する', () => {
        const errors = validateMasterDataIntegrity({
            categories: [{ id: 'm_cat_a' }],
            equipments: [{ id: 'm_eq_1', categoryId: 'm_cat_missing' }],
            missions: [],
            requirementCategoryGroups: [],
        });
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('m_cat_missing');
    });

    it('IDが重複している場合に検出する', () => {
        const errors = validateMasterDataIntegrity({
            categories: [{ id: 'm_cat_a' }, { id: 'm_cat_a' }],
            equipments: [],
            missions: [],
            requirementCategoryGroups: [],
        });
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('m_cat_a');
    });

    it('整合したデータでは空配列を返す', () => {
        const errors = validateMasterDataIntegrity({
            categories: [{ id: 'm_cat_a' }],
            equipments: [{ id: 'm_eq_1', categoryId: 'm_cat_a' }],
            missions: [
                {
                    id: 'm_ms_1',
                    name: 'テスト任務',
                    reqs: [{ kind: 'category', id: 'm_cat_a' }],
                },
            ],
            requirementCategoryGroups: [
                { id: 'm_rcg_1', categoryIds: ['m_cat_a'] },
            ],
        });
        expect(errors).toEqual([]);
    });
});
