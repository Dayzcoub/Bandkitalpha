# BandKit — User Friends & Personal Feed Mechanics v1.0

## Purpose

BandKit users must be able to build personal user-to-user connections independently from groups, studios, organizations, events and workspaces.

This layer is separate from project membership. A user may be friends with another user even if they do not share a group, event, studio or organization.

This document defines the MVP mechanics for:

- personal friendships;
- friend requests;
- following / viewing public profiles;
- personal profile feeds;
- feed visibility and privacy;
- moderation and anti-fraud hooks;
- future backend data model.

This is a docs-first product specification. It does not implement backend logic yet.

---

## Current working baseline note

Before this spec, the next planned UI development pass was the Documents area (`/documents` mock UI). That task remains next after this mechanics pass.

Recent completed shell/UI passes before this spec:

- `/events/new` expanded from abstract wizard to event creation mock UI;
- `/bands/new` expanded from abstract wizard to group/project creation mock UI;
- mobile wizard footer and mobile list row badge layout were fixed;
- desktop create action now opens `/events/new`.

---

## Core concept

BandKit has two different relationship systems:

1. **Project/workspace relationships**
   - group member;
   - studio representative;
   - organization admin;
   - event participant;
   - moderator/admin roles;
   - document permissions.

2. **Personal user relationships**
   - friend;
   - incoming friend request;
   - outgoing friend request;
   - follower / public viewer;
   - blocked user;
   - muted user.

These systems must not be mixed.

A user can be:

- a solo performer;
- a musician;
- a technician;
- a manager;
- a teacher;
- a regular personal user;
- a member of many groups;
- a representative of a studio or organization;
- and still have their own independent personal friends and profile feed.

---

## Relationship states

### 1. No relationship

Default state between two users.

Available actions:

- view public profile if profile is public;
- follow or subscribe to public updates if enabled;
- send friend request if allowed by privacy settings;
- report user;
- block user.

### 2. Outgoing friend request

User A has sent a request to User B.

Visible to User A:

- request status: `Запрос отправлен`;
- action: cancel request.

Visible to User B:

- incoming friend request;
- actions: accept, decline, report, block.

### 3. Incoming friend request

User B sees that User A wants to add them.

Actions:

- accept;
- decline;
- report;
- block.

### 4. Friends

Users mutually accepted a friend request.

Available behavior:

- both can see posts marked `friends`;
- both can see each other in friends list if privacy allows;
- both can start direct messages if DM privacy allows;
- both receive relationship-level notifications;
- either side can remove friend.

### 5. Following / public subscription

Optional lighter relationship, not equal to friendship.

Use cases:

- user wants to follow a solo performer;
- user wants to watch public posts without becoming friends;
- marketplace discovery;
- artist/fan style public visibility.

Following does not automatically unlock friend-only posts.

### 6. Muted

User remains connected, but their posts/notifications are hidden or reduced.

Possible mute scopes:

- mute posts;
- mute stories/future short updates;
- mute event invitations;
- mute chat notifications.

### 7. Blocked

Blocked user cannot:

- send friend requests;
- send direct messages;
- view friend-only content;
- appear in personal recommendations;
- invite the blocker to events or projects unless a shared admin context requires review.

Blocked user may still appear in moderation/admin views.

---

## Friend request flow

### Send request

A user can send a friend request from:

- public profile;
- personal profile preview card;
- marketplace/search result;
- event participant list;
- group member list;
- chat user card;
- notification/user mention.

Before sending:

- check whether requester is verified enough for the target privacy level;
- check if requester is blocked;
- check if a pending request already exists;
- check spam/rate limits;
- check anti-fraud risk flags.

### Accept request

When accepted:

- relationship becomes `friends`;
- both users receive notification;
- optional system message appears in activity history;
- both users can see friend-visible posts going forward.

Historical visibility should be controlled by post visibility settings, not automatically duplicated.

### Decline request

When declined:

- request becomes declined or removed from active queue;
- sender may see neutral state, not necessarily explicit rejection;
- repeated requests may be rate-limited.

### Cancel request

Sender can cancel outgoing request.

### Remove friend

Either user can remove friendship.

After removal:

- friend-only posts are no longer visible;
- DM permissions may change depending on privacy settings;
- shared project/event access remains unchanged.

---

## Personal profile feed

Each user has a personal profile feed similar in behavior to Instagram profile posts.

### Feed location

Personal feed should be visible on:

- `/profile/me`;
- `/profile/:profileId`;
- future user profile modal/card drilldowns.

### Feed ordering

Default ordering:

1. newest post first;
2. sort by `published_at desc`;
3. pinned posts may appear above chronological feed if enabled;
4. drafts are visible only to author;
5. hidden/moderated posts are visible only to author/moderators/admins depending on state.

### Post cards

Profile feed post cards should support:

- author block;
- publication time;
- text;
- images/media placeholder;
- likes;
- comments;
- repost/share inside BandKit;
- report action;
- visibility marker visible to author/admin;
- moderation state if applicable.

### Feed tabs

Profile can contain tabs:

- Activity / Активность;
- Posts / Посты;
- About / О профиле;
- Reviews / Отзывы;
- Friends / Друзья;
- Projects / Проекты.

For MVP shell, `Activity` can include all public/friend-visible user posts in chronological order.

---

## Post visibility levels

Every personal post must have a visibility level.

### Public

Visible to:

- everyone who can open the profile;
- followers;
- friends;
- shared project members;
- admins/moderators.

### Friends

Visible to:

- accepted friends;
- author;
- admins/moderators where policy allows.

Not visible to followers unless they are also friends.

### Workspace / project

Visible to:

- members of selected workspace/project/group/event context;
- author;
- admins/moderators.

This is not a personal friendship setting.

### Private / only me

Visible only to:

- author;
- admins/moderators only if required by abuse/security review.

### Draft

Not published.

Visible only to author.

---

## Relationship-aware feed rules

When User A opens User B profile:

1. If User A is blocked by User B: show restricted state.
2. If User B profile is private and User A is not a friend: show limited profile + add friend action.
3. If User A is a friend: show public + friends posts.
4. If User A is a follower only: show public posts only.
5. If both share a project/event: show public + shared context posts, but not friend-only posts unless they are friends.
6. If User A is admin/moderator: show policy-allowed moderation context, not regular private browsing.

---

## Privacy settings

User should eventually be able to configure:

- who can send friend requests;
- who can follow them;
- who can see friends list;
- who can see online/activity status;
- who can message them;
- who can invite them to events/projects;
- default visibility for new posts;
- whether profile feed is public, friends-only or private.

Suggested options:

- everyone;
- verified users only;
- friends of friends;
- shared project members;
- nobody.

---

## Notifications

Friend mechanics should create notification events for:

- incoming friend request;
- request accepted;
- request declined/cancelled where needed;
- new follower;
- new post from friend/followed user if enabled;
- comment/like/repost;
- report/moderation action.

Channels:

- in-app notification;
- push future-ready;
- email future-ready;
- SMS only for security-critical flows, not regular social noise.

---

## Moderation and anti-fraud hooks

Friend/follow mechanics must respect BandKit anti-fraud strategy.

Required protections:

- rate limit friend requests;
- detect mass friend-request spam;
- detect repeated rejected requests;
- detect suspicious DM/contact attempts after friendship;
- allow reporting a friend request;
- allow blocking from request card;
- keep external-link restrictions in posts/messages;
- apply 2FA requirements for privileged project/admin actions, not for normal friendship.

Suspicious actions can generate `Security review` notifications for moderators/admins.

---

## Future backend model draft

Suggested tables/entities:

### `user_relationships`

Fields:

- `id`;
- `requester_user_id`;
- `target_user_id`;
- `status`:
  - `pending`;
  - `accepted`;
  - `declined`;
  - `cancelled`;
  - `removed`;
  - `blocked`;
- `created_at`;
- `updated_at`;
- `accepted_at`;
- `removed_at`;
- `source`:
  - `profile`;
  - `search`;
  - `event`;
  - `project`;
  - `chat`;
  - `recommendation`;
- `risk_score`;
- `moderation_state`.

### `user_follows`

Fields:

- `id`;
- `follower_user_id`;
- `target_user_id`;
- `status`:
  - `active`;
  - `muted`;
  - `removed`;
  - `blocked`;
- `created_at`;
- `updated_at`.

### `personal_posts`

Fields:

- `id`;
- `author_user_id`;
- `body`;
- `media_refs`;
- `visibility`:
  - `public`;
  - `friends`;
  - `workspace`;
  - `private`;
  - `draft`;
- `workspace_id` nullable;
- `project_id` nullable;
- `event_id` nullable;
- `published_at`;
- `created_at`;
- `updated_at`;
- `moderation_state`:
  - `clean`;
  - `flagged`;
  - `hidden`;
  - `removed`;
- `is_pinned`.

### `post_interactions`

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

---

## MVP UI surfaces

### Profile page

Add/prepare controls:

- `Добавить в друзья`;
- `Запрос отправлен`;
- `Принять` / `Отклонить`;
- `Удалить из друзей`;
- `Подписаться`;
- `Заблокировать`;
- `Пожаловаться`.

### Search / Marketplace

User cards should show:

- friend status;
- safe contact action;
- follow/add friend action;
- report action.

### Notifications

Notification center should show:

- friend requests;
- accepted requests;
- new posts from friends/followed users.

### Feed

Main feed may include:

- posts from friends;
- followed public users;
- own posts;
- project/workspace posts;
- events and invitations.

Sorting should remain primarily chronological unless future ranking is added.

---

## Non-goals for current shell pass

Do not implement yet:

- real database writes;
- real friend request API;
- real media upload;
- real ranking algorithm;
- real push notification sending;
- private DM unlock logic;
- recommendation engine.

Current goal is to lock the product mechanics so UI and future backend can be built consistently.
