# 🚀 TestFlight Deployment Guide - CoParent Connect v1.1.0

## Overview

This guide covers deploying **CoParent Connect v1.1.0** to Apple TestFlight using Xcode Cloud builds.

---

## 📋 Prerequisites

### Required Before Building

- [ ] Apple Developer Account ($99/year individual or $299/year team)
- [ ] Team ID (found at developer.apple.com/account)
- [ ] App Store Connect access
- [ ] Two-factor authentication enabled on Apple account
- [ ] CoParent Connect project added to your Apple Developer account

### Code Status

- [ ] All TypeScript builds pass: `npx tsc --noEmit`
- [ ] Git working tree is clean: `git status`
- [ ] Version is correct: `1.1.0` in package.json
- [ ] Info.plist has URL schemes configured

---

## 🔑 Apple Developer Account Setup

### 1. Register the App

1. Log in to [developer.apple.com](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **"Identifiers"** → **"+"** to create new App ID
4. Fill in:
   - **Description**: CoParent Connect
   - **Bundle ID**: `com.coparent.connect`
   - **Team**: Select your team
5. Click **Continue** and complete registration

### 2. Create Provisioning Profile

1. Navigate to **Certificates, Identifiers & Profiles**
2. Click **"Profiles"** → **"+"** to create new profile
3. Choose **iOS App Development** or **iOS App Store**
4. Select the App ID (`com.coparent.connect`)
5. Choose your development or distribution certificate
6. Click **Generate** and download the profile

### 3. Enable Capabilities (if needed)

1. Navigate to your App ID
2. Add capabilities:
   - **Push Notifications**: For testflight and production
   - **In-App Purchase**: If needed (future)
   - **Sign in with Apple**: If implementing (future)

---

## 📦 Building via Xcode Cloud

### Option 1: Xcode Cloud Dashboard (Recommended)

1. Log in to [developer.apple.com](https://developer.apple.com)
2. Navigate to **Xcode Cloud** section
3. Select **CoParent Connect** workspace
4. Configure:
   - **Scheme**: CoParentConnect
   - **Configuration**: Release
   - **Destination**: Any iOS Device
5. Click **"Build"**

**Timeline:**
- Build Queued: 30-60 seconds
- Compilation: 5-10 minutes
- Archive Creation: 1-2 minutes
- Upload to App Store Connect: 2-5 minutes
- Total: 7-18 minutes

### Option 2: Local Xcode Build

1. Open **Xcode**
2. Open `CoParentConnect.xcworkspace` in the project
3. Select **CoParentConnect** scheme
4. Choose **Any iOS Device (arm64)** as destination
5. Go to **Product** → **Archive**
6. After archive completes, open **Window** → **Organizer**
7. Select the new archive
8. Click **"Distribute App"**
9. Choose **"App Store Connect"**
10. Follow on-screen prompts to upload

**Timeline:**
- Local Compilation: 10-30 minutes
- Archive Creation: 1-3 minutes
- Upload to App Store Connect: 2-5 minutes
- Total: 13-38 minutes

---

## 📲 Uploading to TestFlight

### Via Xcode Cloud Build

1. After build completes, you'll receive an email notification
2. Click the link in the email
3. Log in to [App Store Connect](https://appstoreconnect.apple.com)
4. Review the build details:
   - Version number
   - Build number
   - Binary size
5. Click **"Submit for Review"** or **"Add to TestFlight"**

### Via Local Xcode Archive

1. In Xcode Organizer, select the archive
2. Click **"Distribute App"**
3. Choose **"App Store Connect"**
4. Follow the on-screen instructions
5. Wait for upload to complete

**Upload Timeline:**
- Processing: 2-5 minutes
- Validation: 1-3 minutes
- Available in TestFlight: 5-15 minutes

---

## 👥 Adding Testers

### Internal Testers (Up to 100)

**Best for:** Team members, family, close friends

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **TestFlight** → **Internal Testing**
3. Click **"Add Testers"**
4. Select testers from your Apple Developer team
5. Testers receive immediate TestFlight invitation

**Benefits:**
- Immediate access (no review needed)
- No limit on number of builds
- Perfect for quick iterations

### External Testers (Up to 10,000)

**Best for:** Beta users, customers, early adopters

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **TestFlight** → **External Testing**
3. Click **"Add New Group"**
4. Fill in:
   - **Group Name**: "Family Beta" or "CoParent Beta"
   - **Tester Type**: External
   - **Tester Emails**: Add email addresses (comma-separated)
5. Click **"Create Group"**
6. Testers receive invitation email

**Benefits:**
- Up to 10,000 testers
- Email invitations
- Track tester acceptance
- Control group membership

### Public TestFlight Link (After App Review)

**Best for:** Wider beta distribution, customer beta

1. After first TestFlight build is submitted, wait for it to be processed
2. Request a **Public Link** from TestFlight tab
3. Share the link:
   - On your website
   - Via social media
   - In email newsletters
4. Anyone can join by tapping the link

**Note:** Requires the app to have passed initial App Store Review first.

---

## 📋 Testing Checklist

### Before Submitting to TestFlight

**Core Features:**
- [ ] User can login/logout successfully
- [ ] Messages: Send and receive
- [ ] Calendar: View and manage events
- [ ] Expenses: Add and view expenses
- [ ] Documents: Upload and view documents
- [ ] Settings: Configure preferences
- [ ] **SMS Feature**: Tap "Text Coparent", enter phone, open Messages app

**Technical:**
- [ ] No TypeScript build errors
- [ ] No console warnings/errors
- [ ] App launches in under 3 seconds
- [ ] No memory leaks
- [ ] Proper error handling

**Permissions:**
- [ ] Camera permission requested and handled
- [ ] Photo library permission requested and handled
- [ ] Location permission requested and handled
- [ ] Push notifications work
- [ ] Face ID / Touch ID works

**UI/UX:**
- [ ] Dark mode works correctly
- [ ] All screens responsive (various iPhone sizes)
- [ ] Smooth animations
- [ ] Proper safe area handling (notch/home indicator)
- [ ] Back navigation works correctly
- [ ] Gestures work as expected

**Integration:**
- [ ] Deep links work (coparent://)
- [ ] SMS deep link works (sms://)
- [ ] Linking to external apps works

---

## 🔧 Troubleshooting

### Build Issues

**"Bundle identifier not found"**
- Verify App ID exists in Apple Developer account
- Check bundle ID in Info.plist matches: `com.coparent.connect`

**"Code signing error"**
- Verify provisioning profile is valid
- Check certificate is not expired
- Re-generate provisioning profile if needed

**"Archive failed"**
- Check Xcode project settings
- Verify all dependencies are linked
- Clean build folder: `rm -rf ios/build`

**"Upload to App Store Connect failed"**
- Check App Store Connect status (may be under maintenance)
- Verify network connection
- Try uploading later

### Tester Issues

**"Tester not receiving invitation"**
- Verify email addresses are correct
- Check spam folder
- Re-send invitation from TestFlight tab

**"Tester can't install TestFlight app"**
- TestFlight app may need update
- iOS version too old (require iOS 12.0+)
- Device not supported (iPhone 5s+)

### App Issues

**"App crashes on launch"**
- Check Sentry dashboard for crash reports
- Review console logs
- Verify Info.plist configuration

**"Push notifications not working"**
- Verify push notification entitlements
- Check device token registration
- Verify server is sending to correct endpoints

---

## 📊 Version History

| Version | Release Date | Key Features | Status |
|---------|-------------|-------------|--------|
| 1.0.0 | - | Core MVP features | Production |
| 1.1.0 | - | SMS to Coparent, URL Schemes | TestFlight |

---

## 📖 Additional Resources

**Apple Documentation:**
- [App Store Connect Guide](https://developer.apple.com/documentation/app-store-connect)
- [TestFlight Documentation](https://developer.apple.com/documentation/testflight)
- [Xcode Cloud Documentation](https://developer.apple.com/documentation/xcode-cloud)

**Project Documentation:**
- `XCODE_CLOUD_DEPLOYMENT.md` - Xcode Cloud build steps
- `DEPLOYMENT_READY.md` - Testing checklist and version comparison

---

## 🎉 Summary

**TestFlight Deployment Workflow:**

1. ✅ Build app via Xcode Cloud (7-18 minutes)
2. ✅ Upload to App Store Connect (2-5 minutes)
3. ✅ Add testers (internal or external)
4. ✅ Testers install via TestFlight app
5. ✅ Gather feedback via Sentry and direct communication
6. ✅ Fix issues and iterate
7. ✅ Submit to App Store Review for production

**You're all set to deploy CoParent Connect v1.1.0 to TestFlight!** 🚀
