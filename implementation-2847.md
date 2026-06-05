# Implementation for #2847

See issue #2847 for details.

## Bug

`POST /api/auth/refresh` currently issues a fresh access token without checking the requester at all. The service also signs that token for the hard-coded subject `usr_existing` with role `client`, so even an authenticated caller does not get a token for their own subject and role.

## Expected fix

Protect the refresh route with the existing bearer-token auth middleware, pass the verified user payload into the refresh service, and sign the refreshed token for that authenticated subject 