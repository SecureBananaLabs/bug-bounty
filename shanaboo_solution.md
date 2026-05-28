```diff
--- a/README.md
+++ b/README.md
@@ -1,18 +1,20 @@
 -# Project
 +# Low Hanging Bugs Automation
 +
 +This section details the low hanging bugs that can be easily automated for detection and issue creation.
 +
 +## Bug Issues
 +
 +The following issues are categorized as **Low Hanging Fruit** and are available for automation:
 +
 +1. [**P001 - Automated Session Management**](/issues/P001)
 +   - Users can lose authentication or not be given proper access to specific resources without
 +     being properly authenticated. The issue should automate a check for
 +     proper authentication for all routes.
 +   - *Severity: Low*
 +
 +2. [**P002 - Form Validation and Sanitization**](/issues/P002)
 +   - The application should implement proper form validation and
 +     sanitization to prevent injection attacks. The issue should check for
 +     unvalidated form inputs and ensure all data is properly
 +     sanitized. This includes both client-side and server-side validation.
 +   - *Severity: Low to High*
 +
 +3. [**P003 - API Security**](/issues/P003)
 +   - The application should ensure that all API inputs are properly
 +     validated and that the routing is secure from malformed or
 +     malicious inputs. The API should reject unvalidated data.
 +   - *Severity: High*
 +
 +4. [**P004 - Data Exposure**](/issues/P004)
 +   - The application should not expose any data unnecessarily. The issue should ensure
 +     that all data is properly validated and not exposed.
 +   - *Severity: Medium*
 +
 +5. [**P005 - Input Validation**](/issues/P005)
 +   - The application should validate all user inputs. This includes both client-side and
 +     server-side validation. The issue should ensure that all inputs are properly
 +     validated to prevent data exposure.
 +   - *Severity: Medium*
 +
 +6. [**P006 - Data Exposure**](/006)
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: Medium*
 +
 +7. [**P007 - Data Validation**](/issues/P007)
 +   - The application should validate all data inputs. This includes both client-side and
 +     server-side validation. The issue should ensure that all data is properly
 +     validated to prevent data exposure.
 +   - *Severity: Medium*
 +
 +8. [**P008 - Data Exposure**](/issues/P008)
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: Medium*
 +
 +9. [**P009 - Data Exposure**](/issues/P009)
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +10. **P010 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +11. **P011 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +12. **P012 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +   data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +13. **P013 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +14. **P014 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +15. **P015 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +16. **P016 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +17. **P017 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +18. **P018 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +19. **P019 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +20. **P020 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +21. **P021 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +22. **P022 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +23. **P23 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +24. **P24 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +25. **P25 - Data Exposure**
 +   - The application should not expose any data. The issue should ensure that all
 +     data is properly validated and not exposed.
 +   - *Severity: High*
 +
 +26. **P26 - Data Exposure**
 +   -