# BandKit — Phase 4 Link Guard Server Enforcement Checkpoint 1.11.2

## Status

Accepted checkpoint.

First slice of the Phase 4 **link guard** domain (second domain after reputation). Enforces the link policy on the server for chat messages. The frontend already had a `linkPolicy` UX hint; per CLAUDE.md a frontend check is never the guard, so this slice makes the server the source of truth (Security AntiFraud §4).

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend service: `bandkit-backend`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Scope of this slice

```text
server/src/shared/linkPolicy.js                (new — authoritative check)
server/src/modules/chats/chats.routes.js       (enforce on send + edit)
```

- `checkLinkPolicy(text)` returns `{ blocked, reason }` with a stable reason code the client maps to a localized warning. Strict MVP mode blocks:
  - `punycode` — `xn--` host labels (IDN homograph);
  - `shortener` — known URL shorteners;
  - `suspicious_domain` — a non-ASCII label before a dotted TLD (unicode look-alike);
  - `external_url` — `http(s)://`, `www.`, or a bare host with a common TLD.
- Enforced in `handleSendMessage` and in the edit branch of `handleUpdateMessage` (a message can't smuggle a link in on edit). Blocked attempts return `422 MESSAGE_LINK_BLOCKED` with `details.reason` and write an audit signal `chat.message_link_blocked` (anti-fraud trail).

---

## Verification

Local, authenticated session, against the seeded working-chat room:

```text
clean message                                  -> 201
"...https://evil.example.com/pay"              -> 422 external_url
"...www.paymenow.ru"                           -> 422 external_url
"...scam.top now"                              -> 422 external_url
"...bit.ly/abc"                                -> 422 shortener
"...xn--80ak6aa92e.com"                        -> 422 punycode
"Thanks. See you tomorrow."                    -> 201 (no false positive)
edit to add "t.me/scammer"                     -> 422 external_url
edit to clean text                             -> 200
audit chat.message_link_blocked                -> recorded per attempt with reason
```

---

## Do not regress

- The server is the link guard; the frontend `linkPolicy` stays a UX hint only.
- Apply the guard on both send and edit.
- Keep reason codes stable (client maps them to localized copy).
- Record blocked attempts as an anti-fraud audit signal.

---

## Next recommended work

Extend the link guard to the next user-generated surface when it lands (feed posts / comments), and add allowlist/moderation for links in public profiles (AntiFraud §4). Localize the `MESSAGE_LINK_BLOCKED` reason in the chat UI.
