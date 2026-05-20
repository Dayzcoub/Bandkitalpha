# BandKit — Education / Academy Future Module v1.0

## Purpose

BandKit must support a future education-oriented product layer without breaking the Core MVP architecture.

This document defines the product and architecture boundary for **BandKit Education / Academy**: a future module for beginners, students, teachers, mentors, schools, guardians and supervised learning flows.

This is a docs-first product specification. It does not implement backend or UI logic yet.

---

## Decision summary

BandKit Education is **not** a small role added to the normal profile model.

It is a separate future module with its own:

- student / beginner onboarding;
- teacher and mentor workflows;
- learning groups;
- assignments;
- progress tracking;
- supervised accounts;
- guardian / parent approval;
- safe chats;
- education events;
- school / studio administration;
- privacy and safety rules;
- transition path from student profile to normal musician profile.

The Core MVP must remain usable without Education, but it must be designed so Education can be attached later without rewriting user accounts, roles, feeds, events, chats and permissions.

---

## Current implementation boundary

### In current Core MVP

Do now:

- keep user account logic flexible;
- avoid one hard-coded permanent user role;
- separate relationship types from entity membership;
- separate account identity from capabilities;
- keep profile, event, chat and document permissions context-aware;
- leave architecture hooks for future education profiles.

Do not implement yet:

- full student dashboard;
- assignments;
- progress tracking;
- teacher cabinet;
- guardian approval;
- school-managed accounts;
- education moderation workflows;
- dedicated education marketplace;
- age/minor compliance logic.

### In future Education / Academy module

Implement later as a dedicated product area:

- `/academy` or equivalent education dashboard;
- student sandbox;
- teacher tools;
- learning groups;
- lessons and assignments;
- safe education chats;
- education events;
- guardian mode;
- supervised account permissions;
- soft graduation from student to normal musician profile.

---

## Core product principle

BandKit must not treat a user as a single fixed role forever.

A user may simultaneously be:

- a personal user;
- a musician;
- a professional musician;
- a teacher;
- a student;
- a beginner;
- a founder of a band;
- a creator of an orchestra;
- an admin of a group/project;
- a member of another project;
- an event participant;
- an event organizer;
- a studio or organization representative;
- a moderator or admin in a specific context.

These states must be modeled as **contextual capabilities and memberships**, not as one destructive `user.role` value.

---

## Account model guardrails

The account model should separate these concepts:

### 1. Account identity

The base user account.

Examples:

- login identity;
- email / phone verification;
- 2FA state;
- security preferences;
- language and locale;
- account lifecycle state.

### 2. Public profile layer

The public-facing profile.

Examples:

- display name;
- avatar;
- instruments;
- genres;
- city / region;
- public posts;
- portfolio;
- public reputation;
- public profile visibility.

### 3. Experience level

The user's maturity / experience stage.

Suggested future values:

- `student`;
- `beginner`;
- `amateur`;
- `semi_pro`;
- `professional`.

This is not the same as permissions.

### 4. Safety mode

The current safety envelope for the user.

Suggested future values:

- `normal`;
- `sandbox`;
- `supervised`;
- `guardian_required`;
- `school_managed`.

This is not the same as musical skill level.

### 5. Capabilities

Specific things the user can do.

Examples:

- `can_create_posts`;
- `can_receive_public_messages`;
- `can_join_open_events`;
- `can_create_events`;
- `can_create_band`;
- `can_manage_band`;
- `can_publish_as_entity`;
- `can_access_marketplace`;
- `can_teach`;
- `can_manage_students`;
- `can_create_learning_group`;
- `can_assign_homework`;
- `can_view_student_progress`.

### 6. Entity roles

Roles inside a specific band, orchestra, studio, school, event or organization.

Examples:

- owner;
- admin;
- manager;
- member;
- teacher;
- student;
- guardian;
- invited participant;
- subscriber;
- former member.

Entity roles must not be confused with account-wide identity.

---

## Professional musician with teaching activity

A professional musician must be able to enable teaching activity without creating a separate account.

A professional user can simultaneously:

- perform as a musician;
- participate in events;
- create a band;
- create an orchestra;
- create or manage projects;
- publish as themselves;
- publish as an entity they manage;
- run teaching activity;
- manage students;
- create learning groups;
- run masterclasses;
- attach learning documents and assignments.

Teaching activity should be modeled as an optional profile/module layer, not as a replacement for professional musician status.

Possible future teaching profile fields:

- instruments taught;
- student levels accepted;
- lesson formats: online, offline, group, individual;
- city / studio / venue;
- schedule availability;
- education events;
- learning documents;
- student reviews;
- verification and 2FA requirements.

---

## Student / beginner sandbox

### Purpose

The sandbox protects beginners, students and supervised users from the risks of the full social/professional network while still letting them learn, participate and grow.

The UI tone must not feel punitive. It should communicate:

> You are in learning mode, so BandKit shows safe tools and approved interactions first.

Not:

> You are blocked from the real platform.

### Sandbox should allow

- educational profile setup;
- instrument and level selection;
- learning goals;
- teacher-approved learning groups;
- safe education events;
- assignments and practice tasks;
- progress tracking;
- teacher feedback;
- limited profile posts;
- safe group chats;
- approved documents;
- gradual portfolio building.

### Sandbox should restrict by default

- random direct messages;
- public incoming invitations from unknown users;
- unrestricted marketplace access;
- open event invitations from unverified users;
- external links;
- public contact details;
- unmanaged document sharing;
- unsafe public visibility;
- joining arbitrary projects without approval.

---

## Education roles

Future Education module should include these roles.

### Student / beginner

A learner with limited and protected capabilities.

Can:

- join approved learning groups;
- view assigned lessons/documents;
- submit assignments;
- track progress;
- participate in safe education events;
- communicate inside allowed education contexts.

Should not freely:

- receive random DMs;
- join arbitrary adult/professional projects;
- expose contact information;
- publish fully public professional profile details without review.

### Teacher / mentor

A professional or verified educator.

Can:

- create learning groups;
- manage students;
- create assignments;
- provide feedback;
- create education events;
- attach learning documents;
- recommend student progression;
- request or approve certain sandbox transitions depending on policy.

### Guardian / parent / representative

A supervision role, especially for minors or protected accounts.

Can potentially:

- approve account visibility changes;
- approve participation in events;
- view schedule and attendance;
- receive safety notifications;
- manage privacy and communication settings.

### School / studio / education organization

An entity that can manage education spaces.

Can potentially:

- create school-managed student accounts;
- manage teacher rosters;
- manage learning groups;
- create education events;
- control school-owned documents;
- assign organization-level moderators.

### Education moderator

A safety role focused on education-specific complaints and abuse prevention.

Can potentially:

- review reports inside education contexts;
- restrict unsafe contacts;
- audit teacher/student interactions;
- lock unsafe chats;
- escalate to platform moderation.

---

## Student-to-professional transition

BandKit must support a soft, seamless transition from student/beginner profile to normal musician/professional profile.

The user should not need to delete the old account or create a new one.

### Transition stages

Suggested progression:

1. `student` + `sandbox` / `supervised`;
2. `beginner` + limited public profile;
3. `amateur` + broader social/event access;
4. `semi_pro` + project participation and stronger portfolio;
5. `professional` + full professional capabilities.

### Transition should preserve

- account identity;
- verified email/phone/2FA state;
- safe historical learning records;
- approved achievements;
- teacher recommendations if explicitly published;
- education event participation if user chooses to show it;
- public portfolio items selected by the user.

### Transition should not automatically expose

- homework;
- internal teacher comments;
- attendance records;
- private education chat history;
- school-only documents;
- minor-related information;
- old learning evaluations;
- guardian-only notes.

### Transition confirmation

Before opening broader public/professional mode, BandKit should present a privacy review:

- what becomes public;
- what stays private;
- which contacts are allowed;
- whether public DMs are enabled;
- whether marketplace access is enabled;
- whether old education achievements are shown.

For supervised or minor accounts, transition may require guardian, teacher, school or age-based approval depending on policy and law.

---

## Dashboard and navigation implications

### Core BandKit dashboard

For normal users, the dashboard prioritizes:

- today / upcoming events;
- invitations;
- chats;
- documents;
- feed activity;
- groups/projects;
- profile state;
- moderation/admin items when relevant.

### Education dashboard

For students and sandbox users, the future education dashboard should prioritize:

- next lesson;
- current assignments;
- practice progress;
- teacher feedback;
- safe group messages;
- education events;
- learning documents;
- next suggested profile step.

The student should not be dropped into the full adult/professional feed as the first experience.

---

## Chat and messaging implications

Education communication must be context-based.

Allowed chat contexts may include:

- learning group chat;
- lesson chat;
- assignment feedback thread;
- teacher/student chat if approved;
- guardian-visible chat if policy requires;
- education event chat;
- support/moderation chat.

Default restrictions for sandbox users:

- no random incoming DMs from unrelated users;
- no unrestricted external links;
- suspicious links blocked or reviewed;
- no contact-data exposure by default;
- teacher/school conversations may be auditable depending on policy.

---

## Event implications

Education users can participate in safe education events:

- lessons;
- rehearsals;
- school concerts;
- masterclasses;
- workshops;
- approved beginner jams;
- internal performances.

Sandbox users should not receive arbitrary professional event invitations from unknown users.

Event participation may require:

- student confirmation;
- teacher confirmation;
- guardian approval;
- school approval;
- verified organizer status.

---

## Marketplace implications

Sandbox users should not start with the full marketplace.

Future Education module may provide a separate safe discovery surface:

- verified teachers;
- verified schools/studios;
- beginner-safe groups;
- masterclasses;
- educational events;
- approved rehearsal opportunities;
- beginner-friendly open calls.

This must be separate from unrestricted professional marketplace/contact flows.

---

## Reputation and progress implications

Student reputation must not be treated the same as professional reliability rating.

Student metrics may include:

- learning progress;
- attendance;
- assignment completion;
- practice consistency;
- teacher feedback;
- internal achievements;
- safe participation history.

Professional reputation may include:

- event reliability;
- project participation;
- confirmed roles;
- punctuality;
- cancellations;
- peer reviews;
- organizational trust.

Student learning metrics should be private by default and must not automatically become public professional reputation.

---

## Future data model sketch

This is only a planning sketch, not an implementation requirement for the current MVP.

Possible future tables / entities:

- `education_profiles`;
- `teacher_profiles`;
- `student_guardians`;
- `learning_groups`;
- `learning_group_members`;
- `lessons`;
- `assignments`;
- `assignment_submissions`;
- `student_progress_entries`;
- `education_events`;
- `education_documents`;
- `education_chat_permissions`;
- `profile_transition_requests`;
- `profile_transition_privacy_reviews`;
- `teacher_student_relationships`;
- `education_moderation_cases`.

Core MVP should not need these tables now, but should avoid assumptions that make them impossible later.

---

## Core architecture requirements for today

Even before Education is implemented, Core development must follow these rules:

1. Do not build the app around a single permanent `user.role`.
2. Do not make `teacher`, `student`, `musician`, `professional`, `admin` mutually exclusive account identities.
3. Use contextual capabilities and entity memberships.
4. Keep user-to-user friendship separate from group membership.
5. Keep entity subscription separate from membership and admin rights.
6. Keep account security separate from musical experience level.
7. Keep student learning history separate from public professional reputation.
8. Keep report/moderation flows available inside full details, not loud preview cards.
9. Keep preview UI minimal and safe.
10. Design future route/layout space for Education without forcing it into the main feed.

---

## UI principles for future Education module

- Education should have its own dashboard surface.
- Student UI should be safe, simple and encouraging.
- Beginner users should not see the whole professional platform at once.
- Teachers should have management tools, not just public profile labels.
- Guardians should have approval and visibility controls.
- Public profile expansion should be gradual and user-controlled.
- Transition to professional mode should feel like unlocking the next level, not abandoning the old profile.
- Privacy review must happen before learning history becomes public.

---

## Relationship to existing specs

This spec must be considered together with:

- `BandKit_User_Friends_And_Personal_Feed_v1_0.md`;
- `BandKit_Entity_Subscriptions_And_Public_Feeds_v1_0.md`;
- `BandKit_Entity_Account_Lifecycle_And_Inactivity_v1_0.md`.

Education does not replace those mechanics. It adds a protected future layer on top of Core account, relationship, feed, event, document, chat and moderation mechanics.

---

## Implementation priority

Current priority remains Core MVP and UI/logistics polish.

Education / Academy should be treated as a future major coding category, not as a quick patch.

Suggested future milestone group:

1. Core architecture readiness for capabilities and context roles;
2. Education spec expansion;
3. Student sandbox UX mockups;
4. Teacher tools UX mockups;
5. Guardian/supervision policy;
6. Data model design;
7. Backend permissions;
8. Education UI implementation;
9. Safety/moderation implementation;
10. Migration/transition flows.
