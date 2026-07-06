# Graph Report - /Users/daniilklimanov/Claude/BandKit/Bandkitalpha  (2026-07-06)

## Corpus Check
- Large corpus: 825 files · ~289,665 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1086 nodes · 2415 edges · 77 communities (72 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Domain Card Components|Domain Card Components]]
- [[_COMMUNITY_Backend DB & Migrations|Backend DB & Migrations]]
- [[_COMMUNITY_Chat Action Mocks & Policy|Chat Action Mocks & Policy]]
- [[_COMMUNITY_Admin Read-Only Data Bridge|Admin Read-Only Data Bridge]]
- [[_COMMUNITY_TZ v1.2 Master Spec|TZ v1.2 Master Spec]]
- [[_COMMUNITY_Chat Shell & History Wiring|Chat Shell & History Wiring]]
- [[_COMMUNITY_Mock Data Layer|Mock Data Layer]]
- [[_COMMUNITY_Platform Admin Console|Platform Admin Console]]
- [[_COMMUNITY_App State & Session|App State & Session]]
- [[_COMMUNITY_Real Entities API Preview|Real Entities API Preview]]
- [[_COMMUNITY_Navigation & Layout Shells|Navigation & Layout Shells]]
- [[_COMMUNITY_Monetization & Entity Policy|Monetization & Entity Policy]]
- [[_COMMUNITY_Admin Roles Bridge & Shared UI|Admin Roles Bridge & Shared UI]]
- [[_COMMUNITY_Chat Message Rules (editdeletepin)|Chat Message Rules (edit/delete/pin)]]
- [[_COMMUNITY_Server Admin Contract Checker|Server Admin Contract Checker]]
- [[_COMMUNITY_Chat Empty States|Chat Empty States]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Documents & Feed Policy|Documents & Feed Policy]]
- [[_COMMUNITY_Frontend Package Manifest|Frontend Package Manifest]]
- [[_COMMUNITY_Backend Package Manifest|Backend Package Manifest]]
- [[_COMMUNITY_Staging Deploy & Debug Gate|Staging Deploy & Debug Gate]]
- [[_COMMUNITY_Admin Localization Bridge|Admin Localization Bridge]]
- [[_COMMUNITY_Admin Settings Bridge|Admin Settings Bridge]]
- [[_COMMUNITY_User Model & Workspace Spec|User Model & Workspace Spec]]
- [[_COMMUNITY_Admin Billing Bridge|Admin Billing Bridge]]
- [[_COMMUNITY_Education & Subscriptions Policy|Education & Subscriptions Policy]]
- [[_COMMUNITY_Admin Content Bridge|Admin Content Bridge]]
- [[_COMMUNITY_Admin Notifications Bridge|Admin Notifications Bridge]]
- [[_COMMUNITY_Backend Ops & Privacy Rules|Backend Ops & Privacy Rules]]
- [[_COMMUNITY_Chat Access & Archive Rules|Chat Access & Archive Rules]]
- [[_COMMUNITY_Component Inventory & Tokens|Component Inventory & Tokens]]
- [[_COMMUNITY_MVP Shell Mobile Passes|MVP Shell Mobile Passes]]
- [[_COMMUNITY_Entity API Vertical Slice|Entity API Vertical Slice]]
- [[_COMMUNITY_Staging Backend Infrastructure|Staging Backend Infrastructure]]
- [[_COMMUNITY_Platform Admin Governance|Platform Admin Governance]]
- [[_COMMUNITY_Routing Map & Layout Contract|Routing Map & Layout Contract]]
- [[_COMMUNITY_Frontend Admin Contract Checker|Frontend Admin Contract Checker]]
- [[_COMMUNITY_i18n Translator & Bundles|i18n Translator & Bundles]]
- [[_COMMUNITY_Backend Dev Principles & Permissions|Backend Dev Principles & Permissions]]
- [[_COMMUNITY_Friends & Personal Feed Model|Friends & Personal Feed Model]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]

## God Nodes (most connected - your core abstractions)
1. `AppContext` - 77 edges
2. `card()` - 54 edges
3. `button()` - 39 edges
4. `renderPage()` - 39 edges
5. `sendJson()` - 37 edges
6. `defaultRightRail()` - 36 edges
7. `badge()` - 33 edges
8. `pageHeader()` - 32 edges
9. `contentGrid()` - 31 edges
10. `escapeHtml()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `deploy-vps.yml Workflow` --semantically_similar_to--> `Deploy staging GitHub Actions Workflow`  [INFERRED] [semantically similar]
  docs/deploy/VPS_PREVIEW_SETUP.md → .github/workflows/staging-deploy.yml
- `Layout Shells (Public/Auth/App/Admin)` --semantically_similar_to--> `Application Shell (Desktop/Mobile)`  [INFERRED] [semantically similar]
  docs/handoff/spec/BandKit_Routing_Map_v1_0.md → public/assets/BandKit_Production_Assets_v1_3/spec/BandKit_Interface_Layout_Contract_v1_0.md
- `Entities REST API` --shares_data_with--> `PostgreSQL Staging Database`  [INFERRED]
  docs/handoff/checkpoints/BandKit_Entity_API_Vertical_Slice_Checkpoint_1_10_21.md → README.md
- `Admin Module` --implements--> `Moderation and Admin Console`  [INFERRED]
  src/modules/admin/README.md → public/assets/BandKit_Production_Assets_v1_3/spec/BandKit_TZ_v1_2.md
- `Moderation Module` --implements--> `Moderation and Admin Console`  [INFERRED]
  src/modules/moderation/README.md → public/assets/BandKit_Production_Assets_v1_3/spec/BandKit_TZ_v1_2.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Staging Autodeploy Pipeline** — github_workflows_staging_deploy_staging_deploy_workflow, github_workflows_staging_deploy_ssh_deploy_step, readme_staging_deploy_script, docs_handoff_checkpoints_bandkit_frontend_readonly_real_entities_checkpoint_1_10_23_staging_smoke_api [EXTRACTED 1.00]
- **Entity API Vertical Slice Flow** — docs_handoff_checkpoints_bandkit_entity_api_vertical_slice_checkpoint_1_10_21_entities_api, docs_handoff_checkpoints_bandkit_entity_api_vertical_slice_checkpoint_1_10_21_permission_service, docs_handoff_checkpoints_bandkit_entity_api_vertical_slice_checkpoint_1_10_21_audit_events, docs_handoff_checkpoints_bandkit_frontend_readonly_real_entities_checkpoint_1_10_23_bands_page, readme_postgresql_staging [INFERRED 0.85]
- **MVP Shell Iteration Lineage** — checks_mvp_shell_visual_alignment_notes_v1_3_visual_alignment_notes, checks_mvp_shell_content_flow_acceptance_notes_v1_4_content_flow_notes, checks_mvp_shell_reference_alignment_notes_v1_6_reference_alignment_notes, checks_mvp_shell_mobile_stabilization_notes_v1_7_mobile_stabilization_notes, checks_mvp_shell_v1_9_runtime_css_fix_notes_runtime_css_fix_notes [INFERRED 0.85]
- **Staging Autodeploy Pipeline** — docs_handoff_checkpoints_bandkit_github_actions_staging_deploy_checkpoint_1_10_25_staging_deploy_workflow, docs_handoff_checkpoints_bandkit_staging_deploy_script_verified_checkpoint_1_10_18_staging_deploy_script, docs_handoff_checkpoints_bandkit_staging_api_smoke_verified_checkpoint_1_10_22_smoke_api_script, docs_handoff_checkpoints_bandkit_staging_backend_postgresql_api_checkpoint_1_10_16_run_migrations_script [EXTRACTED 1.00]
- **Staging Backend Runtime Stack** — docs_handoff_checkpoints_bandkit_staging_backend_postgresql_api_checkpoint_1_10_16_bandkit_backend_service, docs_handoff_checkpoints_bandkit_staging_backend_postgresql_api_checkpoint_1_10_16_nginx_api_proxy, docs_handoff_runbooks_bandkit_staging_vps_backend_postgresql_setup_ubuntu_22_04_postgresql_local, docs_handoff_checkpoints_bandkit_staging_backend_postgresql_api_checkpoint_1_10_16_health_endpoints [EXTRACTED 1.00]
- **BandKit Chat Governance Ruleset** — docs_handoff_spec_bandkit_chat_exit_and_membership_rules_v1_0_spec, docs_handoff_spec_bandkit_chat_access_notifications_attachments_archive_rules_v1_0_spec, docs_handoff_spec_bandkit_chat_advanced_governance_rules_v1_0_spec, docs_handoff_spec_bandkit_backend_development_principles_v1_0_permission_service [INFERRED 0.85]
- **Chat Message Governance (Delete/Edit/Actions)** — docs_handoff_spec_bandkit_chat_message_delete_rules_v1_0_chat_message_delete_rules, docs_handoff_spec_bandkit_chat_message_edit_rules_v1_0_chat_message_edit_rules, docs_handoff_spec_bandkit_chat_message_actions_accepted_checkpoint_1_10_12_chat_message_actions_checkpoint, docs_handoff_spec_bandkit_chat_policy_accepted_checkpoint_1_10_13_chat_policy_checkpoint [EXTRACTED 1.00]
- **MVP Core Workflow (entity+team+event+document+chat+ack)** — docs_handoff_spec_bandkit_mvp_scope_and_product_positioning_v1_0_core_workflow, docs_handoff_spec_bandkit_documents_and_entity_files_policy_v1_0_entity_document, docs_handoff_spec_bandkit_mvp_scope_and_product_positioning_v1_0_important_message_acknowledgement, docs_handoff_spec_bandkit_final_product_policy_and_backend_handoff_checkpoint_1_10_15_public_working_layer_separation [INFERRED 0.85]
- **MVP Shell Foundation (Handoff + Layout + Components + RLS)** — docs_handoff_spec_bandkit_development_handoff_v1_0_mvp_shell, docs_handoff_spec_bandkit_interface_layout_contract_v1_0_interface_layout_contract, docs_handoff_spec_bandkit_component_inventory_v1_0_component_inventory, docs_handoff_spec_bandkit_database_rls_model_v1_0_database_rls_model [EXTRACTED 1.00]
- **Layered Permission Enforcement** — docs_handoff_spec_bandkit_platform_roles_and_permissions_v1_0_layered_permissions, docs_handoff_spec_bandkit_platform_roles_and_permissions_v1_0_permission_service, docs_handoff_spec_bandkit_platform_entity_lifecycle_and_social_rules_framework_v1_0_participation_drives_access [INFERRED 0.85]
- **Platform vs Entity Administration Separation** — docs_handoff_spec_bandkit_platform_admin_console_v1_0_platform_entity_boundary, docs_handoff_spec_bandkit_platform_owner_operations_console_v1_0_platform_entity_role_separation, docs_handoff_spec_bandkit_platform_roles_and_permissions_v1_0_entity_roles [INFERRED 0.75]
- **Reliability From Verified Participation** — docs_handoff_spec_bandkit_reputation_and_reliability_rules_v1_0_reliability_events, docs_handoff_spec_bandkit_platform_entity_lifecycle_and_social_rules_framework_v1_0_event_lifecycle, docs_handoff_spec_bandkit_tz_v1_2_completion_flow [INFERRED 0.75]
- **Trust & Safety Pipeline** — public_assets_bandkit_production_assets_v1_3_spec_bandkit_tz_v1_2_link_guard, public_assets_bandkit_production_assets_v1_3_spec_bandkit_tz_v1_2_reputation_trust, public_assets_bandkit_production_assets_v1_3_spec_bandkit_tz_v1_2_moderation_admin, public_assets_bandkit_production_assets_v1_3_spec_bandkit_tz_v1_2_audit_log [INFERRED 0.75]
- **v1.3 Layout Contract Governance** — public_assets_bandkit_production_assets_v1_3_spec_bandkit_tz_v1_2_layout_contract, public_assets_bandkit_production_assets_v1_3_spec_bandkit_tz_v1_2_no_hacks_rules, public_assets_bandkit_production_assets_v1_3_spec_changelog_v1_3_layout_contract_changelog, public_assets_bandkit_production_assets_v1_3_spec_bandkit_tz_v1_2_ui_kit [INFERRED 0.75]
- **Event Lifecycle & Reputation Flow** — public_assets_bandkit_production_assets_v1_3_spec_bandkit_tz_v1_2_events_calendar, public_assets_bandkit_production_assets_v1_3_spec_bandkit_tz_v1_2_completion_flow, public_assets_bandkit_production_assets_v1_3_spec_bandkit_tz_v1_2_reputation_trust [INFERRED 0.75]

## Communities (77 total, 5 thin omitted)

### Community 0 - "Domain Card Components"
Cohesion: 0.10
Nodes (104): AppContext, auditEventRow(), availabilityIcon(), bandCard(), chatMessages(), chatRow(), complaintCard(), documentCard() (+96 more)

### Community 1 - "Backend DB & Migrations"
Cohesion: 0.06
Nodes (76): dirname, ensureMigrationTable(), hasMigration(), migrationsDir, run(), getEnv(), checkDatabase(), getDatabaseUrl() (+68 more)

### Community 2 - "Chat Action Mocks & Policy"
Cohesion: 0.06
Nodes (52): action(), canEditOwnMessage(), chatMessageActionsForPolicy(), disabledWriteReason(), editReason(), MockChatMessageAction, MockChatMessageActionContext, MockChatMessageActionId (+44 more)

### Community 3 - "Admin Read-Only Data Bridge"
Cohesion: 0.09
Nodes (48): kpi(), actionBadgeLabel(), actionLabel(), AdminAuditEvent, AdminAuditResponse, AdminEntitiesResponse, AdminEntity, AdminModerationItem (+40 more)

### Community 4 - "TZ v1.2 Master Spec"
Cohesion: 0.06
Nodes (46): Actor Context Model, Asset Pack and Production Archive, Audit Log, BandKit TZ v1.2, Chats and E2EE, Feature-based Code Architecture, Replacement / No-show / Completion Flow, Documents (rider, offer, setlist) (+38 more)

### Community 5 - "Chat Shell & History Wiring"
Cohesion: 0.11
Nodes (32): addDirectChatNavigation(), BandKitHistoryState, bindChatAttachmentMenu(), bindChatPinnedJump(), CHAT_ATTACHMENT_OPTIONS, CHAT_ROOM_IDS, CHAT_STRESS_MESSAGES, CHAT_STRESS_ROOMS (+24 more)

### Community 6 - "Mock Data Layer"
Cohesion: 0.08
Nodes (28): NavItem, AssetKey, MockChatPolicyPreview, auditEvents, bands, chats, complaints, documents (+20 more)

### Community 7 - "Platform Admin Console"
Cohesion: 0.14
Nodes (29): AdminAccess, AdminBadge, AdminDetailCard, AdminKpi, AdminRow, AdminSection, AdminTableRow, AdminTone (+21 more)

### Community 8 - "App State & Session"
Cohesion: 0.13
Nodes (21): AccessLevel, AppState, CurrentUser, Locale, Role, ShellType, ThemeMode, UiStateMode (+13 more)

### Community 9 - "Real Entities API Preview"
Cohesion: 0.16
Nodes (24): canSeeRealApiDebugPanels(), currentRealEntitySlug(), EntitiesResponse, EntityResponse, escapeHtml(), formatDate(), formatEntityMeta(), hydrateDetailPanel() (+16 more)

### Community 10 - "Navigation & Layout Shells"
Cohesion: 0.23
Nodes (18): adminNavItems, appNavItems, bottomNav(), filteredNavItems(), mobileChatBackButton(), mobileMenuDrawer(), mobileTopBar(), navLink() (+10 more)

### Community 11 - "Monetization & Entity Policy"
Cohesion: 0.14
Nodes (19): Entity Capability Expansion Monetization, MVP Financial Scope Boundary, Free Entity Starter Package, Future Financial Module Option, BandKit Monetization and Entity Feature Policy, Documents as First-Class Entity Records, Entity Lifecycle States, Event Lifecycle States (+11 more)

### Community 12 - "Admin Roles Bridge & Shared UI"
Cohesion: 0.21
Nodes (17): AdminBridgeBadge, AdminBridgeTone, badge(), escapeHtml(), listRow(), safeButton(), AdminStaffCatalogItem, AdminStaffCatalogResponse (+9 more)

### Community 13 - "Chat Message Rules (edit/delete/pin)"
Cohesion: 0.14
Nodes (18): Pinned Messages, Chat Message Actions Checkpoint 1.10.12, ChatMessageControls Module, Soft Frontend Delete, Chat Message Delete Rules, Deletion Modes, Entity-Bound Chat, Chat Message Edit Rules (+10 more)

### Community 14 - "Server Admin Contract Checker"
Cohesion: 0.21
Nodes (16): ADMIN_ENDPOINTS, assert(), assertExpectedPath(), assertPayloadContract(), assertStaticContract(), assertUniqueContracts(), DANGEROUS_GUARDRAIL_PATTERN, DANGEROUS_GUARDRAIL_TOKENS (+8 more)

### Community 15 - "Chat Empty States"
Cohesion: 0.24
Nodes (15): CHAT_STATE_CONFIG, ChatStateConfig, ChatStateKind, decorateChatList(), decorateChatStates(), decorateChatThread(), decorateMissingThread(), directStateSurface() (+7 more)

### Community 16 - "TypeScript Config"
Cohesion: 0.12
Nodes (15): compilerOptions, lib, module, moduleResolution, noFallthroughCasesInSwitch, noImplicitOverride, noUnusedLocals, noUnusedParameters (+7 more)

### Community 17 - "Documents & Feed Policy"
Cohesion: 0.17
Nodes (15): Document Versioning, Documents and Entity Files Policy, Entity Document (First-Class), External Export Restriction, Message Attachment, Feed, Posts, Comments & Public Discussions Rules, Reactions Are Not Acknowledgement, Final Product Policy & Backend Handoff 1.10.15 (+7 more)

### Community 18 - "Frontend Package Manifest"
Cohesion: 0.13
Nodes (14): description, devDependencies, typescript, name, private, scripts, build, check (+6 more)

### Community 19 - "Backend Package Manifest"
Cohesion: 0.13
Nodes (14): dependencies, pg, description, engines, node, name, private, scripts (+6 more)

### Community 20 - "Staging Deploy & Debug Gate"
Cohesion: 0.16
Nodes (14): Frontend Read-Only Real Entity Detail Checkpoint 1.10.24, GET /api/v1/entities/:id-or-slug, RealEntitiesPreview.ts, GitHub Actions Staging Deploy Checkpoint 1.10.25, GitHub Actions Staging Secrets, .github/workflows/staging-deploy.yml, Staging API Smoke Verified Checkpoint 1.10.22, scripts/staging-smoke-api.sh (+6 more)

### Community 21 - "Admin Localization Bridge"
Cohesion: 0.23
Nodes (13): AdminLocalizationResponse, applyLocalization(), FALLBACK_NAMESPACES, FALLBACK_OPERATION_TYPES, fetchLocalization(), hydrate(), initPlatformAdminLocalizationReadOnlyBridge(), LanguagePack (+5 more)

### Community 22 - "Admin Settings Bridge"
Cohesion: 0.23
Nodes (13): AdminSettingsResponse, applySettings(), FALLBACK_OPERATION_TYPES, FALLBACK_PROVIDER_SCOPES, fetchSettings(), hydrate(), initPlatformAdminSettingsReadOnlyBridge(), operationLabel() (+5 more)

### Community 23 - "User Model & Workspace Spec"
Cohesion: 0.18
Nodes (13): Actor Context Model, E2EE Chats, Entitlements Over Direct Plan Checks, Feature/Domain-Based Code Architecture, i18n / Localization Language Packs, BandKit ТЗ v1.2 Master Spec, Workspace Model, Account/Profile/Subscription/Trust Separation (+5 more)

### Community 24 - "Admin Billing Bridge"
Cohesion: 0.26
Nodes (12): AdminBillingResponse, applyBilling(), BillingPlan, FALLBACK_OPERATION_TYPES, fetchBilling(), hydrate(), initPlatformAdminBillingReadOnlyBridge(), operationLabel() (+4 more)

### Community 25 - "Education & Subscriptions Policy"
Cohesion: 0.20
Nodes (12): Contextual Capabilities Model, Education / Academy Future Module, Student-to-Professional Transition, Student / Beginner Sandbox, Entity Post Visibility Levels, Entity Subscriptions & Public Feeds, Subscription Is Not Membership, Avatar Strip Previews (+4 more)

### Community 26 - "Admin Content Bridge"
Cohesion: 0.27
Nodes (11): AdminContentResponse, applyContent(), FALLBACK_OPERATION_TYPES, FALLBACK_POLICY_SCOPES, fetchContent(), hydrate(), initPlatformAdminContentReadOnlyBridge(), operationLabel() (+3 more)

### Community 27 - "Admin Notifications Bridge"
Cohesion: 0.27
Nodes (11): AdminNotificationsResponse, applyNotifications(), channelLabel(), FALLBACK_OPERATION_TYPES, FALLBACK_TEMPLATE_SCOPES, fetchNotifications(), hydrate(), initPlatformAdminNotificationsReadOnlyBridge() (+3 more)

### Community 28 - "Backend Ops & Privacy Rules"
Cohesion: 0.18
Nodes (11): Local-only PostgreSQL on VPS, Staging VPS Backend + PostgreSQL Setup Runbook Ubuntu 22.04, Account Deletion Must Not Break Entity History, Layered Profile Privacy, Account Data, Privacy, Deletion and Export Rules v1.0, Mock-to-Real Backend Migration, Backup and Restore Drill, Environment Separation local/staging/production (+3 more)

### Community 29 - "Chat Access & Archive Rules"
Cohesion: 0.20
Nodes (11): Read Receipts and Acknowledgements, Archive Retention 50-55 days, Read-Only State, Chat Access, Notifications, Attachments, Archive Rules v1.0, Typed System Messages, Chat Lifecycle and Type Migration, Important Messages, Announcements, Decisions, Tasks, Public Discussion vs Working Chat Separation (+3 more)

### Community 30 - "Component Inventory & Tokens"
Cohesion: 0.20
Nodes (11): Component Inventory, Domain Components, i18n Component Rules, UI Primitives, Development Handoff, Mock Data Layer, BandKit MVP Shell, Anti-Drift Rules (+3 more)

### Community 31 - "MVP Shell Mobile Passes"
Cohesion: 0.24
Nodes (10): MVP Shell v1.7 Mobile Stabilization Pass, MVP Shell v1.8 Mobile Hardening Pass, BandKit Pre-Code Handoff v1.0, Shell-First Development Principle, BandKit TZ v1.2 Product Specification, BandKit MVP Shell, Non-Negotiable Development Rules, RU/EN i18n Foundation (+2 more)

### Community 32 - "Entity API Vertical Slice"
Cohesion: 0.22
Nodes (10): Deploy Hygiene Verified Checkpoint 1.10.20, Deploy Working Tree Hygiene Cleanup, audit_events Table, Temporary X-BandKit-Dev-User Actor Model, Entities REST API, Entity API Vertical Slice Checkpoint 1.10.21, /bands Read-Only Entity Panel, Frontend Read-Only Real Entities Checkpoint 1.10.23 (+2 more)

### Community 33 - "Staging Backend Infrastructure"
Cohesion: 0.29
Nodes (10): bandkit-backend systemd service, Staging Backend PostgreSQL API Checkpoint 1.10.16, /api/v1/health and /api/v1/health/db, Nginx /api proxy, scripts/run-migrations.js, Staging Deploy Script Verified Checkpoint 1.10.18, scripts/staging-deploy.sh, Operator Quick Commands (+2 more)

### Community 34 - "Platform Admin Governance"
Cohesion: 0.20
Nodes (10): BandKit Platform Admin Console, PlatformAdminConsole Module, Platform vs Entity Admin Boundary, Sensitive Operations Audit Requirement, Immutable Audit Log, Break-Glass Emergency Access, Dual Approval for Dangerous Actions, BandKit Platform Owner Operations Console (+2 more)

### Community 35 - "Routing Map & Layout Contract"
Cohesion: 0.20
Nodes (10): Contract-Based Acceptance, BandKit QA Acceptance Checklist, Layout Shells (Public/Auth/App/Admin), Route Guards, BandKit Routing Map, Anti-Drift Layout Rules, Application Shell (Desktop/Mobile), Canonical Design Tokens (+2 more)

### Community 36 - "Frontend Admin Contract Checker"
Cohesion: 0.20
Nodes (7): adminRouteFiles, forbiddenWriteGuardrails, frontendEntrySource, indexSource, requiredAdminRoutes, requiredFrontendInitializers, root

### Community 37 - "i18n Translator & Bundles"
Cohesion: 0.29
Nodes (7): createTranslator(), findKey(), interpolate(), NamespaceMap, Vars, localeBundles, LocaleCode

### Community 38 - "Backend Dev Principles & Permissions"
Cohesion: 0.28
Nodes (9): Standard Error Codes, Audit-First Approach, Feature Flags, PermissionService / PolicyResolver, Policy Tests, Backend Development Principles v1.0, Chat Access Computed from Parent Entity, Message Reports Preserve Evidence (+1 more)

### Community 39 - "Friends & Personal Feed Model"
Cohesion: 0.22
Nodes (9): Public vs Private Working Layer Separation, BandKit User Friends and Personal Feed Mechanics, Personal vs Project Relationship Separation, Post Visibility Levels, user_relationships / user_follows Model, Navigation Around Context of Action, Personal Layer vs Entity Layer, Preview vs Full Detail Principle (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (9): Appeals and Disputes Flow, Evidence Preservation Principle, Moderation Case States, BandKit Platform Moderation and Safety Rules, Link Guard / External Link Policy, BandKit Security & Anti-Fraud Spec, Security/Anti-Fraud Designed Before Code, 2FA Mandatory for Elevated Roles (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.25
Nodes (8): MVP Shell Acceptance Notes v1.0, Link Policy Helper, MVP Shell v1.4 Content and Flow Acceptance Notes, MVP Shell Pass 2 Acceptance Notes v1.2, MVP Shell v1.6 Reference Alignment Pass, Dark Backstage SaaS Reference Direction, MVP Shell v1.3 Visual Alignment Pass, MVP Shell v1.5 Visual Bugfix Notes

### Community 43 - "Community 43"
Cohesion: 0.25
Nodes (8): deploy-vps.yml Workflow, VPS Preview Deployment Setup, Autodeploy And User Interface Debug Gate Checkpoint 1.10.26, Diagnostics Permissions (canSeeDiagnostics/canSeeTechnicalLabels), RealEntitiesPreview.ts Module, super_admin Technical Debug Gate, Staging GitHub Secrets, Deploy staging GitHub Actions Workflow

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (8): BandKit MVP Shell, Codex MVP Shell Prompt v1.0, Application Layer Structure, Product Modules, Top-level Providers, Realtime Layer, App Architecture v1.0, WebSocket Access Revocation

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (8): Modular Backend Architecture, DATABASE_URL Portability / Avoid Lock-in, Files in Object Storage Not PostgreSQL, Services/Repositories Data-Access Isolation, Backend PostgreSQL VPS Infrastructure Plan v1.0, Staging VPS is Not Production, Storage Lifecycle: Entity Documents vs Attachments, Entity Document Forward/Export Restriction

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (8): Deletion Audit Model, audit_logs Table, chat_rooms Table, Database & RLS Model, documents Table, RLS Permission Enforcement, Mock Permission Model, PermissionService / PolicyResolver

### Community 47 - "Community 47"
Cohesion: 0.32
Nodes (8): bandkit-backend systemd Service, Public API Health Endpoints, Database Migration Runner, MVP Core Database Schema, Nginx /api Proxy, PostgreSQL Staging Database, Staging Backend Foundation, One-Command Staging Deploy Script

### Community 48 - "Community 48"
Cohesion: 0.32
Nodes (7): matchPattern(), matchRoute(), normalizePath(), notFoundRoute, routes, RouteDefinition, RouteMatch

### Community 49 - "Community 49"
Cohesion: 0.32
Nodes (6): AppRootInitializer, platformAdminInitializers, root, initChatComposerPlacement(), placeChatComposer(), initPlatformAdminReadOnlyDataBridge()

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (7): Chat History and Reply Logistics, Default Unread Landing, Message Anchor, Reply with Attached Context, Chat Messenger Compact Checkpoint 1.10.10, Compact VK-like Messenger UI, Chats Layout

### Community 51 - "Community 51"
Cohesion: 0.29
Nodes (7): Soft Deletion by Default, Soft Delete Principle, User Account Deletion, Entity, Account Lifecycle & Inactivity Policy, Entity Lifecycle Statuses, Inactivity Decay Before Deletion, Ownership Transfer

### Community 52 - "Community 52"
Cohesion: 0.29
Nodes (5): dist, mime, port, root, server

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (6): dependencies, pg, name, private, type, version

### Community 54 - "Community 54"
Cohesion: 0.40
Nodes (6): Platform Admin Read-Only Bridge Modules, Platform Admin Read-Only Console, Admin Read-Only Backend Routes, PlatformAdminConsole.ts Module, Admin Read-Only Guardrail, PermissionService

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (5): dist, distStyles, publicDir, root, srcStyles

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (5): bundles, langs, localeDir, outFile, root

### Community 57 - "Community 57"
Cohesion: 0.60
Nodes (5): clean_generated_worktree(), log(), require_file(), staging-deploy.sh script, wait_for_url()

### Community 58 - "Community 58"
Cohesion: 0.47
Nodes (3): expect_contains(), log(), staging-smoke-api.sh script

### Community 59 - "Community 59"
Cohesion: 0.40
Nodes (5): MVP Shell v1.10 Mobile Reference UI Patch, MVP Shell v1.9 Runtime CSS Mobile Contract Fix, BandKit Current Baseline, Mock Permissions and Role Guards, Runtime CSS Synchronization Rule

### Community 60 - "Community 60"
Cohesion: 0.40
Nodes (5): MVP Core Database Schema Checkpoint 1.10.17, 0002_mvp_core_schema.sql, MVP Workflow: entity+team+event+document+chat+acknowledgement, schema_migrations table, Large Table Partitioning Design

### Community 61 - "Community 61"
Cohesion: 0.40
Nodes (5): PermissionService / PolicyResolver, Backend Development Principles, BandKit Production Launch Checklist, Operational Readiness Before Launch, Verified Restore Drill Launch Blocker

### Community 62 - "Community 62"
Cohesion: 0.40
Nodes (5): No-Show and Anti-Abuse Protections, Structured Reliability Events, BandKit Reputation and Reliability Rules, Verified-Context Reputation Not Revenge, Event Completion Flow

### Community 63 - "Community 63"
Cohesion: 1.00
Nodes (3): src/app/App.ts, Chat Cleanup Accepted Checkpoint 1.10.11, Narrow Chat Pinned Strip

## Knowledge Gaps
- **277 isolated node(s):** `name`, `version`, `private`, `type`, `description` (+272 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppContext` connect `Domain Card Components` to `App State & Session`, `Navigation & Layout Shells`, `Chat Shell & History Wiring`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `mockChatPolicyForRoom()` connect `Chat Action Mocks & Policy` to `Mock Data Layer`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `renderPage()` connect `Domain Card Components` to `App State & Session`, `Chat Shell & History Wiring`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _318 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Domain Card Components` be split into smaller, more focused modules?**
  _Cohesion score 0.10382427307206069 - nodes in this community are weakly interconnected._
- **Should `Backend DB & Migrations` be split into smaller, more focused modules?**
  _Cohesion score 0.0586340206185567 - nodes in this community are weakly interconnected._
- **Should `Chat Action Mocks & Policy` be split into smaller, more focused modules?**
  _Cohesion score 0.06327683615819209 - nodes in this community are weakly interconnected._