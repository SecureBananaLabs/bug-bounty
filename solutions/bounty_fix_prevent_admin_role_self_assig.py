**Preventing Admin Role Self‑Assignment During Public Registration**

**Overview**  
The current registration endpoint permits any role to be supplied in the request payload. While this flexibility is useful for internal tooling, it creates a critical security gap: a malicious actor can submit `role: "admin"` and obtain full administrative privileges, including a JWT that grants unrestricted access to protected resources. The fix must enforce strict role whitelisting for public sign‑ups, allowing only the business‑defined public roles—`client` and `freelancer`—while rejecting any attempt to assign `admin` (or any other privileged role) at registration time.

**Scope**  
- Public registration API (`POST /api/v1/auth/register` or equivalent).  
- Input validation layer that parses the JSON body.  
- Role‑assignment logic that populates the newly created `User` record and signs the JWT.  
- Unit and integration tests confirming the new constraints.  
- Documentation updates reflecting the allowed role set.

**Design Considerations**  

1. **Role Whitelisting vs. Blacklisting**  
   A whitelist approach guarantees future safety: only explicitly permitted roles are accepted. Adding new public roles later will be a deliberate code change, reducing the risk of unintentionally exposing privileged roles.

2. **Backward Compatibility**  
   Existing internal tools that create admin users via a separate, protected endpoint must remain unaffected. The restriction applies exclusively to the public registration path; internal services can continue using a privileged creation API that bypasses the whitelist.

3. **Error Reporting**  
   When an invalid role is supplied, the API should return a clear `400 Bad Request` with a message such as:  
   ```json
   {
     "error": "Invalid role. Allowed roles are: client, freelancer."
   }
   ```  
   This aids developers and client applications in handling the error gracefully.

4. **Security‑First JWT Claims**  
   The JWT generation step must reference the role stored on the persisted user record rather than the raw request value. This ensures that even if the validation layer were bypassed, the token would reflect the actual stored role.

**Implementation Steps**  

1. **Define the Public Role Set**  
   In a central constants file (e.g., `src/constants/roles.ts`), create an exported array:  
   ```ts
   export const PUBLIC_ROLES = ['client', 'freelancer'] as const;
   export type PublicRole = typeof PUBLIC_ROLES[number];
   ```

2. **Validate Incoming Role**  
   In the registration controller or service:
   ```ts
   const { role } = req.body;
   if (!PUBLIC_ROLES.includes(role)) {
     return res.status(400).json({
       error: `Invalid role. Allowed roles are: ${PUBLIC_ROLES.join(', ')}.`
     });
   }
   ```
   Optionally, default to `client` if the role is omitted, preserving backward compatibility for older clients.

3. **Persist the Role Safely**  
   After validation, assign the role to the new `User` entity:
   ```ts
   const newUser = new User({
     ...otherFields,
     role: role as PublicRole
   });
   await userRepository.save(newUser);
   ```

4. **Generate JWT from Persisted Data**  
   ```ts
   const token = jwt.sign(
     { sub: newUser.id, role: newUser.role },
     JWT_SECRET,
     { expiresIn: '7d' }
   );
   ```
   This step guarantees the claim mirrors the stored role.

5. **Update Tests**  
   - **Positive Tests:** Register with `client` and `freelancer`; expect `201 Created` and a valid token containing the correct role claim.  
   - **Negative Tests:** Submit `admin`, `superadmin`, or any undefined role; expect `400 Bad Request` with the defined error message.  
   - **Edge Cases:** Omit the `role` field; ensure the default (if any) is applied and the response is successful.

6. **Documentation**  
   - Amend the API spec (OpenAPI/Swagger) to list the allowed enum values for the `role` property.  
   - Update README or developer portal sections describing registration payload requirements.

**Security Validation**  
After implementation, perform a quick penetration test:
- Attempt direct POST with `role: "admin"` and verify rejection.  
- Try tampering with the JWT after a successful `client` registration to inject `admin` into the payload; ensure the server validates the signature and rejects any altered token.  

**Rollback Plan**  
If unforeseen integration issues arise, revert the controller change and re‑enable the previous permissive behavior behind a feature flag. The flag can be toggled off once the whitelist is confirmed stable.

**Conclusion**  
By enforcing a strict whitelist for public registration roles, we eliminate the most straightforward path for privilege escalation via self‑assigned admin accounts. The change is isolated to the public endpoint, preserves internal admin creation workflows, and provides clear feedback to API consumers. Comprehensive tests and updated documentation will ensure maintainability and prevent regression in future releases.