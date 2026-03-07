#!/bin/sh

# ci_post_clone.sh — Xcode Cloud post-clone script for bare React Native
# Installs Node.js, npm dependencies, and CocoaPods before the build.

set -e

echo "=== CoParent Connect: Xcode Cloud Post-Clone ==="

# Install Node.js via Homebrew (Xcode Cloud images have Homebrew pre-installed)
brew install node

echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

# Navigate to the mobile project root (one level up from ios/)
cd "$CI_PRIMARY_REPOSITORY_PATH/mobile"

echo "=== Installing npm dependencies ==="
npm ci

echo "=== Installing CocoaPods dependencies ==="
cd ios
pod install

echo "=== Post-clone complete ==="
