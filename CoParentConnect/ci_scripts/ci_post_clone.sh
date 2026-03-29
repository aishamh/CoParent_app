#!/bin/sh

# ci_post_clone.sh — Xcode Cloud post-clone script for native SwiftUI app
# No dependencies needed — pure Swift project

set -e

echo "=== CoParent Connect (Native SwiftUI): Xcode Cloud Post-Clone ==="
echo "Working directory: $(pwd)"
echo "CI_PRIMARY_REPOSITORY_PATH: $CI_PRIMARY_REPOSITORY_PATH"
echo "CI_WORKSPACE: ${CI_WORKSPACE:-not set}"
echo "=== Post-clone complete (no setup needed for pure Swift) ==="
