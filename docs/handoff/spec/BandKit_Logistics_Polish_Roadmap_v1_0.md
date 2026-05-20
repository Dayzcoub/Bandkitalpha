# BandKit — Logistics Polish Roadmap v1.0

## Purpose

Before adding new modules and pages, BandKit must polish the existing user logistics so the product feels coherent, predictable and useful.

This document defines the immediate product/UI phase after `BandKit_User_Logistics_And_Product_Journeys_v1_0.md`.

This is a docs-first implementation roadmap. It does not implement backend or UI logic yet.

---

## Strategic decision

Do not keep expanding the app with new modules until the current Core MVP routes have a stable logistics foundation.

Current priority:

1. polish how users move through existing routes;
2. make preview/detail behavior consistent;
3. make mobile navigation reliable;
4. make context and actor identity clear;
5. make existing pages feel like connected workflows;
6. only then continue adding new modules and pages.

New features are allowed only when they support this logistics pass directly.

---

## Current accepted UI principle

Keep the accepted direction:

- previews show minimum information;
- details live inside full pages;
- people in previews use horizontal avatar strips;
- no heavy member cards in lists/previews;
- no loud red report actions in previews;
- secondary statuses use compact muted icon chips;
- rating is icon + number;
- mobile-first must be checked on real iPhone/Safari;
- UI changes should be systemic, not one-off visual hacks.

---

## Phase 0 — Baseline stabilization

Goal: freeze the current product direction and avoid drift.

Tasks:

- keep current `main` baseline as the working branch;
- do not add new broad modules during logistics polish;
- continue small safe commits;
- keep docs-first decisions in `docs/handoff/spec/`;
- do not introduce backend assumptions that lock users into one permanent role;
- preserve current GitHub -> VPS deploy flow;
- verify important UI changes on the VPS preview and real iPhone where possible.

Exit criteria:

- current specs are committed;
- next work items are clearly tied to logistics polish;
- no new module work is started before route logistics are reviewed.

---

## Phase 1 — Dashboard / feed separation

Problem:

The app should not feel like the feed is the only center. Users need a working home surface.

Direction:

- keep `/feed` for now if renaming is risky;
- visually structure the top of `/feed` as a dashboard/work surface;
- keep feed updates below the operational blocks;
- later decide whether `/dashboard` becomes a separate route.

Dashboard should prioritize:

- today / upcoming events;
- invitations;
- unread chats;
- documents requiring action;
- active groups/projects;
- quick create actions;
- profile completion/security hints;
- moderation/admin counters only when relevant.

Exit criteria:

- first screen answers “what do I need to do now?”;
- feed updates do not drown urgent actions;
- mobile view remains compact and thumb-friendly.

---

## Phase 2 — Back / return logistics

Problem:

Users jump between events, profiles, documents and chats. Returning to the previous place must feel native.

Current good baseline:

- history back exists;
- scroll restoration exists;
- mobile back behavior has been improved.

Next polish:

- verify return from profile opened inside event participant context;
- verify return from document opened from event/project;
- verify return from chat opened from event/project;
- verify return from entity detail back to feed/list;
- keep fallback route safe when no browser history exists;
- preserve scroll and context where possible.

Exit criteria:

- user can complete `dashboard -> event -> document -> chat -> back` without getting lost;
- iPhone/Safari behavior matches expected mobile navigation.

---

## Phase 3 — Preview/detail consistency

Problem:

Preview cards must stay light, and detail pages must contain the full information.

Tasks:

- audit all preview surfaces;
- remove or reduce heavy details in list cards;
- keep report actions inside full details only;
- use avatar strips for participant/member previews;
- ensure preview card click opens the correct detail page;
- ensure full pages include roles, permissions, documents, chats and reports where appropriate.

Routes to audit:

- `/feed`;
- `/profile/me`;
- `/profile/:profileId`;
- `/bands`;
- `/bands/:bandId`;
- `/events`;
- `/events/:eventId`;
- `/documents`;
- `/documents/:documentId`;
- `/marketplace`;
- `/notifications`;
- `/admin/users`.

Exit criteria:

- previews answer only “what is it and should I open it?”;
- full pages answer “what can I do here?”;
- no heavy user/member cards remain in preview lists.

---

## Phase 4 — Real avatar strip component

Problem:

The current avatar-strip UI is partly achieved through CSS over old compact cards. This works visually, but the DOM still contains hidden profile names/actions in some places.

Direction:

- replace heavy `profileCompactCard` usage in preview strips with a real `avatarStrip` helper/component;
- render only avatar links and accessible labels;
- keep optional count chip;
- keep horizontal iOS scroll;
- preserve current accepted visual style.

Candidate places:

- band detail members;
- event detail participants;
- admin users preview if it is used as a quick overview;
- future followers/friends previews;
- future entity subscribers previews.

Exit criteria:

- avatar strips render lightweight markup;
- hidden buttons/roles are not present in preview strips;
- detail pages still provide full profile/member data when opened.

---

## Phase 5 — Actor context polish

Problem:

The user can act as themselves or as an entity. The UI must not make this ambiguous.

Actions needing actor clarity:

- create post;
- create event;
- create band/project;
- publish entity update;
- send chat message;
- upload document;
- invite participant;
- moderate/report;
- change settings.

UI should communicate examples like:

- `Posting as personal profile`;
- `Posting as Northern Lights Band`;
- `Creating event for Helsinki Jazz Orchestra`;
- `Replying as event participant`;
- `Managing as project admin`.

MVP implementation can start with static mock indicators, then become real actor switching later.

Exit criteria:

- user can tell whether they are acting as self or entity;
- no create/publish/reply action feels identity-ambiguous.

---

## Phase 6 — Entity pages as working contexts

Problem:

Bands/projects/orchestras must feel like working entities, not just public cards.

Polish targets for `/bands/:bandId`:

- overview;
- public/entity feed preview;
- members avatar strip;
- events block;
- documents block;
- chat entry point;
- permissions/settings for admins;
- lifecycle/status indicator;
- report/moderation only inside detail.

Exit criteria:

- entity page answers: who is involved, what is happening, what documents/chats/events are linked, and what I can do.

---

## Phase 7 — Event pages as working contexts

Problem:

Events are central workflow nodes and must connect people, documents and chats.

Polish targets for `/events/:eventId`:

- clear date/time/location/status;
- organizer and linked entity;
- participants avatar strip;
- role/participation state;
- documents block;
- event chat entry point;
- RSVP/confirmation action;
- report/moderation inside detail;
- back navigation to previous context.

Exit criteria:

- event detail can support the journey `open invite -> inspect people -> open document -> write in chat -> return`.

---

## Phase 8 — Document context polish

Problem:

Documents must always show ownership and access reasoning.

Polish targets:

- global `/documents` should aggregate documents across contexts;
- `/documents/:documentId` should show owner/context/status/access;
- linked project/event/profile should be visible;
- access/permission explanation should be clear;
- export/view actions should remain secondary unless document is the main task.

Exit criteria:

- user can always tell why they can see a document and where it belongs.

---

## Phase 9 — Chat context polish

Problem:

Chats must be tied to real contexts, not feel like generic floating messages.

Polish targets:

- chat list rows should show type/context;
- chat room should show whether it is personal, group, event or document-related;
- composer should make visibility/link safety clear;
- future actor identity should be considered;
- event/project/document entry points should lead to the right chat context.

Exit criteria:

- user can tell who sees the message and why the chat exists.

---

## Phase 10 — Relationship vocabulary polish

Problem:

Friend, follower, subscriber, member, participant and admin are different states.

Tasks:

- audit labels across profile/entity/event pages;
- ensure `friend` is personal only;
- ensure `subscriber/follower` does not imply membership;
- ensure `member` implies entity/workspace relationship;
- ensure `participant` is event-specific;
- ensure admin/owner is context-specific.

Exit criteria:

- UI does not blur relationship types;
- user understands why each action is available.

---

## Phase 11 — Mobile-first QA pass

Problem:

Chrome responsive preview is not enough. Real mobile behavior matters.

Test on iPhone/Safari where possible:

- bottom nav safe area;
- back button and browser back;
- horizontal avatar strips;
- event card readability;
- feed/dashboard top sections;
- document detail scrolling;
- chat composer visibility;
- drawer menu;
- tap targets;
- no accidental overflow;
- no hidden primary actions below unreachable areas.

Exit criteria:

- common journeys are usable on real mobile;
- preview cards remain compact;
- bottom nav and safe areas do not collide.

---

## Phase 12 — New modules may resume

Only after logistics polish reaches acceptable quality should new module/page expansion resume.

Possible next modules after logistics polish:

- deeper marketplace;
- richer notifications;
- real profile editing;
- document upload flows;
- event planning enhancements;
- entity settings;
- Education / Academy mock exploration;
- backend integration.

New modules must follow the polished logistics patterns from this roadmap.

---

## Immediate next implementation recommendations

Recommended next coding order:

1. Create real `avatarStrip` helper and replace hidden compact-card strips.
2. Polish `/bands/:bandId` full detail as a working entity context.
3. Polish `/events/:eventId` full detail as a working event context.
4. Add basic context blocks/links between event, documents and chat.
5. Add static actor-context hints in create/publish/reply areas.
6. Re-audit `/feed` top area as dashboard-style working surface.
7. Run mobile iPhone/Safari preview check on VPS.

---

## Related specs

This roadmap depends on:

- `BandKit_User_Logistics_And_Product_Journeys_v1_0.md`;
- `BandKit_User_Friends_And_Personal_Feed_v1_0.md`;
- `BandKit_Entity_Subscriptions_And_Public_Feeds_v1_0.md`;
- `BandKit_Entity_Account_Lifecycle_And_Inactivity_v1_0.md`;
- `BandKit_Education_Academy_Future_Module_v1_0.md`.
