# Implementation for #2845

See issue #2845 for details.

## Bug

`registerUser()` currently builds the returned `id` and the JWT `sub` with two separate `Date.now()` calls. If time advances between those calls, the API can return one user id while signing an access token for a different subject. Downstream authenticated requests would then identify a different user than the one returned by registration.

## Expected fix

Generate the new user id once, return that id, and sign the access token with the same id as `sub`. Add a regression test that force