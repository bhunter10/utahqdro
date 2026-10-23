# WordPress account migration

The client portal and both intake sign-in forms try Firebase first. When Firebase reports invalid credentials, a server-only bridge checks the email and password with the original WordPress installation. A successful check creates a Firebase client account using the same password and the UID `wordpress-user-{WordPress user ID}`. The browser then signs in through Firebase normally. WordPress passwords and password hashes are never exported or saved by this application.

## Setup before launch

1. Back up WordPress and Firestore. Keep the original WordPress installation accessible over HTTPS at a separate origin after the new site takes over the public domain.
2. Install `scripts/wordpress/utahqdro-login-migration.php` as a plugin on that original WordPress installation and activate it.
3. Generate a random secret of at least 32 characters. Set `UTAHQDRO_MIGRATION_SECRET` in WordPress's `wp-config.php` and the identical `WORDPRESS_MIGRATION_SECRET` in the new site's server environment. Keep both private.
4. Set `WORDPRESS_MIGRATION_URL` to `https://YOUR-LEGACY-HOST/wp-json/utahqdro-migration/v1/verify`. Redirects are rejected. Make sure WordPress recognizes HTTPS if behind a proxy.
5. Enable Firebase email/password sign-in. Import requests using the current importer; it maps the CSV's `Created By (User Id)` directly to the matching Firebase UID. For already imported requests, run the importer with `--link-owners-only` first to inspect the CSV summary, then `--link-owners-only --write` to update ownership only. Back up and confirm the CSV comes from this same WordPress installation before writing. This leaves already assigned owners alone and never grants access by client or billing email. Requests without a recorded user ID require manual review.
6. Deploy the new application with those server settings. Test a dedicated legacy client account, its request visibility, a wrong password, an existing Firebase account, and a changed/reset Firebase password. Verify that WordPress security plugins permit the bridge while still enforcing disabled-account or MFA restrictions. Configure request-rate protection at the hosting layer too; the bridge additionally permits five attempts per normalized email per fifteen minutes in Firestore.

## Behavior and limits

- Sign in using the WordPress account's **email**, not its username. Username-based sign-in is not supported by this implementation.
- Accounts migrate on their first successful login; dormant accounts remain in WordPress. This is not a bulk Firebase user import.
- Existing Firebase accounts are never linked automatically or given a new password through WordPress. Email or UID conflicts need manual review and proof of ownership. No WordPress administrative roles are imported.
- WordPress remains the recovery path for accounts that have not migrated. The new portal's password reset works for accounts already in Firebase. Legacy passwords shorter than six characters must be changed in WordPress first, then used to sign in here.
- If account creation succeeds but profile creation fails, the Firebase account can still sign in. Repair its client profile through trusted administration; do not replace its password.
- The private bridge uses `wp_authenticate`, so custom authentication/MFA plugins may require additional integration. Do not bypass those checks to force migration.
- The attempt collection is private under the default-deny Firestore rules. Arrange periodic deletion of expired attempt records; `expiresAt` is an epoch-millisecond number, not a Firestore TTL timestamp.

## Retirement

After the migration window, remove both server settings and deactivate/delete the bridge plugin. Unmigrated users will need a verified account recovery process before the original WordPress installation is retired. Retain the WordPress user-ID ownership mapping and backups until every required account is accounted for.
