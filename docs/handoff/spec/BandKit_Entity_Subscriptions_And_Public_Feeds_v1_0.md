# BandKit — Entity Subscriptions & Public Feeds Mechanics v1.0

## Purpose

BandKit users must be able to subscribe to public or semi-public feeds of non-user entities:

- bands;
- music groups;
- orchestras;
- studios;
- rehearsal spaces;
- venues;
- labels;
- schools;
- production teams;
- agencies;
- other organizations and project-like entities.

This mechanic is separate from:

- personal friendship between users;
- membership in a group/project;
- admin/moderator roles;
- event participation;
- document permissions.

A user can follow a group or studio without being a member of it, without having access to private documents and without becoming part of its workspace.

This document is a docs-first product specification. It does not implement backend logic yet.

---

## Current working baseline note

This spec extends `BandKit_User_Friends_And_Personal_Feed_v1_0.md`.

The next planned UI development pass remains the Documents area (`/documents` mock UI`) after the social mechanics docs pass.

---

## Core concept

BandKit should support two feed-subscription layers:

1. **Personal user feed subscription**
   - follow a user / solo performer;
   - see their public posts;
   - friendship can unlock friend-only content.

2. **Entity feed subscription**
   - follow a band, orchestra, studio, venue, school or organization;
   - see public entity posts;
   - membership/admin status can unlock internal workspace content.

Entity subscription is not membership.

A subscribed user should not automatically get:

- workspace access;
- private chats;
- internal documents;
- member-only files;
- event management permissions;
- booking/admin tools.

---

## Entity types that can have feeds

### Group / band / project

Examples:

- rock band;
- cover band;
- jazz trio;
- temporary session project;
- tribute project;
- music collective.

Feed may contain:

- concert announcements;
- rehearsal photos;
- release/news posts;
- lineup updates;
- public casting/open role posts;
- media/promo content.

### Orchestra / ensemble

Examples:

- symphonic orchestra;
- chamber orchestra;
- choir;
- brass ensemble;
- student ensemble.

Feed may contain:

- concert announcements;
- program notes;
- audition announcements;
- conductor/team updates;
- public schedule highlights.

### Studio / rehearsal space

Examples:

- recording studio;
- rehearsal studio;
- production studio;
- podcast/voice studio.

Feed may contain:

- free slots;
- studio news;
- equipment updates;
- promo offers;
- safety/rules updates;
- portfolio/showcase posts.

### Venue / площадка

Examples:

- club;
- concert hall;
- bar with live music;
- festival stage;
- cultural center.

Feed may contain:

- event announcements;
- open dates;
- booking requirements;
- technical rider updates;
- public rules.

### School / teacher / education organization

Examples:

- music school;
- vocal school;
- drum school;
- private teacher organization;
- masterclass project.

Feed may contain:

- course announcements;
- workshop posts;
- student concerts;
- enrollment windows;
- teacher availability.

### Production team / agency / label

Examples:

- booking agency;
- sound/light production team;
- label;
- event production organization.

Feed may contain:

- project announcements;
- hiring/casting posts;
- case studies;
- public event reports;
- open collaboration calls.

---

## Subscription states

### 1. Not subscribed

Default state.

Available actions:

- view public entity profile if public;
- subscribe if subscriptions are enabled;
- request membership if entity allows it;
- contact safely if allowed;
- report entity;
- block/mute entity feed.

### 2. Subscribed

User receives public posts from the entity in their main feed.

Available actions:

- unsubscribe;
- mute;
- configure notification level;
- share/repost posts inside BandKit;
- comment/like if allowed by entity settings.

### 3. Muted subscription

User stays subscribed, but feed content and/or notifications are reduced.

Mute scopes:

- mute posts;
- mute event announcements;
- mute promo posts;
- mute notifications only;
- mute for a fixed period.

### 4. Member

User is a member of the entity/project.

Membership is not the same as subscription.

A member may automatically receive internal/project posts depending on settings, but the member can still control public feed notifications separately.

### 5. Admin / owner / representative

User has management rights for the entity.

Admin/owner can:

- publish entity posts;
- configure entity feed visibility;
- moderate comments;
- manage subscriber settings;
- pin posts;
- view entity feed analytics in future.

### 6. Blocked / restricted

Entity or user can be blocked/restricted by moderation policy.

When blocked:

- user no longer sees entity posts;
- user cannot comment/contact through entity feed;
- moderation/admin views may still show history.

---

## Entity post visibility levels

Every entity post should have a visibility level.

### Public

Visible to:

- everyone who can open the entity profile;
- subscribers;
- members;
- admins/moderators.

Used for:

- announcements;
- public news;
- concerts;
- releases;
- open casting;
- public offers.

### Subscribers

Visible to:

- subscribed users;
- entity members;
- entity admins;
- platform moderators/admins.

Used for:

- early announcements;
- subscriber-only updates;
- soft community content;
- non-critical posts not intended for full public discovery.

### Members / workspace

Visible to:

- members of the group/studio/organization workspace;
- admins/owners;
- moderators where policy allows.

Used for:

- internal rehearsal updates;
- member-only reminders;
- internal project posts;
- private media drafts.

Subscribers who are not members do not see this content.

### Event-linked

Visible based on event relationship:

- event participants;
- invited users;
- event managers;
- entity members if configured.

Used for:

- concert prep;
- call times;
- event-specific documents;
- reminders.

### Private / draft

Visible only to:

- post author;
- entity admins/owners;
- moderators if required by review.

---

## Feed ordering

Entity feeds should be ordered by time by default:

1. pinned posts first if enabled;
2. newest published post first;
3. sort by `published_at desc`;
4. hidden/moderated posts excluded from regular users;
5. draft posts visible only to allowed authors/admins.

Main user feed can mix:

- friends' posts;
- followed personal users;
- subscribed entity posts;
- user's own posts;
- project/workspace posts;
- event announcements.

Default MVP sorting should remain chronological unless a future ranking algorithm is introduced.

---

## User feed inclusion rules

When User A subscribes to Entity B:

1. Public entity posts appear in User A's main feed.
2. Subscriber-only posts appear if User A is actively subscribed and not muted.
3. Member-only posts appear only if User A is also a member with proper workspace access.
4. Event-linked posts appear only if User A has event-level access.
5. Draft/private posts never appear in subscriber feed.
6. Moderated/hidden posts do not appear unless User A is an authorized moderator/admin.

---

## Entity profile feed

Entity pages should eventually contain tabs:

- Activity / Активность;
- Posts / Посты;
- Events / События;
- Members / Состав;
- Media / Медиа;
- Documents / Документы;
- About / О проекте;
- Reviews / Отзывы.

For MVP shell, `Activity` can show public and subscriber-visible posts sorted by `published_at desc`.

---

## Subscription notification settings

Users should be able to configure notifications per entity subscription.

Suggested levels:

### All updates

Notify about:

- new posts;
- new events;
- open roles/casting;
- important announcements;
- document updates if user has access.

### Important only

Notify about:

- event announcements;
- urgent schedule changes;
- casting/open roles;
- admin-marked important posts.

### Events only

Notify only about:

- new public events;
- RSVP reminders;
- changes to events the user follows/attends.

### Silent

Show posts in feed but do not send notifications.

### Muted

Do not show in main feed unless user opens the entity profile directly.

---

## Who can publish entity posts

Publishing depends on entity role, not subscription.

Allowed authors may include:

- entity owner;
- admin;
- manager;
- moderator;
- member with publishing permission;
- system-generated event/document updates.

Subscribers cannot publish to entity feed unless granted a role or unless comments/community posts are explicitly supported later.

---

## Comments, likes and reposts

Entity owners/admins should configure interaction policy:

- comments enabled for everyone;
- comments for subscribers only;
- comments for verified users only;
- comments disabled;
- likes enabled/disabled;
- reposts inside BandKit enabled/disabled.

All interactions must follow:

- external-link restrictions;
- reporting flow;
- anti-fraud/rate limits;
- moderation review.

---

## Subscription discovery

Users can subscribe from:

- entity profile page;
- search / marketplace result;
- event page;
- post card;
- recommendation block;
- shared repost;
- QR/deep link later;
- invite to follow by entity admin.

Discovery filters should eventually support:

- type: band, orchestra, studio, venue, school, agency;
- city/region;
- genre;
- verified/trusted status;
- open roles/casting;
- upcoming events;
- safe contact only.

---

## Privacy and entity settings

Entity admins should eventually configure:

- whether entity profile is public;
- whether users can subscribe;
- whether subscribers can comment;
- whether subscriber list is visible;
- default post visibility;
- who can publish;
- whether reposts are allowed;
- whether direct safe-contact is available;
- whether open membership requests are allowed.

Suggested subscription modes:

- open subscription;
- verified users only;
- request-to-subscribe;
- invite-only;
- disabled.

---

## Moderation and anti-fraud hooks

Entity subscription mechanics must respect BandKit anti-fraud strategy.

Required protections:

- rate-limit mass subscriptions/unsubscriptions;
- detect fake/spam entity growth;
- detect suspicious subscriber acquisition patterns;
- detect spam comments under entity posts;
- allow reporting an entity;
- allow reporting an entity post;
- allow muting/blocking an entity feed;
- prevent external-link abuse in posts/comments;
- flag suspicious entity admins or repeated complaint patterns.

Moderators/admins should see entity subscription abuse signals in future moderation views.

---

## Future backend model draft

### `entity_subscriptions`

Fields:

- `id`;
- `user_id`;
- `entity_type`:
  - `band`;
  - `orchestra`;
  - `studio`;
  - `venue`;
  - `school`;
  - `agency`;
  - `organization`;
  - `project`;
- `entity_id`;
- `status`:
  - `active`;
  - `muted`;
  - `cancelled`;
  - `blocked`;
  - `pending`;
- `notification_level`:
  - `all`;
  - `important`;
  - `events_only`;
  - `silent`;
  - `muted`;
- `created_at`;
- `updated_at`;
- `source`:
  - `profile`;
  - `search`;
  - `event`;
  - `post`;
  - `recommendation`;
  - `invite`;
- `risk_score`;
- `moderation_state`.

### `entity_posts`

Fields:

- `id`;
- `entity_type`;
- `entity_id`;
- `author_user_id`;
- `body`;
- `media_refs`;
- `visibility`:
  - `public`;
  - `subscribers`;
  - `members`;
  - `event_linked`;
  - `private`;
  - `draft`;
- `event_id` nullable;
- `workspace_id` nullable;
- `published_at`;
- `created_at`;
- `updated_at`;
- `is_pinned`;
- `moderation_state`:
  - `clean`;
  - `flagged`;
  - `hidden`;
  - `removed`.

### `entity_post_interactions`

Fields:

- `id`;
- `post_id`;
- `user_id`;
- `type`:
  - `like`;
  - `comment`;
  - `repost`;
  - `report`;
- `body` nullable for comments;
- `created_at`;
- `moderation_state`.

### `entity_feed_settings`

Fields:

- `id`;
- `entity_type`;
- `entity_id`;
- `profile_visibility`;
- `subscription_mode`;
- `default_post_visibility`;
- `comment_policy`;
- `repost_policy`;
- `subscriber_list_visibility`;
- `safe_contact_enabled`;
- `created_at`;
- `updated_at`.

---

## MVP UI surfaces

### Entity profile page

Controls to prepare:

- `Подписаться`;
- `Вы подписаны`;
- `Отписаться`;
- `Уведомления`;
- `Без уведомлений`;
- `Скрыть из ленты`;
- `Пожаловаться`.

### Search / Marketplace

Entity cards should show:

- entity type;
- city/region;
- verified/trusted status;
- subscriber status;
- safe contact action;
- subscribe/unsubscribe action.

### Main feed

Main feed should include posts from subscribed entities according to visibility and notification/feed settings.

### Notifications

Notification center should show:

- new posts from subscribed entities;
- important entity announcements;
- event announcements;
- open roles/casting from subscribed entities;
- moderation or security notices if relevant.

---

## Non-goals for current shell pass

Do not implement yet:

- real database writes;
- real entity subscription API;
- real media upload;
- real ranking algorithm;
- real push/email delivery;
- paid subscription mechanics;
- recommendation engine;
- analytics dashboards.

Current goal is to lock the product mechanics so UI and future backend can be built consistently.
