<?php
// Lavender Plaza Hotel - member account settings. Keep this file private.

// Google sign-in ("Continue with Gmail"). Paste your OAuth Client ID here.
// It looks like 1234567890-abcdef.apps.googleusercontent.com
define('GOOGLE_CLIENT_ID', '');

// Facebook login (optional). Paste your Facebook App ID here.
define('FACEBOOK_APP_ID', '');

// Password for the members list page:  https://YOUR-DOMAIN/api/members.php?key=THIS-PASSWORD
// Change it to a long random text, otherwise the members page stays locked.
define('ADMIN_KEY', 'change-this-to-a-long-random-password');

// How many days a guest stays signed in on their device.
define('SESSION_DAYS', 30);
