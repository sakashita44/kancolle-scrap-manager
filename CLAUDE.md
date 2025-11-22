# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

艦これ 工廠任務廃棄マネージャー (Kancolle Scrap Manager) is a web application that calculates the optimal minimum equipment scrap list when managing multiple Kancolle factory missions in parallel to prevent wasteful scrapping.

## Tech Stack

* **Frontend**: React, Tailwind CSS, Lucide React
* **Build Tool**: Not yet configured (documentation mentions Vite)
* **Hosting**: Static hosting on Lolipop
* **Master Data**: Hosted on GitHub Pages as JSON
* **Data Storage**: Browser LocalStorage

## Development Commands

**Note**: The project appears to be in early setup phase. Build tools are not yet configured in package.json but documentation indicates Vite will be used.

Expected commands once configured:

* `npm run dev` - Start development server
* `npm run build` - Build for production (outputs to `dist/`)
* `npm run test` - Run tests (not yet implemented)

## Data Architecture

### ID Naming Convention

The project uses strict prefix-based namespacing to prevent data conflicts:

| Data Type          | Prefix   | Format Example       | Generation Method     | Deletable |
| :----------------- | :------- | :------------------- | :-------------------- | :-------- |
| Official Equipment | `m_eq_`  | `m_eq_gun_12cm`      | Manual definition     | No        |
| Official Mission   | `m_ms_`  | `m_ms_daily_scrap_1` | Manual definition     | No        |
| User Equipment     | `u_eq_`  | `u_eq_<UUID>`        | `crypto.randomUUID()` | Yes       |
| User Mission       | `u_ms_`  | `u_ms_<UUID>`        | `crypto.randomUUID()` | Yes       |

**Critical Rules**:

* Official master data IDs are **immutable** once published (to prevent breaking user data references)
* Deprecated items should be logically deleted by renaming to "【廃止】..." rather than removing the ID
* UUIDs are generated using `crypto.randomUUID()`, requiring HTTPS or localhost environment

### Data Flow Strategy

The app uses a hybrid fetch strategy for master data:

1. **Primary**: Fetch from GitHub Pages (`https://<user>.github.io/.../data/missions.json`)
2. **Fallback**: If GitHub Pages fails, fetch from local hosting server (`./data/missions.json`)
3. **Failure**: Display warning banner, operate with user-defined data only

Cache busting is implemented via URL query parameters (e.g., `?v=1.0.0`).

### Storage Locations

* **LocalStorage**: User-defined equipment/missions, app settings
* **SessionStorage**: Selected mission state (cleared on tab close)
* **GitHub Pages**: Official master data (primary source)
* **`public/data/`**: Backup master data bundled with deployment

## Core Calculation Logic

The calculation algorithm determines the **minimum** equipment to scrap when multiple missions are selected in parallel. Key principles:

1. **MAX Aggregation**: When multiple missions require the same equipment, use the maximum count (not sum)
2. **OR Condition (Inclusion Resolution)**: Item-specific requirements are subtracted from category requirements
3. **Validation**: Equipment IDs that don't exist in the master are excluded from calculation with a warning

### Example Calculation

```
Selected missions:
- Mission A: 機銃(Category) ×5
- Mission B: 25mm単装機銃(Item, category="機銃") ×2

Result:
- 25mm単装機銃: 2 pieces
- 機銃(Category): 3 pieces  ← (5 - 2 = 3)
```

The algorithm is in `docs/calculation_logic.md` with detailed phase-by-phase implementation steps.

## Deployment Process

1. Run `npm run build` to generate `dist/` folder
2. Upload `dist/` contents to Lolipop (updates backup master data)
3. Push `public/data/` JSON changes to GitHub (updates primary master data)

Master data **must** be placed in `public/data/` directory so it's:

* Copied to `dist/` by Vite during build
* Accessible as GitHub Pages public source

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

Comprehensive error handling is defined in `docs/error_handling.md`:

* **Critical**: App cannot continue, display error modal with reload option
* **Error**: Feature unavailable, disable that feature only
* **Warning**: Operation continues with notification (e.g., missing equipment ID in mission)
* **Info**: Informational only (e.g., fallback to local master data)

Key error scenarios:

* Network errors have automatic retry (1 attempt) + fallback to local files
* Data integrity errors (missing equipment IDs) show warnings on mission cards but allow calculation
* LocalStorage quota exceeded prompts user to export data
* Import validation errors block import completely but preserve existing data

## Important Implementation Notes

1. **No Server Backend**: All data processing happens client-side. Emphasize this in UI (privacy feature).

2. **HTTPS Required**: `crypto.randomUUID()` requires secure context. App must run on HTTPS or localhost.

3. **Schema Versioning**: All JSON files have a `version` field following Semantic Versioning. Future versions must implement migration logic.

4. **Max Selection Limit**: UI must enforce max 8 simultaneous mission selections (game constraint).

5. **Validation UX**: Use disabled button pattern instead of post-submit error messages. Invalid forms should disable save buttons with inline error indicators.

6. **Data Immutability**: Never mutate original mission data during calculation. Always create new objects for results.

## Key Documentation Files

* `docs/design.md` - System architecture and detailed specifications
* `docs/calculation_logic.md` - Algorithm implementation with test cases
* `docs/schema.md` - Complete data structure definitions and validation rules
* `docs/ui_specification.md` - Detailed UI/UX specifications and component behavior
* `docs/error_handling.md` - Error classification and recovery strategies
