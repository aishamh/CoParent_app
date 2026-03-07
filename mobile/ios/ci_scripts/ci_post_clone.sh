#!/bin/sh

# ============================================================
# Xcode Cloud - Post Clone Script
# ============================================================
# Runs after Xcode Cloud clones the repo.
# Installs Node.js, npm dependencies, and CocoaPods.
# ============================================================

set -e

echo "=== CoParent Connect - Xcode Cloud Build ==="
echo "Current directory: $(pwd)"

# Navigate to the mobile directory
cd "$CI_PRIMARY_REPOSITORY_PATH/mobile"
echo "Working directory: $(pwd)"

# Install Node.js using Homebrew (Xcode Cloud has Homebrew pre-installed)
echo "=== Installing Node.js ==="
brew install node@22
export PATH="/usr/local/opt/node@22/bin:$PATH"
node --version
npm --version

# Install npm dependencies
echo "=== Installing npm dependencies ==="
npm ci || npm install

# Run expo prebuild to ensure native project is up to date
echo "=== Running Expo Prebuild ==="
npx expo prebuild --platform ios --no-install

# Navigate to iOS directory and install CocoaPods
echo "=== Installing CocoaPods ==="
cd ios
pod install

echo "=== Post Clone Complete ==="
