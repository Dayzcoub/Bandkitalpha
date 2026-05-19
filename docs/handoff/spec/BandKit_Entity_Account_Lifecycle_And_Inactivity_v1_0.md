# BandKit — Entity, Account Lifecycle & Inactivity Policy v1.0

## Purpose

BandKit must define what happens when:

- a group/project/entity is created and later changes owners;
- a band, project, orchestra, studio or organization closes;
- members leave or conflict over control;
- an entity becomes inactive;
- a user becomes inactive;
- a user deletes their own account;
- reputation, badges, awards and trust marks should be preserved, frozen, reduced or removed.

This document is a docs-first product specification. It does not implement backend logic yet.

---

## Current working baseline note

The next planned UI development pass remains **Profile and Personal Feed UI** after this lifecycle/spec pass.

Recent related specs:

- `BandKit_User_Friends_And_Personal_Feed_v1_0.md`;
- `BandKit_Entity_Subscriptions_And_Public_Feeds_v1_0.md`.

This lifecycle policy must be considered together with personal feeds, entity feeds, reputation and moderation.

---

## Core principles

### 1. Created entities have a lifecycle

Groups, projects, orchestras, studios, venues, schools and organizations are not just temporary UI cards. They have a lifecycle:

- created;
- active;
- paused;
- ownership transfer pending;
- archived;
- closed;
- memorial / historical profile;
- removed by moderation.

### 2. Closing an entity should not erase history by default

If a band breaks up, a project fails, a studio closes or members fall out, the profile should usually remain in the system as historical memory.

The profile can become read-only, archived or marked as closed, but should not be deleted immediately unless:

- it violates policy;
- it was fraudulent/spam;
- legal/data deletion rules require removal;
- an authorized admin/moderator removes it.

### 3. Membership and ownership are separate

A user can be:

- creator;
- owner;
- admin;
- manager;
- member;
- former member;
- contributor;
- invited user;
- subscriber;
- follower.

These roles must not be treated as the same.

### 4. Inactivity should have consequences

BandKit should encourage active participation. Inactive users and abandoned entities should lose active trust signals over time.

However, sanctions must be gradual and reversible before destructive action.

### 5. User-initiated account deletion must be possible

A user must be able to request deletion of their own account. This must be separated from moderation bans, inactivity sanctions and reputation penalties.

---

## Entity lifecycle statuses

### Draft

Entity was started but not published.

Visible to:

- creator;
- invited admins;
- platform admins/moderators when needed.

### Active

Normal state.

Entity can:

- publish posts;
- create events;
- manage members;
- manage documents;
- receive subscribers/followers;
- appear in search and recommendations.

### Paused

Temporary inactive state.

Use cases:

- seasonal break;
- project is waiting for new material;
- studio renovation;
- orchestra vacation period;
- owner temporarily unavailable.

Behavior:

- profile remains visible;
- posts remain visible according to visibility settings;
- new events may be disabled or marked limited;
- subscriptions stay active;
- search card shows `Paused`/`На паузе`.

### Ownership transfer pending

Used when:

- creator leaves;
- owner wants to transfer project;
- members dispute who controls the entity;
- owner account is deleted or inactive;
- organization representative changes.

Behavior:

- critical settings are locked;
- transfer request is visible to current owner/admins;
- 2FA required for transfer approval;
- audit trail records all actions.

### Archived

Entity is no longer operational but should remain visible as history.

Use cases:

- band split up;
- project ended;
- tour ended;
- studio closed temporarily or permanently;
- organization stopped activity;
- failed project that still has useful documents/history.

Behavior:

- profile remains visible if not private;
- archived badge shown;
- new posts disabled except owner/admin closure note;
- old posts remain according to visibility settings;
- subscribers/followers can remain but notifications are silent by default;
- documents become read-only unless owner/admin reopens.

### Closed

Entity has ended permanently.

Use cases:

- dissolved band;
- business closed;
- project bankrupt;
- members agreed to close;
- owner closed entity;
- moderation closed entity.

Behavior:

- profile is preserved as a closed/historical profile;
- search can show it with `Closed`/`Закрыто` marker;
- no new public posts except closure/history notes;
- no new events;
- no new membership requests;
- documents become read-only;
- owner/admin may download/export data if policy allows.

### Memorial / historical profile

Optional special state for important or public projects.

Use cases:

- notable band history;
- major project archive;
- cultural memory;
- closed studio with historic materials;
- portfolio value.

Behavior:

- read-only profile;
- curated timeline;
- past members and contributors may be shown;
- no operational actions;
- clear label that project is no longer active.

### Removed by moderation

Entity removed or hidden due to policy violation.

Use cases:

- fraud;
- spam;
- impersonation;
- dangerous activity;
- repeated abuse;
- legal request.

Behavior:

- profile hidden from public;
- audit trail retained;
- moderators/admins retain access to evidence;
- linked documents/posts may be hidden or preserved for review.

---

## Entity closure reasons

Supported closure reasons should include:

- band/project broke up;
- project did not work out;
- members conflict;
- bankrupt/financial closure;
- studio/venue closed;
- rebranded into another entity;
- merged into another project;
- owner left;
- duplicate entity;
- moderation/legal reason;
- other.

Closure reason can be:

- public;
- visible only to members;
- visible only to owner/admin/moderation.

Public closure text should be optional and editable by owner/admin while the entity remains in archive mode.

---

## Entity inheritance and ownership transfer

### Creator

The creator is the user who initially created the entity.

Creator is not always permanent owner.

### Owner

Owner controls:

- entity settings;
- ownership transfer;
- deletion/archive requests;
- role management;
- sensitive documents;
- billing/future premium plan;
- closure status.

### Admins

Admins can manage operational parts but may not always be allowed to transfer ownership or close entity.

### Ownership transfer cases

Ownership transfer can happen when:

- current owner voluntarily transfers;
- owner account is deleted;
- owner becomes inactive for too long;
- owner is banned;
- organization representative changes;
- members vote/request transfer;
- platform moderator resolves dispute.

### Transfer rules

Recommended MVP rules:

1. Voluntary transfer requires current owner confirmation.
2. Transfer to another user requires target user acceptance.
3. 2FA required for owner-level transfer.
4. Transfer creates audit event.
5. Former owner can remain as founder/former owner if privacy allows.
6. Disputed transfers require moderation review.

### Inactive owner fallback

If an owner is inactive beyond threshold:

1. notify owner;
2. notify entity admins;
3. mark ownership health as at risk;
4. allow admins to request takeover;
5. after grace period, moderator/admin can approve transfer;
6. audit everything.

---

## Entity inactivity policy

Entity inactivity should be tracked separately from user inactivity.

Signals:

- no posts;
- no events;
- no member activity;
- no document updates;
- no owner/admin login;
- no response to invitations/requests;
- unresolved complaints;
- stale public information.

Suggested thresholds:

### 30 days inactive

Soft warning.

- no penalty;
- owner/admin gets reminder;
- dashboard shows `Low activity`.

### 90 days inactive

Visibility reduction.

- search/recommendation priority reduced;
- entity marked `Low activity` internally;
- subscribers may see fewer recommendations;
- no reputation loss yet.

### 180 days inactive

Dormant state.

- profile shows `Dormant`/`Неактивно`;
- ranking reduced;
- trust/reliability freshness score decays;
- open roles/casting may be auto-paused;
- owner/admin prompted to reactivate or archive.

### 365 days inactive

Archive candidate.

- system suggests archiving;
- owner/admin must confirm active status;
- if no response, entity may move to paused/archived by policy;
- moderators can review popular/high-impact entities manually.

---

## User inactivity policy

User inactivity must encourage real participation while avoiding unfair deletion.

### Activity signals

Positive signals:

- login/session activity;
- posts;
- comments;
- reactions;
- event participation;
- RSVP responses;
- document confirmations;
- accepted invitations;
- completed profile verification;
- safe contact responses;
- project/group activity.

Passive login alone should not fully count as meaningful activity forever.

### Reputation freshness

Reputation should have a freshness component.

A user can have historic achievements, but current active trust should decay if they disappear for too long.

Suggested reputation layers:

1. **Historical achievements**
   - past badges;
   - completed events;
   - verified contributions;
   - reviews.

2. **Active trust score**
   - recent reliability;
   - recent participation;
   - recent responses;
   - no recent complaints.

3. **Freshness multiplier**
   - reduces active trust for inactive users;
   - can recover with renewed activity.

---

## User inactivity stages

### 30 days inactive

Soft state.

- no penalty;
- optional reminder;
- user remains normal.

### 90 days inactive

Low activity.

- lower feed/search priority;
- availability can be marked stale;
- some active-status badges hidden from public discovery.

### 180 days inactive

Inactive state.

- profile shows `Inactive` marker;
- active trust score decreases;
- recommendations reduced;
- user may stop appearing in open-role suggestions;
- premium/public badges may show stale marker if not renewed.

### 365 days inactive

Dormant state.

- stronger active trust decay;
- active badges/regalia can be frozen;
- reliability score may be hidden or marked outdated;
- account prompted for reactivation;
- user cannot receive new high-trust labels until reactivated.

### Very long inactivity

Potential actions:

- freeze all active reputation;
- remove from active search recommendations;
- disable incoming invitations by default;
- hide online/contact actions;
- require re-verification on return;
- do not hard-delete without notice unless policy/legal allows.

---

## Sanctions for inactivity

The user proposed strong penalties for inactivity, including deleting profile or removing reputation points, regalia and awards.

Recommended product-safe policy:

### Prefer decay/freeze before deletion

Deletion should not be the first penalty.

Better sequence:

1. warn;
2. mark inactive;
3. reduce discovery priority;
4. freeze active trust badges;
5. decay active reputation score;
6. require reactivation/re-verification;
7. archive/hide from active discovery;
8. delete only after long-term non-response or explicit user request.

### Reputation handling

Possible rules:

- active reputation points decay after long inactivity;
- active trust badges are frozen/hidden while inactive;
- awards/regalia can be marked `historical`, not fully erased immediately;
- reliability score becomes `outdated` until new activity appears;
- restored activity can gradually recover active score.

### Hard reset option

For aggressive gamification, BandKit can support:

- seasonal active rating;
- annual reliability score;
- current activity rank.

These can reset/decay without deleting historical profile value.

---

## User account deletion by user request

A user must be able to delete their account.

### Deletion types

#### Deactivate account

Temporary.

- profile hidden or marked unavailable;
- user can return;
- friendships/subscriptions paused;
- active invitations stopped;
- account can be restored.

#### Delete account

Permanent or near-permanent.

- user profile removed/anonymized;
- personal data deleted/anonymized according to policy;
- posts may be deleted, anonymized or preserved depending on visibility and legal rules;
- entity ownership must be transferred or resolved first;
- audit/moderation records may be retained as required.

### Before deletion

System must check:

- does user own groups/projects/entities;
- does user own documents;
- does user have unpaid/future billing obligations;
- does user have unresolved moderation cases;
- does user have active events;
- does user have admin roles;
- does user need to transfer ownership.

### Account deletion flow

Recommended flow:

1. user requests deletion;
2. show consequences;
3. require password/2FA confirmation;
4. list owned entities and required transfer/archive actions;
5. grace period optional;
6. process deletion/anonymization;
7. send confirmation.

### User-created content after deletion

Options by content type:

- private drafts: delete;
- personal posts: delete or anonymize;
- comments: anonymize unless user chooses deletion and no integrity issue;
- entity posts created as admin: may remain attributed to entity, not personal user;
- documents: ownership transferred to entity if document belongs to project/event;
- audit logs: retained with anonymized user reference where possible.

---

## Entity owner deletes their account

If a user owns entities and requests account deletion:

1. user must transfer ownership;
2. or archive/close entity;
3. or assign platform-managed temporary owner state;
4. if no action, deletion may be delayed;
5. moderation/admin can resolve abandoned ownership.

For organizations/studios, ownership should ideally be tied to organization account plus representatives, not a single personal profile.

---

## Closed entity profile as memory

Closed entity profile can show:

- name;
- type;
- active years;
- city/region;
- reason/status: closed, archived, merged, rebranded;
- former members/contributors if privacy allows;
- public posts/timeline;
- public media;
- public events archive;
- reviews/testimonials if allowed;
- successor entity link if rebranded/merged.

Closed profiles should clearly show:

- `Проект закрыт`;
- `Не принимает заявки`;
- `Документы доступны только участникам/админам`;
- `Исторический профиль` if applicable.

---

## UI surfaces to prepare

### Entity profile

Add states/buttons:

- `Активно`;
- `На паузе`;
- `Неактивно`;
- `Архивировано`;
- `Закрыто`;
- `Исторический профиль`;
- `Передать владельца`;
- `Закрыть проект`;
- `Архивировать`;
- `Восстановить активность`.

### User profile

Add states:

- active;
- low activity;
- inactive;
- dormant;
- deleted/anonymized;
- reliability outdated.

### Settings

Add:

- deactivate account;
- delete account;
- export data;
- transfer owned entities;
- manage inactive/closed projects.

### Admin/moderation

Add:

- abandoned entities queue;
- inactive owner review;
- transfer dispute review;
- account deletion conflicts;
- closed entity moderation view.

---

## Future backend model draft

### `entity_lifecycle_events`

Fields:

- `id`;
- `entity_type`;
- `entity_id`;
- `event_type`:
  - `created`;
  - `paused`;
  - `reactivated`;
  - `archived`;
  - `closed`;
  - `ownership_transfer_requested`;
  - `ownership_transferred`;
  - `removed_by_moderation`;
- `actor_user_id`;
- `reason`;
- `visibility`;
- `created_at`;
- `metadata`.

### `entity_ownerships`

Fields:

- `id`;
- `entity_type`;
- `entity_id`;
- `user_id`;
- `role`:
  - `creator`;
  - `owner`;
  - `admin`;
  - `manager`;
  - `former_owner`;
- `status`:
  - `active`;
  - `pending_transfer`;
  - `removed`;
- `created_at`;
- `updated_at`;
- `ended_at`.

### `user_activity_state`

Fields:

- `user_id`;
- `last_login_at`;
- `last_meaningful_activity_at`;
- `activity_state`:
  - `active`;
  - `low_activity`;
  - `inactive`;
  - `dormant`;
  - `deactivated`;
  - `deleted`;
- `active_reputation_score`;
- `historical_reputation_score`;
- `freshness_multiplier`;
- `badges_state`;
- `updated_at`.

### `account_deletion_requests`

Fields:

- `id`;
- `user_id`;
- `status`:
  - `requested`;
  - `pending_ownership_transfer`;
  - `cooldown`;
  - `processing`;
  - `completed`;
  - `cancelled`;
  - `blocked_by_moderation`;
- `requested_at`;
- `scheduled_delete_at`;
- `completed_at`;
- `requires_2fa`;
- `owned_entities_count`;
- `notes`.

---

## Non-goals for current shell pass

Do not implement yet:

- real deletion;
- real account anonymization;
- automatic reputation decay engine;
- ownership transfer workflow;
- legal/privacy automation;
- billing-related account closure logic.

Current goal is to lock lifecycle mechanics so UI and future backend can be built consistently.
