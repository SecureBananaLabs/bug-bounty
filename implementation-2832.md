# Implementation for #2832

See issue #2832 for details.

Same as #1426, registration role restriction.

Public registration currently accepts `role: "admin"`, which lets a new user self-assign admin privileges and receive a token signed with the admin role. Registration should only allow public roles (`client` and `freelancer`) and should reject `admin` in the request body.

---
This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create 