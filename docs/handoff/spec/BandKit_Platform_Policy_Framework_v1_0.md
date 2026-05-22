# BandKit — Platform Policy Framework v1.0

## Status

Accepted platform policy direction.

This document defines the general approach for BandKit platform policies. BandKit should follow common social platform principles, adapted to the specific needs of musicians, bands, orchestras, technicians, organizers, events, documents, reliability and safety.

---

## Core approach

BandKit is not only a messenger and not only a social feed. It is a social/work platform for music-related collaboration.

Common social platform baseline:

- users;
- profiles;
- social graph;
- feeds;
- posts;
- comments;
- direct messages;
- groups;
- events;
- notifications;
- moderation.

BandKit adaptation:

- musicians;
- technicians;
- managers;
- organizers;
- bands/groups/orchestras;
- projects;
- rehearsals/events/concerts;
- working chats;
- riders/documents/contracts/receipts/schedules;
- participation/declines/no-shows;
- reliability/reputation;
- entity-based permissions;
- strict safety and audit rules.

Accepted principle:

> Use standard social platform patterns where possible, but make them stricter when BandKit context involves working obligations, events, documents, safety or reputation.

---

## Already accepted core chat/backend specs

Current accepted foundation includes:

- `BandKit_Chat_Policy_Accepted_Checkpoint_1_10_13.md`
- `BandKit_Chat_Exit_And_Membership_Rules_v1_0.md`
- `BandKit_Chat_Message_Delete_Rules_v1_0.md`
- `BandKit_Chat_Message_Edit_Rules_v1_0.md`
- `BandKit_Chat_Access_Notifications_Attachments_Archive_Rules_v1_0.md`
- `BandKit_Chat_Advanced_Governance_Rules_v1_0.md`
- `BandKit_Backend_PostgreSQL_VPS_Infrastructure_Plan_v1_0.md`
- `BandKit_Backend_Production_Readiness_Risk_Register_v1_0.md`
- `BandKit_Backend_Development_Principles_v1_0.md`

Future platform policy specs should not contradict these accepted rules.

---

## Required platform policy areas

### 1. Platform Roles And Permissions

Should define:

- global roles;
- entity roles;
- project roles;
- event roles;
- organization roles;
- moderation/admin roles;
- read-only/restricted states;
- permission inheritance from parent entities.

Key rule:

> A user can have different permissions in different entities. Global role is not the same as project/event/organization role.

---

### 2. User Profile And Privacy Rules

Should define:

- public profile visibility;
- registered-user visibility;
- friend/contact visibility;
- project/event participant visibility;
- organizer/admin visibility;
- moderator visibility;
- hidden/private fields;
- profile verification state;
- privacy-safe display in search/feed/events.

Sensitive fields:

- phone;
- email;
- real name;
- location;
- age/date of birth;
- social links;
- reliability history;
- event history;
- documents;
- private notes.

---

### 3. Social Graph Rules

Should define:

- friends;
- followers;
- subscriptions;
- contacts;
- blocks/restrictions;
- group/entity followers;
- event subscribers;
- invitation relationships;
- former participant status.

Key rule:

> Social graph permissions must not override stricter entity, safety or privacy rules.

---

### 4. Feed, Posts And Comments Rules

Should define:

- who can post;
- profile posts;
- group/project posts;
- event posts;
- comments;
- likes/reactions;
- reposts;
- visibility settings;
- edit/delete windows;
- moderation/report flow;
- public discussion vs working chat separation.

Key rule:

> Public comments/discussions must not become private working chats and must not expose entity-confidential documents or decisions.

---

### 5. Groups, Projects And Organizations Lifecycle

Should define:

- creation;
- ownership;
- admin/manager roles;
- membership;
- invitations;
- removal;
- ownership transfer;
- last-owner protection;
- archive;
- deletion;
- restoration;
- related chats/documents/events.

Key rule:

> A group/project/organization must not be left without a responsible owner/admin.

---

### 6. Events And Participation Lifecycle

Should define:

- draft;
- published;
- recruiting;
- confirmed;
- in progress;
- completed;
- archived;
- cancelled/rescheduled;
- participant invitation;
- application/request to participate;
- acceptance/decline;
- no-show;
- replacement participant;
- organizer cancellation;
- important announcements;
- event chat/document access.

Key rule:

> Event participation drives access to event working chat and event documents.

---

### 7. Invitations And Participation Rules

Should define:

- invite to group/project/event;
- apply to group/project/event;
- accept/decline;
- revoke invite;
- cancel application;
- repeat invite;
- expired invite;
- who can invite;
- what happens to chats and documents after acceptance/removal/decline.

Key rule:

> Users enter entity working chats through entity membership/participation, not direct chat invite.

---

### 8. Decline, Cancellation And No-show Rules

Should define:

- early decline;
- late decline;
- no-show;
- valid reason;
- illness/emergency;
- replacement;
- organizer cancellation;
- event reschedule;
- dispute process;
- reliability impact;
- notifications;
- chat/system messages.

Key rule:

> Reliability impact must be fair, context-aware and dispute-friendly. It must not become a revenge tool.

---

### 9. Reputation And Reliability Rules

Should define:

- public reputation;
- private event feedback;
- reliability events;
- no-show records;
- late cancellation records;
- confirmed positive participation;
- who can leave feedback;
- when feedback opens;
- appeal/dispute;
- anti-abuse protections;
- visibility rules.

Key rule:

> Reputation must be built from verified participation context, not arbitrary social attacks.

---

### 10. Documents And Entity Files Policy

Should define:

- entity document vs chat attachment;
- rider;
- contract;
- receipt;
- schedule;
- setlist;
- technical plan;
- booking/payment-related file;
- versions;
- permissions;
- export rights;
- archive;
- deletion;
- audit;
- access after leaving entity.

Accepted existing rule:

> Entity documents and attachments stay inside the entity by default. External forwarding/export is limited to responsible roles and must be auditable later.

---

### 11. Financial And Monetization Policy

Accepted current financial position:

> BandKit will not process calculations, settlements, payments or financial transactions through the platform at this stage.

Current stage rules:

- no in-platform payments;
- no settlement engine;
- no commission from gigs/payments;
- no escrow;
- no invoice/payment automation;
- no legally binding financial workflow inside platform MVP;
- financial/payment-related documents may exist as entity documents if users upload them, but access/export must follow document policies;
- payment/off-platform fraud patterns must still be handled by safety/moderation policy.

Future option:

- financial workflows may be added later only after legal/business requirements are clarified;
- architecture should not block future addition of payments, invoices, escrow, contracts or settlement modules;
- future financial module must be separate, permissioned, audited and legally reviewed.

Current monetization direction:

> Monetization should focus on expanding platform capabilities for selected entities, not on processing user payments for gigs.

Possible future monetization areas:

- premium group/project features;
- expanded event management features;
- organization tools;
- document/versioning storage limits;
- advanced analytics;
- advanced moderation/admin tools for organizations;
- higher storage quotas;
- team/role management;
- verified organization profile;
- professional promotion tools;
- advanced notifications/automation.

Key rule:

> Do not design MVP around payment processing. Design it so payments can be added later without breaking the entity/document/permission model.

---

### 12. External Links And Anti-fraud Rules

Should define:

- external link restrictions;
- allowed links/whitelist later;
- profile links;
- document links;
- phone/email sharing rules;
- fraud pattern detection;
- off-platform payment warnings;
- suspicious link reporting;
- moderator review.

Key rule:

> Safety against scams and social engineering is a first-class platform concern.

---

### 13. Platform Moderation And Safety Rules

Should define:

- report user;
- report message;
- report post/comment;
- report event;
- report group/organization;
- report document;
- moderation queue;
- statuses;
- actions;
- evidence preservation;
- user restrictions;
- appeals;
- audit.

Key rule:

> Moderation actions must preserve context, reasons and audit trail.

---

### 14. Account Data, Deletion And Export Rules

Should define:

- account deletion;
- account deactivation;
- anonymization;
- data export;
- what happens to messages;
- what happens to entity documents;
- what happens to events/groups owned by user;
- last-admin protection;
- safety/legal/audit retention.

Key rule:

> Account deletion must not destroy entity history, safety evidence, legal/audit records or other users' legitimate access.

---

### 15. Notifications Policy

Should define:

- push;
- email;
- in-app notification center;
- critical vs non-critical;
- mute;
- digest;
- quiet hours;
- privacy-safe push text;
- language/localization;
- event/project important alerts.

Key rule:

> Notifications must respect access rights and must not leak confidential entity information.

---

### 16. Localization Policy

Should define:

- interface languages;
- system message localization;
- notification localization;
- event/group language;
- fallback language;
- backend event payloads as type+payload, not only pre-rendered text.

Key rule:

> Store system events structurally; render text in the user's language.

---

### 17. Feature Flags And Release Policy

Should define:

- staging-only features;
- production features;
- who can enable flags;
- rollback strategy;
- partial rollout;
- test/demo gating;
- feature owner.

Key rule:

> Unfinished features must not leak into production by accident.

---

### 18. Testing And QA Policy

Should define:

- unit tests;
- policy tests;
- integration tests;
- e2e tests;
- visual checks;
- staging checklist;
- production release checklist;
- security checks;
- migration checks.

Key rule:

> Permissions, documents, auth, events and chat policies need tests before production.

---

### 19. Admin Platform Tools

Should define internal tools for:

- users;
- groups/projects;
- events;
- documents;
- reports;
- restrictions/read-only;
- roles;
- audit;
- document export audit;
- system events;
- feature flags;
- support actions.

Key rule:

> If a policy exists, admins/moderators need tools to operate it safely.

---

### 20. Production Launch Checklist

Should define:

- production hosting;
- production database;
- backups;
- restore drill;
- domain/SSL;
- monitoring/logging;
- storage/object storage;
- rate limits;
- legal pages;
- admin account setup;
- moderation flow;
- support contact;
- seed data;
- mock disabled;
- security review;
- rollback plan.

Key rule:

> Public launch requires operational readiness, not only working UI.

---

## Accepted product direction

BandKit should be built on common social platform principles, but adapted to a stricter professional collaboration context.

Important BandKit-specific differences from a generic social network:

- entity-bound working chats are stricter than casual chats;
- documents are first-class entity records, not just attachments;
- participation history can affect reliability;
- important event/project messages can require acknowledgement;
- safety and anti-fraud are core platform concerns;
- moderation/audit must be designed early;
- financial processing is intentionally out of scope for MVP;
- monetization focuses on expanded platform capabilities for entities, not payments/settlements through the platform.

---

## Recommended next specs

After this framework, the next detailed policy specs should be:

1. `BandKit_Platform_Roles_And_Permissions_v1_0.md`
2. `BandKit_Entity_Lifecycle_Rules_v1_0.md`
3. `BandKit_Invitations_And_Participation_Rules_v1_0.md`
4. `BandKit_Reputation_And_Reliability_Rules_v1_0.md`
5. `BandKit_Documents_And_Entity_Files_Policy_v1_0.md`
6. `BandKit_Platform_Moderation_And_Safety_Rules_v1_0.md`
7. `BandKit_Account_Data_Privacy_Deletion_Export_Rules_v1_0.md`
8. `BandKit_Production_Launch_Checklist_v1_0.md`
