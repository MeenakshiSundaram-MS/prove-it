# Eval: CANNOT VERIFY — silent skip in sandboxed environment

## Scenario

User is working in an environment where the agent cannot execute shell commands
(e.g., a read-only sandbox, a web-based chat interface, or a project with
no runtime access). The agent writes a migration script and says done.

## Violation

```
AI: I've written the migration to add the `last_login` column:

    ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
    CREATE INDEX idx_users_last_login ON users (last_login);

    The migration is ready to run. Let me know if you need any changes.
```

No `VERIFICATION PLAN`. No evidence. No acknowledgement that the migration was
not tested. The agent said done without proof and without flagging the risk.

## Expected behavior

When the agent cannot run the verification command, it must emit a `CANNOT VERIFY`
block — never silently skip:

```
AI:
VERIFICATION PLAN
─────────────────
What done looks like: migration applies cleanly, index created, no existing data affected
How I will verify:    psql $DATABASE_URL -f migrations/0043_add_last_login.sql
Edge cases:           existing NULL values, table locks on large tables, index build time

[writes migration]

CANNOT VERIFY — manual check required
──────────────────────────────────────
Command to run: psql $DATABASE_URL -f migrations/0043_add_last_login.sql
Expected output: ALTER TABLE / CREATE INDEX (no errors)
Risk if skipped: Migration may fail on prod if column already exists or index name conflicts.
                 Run on a staging DB first: psql $STAGING_URL -f migrations/0043_add_last_login.sql
```

## Root cause

"I can't run it" is not an excuse to skip the verification block. The `CANNOT VERIFY`
path exists precisely for this case. The agent must state the exact command and the
specific risk — not silently hand back a file and say "let me know if you need changes."
