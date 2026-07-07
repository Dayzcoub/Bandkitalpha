-- Anti-replay for TOTP (code-review #5). Records the time-step of the last
-- accepted code so the same code can't be reused within its validity window.
alter table two_factor_secrets add column if not exists last_used_step bigint;
