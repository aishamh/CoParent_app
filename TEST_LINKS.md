# 🧪 Test Link File - CoParent Connect v1.1.0

## Direct Test Links

Anyone with these links can test specific features:

### SMS Feature Test
**Link:** `sms://` (opens Messages app)
**How to test:**
1. Open Safari on iPhone
2. Type: `sms://`
3. Should open Messages app
4. Works for verifying SMS integration is configured

### Deep Link Test  
**Link:** `coparent://test` (opens CoParent Connect app)
**How to test:**
1. Open Safari on iPhone
2. Type: `coparent://test`
3. Should open CoParent Connect app
4. Works for verifying deep linking is configured

### SMS to Specific Number
**Link:** `sms:+1234567890` (opens Messages with number)
**How to test:**
1. Replace `+1234567890` with your coparent's actual number
2. Should open Messages app with number pre-filled

---

## App Store TestFlight Link

After upload to TestFlight, you'll receive a TestFlight link that looks like:
```
https://testflight.apple.com/join/xxxxxxxxxxxxxxxxxxxxxxxxx
```

Share this link with testers. Anyone who taps it can:
1. Install TestFlight app (if not already installed)
2. Install CoParent Connect app
3. Test the new features

---

## What to Test in v1.1.0

### Core Features
- [ ] **SMS Feature**
  1. Navigate to Messages tab
  2. Tap "Text Coparent" button
  3. Enter phone number (e.g., +1 234 567 8901)
  4. Tap "Open SMS"
  5. ✅ Verify Messages app opens with correct number

- [ ] **URL Schemes**
  1. Open Safari and type: `coparent://test`
  2. ✅ Verify CoParent Connect opens
  3. Try: `sms://` and verify Messages app opens

- [ ] **Core App Functions**
  - [ ] Login/logout with biometrics (Face ID/Touch ID)
  - [ ] Send/receive messages
  - [ ] View calendar events
  - [ ] Add/view expenses
  - [ ] Upload and view documents
  - [ ] View and manage children info

- [ ] **Performance**
  - [ ] App launches in under 3 seconds
  - [ ] Smooth animations
  - [ ] No crashes on common actions

- [ ] **Push Notifications**
  - [ ] Receive notification alerts
  - [ ] Tap to open relevant screen
  - [ ] Badge shows unread count

---

## iOS Requirements

**Minimum iOS Version:** 12.0
**Required for SMS:** iOS 7.0+ (URL schemes work)
**Required for TestFlight:** iOS 13.0+ (recommended)

---

## Notes for Testers

1. **Download TestFlight:** Must have TestFlight app installed first
2. **iOS Version:** Check iOS version on device (Settings → General → About)
3. **Feedback:** Report any issues directly to you or via email
4. **Screenshots:** If you find issues, take screenshots for debugging

---

## Build Details

- **Version:** 1.1.0
- **Archive Size:** ~7.4 MB
- **Bundle ID:** com.coparent.connect
- **Deep Links:** coparent:// and sms://
- **Build Date:** March 15, 2026

