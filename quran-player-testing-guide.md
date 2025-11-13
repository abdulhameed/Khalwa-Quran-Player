# Quran MP3 Player - Testing Guide

## How to Test While Building with AI

This guide helps you verify that what Claude Code builds actually works. Test after each major feature is implemented.

---

## Testing Setup

### Required Tools
1. **Development Environment**
   - React Native CLI installed
   - Xcode (for iOS) or Android Studio (for Android)
   - iOS Simulator or Android Emulator running

2. **Testing Devices** (Recommended)
   - At least one physical device for audio/performance testing
   - Emulator/Simulator for quick UI checks

3. **Network Conditions** (For testing)
   - Good WiFi connection
   - Ability to toggle airplane mode
   - Mobile data (for testing cellular restrictions)

### How to Run the App
```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android

# If you need to clean and rebuild
cd ios && pod install && cd ..
npx react-native run-ios --reset-cache
```

---

## Phase-by-Phase Testing

### Phase 1: Project Setup (Week 1)

#### Test 1: App Launches
**What to test:**
- [ ] App opens without errors
- [ ] Splash screen appears (if implemented)
- [ ] Bottom navigation shows 4 tabs
- [ ] Can tap each tab and screen changes

**How to test:**
1. Run the app
2. Wait for it to load
3. Tap Home, Reciters, Library, Settings tabs
4. Check console for errors (red screen = problem)

**Expected result:** All tabs are visible and tappable, no crashes

**If it fails:**
Tell Claude Code: "The app crashes on launch" or "I see error: [copy exact error message]"

---

#### Test 2: Navigation Works
**What to test:**
- [ ] Bottom tabs switch screens
- [ ] Back button works (on stack navigation)
- [ ] Screen transitions are smooth

**How to test:**
1. Tap each tab multiple times
2. Navigate to detail screens (when available)
3. Use back button to return

**Expected result:** Smooth navigation, no freezing

**If it fails:**
Tell Claude Code: "Navigation freezes when I tap [specific tab]"

---

### Phase 2: Audio Playback (Week 2-3)

#### Test 3: Stream Audio from Source
**What to test:**
- [ ] Can select a surah
- [ ] Surah starts playing (you hear audio)
- [ ] Play/pause button works
- [ ] Audio continues playing

**How to test:**
1. Navigate to Reciters tab
2. Select a reciter (e.g., Abdul Basit)
3. Tap a surah (e.g., Al-Fatihah)
4. Wait for audio to start
5. Tap pause, then play again
6. Listen for at least 30 seconds

**Expected result:** Audio plays clearly, controls respond immediately

**If it fails:**
- "No audio plays" → Check if device volume is up, check console errors
- "Audio is choppy" → Network issue or buffering problem
- "Play button doesn't respond" → Tell Claude Code

**Common issues:**
- Permissions not requested (iOS needs audio background permission)
- Wrong audio URL format
- Network timeout

---

#### Test 4: Player Controls
**What to test:**
- [ ] Play/Pause works
- [ ] Next surah button works
- [ ] Previous surah button works
- [ ] Seek bar works (drag to different position)
- [ ] Time display updates (00:00 / 05:30 format)
- [ ] Playback speed changes audio speed

**How to test:**
1. Start playing a surah
2. Tap pause (audio stops), tap play (audio resumes)
3. Tap next (moves to next surah)
4. Tap previous (goes back)
5. Drag seek bar to middle of surah (audio jumps)
6. Change playback speed to 1.5x (audio plays faster)

**Expected result:** All controls work instantly, audio responds correctly

**If it fails:**
Tell Claude Code exactly which control doesn't work: "Next button doesn't move to next surah"

---

#### Test 5: Background Playback
**What to test:**
- [ ] Audio continues when app goes to background
- [ ] Audio continues when screen locks
- [ ] Lock screen shows controls
- [ ] Lock screen controls work (play/pause/next/previous)

**How to test:**
1. Start playing audio
2. Press home button (app goes to background)
3. Wait 10 seconds - audio should still play
4. Lock the device (press power button)
5. Wake device, see lock screen controls
6. Try pausing from lock screen

**Expected result:** Audio never stops, lock screen controls work

**If it fails:**
- "Audio stops when I background app" → Background permission issue
- "No lock screen controls" → Media session not configured
Tell Claude Code: "Background playback doesn't work"

---

#### Test 6: Repeat and Shuffle Modes
**What to test:**
- [ ] Repeat off: Plays through list once and stops
- [ ] Repeat one: Replays current surah infinitely
- [ ] Repeat all: Loops through all surahs
- [ ] Shuffle: Plays surahs in random order

**How to test:**
1. Enable repeat one, let surah finish (should restart same surah)
2. Enable repeat all, let playlist finish (should restart from first surah)
3. Enable shuffle, skip through several surahs (order should be random)

**Expected result:** Each mode behaves as described

**If it fails:**
Tell Claude Code: "Repeat one plays next surah instead of repeating"

---

### Phase 3: Basic UI (Week 3)

#### Test 7: Reciter List Display
**What to test:**
- [ ] Reciters list shows all reciters
- [ ] Reciter photos load
- [ ] Reciter names display (Arabic + English)
- [ ] Can scroll through list smoothly
- [ ] Can search reciters by name
- [ ] Tapping a reciter opens detail screen

**How to test:**
1. Go to Reciters tab
2. Scroll up and down (should be smooth, 60fps feel)
3. Check if photos load (if not, may be network issue)
4. Use search bar, type "Abdul"
5. Tap a reciter card

**Expected result:** Smooth scrolling, all data visible, search works

**If it fails:**
- "Photos don't load" → Check image URLs, check network
- "Scrolling is laggy" → Performance optimization needed
- "Search doesn't work" → Tell Claude Code

---

#### Test 8: Reciter Detail Screen
**What to test:**
- [ ] Reciter profile displays (photo, name, bio, style)
- [ ] Shows list of 114 surahs
- [ ] Surah names display (Arabic + transliteration)
- [ ] Can tap a surah to play
- [ ] Download icons show correct state

**How to test:**
1. Open any reciter's detail page
2. Read bio - is it showing correctly?
3. Scroll through surah list
4. Tap a surah (should start playing)
5. Check download icons (downloaded vs not downloaded)

**Expected result:** All information displays, tapping surah plays audio

**If it fails:**
Tell Claude Code: "Surah list doesn't show on reciter detail page"

---

#### Test 9: Home Screen (Continue Listening)
**What to test:**
- [ ] "Continue Listening" card appears after playing something
- [ ] Shows correct surah and reciter
- [ ] Shows correct playback position
- [ ] Tapping resumes at exact position

**How to test:**
1. Play a surah for 1-2 minutes
2. Close the app (force quit)
3. Reopen the app
4. Check Home screen for "Continue Listening" card
5. Tap the card (should resume from where you left off)

**Expected result:** Playback resumes at exact position you left

**If it fails:**
Tell Claude Code: "Continue listening doesn't resume at correct position"

---

### Phase 4: Source Integration (Week 4)

#### Test 10: Multiple Sources Work
**What to test:**
- [ ] Can switch source for a reciter
- [ ] Audio plays from selected source
- [ ] If one source fails, error message shows

**How to test:**
1. Go to a reciter's profile
2. Find source selector (dropdown or settings)
3. Switch from Source A to Source B
4. Play a surah (should stream from new source)
5. Try a source that might fail (intentionally break URL to test error handling)

**Expected result:** Can switch sources, audio plays correctly, errors show helpful messages

**If it fails:**
Tell Claude Code: "Source switching doesn't change the audio URL"

---

### Phase 5: Downloads (Week 5-6)

#### Test 11: Single Surah Download
**What to test:**
- [ ] Can tap download button on a surah
- [ ] Quality selection dialog appears
- [ ] Shows estimated file size
- [ ] Download starts and shows progress
- [ ] Notification shows download progress
- [ ] Download completes successfully
- [ ] Downloaded surah has checkmark/indicator
- [ ] Can play downloaded surah offline

**How to test:**
1. Find a short surah (e.g., Al-Fatihah)
2. Tap download icon
3. Select quality (Medium)
4. Watch progress bar fill
5. Wait for completion notification
6. Turn on airplane mode
7. Try playing the downloaded surah (should work offline)

**Expected result:** Download completes, surah plays offline

**If it fails:**
- "Download progress stuck at 0%" → Network issue or wrong URL
- "Download fails" → Check error message, tell Claude Code
- "Can't play offline" → File not saved correctly

---

#### Test 12: Download Queue
**What to test:**
- [ ] Can queue multiple downloads
- [ ] Downloads process in order
- [ ] Can pause a download
- [ ] Can resume a paused download
- [ ] Can cancel a download
- [ ] Failed downloads show retry option

**How to test:**
1. Queue 5 surahs for download
2. Watch them download (may be sequential or 3 concurrent)
3. Pause one download (should pause)
4. Resume it (should continue from where it stopped)
5. Cancel one download (should remove from queue)
6. If one fails, check retry button

**Expected result:** Full control over download queue, no crashes

**If it fails:**
Tell Claude Code: "Can't pause downloads" or "Queue doesn't show all downloads"

---

#### Test 13: Batch Download (By Juz)
**What to test:**
- [ ] Can select "Download by Juz"
- [ ] Shows list of 30 Juz
- [ ] Tapping a Juz shows surahs in that Juz
- [ ] Shows total size estimate
- [ ] Confirms before downloading
- [ ] All surahs in Juz get queued

**How to test:**
1. Go to reciter profile
2. Find "Download by Juz" button
3. Select Juz 30 (short surahs, fastest to test)
4. Check total size estimate (should be reasonable)
5. Confirm download
6. Check download queue (should have all surahs from Juz 30)

**Expected result:** All surahs in Juz are queued and download

**If it fails:**
Tell Claude Code: "Juz download only queues 1 surah instead of all"

---

#### Test 14: WiFi-Only Downloads
**What to test:**
- [ ] Setting to force WiFi-only is available
- [ ] When enabled on cellular, downloads don't start
- [ ] Warning message appears
- [ ] Downloads auto-start when WiFi connects
- [ ] Can override and download on cellular

**How to test:**
1. Turn off WiFi, use cellular data
2. Enable "WiFi only" in Settings
3. Try to download a surah
4. Should see warning: "Downloads will start when connected to WiFi"
5. Turn on WiFi
6. Downloads should auto-start

**Expected result:** Downloads respect WiFi preference

**If it fails:**
Tell Claude Code: "WiFi-only setting doesn't prevent cellular downloads"

---

### Phase 6: Library (Week 6)

#### Test 15: Downloaded Content Shows in Library
**What to test:**
- [ ] Library tab shows downloaded reciters
- [ ] Shows count of downloaded surahs per reciter
- [ ] Can navigate to downloaded surahs
- [ ] Only downloaded surahs appear (no streaming-only surahs)
- [ ] Can play all downloaded surahs offline

**How to test:**
1. Download surahs from 2-3 different reciters
2. Go to Library tab
3. Should see list of reciters with downloaded content
4. Tap a reciter, see only downloaded surahs
5. Turn on airplane mode, play surahs (should work)

**Expected result:** Library accurately reflects downloaded content

**If it fails:**
Tell Claude Code: "Library shows reciters I haven't downloaded from"

---

#### Test 16: Favorites
**What to test:**
- [ ] Can mark a surah as favorite (heart icon)
- [ ] Favorite icon toggles on/off
- [ ] Favorites section shows all favorited surahs
- [ ] Favorites persist after app restart
- [ ] Can unfavorite from favorites list

**How to test:**
1. Play a surah, tap favorite/heart icon
2. Go to Library → Favorites section
3. Should see the favorited surah
4. Close and reopen app
5. Favorites should still be there
6. Unfavorite (tap heart again), should remove from list

**Expected result:** Favorites work and persist

**If it fails:**
Tell Claude Code: "Favorites disappear after app restart"

---

#### Test 17: Recently Played
**What to test:**
- [ ] Recently played section shows last 10-20 surahs
- [ ] Shows surah name, reciter, timestamp
- [ ] Tapping an item resumes playback
- [ ] List updates when new surahs are played
- [ ] Most recent appears at top

**How to test:**
1. Play 5-10 different surahs
2. Go to Library → Recently Played (or Home screen)
3. Should see all played surahs in reverse chronological order
4. Tap one (should resume playback)

**Expected result:** Recently played is accurate and up-to-date

**If it fails:**
Tell Claude Code: "Recently played doesn't update when I play new surahs"

---

### Phase 7: Storage Management (Week 6-7)

#### Test 18: Storage Display
**What to test:**
- [ ] Settings shows total storage used
- [ ] Shows breakdown by reciter
- [ ] Shows device available storage
- [ ] Numbers are accurate

**How to test:**
1. Download several surahs from different reciters
2. Go to Settings → Storage Management
3. Check total storage (should match downloaded file sizes roughly)
4. Check breakdown per reciter
5. Use phone's storage settings to verify numbers are close

**Expected result:** Storage numbers are reasonably accurate

**If it fails:**
Tell Claude Code: "Storage display shows 0 MB even though I have downloads"

---

#### Test 19: Delete Downloaded Content
**What to test:**
- [ ] Can delete individual surah
- [ ] Can delete all surahs from a reciter
- [ ] Can delete all downloaded content
- [ ] Confirmation dialog appears before deletion
- [ ] Storage updates after deletion
- [ ] Deleted surahs can be re-downloaded

**How to test:**
1. Go to Storage Management or Library
2. Delete a single surah (should ask for confirmation)
3. Check storage (should decrease)
4. Delete all from a reciter (confirm, check storage)
5. Verify deleted surahs are gone from Library
6. Try re-downloading a deleted surah (should work)

**Expected result:** Deletion works correctly, no orphaned files

**If it fails:**
Tell Claude Code: "Deleted surahs still appear in Library" or "Storage doesn't update after deletion"

---

### Phase 8: Design & Polish (Week 7-8)

#### Test 20: Visual Design Check
**What to test:**
- [ ] Colors match theme (teal, gold, cream)
- [ ] Arabic text renders correctly
- [ ] Fonts are readable
- [ ] Icons are consistent
- [ ] Spacing and padding look good
- [ ] No UI elements overlap
- [ ] Dark mode works (if implemented)

**How to test:**
1. Go through every screen
2. Check colors against design spec
3. Read Arabic text (should be clear)
4. Check for UI glitches (overlapping text, cutoff content)
5. Test on small screen (iPhone SE) and large screen (iPad/Android tablet)

**Expected result:** App looks polished and professional

**If it fails:**
Take screenshots, tell Claude Code: "Text overlaps on Home screen" (attach screenshot)

---

#### Test 21: Animations & Interactions
**What to test:**
- [ ] Page transitions are smooth
- [ ] Button presses have feedback (scale animation)
- [ ] Progress bars animate smoothly
- [ ] List scrolling is 60fps
- [ ] Pull-to-refresh works
- [ ] Haptic feedback on taps (if implemented)

**How to test:**
1. Navigate between screens (should transition smoothly)
2. Tap buttons (should see/feel feedback)
3. Scroll lists fast (should remain smooth)
4. Drag seek bar (should be responsive)
5. Download something (progress should animate)

**Expected result:** Buttery smooth animations, no jank

**If it fails:**
Tell Claude Code: "Animations are choppy when scrolling reciter list"

---

### Phase 9-10: Settings & Final Features (Week 8)

#### Test 22: Settings Work
**What to test:**
- [ ] Can change audio quality (affects downloads and streaming)
- [ ] WiFi-only toggle works
- [ ] Auto-play next surah toggle works
- [ ] Theme selector changes app appearance
- [ ] Settings persist after app restart

**How to test:**
1. Go to Settings
2. Change each setting one by one
3. Verify behavior changes (e.g., change quality, start download, check file size)
4. Close and reopen app, settings should persist

**Expected result:** All settings work and are saved

**If it fails:**
Tell Claude Code: "Changing quality setting doesn't affect new downloads"

---

## Critical Pre-Launch Tests

### Test 23: Full User Journey (End-to-End)
**Simulate new user experience:**
1. [ ] Open app for first time (should see onboarding if implemented)
2. [ ] Browse reciters
3. [ ] Select a reciter, see profile
4. [ ] Play a surah (stream)
5. [ ] Download the surah
6. [ ] Turn off network, play offline
7. [ ] Add to favorites
8. [ ] Close app, reopen, continue listening
9. [ ] Download more surahs (test queue)
10. [ ] Check library, play downloaded content
11. [ ] Change settings, see effect
12. [ ] Delete some downloads, check storage

**Expected result:** Smooth experience with no crashes or confusion

---

### Test 24: Stress Testing
**Push the app to limits:**
- [ ] Download 50+ surahs (does it handle large library?)
- [ ] Play for 2+ hours continuously (memory leaks? crashes?)
- [ ] Rapid tapping (does UI freeze?)
- [ ] Fill device storage almost full (does app warn?)
- [ ] Switch between tabs quickly 20 times (crashes?)
- [ ] Background/foreground app 10 times during playback (audio continues?)

**Expected result:** App remains stable under stress

---

### Test 25: Error Scenarios
**Test failure cases:**
- [ ] No internet connection (should show appropriate message)
- [ ] Invalid source URL (should show error, suggest alternative)
- [ ] Download interrupted (can retry?)
- [ ] Corrupted downloaded file (error message, can re-download?)
- [ ] Device storage full (prevents download, shows warning)
- [ ] Audio file not found (error message is helpful)

**Expected result:** Graceful error handling, no crashes

---

## Platform-Specific Tests

### iOS-Specific
- [ ] Test on iPhone (SE, 12, 14, 15 models if possible)
- [ ] Test on iPad (UI should scale well)
- [ ] Test Control Center integration (can control from swipe-down menu)
- [ ] Test Siri integration (if implemented)
- [ ] Test CarPlay (if implemented)
- [ ] Permissions are requested properly (notifications, background audio)

### Android-Specific
- [ ] Test on multiple manufacturers (Samsung, Google Pixel, OnePlus, etc.)
- [ ] Test Android 8, 10, 12, 13, 14
- [ ] Test notification controls
- [ ] Test picture-in-picture (if applicable)
- [ ] Test back button behavior
- [ ] External storage permissions (Android 10+)
- [ ] Battery optimization whitelist (so downloads continue in background)

---

## How to Report Issues to Claude Code

### Good Bug Report Template:
```
**Issue:** [Brief description]
**Steps to reproduce:**
1. Step 1
2. Step 2
3. Step 3
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Device:** iOS/Android, version
**Screenshots/Error messages:** [If applicable]
```

### Example:
```
**Issue:** App crashes when deleting downloaded surah
**Steps to reproduce:**
1. Go to Library
2. Tap a reciter with downloaded surahs
3. Long-press a surah
4. Tap "Delete"
5. Confirm deletion
**Expected:** Surah is deleted, UI updates
**Actual:** App crashes immediately after confirmation
**Device:** iPhone 14, iOS 17.1
**Error message:** [paste console error if available]
```

---

## Testing Checklist Summary

Use this quick checklist before each development phase completion:

### Week 1-2: Foundation ✓
- [ ] App launches without crashing
- [ ] Navigation works
- [ ] Can select and play audio
- [ ] Basic UI displays correctly

### Week 3-4: Core Features ✓
- [ ] All player controls work
- [ ] Background playback works
- [ ] Lock screen controls work
- [ ] Streaming from multiple sources works
- [ ] Reciter browsing works

### Week 5-6: Downloads ✓
- [ ] Single download works
- [ ] Batch download works
- [ ] Download queue management works
- [ ] WiFi-only setting works
- [ ] Downloaded content plays offline
- [ ] Library displays correctly

### Week 7-8: Polish ✓
- [ ] Design looks beautiful
- [ ] Animations are smooth
- [ ] All settings work
- [ ] Storage management works
- [ ] Favorites and recently played work

### Week 9: Testing ✓
- [ ] Full user journey works end-to-end
- [ ] App handles errors gracefully
- [ ] Performance is good (no lag, no crashes)
- [ ] Works on iOS and Android
- [ ] Works on multiple devices

### Week 10: Launch Ready ✓
- [ ] Beta testers gave positive feedback
- [ ] All critical bugs fixed
- [ ] App store assets prepared
- [ ] Privacy policy written
- [ ] Ready to submit!

---

## Tips for Efficient Testing

1. **Test incrementally**: Don't wait for everything to be built
2. **Test the happy path first**: Make sure basic functionality works
3. **Then test edge cases**: Break things on purpose
4. **Use real devices**: Emulators don't catch all issues (especially audio, performance)
5. **Test offline**: Toggle airplane mode frequently
6. **Test with poor network**: Use network link conditioner or throttling
7. **Keep Claude Code in the loop**: Report issues immediately with details
8. **Celebrate small wins**: Each working feature is progress!

---

**Remember:** AI can build fast, but you're the QA. Your testing ensures quality. Don't skip it!
