# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

艦これ 工廠任務廃棄マネージャー (Kancolle Scrap Manager) is a web application that calculates the optimal minimum equipment scrap list when managing multiple Kancolle factory missions in parallel to prevent wasteful scrapping.

## Tech Stack

* **Frontend**: React, Tailwind CSS, Lucide React
* **Build Tool**: Vite
* **Hosting**: Static hosting on Lolipop
* **Master Data**: Bundled in application (`src/data/*.json`)
* **Data Storage**: Browser LocalStorage (user data), SessionStorage (selected state)

## Development Commands

* `npm run dev` - Start development server
* `npm run build` - Build for production (outputs to `dist/`)
* `npm run test` - Run tests (not yet implemented)

### Development Flow

1. check current branch status with `git status`
1. check issue and `progress.md` for next tasks
    * Must: check comments of related issues for additional context
1. create branch with rule in `copilot-instructions.md` from main branch
    * `<prefix>/<yyyymm>/sakashita44/<issue-number: if exists>-<short-description>`
    * e.g. `feat/202511/sakashita44/5-add-validation`
1. implement feature / fix bug
1. test locally
1. update `docs/progress.md` if task affects progress
1. commit with rule in `copilot-instructions.md`
1. push to remote
1. create pull request
1. return to step 1 after merge

## Data Architecture

### ID Naming Convention

The project uses prefix-based namespacing to prevent data conflicts:

| Data Type          | Prefix   | Format Example       | Generation Method     | Deletable |
| :----------------- | :------- | :------------------- | :-------------------- | :-------- |
| Official Category  | `m_cat_` | `m_cat_gun_s`        | Manual definition     | No        |
| Official Equipment | `m_eq_`  | `m_eq_gun_12cm`      | Manual definition     | No        |
| Official Mission   | `m_ms_`  | `m_ms_daily_scrap_1` | Manual definition     | No        |
| User Category      | `u_cat_` | `u_cat_<UUID>`       | `crypto.randomUUID()` | Yes       |
| User Equipment     | `u_eq_`  | `u_eq_<UUID>`        | `crypto.randomUUID()` | Yes       |
| User Mission       | `u_ms_`  | `u_ms_<UUID>`        | `crypto.randomUUID()` | Yes       |

**Critical Rules**:

* Prefixes are recommended for readability but not mandatory (validation checks prefix format if present)
* Official master data IDs are **immutable** once published (to prevent breaking user data references)
* Deprecated items should be logically deleted by renaming to "【廃止】..." rather than removing the ID
* UUIDs are generated using `crypto.randomUUID()`, requiring HTTPS or localhost environment
* `isMaster` flag is **never stored** in JSON files - it's automatically assigned at runtime based on data source (bundled `src/data/*.json` → true, LocalStorage → false)
* `type` field (equipment only) is **never stored** in JSON files - it's automatically assigned at runtime (`"item"` for individual equipment, `"category"` for category representatives)
* **Category Representative Equipment**: Dynamically generated at runtime for all categories (both official and user-defined), not stored in JSON files

### Data Flow Strategy

The app bundles master data directly into the application:

**Data Loading**:

1. **Master Data**: JSON files in `src/data/` are imported directly in custom hooks (`useCategories`, `useEquipments`, `useMissions`)
   * No network requests required
   * Instant startup with zero latency
   * App and data versions are always in sync
2. **User Data**: Loaded from LocalStorage with validation
   * Merged with master data after loading
   * Invalid entries are auto-removed with warnings

**Validation on Startup**:

* **LocalStorage Validation**: User-defined data is validated on load, corrupt entries are auto-removed with warning display
* **Auto-Recovery**: Corrupt data is silently removed from LocalStorage to maintain app stability

### Storage Locations

**LocalStorage** (persists across sessions):

* `ksp_app_version` - App version
* `ksp_user_categories` - User-defined categories
* `ksp_user_equipments` - User-defined equipment list
* `ksp_user_missions` - User-defined missions list
* `ksp_about_shown` - About modal display flag (initial launch)

**SessionStorage** (cleared on tab/window close):

* `ksp_selected_missions` - Currently selected mission IDs
* `ksp_filter_period` - Period filter selection
* `ksp_filter_category` - Equipment category filter selection
* `ksp_mission_list_expanded` - Mission list expand/collapse state

**Data Sources**:

* **`src/data/`**: Official master data bundled directly in application code

## Core Calculation Logic

The calculation algorithm determines the **minimum** equipment to scrap when multiple missions are selected in parallel.

### Algorithm Phases

1. **Pre-check**: Return empty list if no missions selected, error if >8 missions selected
2. **Expand Requirements**: Extract all requirements from selected missions
3. **Integrity Check**: Filter out requirements based on `targetType`:
   * `targetType="category"`: Validate category ID exists in category master
   * `targetType="item"`: Validate equipment ID exists in equipment master
   * Display warnings for non-existent IDs
4. **Group by Type**: Separate requirements based on `targetType` field:
   * `targetType="item"` → Item requirements
   * `targetType="category"` → Category requirements
5. **MAX Aggregation (Items)**: For same equipment ID, use maximum count (not sum)
6. **MAX Aggregation (Categories)**: For same category ID, use maximum count (not sum)
7. **Inclusion Resolution (OR Condition)**: Subtract Item counts from Category counts within same category
   * If Category count ≤ Item total → Remove category requirement (Items satisfy it)
   * If Category count > Item total → Keep remaining count
8. **Generate Result**: Combine Item and Category results, sort by category name

### Example Calculation

```text
Selected missions:
- Mission A: 機銃(Category) ×5
- Mission B: 25mm単装機銃(Item, category="機銃") ×2

Result:
- 25mm単装機銃: 2 pieces
- 機銃(Category): 3 pieces  ← (5 - 2 = 3)
```

See `docs/calculation_logic.md` for detailed implementation with test cases.

## Deployment Process

1. Run `npm run build` to generate `dist/` folder
2. Upload `dist/` contents to Lolipop

Master data **must** be placed in `src/data/` directory so it's:

* Bundled into the application by Vite during build
* Always in sync with the deployed application version

## Text and Documentation Conventions

From `.github/copilot-instructions.md`:

### Japanese Text Rules

* Use `,` and `.` instead of `、` and `。`
* Use direct form, not polite form (`~する` not `~します`)
* Use plain dictionary form for verbs in documentation

### Markdown Rules

* Use `*` for unordered lists
* Use continuous `1.` for ordered lists (not `2.`, `3.`)
* Add line breaks after all headings and around lists
* Use 4 spaces for indentation
* Add 1 space after `#` and list markers
* Use backticks for code, filenames, and technical terms

### File Naming

* Repository meta files: UPPERCASE (README.md, LICENSE)
* Project documents: PascalCase (Setup.md, Workflow.md)
* Scripts: snake_case with verb prefix (process_data.py)
* Directories: singular lowercase (script/, data/)

### Git Commit Prefixes

* `feat:` - New features
* `fix:` - Bug fixes
* `refactor:` - Code refactoring including formatting
* `test:` - Adding or modifying tests
* `docs:` - Documentation changes
* `chore:` - Build process, tooling, libraries

## Error Handling Strategy

The app implements 4-level error classification with comprehensive recovery strategies (see `docs/error_handling.md`):

### Error Levels

| Level    | Impact          | User Action | Recovery                             |
| :------- | :-------------- | :---------- | :----------------------------------- |
| Critical | App cannot run  | Required    | Display modal, reload required       |
| Error    | Feature blocked | Recommended | Disable feature, other features work |
| Warning  | Continues       | Optional    | Show warning, all features available |
| Info     | No error        | None        | Informational notification only      |

### Key Error Scenarios

**Data Integrity**:

* Missing equipment IDs in missions → Warning icon on mission card, exclude from calculation
* LocalStorage data corruption on startup → Auto-remove corrupt entries, display warning with details
* ID conflicts → Last-loaded wins (user data overrides official), log warning

**Storage Issues**:

* LocalStorage quota exceeded → Block save, prompt user to export data
* Private browsing mode → Read-only mode, disable edit UI
* Cross-tab data updates → Display reload notification (no auto-merge)

**Import/Export**:

* JSON syntax error → Block import, display detailed error
* Schema validation failure → Block import, show field-level errors
* Import success → Complete overwrite of target data type with confirmation

## Important Implementation Notes

1. **No Server Backend**: All data processing happens client-side. Emphasize this in UI (privacy feature).

2. **HTTPS Required**: `crypto.randomUUID()` requires secure context. App must run on HTTPS or localhost.

3. **Schema Versioning**: All JSON files have a `version` field following Semantic Versioning. Validation checks schema structure, not version numbers. Future schema changes must maintain backward compatibility (add fields only, never remove/change types).

4. **Display Order Management**:
   * Each data type has an `order` field (integer) for sort order
   * Data is sorted first by `isMaster` flag (official first), then by `order` ascending
   * User additions get max(existing order) + 1 within their data source (auto-increment from 0, category-agnostic)
   * **Master Equipment Order Rules**:
     * Individual equipment: 100-interval per category (e.g., small guns: 100-199, medium guns: 200-299)
     * Category representative equipment: Dynamically generated with `order` inherited from category (1, 2, 3, 4...)
     * See `docs/maintenance.md` for detailed allocation rules
   * **Master Mission Order Rules**:
     * Grouped by `period` (Daily/Weekly/etc.), numbered from 0 within each period
   * When updating master data, strictly follow the order allocation rules documented in `docs/maintenance.md`

5. **Max Selection Limit**: UI must enforce max 8 simultaneous mission selections (game constraint).

6. **Validation UX**: Use disabled button pattern instead of post-submit error messages. Invalid forms should disable save buttons with inline error indicators.

7. **Data Immutability**: Never mutate original mission data during calculation. Always create new objects for results.

8. **About Modal on First Launch**: Display About modal automatically on first app launch (check `localStorage['ksp_about_shown']`). This serves as disclaimer confirmation. On subsequent launches, only show via settings menu.

9. **Equipment Management Modal**:
   * Uses a two-section modal (add form + list) that stays open for continuous additions
   * **Mode Selection**: Radio buttons toggle between "Add Equipment" and "Add Category" modes
   * **Add Equipment Mode**: Shows equipment name input and category selection (datalist for auto-suggestion)
   * **Add Category Mode**: Shows category name input only (category representative equipment is auto-generated at runtime)
   * Category deletion automatically deletes all equipment in that category (with confirmation dialog)

## Key Documentation Files

* `docs/design.md` - System architecture and detailed specifications
* `docs/calculation_logic.md` - Algorithm implementation with test cases (8 phases detailed)
* `docs/schema.md` - Complete data structure definitions, validation rules, and `order`/`isMaster` specifications
* `docs/ui_specification.md` - Detailed UI/UX specifications including modal behaviors and filter combinations
* `docs/error_handling.md` - Error classification (4 levels), recovery strategies, and validation on startup
* `docs/import_export.md` - Import/export file formats, validation flow, and filename generation rules
* `docs/progress.md` - Project progress tracking and next steps
