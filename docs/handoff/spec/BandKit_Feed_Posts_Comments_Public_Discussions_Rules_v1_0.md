# BandKit — Feed, Posts, Comments and Public Discussions Rules v1.0

## Status

Accepted product policy.

This document defines the baseline rules for public/social content in BandKit: feed, posts, comments, reactions, reposts and public discussions.

---

## Core principle

BandKit can use familiar social-platform feed behavior, but public/social content must remain separate from private working context.

Accepted rule:

> Public discussion is not the same as working chat.

---

## Content types

Supported future content types:

- user profile post;
- entity post;
- event post;
- public event discussion/comment;
- group/project public update;
- comment;
- reaction;
- repost/share;
- official entity/event announcement.

---

## Visibility levels

Posts/discussions should support visibility layers:

- public;
- registered users;
- followers/subscribers;
- friends/contacts;
- entity members;
- event participants;
- private/internal.

Public visibility must never grant access to:

- working chat;
- internal documents;
- backstage logistics;
- confidential event/project information.

---

## User posts

User posts follow standard social behavior.

Rules:

- user can create posts according to account state and rate limits;
- user can edit/delete own posts according to post policy;
- posts can be reported;
- comments can be enabled/disabled by policy;
- restricted/read-only users cannot post where restricted.

---

## Entity posts

Entity posts are posted by users with entity role permission.

Can be used for:

- public updates;
- announcements;
- media/news;
- event promotion;
- non-confidential project updates.

Entity posts must not expose internal documents unless explicitly allowed.

---

## Event posts and public discussions

Event public discussion is optional.

Rules:

- separate from event working chat;
- viewers/subscribers may participate only if enabled;
- can be moderated;
- can be disabled by organizer/admin;
- does not grant access to event working chat or documents;
- must not contain confidential backstage/event logistics unless intentionally public.

---

## Comments

Comments follow social-platform logic.

Rules:

- comments can be reported;
- comments can be hidden by author/admin/moderator according to policy;
- restricted/read-only users cannot comment;
- comments on entity/event posts follow visibility and moderation rules;
- comments must not become a workaround for working chat access.

---

## Reactions and reposts

Reactions are lightweight social feedback.

Rules:

- reactions do not count as operational acknowledgement;
- `Ознакомлен` / `Принял задачу` / `Подтверждаю участие` are separate actions;
- reposts/shares must respect source visibility;
- confidential entity content cannot be reposted publicly unless policy allows.

---

## Moderation

Posts, comments and public discussions can be reported.

Moderation can:

- hide content;
- restrict comments;
- remove public visibility;
- restrict user;
- preserve evidence;
- escalate case.

All sensitive actions require reason/audit.

---

## MVP scope

MVP does not require broad public feed as core feature.

MVP may include minimal entity/event updates if they support the working entity flow.

Out of MVP:

- algorithmic feed;
- viral discovery;
- advanced repost mechanics;
- public fan communities;
- large-scale content recommendation.

---

## Accepted decision

BandKit feed/social rules:

- familiar social behavior applies to public posts/comments;
- public discussion stays separate from working chat;
- event working chat is private and role-based;
- reactions are not acknowledgements;
- visibility and moderation are required;
- broad social feed is not MVP core.
