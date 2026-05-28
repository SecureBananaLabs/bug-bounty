#!/bin/bash

# This script automates the detection and creation of low hanging fruit issues

echo "Creating low hanging fruit issue..."

# Create a new issue
title="Low Hanging Fruit: Automated Issue"
body="This is an automated issue for bounty #743. This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information."
labels="bug, good first issue"

# Create the issue using GitHub CLI
gh issue create --title "$title" --body "$body" --label "$labels"

echo "New low hanging fruit issue created."