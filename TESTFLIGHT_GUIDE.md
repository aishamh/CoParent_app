# TestFlight Upload Guide - CoParent Connect v1.1.0

## What's Been Prepared

✅ **Code Changes Committed**
- Version 1.1.0 updates
- SMS initiation feature added to MessagesScreen
- URL schemes configured (coparent://, sms://)
- All TypeScript compilation passes

✅ **iOS Configuration**
- Info.plist updated with URL schemes
- Provisioning profile structure in place
- EAS build configuration ready

✅ **Feature Summary**
1. **SMS to Coparent**: Users can tap "Text Coparent" button, enter phone number, and open native Messages app
2. **Deep Linking**: SMS and coparent URL schemes for future integration
3. **Security**: Content hashing for message integrity verification

---

## Build & Upload Options

### Option 1: EAS Build (Recommended)

**Pros:**
- Handles signing, certificates, provisioning automatically
- Cloud-based - no local compilation needed
- Optimized for App Store Connect

**Steps:**
```bash
# 1. Login to EAS (interactive - opens browser)
npx eas login

# 2. Build for TestFlight
npx eas build --platform ios --profile production

# 3. Follow the provided link to upload to TestFlight
```

**Expected:**
- Login: 1-2 minutes
- Build: 5-15 minutes
- Upload: 2-5 minutes

---

### Option 2: Local Xcode Build

**Pros:**
- Full control over build process
- Can debug build issues locally
- Archive can be used for multiple uploads

**Steps:**
```bash
# 1. Build archive
cd /Users/aishahalane/CoParent_app/mobile/ios
xcodebuild -workspace CoParentConnect.xcworkspace \
  -scheme CoParentConnect \
  -configuration Release \
  -archivePath build/CoParentConnect.xcarchive

# 2. Open Xcode Organizer
open build/CoParentConnect.xcarchive

# 3. In Xcode:
#    - Select the archive
#    - Click "Distribute App"
#    - Choose "App Store Connect"
#    - Upload to TestFlight
```

---

## Apple Developer Account Requirements

You'll need:
- **Apple ID**: Your developer account email
- **Team ID**: Found at https://developer.apple.com/account
- **App Store Connect access**: For uploading builds
- **Bundle ID**: com.coparent.connect (or your custom bundle)

---

## TestFlight Distribution

After upload, in App Store Connect:

1. **Create New Build** (or upload to existing)
2. **Add Testers**:
   - Internal testers (up to 100)
   - External testers (up to 10,000 via email)
3. **Configure Test Information**:
   - What to test
   - Feedback email
4. **Submit for Review** (optional, for production)
   - Screenshots required
   - Review typically takes 1-3 days

---

## Testing Checklist

Before distributing:

- [ ] App builds successfully
- [ ] SMS feature works (test with real phone number)
- [ ] URL schemes functional (open coparent:// or sms://)
- [ ] All core features function (messages, calendar, expenses, etc.)
- [ ] Crash reporting configured (Sentry)
- [ ] Push notifications working

---

## Build Artifacts

**EAS Build**: 
- .ipa file in cloud
- URL provided after completion

**Local Build**:
- .xcarchive in: `/Users/aishahalane/CoParent_app/mobile/ios/build/`
- Use Xcode Organizer for distribution

---

## Quick Start Commands

```bash
# Navigate to mobile directory
cd /Users/aishahalane/CoParent_app/mobile

# Option 1: EAS Build (recommended)
npx eas login
npx eas build --platform ios --profile production

# Option 2: Local Build
cd ios
pod install
xcodebuild -workspace CoParentConnect.xcworkspace \
  -scheme CoParentConnect \
  -configuration Release \
  -archivePath build/CoParentConnect.xcarchive \
  -destination generic/platform=iOS \
  -allowProvisioningUpdates
```

---

## Support & Troubleshooting

**EAS Build Issues:**
```bash
# Check EAS status
npx eas build:list

# View build details
npx eas build:status

# Clean build cache
npx eas build:clean-cache
```

**Local Build Issues:**
```bash
# Verify Xcode installation
xcodebuild -version

# Check for code signing issues
security find-identity -v -p codesigning

# View Xcode logs
open ~/Library/Logs/DiagnosticReports/
```

---

## Version Information

**Current Version:** 1.1.0
**Previous Version:** 1.0.0

**New Features:**
- SMS initiation to text coparent directly from app
- URL scheme support for deep linking
- Performance optimizations and bug fixes

---

## Next Steps

1. **Choose build method** (EAS recommended)
2. **Run the build command**
3. **Upload to TestFlight**
4. **Add testers**
5. **Monitor feedback and prepare for production release**
