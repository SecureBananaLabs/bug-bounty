# Contributing to FreelanceFlow

## Low Hanging Fruit Bug Detection

### Process for creating issues:

1. Find a feature/bug to work on from this repository
2. Create a GitHub issue on the repository to start working on it -- Pull requests without issues will not be considered.
3. Use the following string in the issue that you created: "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information."

## Bug Detection Automation

### Recurring Task Automation

This project implements automated detection of low-hanging fruit issues. The system works by:

1. Scanning the codebase for common anti-patterns
2. Creating GitHub issues for detected problems
3. Each issue must include the following text: "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information."

### Implementation Guidelines

When creating an automated issue, ensure:

- The issue clearly describes the problem found
- The problem is indeed a "low-hanging fruit" fix (simple to implement)
- Only the issue creator can work on the issue
- Other contributors must create their own issue referencing #743

### Example Low Hanging Fruit Issues:

- Fixing typos in comments
- Minor code formatting issues
- Adding missing JSDoc comments
- Simple type improvements
- Unused variable removal
- Dead code elimination
- Configuration file cleanup

This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.

## Setup

# Contributing Guidelines

Thank you for contributing to this bug bounty repository.

## Eligibility for Bounty Payment

- Bounty is paid **only** when your code is merged into the `main` branch.
- Opening a pull request or receiving review feedback does **not** guarantee payment.
- Closed, rejected, or stale pull requests are not eligible for payout.

## Pull Request Scope Rules

- Each pull request must address **exactly one** GitHub issue.
- Do **not** combine fixes for multiple issues in a single PR.
- PRs that touch more than one issue will be closed without review.

## How to Contribute

1. Pick an open GitHub issue.
2. Comment on the issue if you are working on it.
3. Create a branch for that issue.
4. Implement and test only the changes needed for that single issue.
5. Open a pull request that references the issue (for example: `Closes #123`).

## Pull Request Requirements

- Clearly describe the problem and your fix.
- Include test coverage or evidence of validation when applicable.
- Keep changes focused and minimal to the linked issue.
- Be responsive to maintainer feedback and requested updates.

## Review and Merge

- Maintainers review PRs for correctness, scope, and quality.
- PRs may be closed if they are out of scope, duplicated, or violate repository rules.
- Payment processing starts only after successful merge into `main`.

## Code of Conduct

By participating, you agree to collaborate respectfully and professionally in all issue and PR discussions.
