# BandKit — User Logistics & Product Journeys v1.0

## Purpose

BandKit must feel like a working center for musicians, bands, orchestras, studios, venues, teachers, organizers and music-related teams — not just a collection of screens.

This document defines the high-level user logistics model: how users enter the product, understand where they are, move between contexts, act as themselves or as entities, return to previous places, and complete real-world music workflows.

This is a docs-first product specification. It does not implement backend or UI logic yet.

---

## Core principle

BandKit navigation must be built around **context of action**, not around isolated pages.

The product should answer these questions quickly:

- What is happening today?
- Who needs my attention?
- Where was I invited?
- Which event, chat or document requires action?
- Am I acting as myself or as a band/project/studio/organization?
- What details are hidden behind this preview?
- How do I return to where I came from?

The user should not feel lost while moving through feed, profile, event, group, document and chat contexts.

---

## Main product model

BandKit has two major layers.

### 1. Personal layer

The user as an individual.

Includes:

- personal profile;
- personal feed;
- friends;
- followers/subscribers;
- personal reputation;
- personal chats;
- direct invitations;
- personal documents;
- personal settings;
- account security.

### 2. Entity layer

The user as a participant or manager of something larger.

Includes:

- bands;
- music groups;
- orchestras;
- temporary projects;
- studios;
- rehearsal spaces;
- venues;
- production teams;
- agencies;
- schools;
- education organizations;
- events;
- documents;
- entity chats;
- entity public feeds;
- entity settings.

The UI must always make it clear whether the user is acting as:

- themselves;
- a member;
- a manager/admin;
- an owner;
- an invited participant;
- an entity representative.

---

## Home / dashboard logistics

After login, the user should not be dropped into an endless feed as the only center of the app.

The main surface should behave as a **working dashboard**.

Priority blocks:

1. **Today / Now**
   - next rehearsal;
   - next concert/event;
   - urgent invitations;
   - unread chats;
   - documents requiring confirmation;
   - moderation/admin items when relevant.

2. **My actions**
   - create post;
   - create event;
   - create band/project;
   - open documents;
   - open chats;
   - open profile;
   - continue onboarding/profile completion.

3. **My spaces**
   - personal profile;
   - bands/projects;
   - events;
   - documents;
   - chats;
   - marketplace/discovery when allowed.

4. **Feed / updates**
   - personal feed;
   - followed user updates;
   - subscribed entity updates;
   - project/entity posts;
   - relevant event updates.

The feed is important, but it should not be the only mental center of BandKit.

---

## New user journey

A new user should move through a lightweight onboarding path.

Suggested flow:

1. Register / sign in.
2. Confirm email and/or phone.
3. Offer 2FA setup, with stronger requirements later for elevated roles.
4. Choose initial profile direction:
   - musician;
   - vocalist;
   - solo performer;
   - band/project;
   - studio;
   - organizer;
   - technician;
   - teacher;
   - venue;
   - other music-related role.
5. Fill minimal profile.
6. Choose first action:
   - create project;
   - join by invitation;
   - find people;
   - create first post;
   - add portfolio;
   - browse safe feed;
   - open dashboard.

Onboarding must not require the user to complete everything before seeing value.

A profile completion indicator can guide the user gradually.

---

## Returning user journey

A returning user usually wants to resume work quickly.

Common journey:

1. Open dashboard.
2. See urgent items.
3. Open event invitation.
4. Check participants.
5. Open linked document.
6. Write in event/project chat.
7. Return to the previous place.

This is why back navigation, scroll restoration and contextual breadcrumbs are core product logistics, not minor UI details.

---

## Acting as self vs acting as entity

A user may have many contexts at once.

Examples:

- post as personal profile;
- post as band;
- create event as personal organizer;
- create event as orchestra admin;
- reply as event participant;
- reply as project manager;
- upload document to personal profile;
- upload document to project workspace;
- moderate as organization admin;
- moderate as platform moderator.

Every create, publish, reply, invite or manage action should have clear actor context.

UI copy examples:

- `Posting as Alex Rhythm`;
- `Posting as Northern Lights Band`;
- `Creating event for Helsinki Jazz Orchestra`;
- `Replying as event participant`;
- `Managing as project admin`.

Avoid ambiguous actions where the user cannot tell what identity will be used.

---

## Preview vs full detail principle

The current accepted UI principle remains:

- previews show minimum useful information;
- full details live inside full pages;
- participant/user/group/profile previews use avatar strips where appropriate;
- secondary statuses use muted compact icon chips;
- rating is shown as icon + number;
- complaints/reports are not loud red actions in previews;
- heavy member cards must not be used in lists/previews.

### Preview should answer

- What is this?
- Is it relevant now?
- How many people/items are involved?
- What is the primary next action?
- Where do I open details?

### Full detail should contain

- full metadata;
- participants;
- roles;
- documents;
- permissions;
- chats;
- reports/complaints;
- admin actions;
- history/audit if relevant.

---

## Profile logistics

The profile is both:

1. a public identity surface;
2. a control center for personal social activity.

A profile should contain:

- cover/avatar/name;
- compact status chips;
- rating chip;
- friends/followers/post counters;
- personal feed;
- relationship actions;
- about section;
- projects/bands where appropriate;
- public documents/portfolio if allowed;
- report action only in full profile context.

Personal friendship, following, subscriptions, membership and admin rights must remain separate concepts.

---

## Band / project / orchestra logistics

A band/project/orchestra is not just a card. It is a working entity.

### Preview/list card

Should show:

- cover;
- name;
- type/status;
- short public feed preview;
- subscription state if relevant;
- minimal actions;
- avatar strip when showing members/participants.

### Full entity page

Should show:

- overview;
- public/private feed depending on permissions;
- members via avatar strip or structured role rows;
- events;
- documents;
- chats;
- settings for owners/admins;
- reports/moderation inside full detail only;
- lifecycle state: active, paused, archived, closed.

The entity page should make clear whether the user is:

- subscriber;
- member;
- admin;
- owner;
- former member;
- invited participant.

---

## Event logistics

Events are one of BandKit's main working nodes.

### Event preview/card

Should show:

- event title;
- date/time;
- location;
- type;
- status;
- participants count;
- primary action: view / RSVP / open.

### Event detail

Should show:

- description;
- organizer;
- linked band/project/entity;
- participants;
- roles;
- documents;
- event chat;
- RSVP/participation state;
- schedule/timing;
- location details;
- permissions;
- report/moderation tools;
- audit/history when relevant.

User journey example:

`Dashboard -> Event invite -> Event detail -> Participants -> Document -> Event chat -> Back to event -> Back to dashboard`

This path must feel natural on mobile.

---

## Document logistics

Documents must be easy to find and always show ownership/context.

A document may belong to:

- personal profile;
- band/project;
- orchestra;
- studio;
- event;
- school/education entity in future Education module;
- organization.

Document UI must answer:

- What is this document?
- Who owns it?
- Why do I have access?
- Which event/project/profile is it linked to?
- What is its status?
- Who can view/edit/export it?

Examples:

- rider;
- setlist;
- contract;
- promo kit;
- technical document;
- media pack;
- invoice/act in future business modules.

Documents should not be hidden only inside deep entity pages. The global documents area should aggregate documents across contexts while preserving ownership and access reasoning.

---

## Chat logistics

Chats must be context-aware.

Chat types:

- personal direct chat;
- group/project chat;
- event chat;
- document discussion;
- moderation/report chat;
- organization/team chat;
- future education group/lesson chat.

The UI should always show:

- chat context;
- who can see messages;
- whether links are restricted;
- whether the user is writing as self or as entity/admin;
- if the chat belongs to an event/project/document.

Avoid generic messaging where the user cannot tell where the message will go or who can see it.

---

## Reports and safety logistics

Reports/complaints are system flows, not preview decorations.

Rules:

- do not show loud red report actions in quick previews;
- full profile/post/chat/event/detail pages may include report actions;
- report form should preserve target context;
- moderation queue should show priority, target, evidence and audit trail;
- entity owners can handle only reports inside their scope;
- platform moderators/admins can handle broader cases depending on permission.

Safety features must be present without making normal browsing feel hostile.

---

## Relationships logistics

BandKit must keep these relationships separate:

### Friend

Personal mutual relationship.

May unlock friend-only profile posts and DM permissions.

### Follower / personal subscriber

One-way personal feed subscription.

Does not equal friendship.

### Entity subscriber

User follows a band, studio, venue, school or organization.

Does not equal membership.

### Member

User has a role inside a band/project/entity.

May unlock workspace, documents, chats and event management.

### Event participant

User is invited to or participates in a specific event.

Does not automatically imply membership in the parent project.

### Admin / owner

User manages a specific entity or context.

Does not automatically make them platform admin.

---

## Back navigation and return logic

Back navigation is part of product logic.

Required behavior:

- return to the previous real place, not just a default parent route;
- preserve scroll position when returning;
- preserve filter context where possible;
- mobile back button should feel native;
- deep detail pages should still allow contextual return;
- fallback route should be safe when there is no history.

Examples:

- from event participant profile back to event;
- from document back to event/project that opened it;
- from chat back to event;
- from profile back to followers list;
- from entity detail back to feed or search result.

---

## Mobile-first logistics

Mobile Safari/iPhone is the real reference for mobile behavior.

Chrome responsive preview is useful but not enough.

Rules:

- bottom nav must not collide with safe areas;
- horizontal avatar strips must scroll naturally on iOS;
- preview cards must remain compact;
- primary actions must be reachable with thumb;
- full detail pages should avoid overloaded top sections;
- modals/drawers must respect viewport and safe-area insets;
- back behavior must be tested on real iPhone/Safari.

---

## Recommended route-level mental model

Core routes should map to user intent, not just data type.

Suggested mental grouping:

### Main work

- `/feed` or future `/dashboard` — working home surface;
- `/events` — schedule and event management;
- `/documents` — cross-context document hub;
- `/chats` — communication hub.

### Identity and relationships

- `/profile/me`;
- `/profile/:profileId`;
- friends/followers future subroutes or tabs.

### Entities

- `/bands`;
- `/bands/:bandId`;
- future studios/venues/schools/organizations routes.

### Creation flows

- `/events/new`;
- `/bands/new`;
- future document upload/create flows;
- future post composer route/sheet.

### Safety/admin

- `/complaints/new`;
- `/moderation`;
- `/admin`;
- settings/security routes.

### Future Education

- `/academy` or equivalent;
- student dashboard;
- teacher tools;
- learning group details;
- assignment detail;
- guardian approval surfaces.

---

## MVP UI pass implications

Near-term UI work should prioritize:

1. Make previews compact and consistent.
2. Replace heavy compact user cards with real avatar strip rendering.
3. Keep details inside full pages.
4. Keep report actions out of previews.
5. Make entity/event/document pages feel like working contexts.
6. Preserve scroll and return behavior.
7. Keep actor context clear when publishing/creating/replying.
8. Keep dashboard/feed from becoming a chaotic dump of unrelated cards.

---

## Open product questions

These should be solved before backend implementation:

1. Should `/feed` become `/dashboard`, or should dashboard and feed be separate tabs?
2. How visible should actor switching be in the MVP?
3. Which entity types share `/bands` mechanics and which need separate routes later?
4. How much document context should appear in global `/documents` vs entity/event detail pages?
5. Should event chat be a tab inside event detail or a separate chat route with event context?
6. How should mobile bottom nav prioritize dashboard/feed/events/chats/profile?
7. What is the minimal onboarding path that gives value without forcing full profile completion?

---

## Relationship to existing specs

This spec should be considered together with:

- `BandKit_User_Friends_And_Personal_Feed_v1_0.md`;
- `BandKit_Entity_Subscriptions_And_Public_Feeds_v1_0.md`;
- `BandKit_Entity_Account_Lifecycle_And_Inactivity_v1_0.md`;
- `BandKit_Education_Academy_Future_Module_v1_0.md`.

User logistics is the layer that connects those mechanics into real product journeys.
