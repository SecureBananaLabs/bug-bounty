<img width="1859" height="935" alt="logo" src="https://github.com/user-attachments/assets/31e54d5c-d336-4294-8f73-9782465dbbda" />

<img width="952" height="328" alt="Image" src="https://github.com/user-attachments/assets/2da5d257-dd5b-4bef-831e-e39b44ce4b94" />

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

# Contributing to FreelanceFlow

Thank you for your interest in contributing to FreelanceFlow! This document outlines the process for contributing, including our automated issue creation system.

## Automated Low Hanging Fruit Detection

This repository uses an automated system to detect and create issues for common code quality problems. The system runs daily and creates issues for patterns such as:

- `TODO`, `FIXME`, `XXX`, `HACK`, `BUG` comments
- Debug `console.log` statements in production code
- Focused test blocks (`describe.only`, `it.only`, `test.only`)
- Environment variable usage patterns

### How It Works

The automation is implemented as a GitHub Actions workflow in `.github/workflows/low-hanging-fruit.yml`. It:

1. Scans all source files in the repository
2. Detects predefined patterns indicating potential issues
3. Creates GitHub issues with appropriate labels and descriptions
4. Limits issue creation to prevent spam (max 5 issues per run)

### Issue Creation Rules

When the automation creates an issue, it includes the following required text:

> This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.

### Creating Issues Manually

If you want to work on something not covered by the automation:

1. Find a feature or bug to work on in the repository
2. Create a GitHub issue before starting work — **Pull requests without issues will not be considered**
3. Include the required text in your issue description (see above)

## Pull Request Process

1. Ensure an issue exists for your change
2. Fork the repository and create a feature branch
3. Make your changes with clear, descriptive commit messages
4. Submit a pull request referencing the issue number
5. Wait for review and address any feedback

## Code of Conduct

Please be respectful and constructive in all interactions. We value diverse perspectives and collaborative problem-solving.
By participating, you agree to collaborate respectfully and professionally in all issue and PR discussions.
