# Auth API Notes

The authentication API now supports:

- user registration
- patient, clinic, lab, admin, and insurance registration routes
- login with access and refresh tokens
- token refresh flow
- organization document uploads for admin review

## Token behavior

- Access token: short-lived JWT for API access
- Refresh token: long-lived random token stored securely for renewing access tokens

## Suggested environment variables

- R2_ENDPOINT
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME
- R2_PUBLIC_URL
