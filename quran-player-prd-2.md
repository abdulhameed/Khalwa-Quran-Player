# Quran MP3 Player - Product Requirements Document (PRD)

## 1. Product Overview

### 1.1 Vision
A beautiful, simple, and lovable mobile app that allows Muslims worldwide to listen to Quran recitations with seamless streaming and offline playback capabilities. The app prioritizes ease of use with an elegant Islamic aesthetic.

### 1.2 Product Type
Simple, Lovable, and Complete (SLC) - Not an MVP

### 1.3 Target Users
- Muslims who want to listen to Quran recitations
- People who memorize Quran and need to hear different reciters
- Users who commute and want offline access
- Users across different age groups and technical abilities

### 1.4 Core Value Proposition
Easy-to-use Quran audio player with multiple sources and reciters, flexible download options, and beautiful Islamic design that works seamlessly online and offline.

---

## 2. Technical Stack

### 2.1 Platform
- **Framework**: React Native
- **Platforms**: iOS and Android (simultaneous release)
- **Minimum Versions**: 
  - iOS 13.0+
  - Android 8.0+ (API Level 26)

### 2.2 Key Dependencies (Recommended)
- **Audio Playback**: `react-native-track-player` (background audio, lock screen controls)
- **Storage**: `@react-native-async-storage/async-storage` (metadata), Native file system for audio
- **Downloads**: `react-native-fs` or `rn-fetch-blob`
- **Navigation**: `@react-navigation/native` (stack + bottom tabs)
- **State Management**: React Context API or Zustand (keep it simple)
- **UI Components**: React Native Paper or Native Base (customized for Islamic aesthetic)
- **Network Detection**: `@react-native-community/netinfo`
- **Animations**: `react-native-reanimated`

---

## 3. Features & Specifications

### 3.1 Audio Player (Core Feature)

#### 3.1.1 Player UI
**Main Player Screen:**
- **Surah name** displayed prominently at top (Arabic + transliteration)
- Reciter name below surah name
- **Minimalist controls** centered
- Progress bar showing current position and total duration
- Visual feedback for play/pause state
- Clean, uncluttered interface with calming colors

**Control Buttons:**
- Play/Pause (large, centered)
- Previous Surah
- Next Surah  
- Playback speed (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- Repeat mode (repeat all, repeat one, no repeat)
- Shuffle toggle
- Download button (if not downloaded)
- Add to favorites

**Additional UI Elements:**
- Current time / Total duration
- Seekable progress bar
- Volume control (use system volume)
- Source indicator (small badge showing which source is active)

#### 3.1.2 Playback Features
**Core Playback:**
- Stream audio from source or play from local storage
- Background playback when app is backgrounded or screen is locked
- Continue playback across surah boundaries
- Gapless playback between surahs (if technically feasible)

**Playback Modes:**
- Sequential play (1-114 in order)
- Repeat current surah
- Repeat all surahs
- Shuffle mode (random order)

**Speed Control:**
- Variable playback speed: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- Speed persists per session

**Lock Screen & Notifications:**
- Standard media controls on lock screen
- Show surah name, reciter name, and source
- Playback controls: previous, play/pause, next
- Album art: Use app logo or Islamic geometric pattern

#### 3.1.3 Resume & State Management
- **Resume playback**: App remembers last played surah, reciter, position
- On app reopen: Show "Continue listening" prompt
- State persists across app restarts

---

### 3.2 Audio Sources

#### 3.2.1 Supported Sources (v1.0)
1. **EveryAyah.com** - `https://everyayah.com`
2. **MP3Quran.net** - `https://mp3quran.net`
3. **Quran.com** - `https://quran.com`
4. **QuranicAudio.com** - `https://quranicaudio.com`
5. **Assabile.com** - `https://assabile.com`

#### 3.2.2 Source Management
**Per-Reciter Source Selection:**
- Each reciter can have audio from one or more sources
- User can switch source per reciter in reciter profile
- Example: User selects "Abdul Basit" → sees available sources → chooses MP3Quran.net

**Source Discovery:**
- App maintains a database/config of reciters and their available sources
- Source URLs are stored in app config (can be updated via remote config in future)

**Fallback Logic:**
- If a source fails (404, timeout), show error and suggest alternative source
- Do not auto-switch sources without user consent

#### 3.2.3 Quality Options
**Audio Quality Levels:**
- **Low**: 32-40 kbps (for limited data)
- **Medium**: 64 kbps (balanced)
- **High**: 128 kbps (best quality)

**Quality Selection:**
- User sets preferred quality in Settings
- Can be overridden per download
- Quality choice applies to both streaming and downloads

---

### 3.3 Reciters

#### 3.3.1 Reciter Database
**Initial Launch:** 50+ reciters

**Selection Criteria:**
- Most popular globally (e.g., Abdul Basit, Mishary Alafasy, Sudais, Minshawi)
- Different recitation styles:
  - **Murattal** (slow, measured recitation for learning)
  - **Mujawwad** (melodious, slower with tajweed rules)
  - **Hafs** (most common transmission)
  - **Warsh** (North African tradition)
- Regional preferences (Middle East, South Asia, North Africa, etc.)

**Reciter Profiles:**
Each reciter has:
- **Name** (Arabic + English transliteration)
- **Photo** (square, high-res)
- **Short bio** (2-3 sentences, country of origin, style)
- **Recitation style** (Murattal, Mujawwad, etc.)
- **Available sources** (list of sources that have this reciter)
- **Number of downloads** (optional, shows popularity)

#### 3.3.2 Reciter Discovery
**Browse Reciters:**
- List view with reciter photo, name, and style
- Search by name
- Filter by style (Murattal, Mujawwad, etc.)
- Sort by: Name (A-Z), Most Popular, Recently Added

**Reciter Detail Page:**
- Full profile information
- List of all 114 surahs
- Download status indicator for each surah
- "Download All" button
- Source selector dropdown

---

### 3.4 Download System

#### 3.4.1 Download Options
**Three Download Modes:**

1. **Per Surah (Individual)**
   - User selects a single surah to download
   - Example: Download only Al-Baqarah from Abdul Basit

2. **Batch Download (Multiple Selection)**
   - **By Juz**: Download all surahs in a specific Juz (1-30)
   - **User Selection**: User checks multiple surahs, then downloads all at once
   - Example: Select surahs 67-114 (short surahs for easy listening)

3. **Full Quran**
   - Downloads all 114 surahs for selected reciter
   - Shows total size estimate before downloading
   - Confirms with user before proceeding

#### 3.4.2 Download Queue
**Queue Management:**
- Multiple downloads can be queued
- Queue shows:
  - Surah name
  - Reciter name
  - File size
  - Download progress (%)
  - Status: Queued, Downloading, Paused, Completed, Failed
- User can:
  - Pause individual downloads
  - Resume paused downloads
  - Cancel downloads
  - Retry failed downloads
  - Reorder queue (optional for v1)

**Concurrent Downloads:**
- Allow 3-5 concurrent downloads max (to avoid overwhelming device)
- Remaining downloads stay in queue

#### 3.4.3 WiFi-Only Option
**Settings Toggle:**
- "Download on WiFi only" option in Settings
- Default: Enabled (ON)
- If enabled and user tries to download on cellular:
  - Show warning: "Downloads are queued. They will start when connected to WiFi."
  - Downloads remain in queue until WiFi connection detected

**User Override:**
- Allow one-time override: "Download anyway on cellular data"
- Warning shows estimated data usage

#### 3.4.4 Storage Management
**Storage Display:**
- Settings screen shows:
  - Total storage used by app
  - Breakdown by reciter (e.g., "Abdul Basit: 450 MB, 67 surahs")
  - Available device storage
- Detailed storage view:
  - List reciters and their downloaded surahs
  - Size per reciter
  - Option to delete per reciter or per surah

**Manual Management:**
- User can delete:
  - Individual surahs
  - All surahs from a reciter
  - All downloaded content
- Confirmation dialog before deletion
- No automatic deletion

**Storage Warnings:**
- Warn if device storage < 500 MB
- Warn before downloading if download size > available storage

#### 3.4.5 Download UX
**Before Download:**
- Show estimated file size
- Show estimated time (based on connection speed)
- Quality selection option

**During Download:**
- Progress bar with percentage
- Ability to pause/resume
- Ability to cancel
- Background download (continues when app is backgrounded)
- Notification showing download progress

**After Download:**
- Success notification
- Downloaded badge/icon on surah
- Ability to play offline

---

### 3.5 Navigation & Discovery

#### 3.5.1 App Structure
**Bottom Tab Navigation (4 tabs):**

1. **Home** (or "Player")
   - Currently playing or "Continue Listening"
   - Quick access to recently played
   - Featured reciters

2. **Reciters**
   - Browse all reciters
   - Search and filter

3. **Library**
   - Downloaded content organized by reciter
   - Favorites
   - Recently played

4. **Settings**
   - Audio quality
   - Download preferences
   - Storage management
   - About & support

#### 3.5.2 Finding Surahs
**Surah Browsing (within a reciter):**
- **Numbered list (1-114)**: Default view, shows surah number, name (Arabic + transliteration), download status
- **Search**: Search by surah name (Arabic or English), number
- **Filter by length**: 
  - Short (< 2 min)
  - Medium (2-10 min)
  - Long (> 10 min)
- **Favorites**: Mark surahs as favorites, quick filter to show only favorites

**Surah List Item:**
- Surah number
- Surah name (Arabic)
- Transliteration
- Duration
- Download status icon (downloaded, not downloaded, downloading)
- Favorite icon (heart)

#### 3.5.3 Multiple Reciters Workflow
**Scenario:** User has downloaded Al-Baqarah from 3 reciters

**UI Flow:**
1. User goes to **Library** tab
2. Sees list of reciters with downloaded content
3. Clicks on a reciter (e.g., "Abdul Basit")
4. Sees list of downloaded surahs under that reciter
5. Clicks on Al-Baqarah → plays from Abdul Basit

**Alternative Flow:**
- User searches "Al-Baqarah" in search bar
- Results show: Al-Baqarah from Abdul Basit, Al-Baqarah from Mishary, Al-Baqarah from Sudais
- User selects which one to play

#### 3.5.4 Recently Played
**Recently Played Section:**
- Shows last 10-20 played items
- Displays:
  - Surah name
  - Reciter name
  - Timestamp (e.g., "2 hours ago", "Yesterday")
- Tap to resume playback

**Location:**
- Home screen (top section)
- Library tab (dedicated section)

#### 3.5.5 Continue Listening
**Resume Behavior:**
- On app open, if user was previously listening:
  - Show "Continue Listening" card on Home screen
  - Displays: Surah name, reciter, last position
  - Tap to resume exactly where left off
- State persists across app restarts

---

### 3.6 The "Lovable" Elements

#### 3.6.1 Beautiful Design
**Visual Style:**
- **Elegant Islamic Aesthetic**:
  - Subtle Islamic geometric patterns (not overwhelming)
  - Crescent moon and star motifs (tasteful, not cliché)
  - Arabic calligraphy elements (surah names, headings)
- **Modern Minimalist**:
  - Clean lines and ample white space
  - Card-based UI
  - Clear hierarchy
- **Calming Color Palette**:
  - Primary: Deep teal or emerald green (#006B5E, #00897B)
  - Secondary: Soft gold/amber (#F9A825)
  - Background: Off-white or soft cream (#FAFAFA)
  - Text: Dark gray (#212121) for readability
  - Accent: Muted blue for links/actions

**Typography:**
- Arabic: Use system Arabic font (SF Arabic on iOS, Noto Naskh Arabic on Android)
- English: Clean sans-serif (SF Pro on iOS, Roboto on Android)
- Clear size hierarchy

**Icons:**
- Custom Islamic-themed icons where appropriate
- Consistent icon set (e.g., Feather Icons or Material Icons)

#### 3.6.2 Delightful Interactions
**Smooth Animations:**
- Page transitions: Smooth slide animations
- Player controls: Subtle scale/fade effects on tap
- Progress bar: Smooth dragging with haptic feedback
- Download progress: Smooth circular progress indicators
- List items: Gentle fade-in on scroll

**Micro-interactions:**
- Button press feedback (scale down slightly)
- Toggle switches with smooth animation
- Pull-to-refresh with custom loading indicator
- Swipe gestures where intuitive (e.g., swipe to delete in library)

**Haptic Feedback:**
- Light haptic on button taps
- Medium haptic on important actions (download start, favorite toggle)
- Subtle haptic on seek bar drag

#### 3.6.3 Unique Feature: Extreme Ease of Use
**Key Differentiators:**

1. **One-Tap Access**:
   - From any screen, floating "Play" button shows last played
   - Resume listening with single tap

2. **Smart Defaults**:
   - App suggests popular reciters on first launch
   - Pre-selects optimal quality based on connection
   - WiFi-only downloads enabled by default

3. **Minimal Steps to Play**:
   - New user flow: Select reciter → Select surah → Play (3 taps)
   - Returning user: Open app → Tap continue (1 tap)

4. **Intuitive Discovery**:
   - Reciter profiles make it easy to explore
   - Clear visual indicators for downloaded content
   - No confusing menus or hidden features

5. **Forgiving UX**:
   - Undo option for deletions
   - Confirmation dialogs for destructive actions
   - Clear error messages with solutions

6. **Onboarding**:
   - Optional 3-step onboarding highlighting key features
   - Can be skipped
   - Never shown again after first launch

---

## 4. Data Models

### 4.1 Reciter
```javascript
{
  id: string (unique identifier),
  nameArabic: string,
  nameEnglish: string,
  photo: string (URL or local asset),
  bio: string,
  style: string (Murattal, Mujawwad, etc.),
  country: string,
  sources: [
    {
      sourceId: string (e.g., "mp3quran"),
      sourceName: string (e.g., "MP3Quran.net"),
      baseUrl: string,
      qualities: ["low", "medium", "high"]
    }
  ]
}
```

### 4.2 Surah
```javascript
{
  id: number (1-114),
  nameArabic: string,
  nameEnglish: string,
  transliteration: string,
  revelationPlace: string (Makkah or Madinah),
  numberOfAyahs: number,
  duration: number (in seconds, may vary by reciter)
}
```

### 4.3 Download
```javascript
{
  id: string (unique identifier),
  reciterId: string,
  surahId: number,
  sourceId: string,
  quality: string (low, medium, high),
  fileSize: number (bytes),
  localPath: string (where file is saved),
  downloadedAt: timestamp,
  status: string (queued, downloading, completed, failed, paused)
}
```

### 4.4 Playback State
```javascript
{
  currentReciterId: string,
  currentSurahId: number,
  currentPosition: number (seconds),
  playbackSpeed: number (0.5 to 2.0),
  repeatMode: string (off, one, all),
  shuffleMode: boolean,
  lastPlayedAt: timestamp
}
```

### 4.5 User Preferences
```javascript
{
  defaultQuality: string (low, medium, high),
  wifiOnlyDownloads: boolean,
  autoPlay: boolean (continue to next surah),
  theme: string (light, dark, auto),
  language: string (for UI, future feature)
}
```

---

## 5. User Flows

### 5.1 First-Time User Flow
1. **Launch app** → Splash screen with app logo
2. **Onboarding** (optional, can skip):
   - Screen 1: "Listen to Beautiful Quran Recitations"
   - Screen 2: "Download for Offline Listening"
   - Screen 3: "Choose from 50+ Reciters"
3. **Home screen** → Empty state with "Browse Reciters" CTA
4. **Tap "Browse Reciters"** → Reciters tab
5. **Select a reciter** → Reciter profile with surah list
6. **Tap a surah** → Starts streaming (if online) or prompts to download
7. **Playing** → Player UI appears at bottom of screen

### 5.2 Streaming a Surah
1. User selects a surah (not downloaded)
2. If online: Starts streaming immediately, shows loading indicator briefly
3. Player UI appears
4. If offline: Shows message "This surah is not downloaded. Please download to listen offline."

### 5.3 Downloading a Surah
1. User navigates to reciter profile
2. Taps download icon next to surah
3. **Download options dialog**:
   - Quality selection (Low, Medium, High)
   - Estimated size shown
   - "Download" button
4. Download starts, progress shown in notification and in-app
5. On completion: Success notification, download icon changes to checkmark

### 5.4 Batch Download (By Juz)
1. User navigates to reciter profile
2. Taps "Download by Juz" option (menu or button)
3. Selects Juz (1-30) from list
4. Shows list of surahs in that Juz with total size
5. Confirms download
6. All surahs queued and downloaded sequentially

### 5.5 Playing Downloaded Content Offline
1. User opens app (offline)
2. Navigates to Library tab
3. Sees only downloaded reciters and surahs
4. Selects reciter → surah
5. Plays from local storage

### 5.6 Resume Listening
1. User opens app (was previously listening)
2. Home screen shows "Continue Listening" card
3. Card displays: Surah name, reciter, "Resume from 2:34"
4. User taps card → Resumes playback at exact position

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **App launch**: < 2 seconds on mid-range devices
- **Audio playback start**: < 1 second for streaming, < 0.5 seconds for local files
- **List scrolling**: 60 FPS, smooth scrolling even with 100+ items
- **Download speed**: Should utilize available bandwidth without throttling other apps

### 6.2 Reliability
- **Offline support**: All core features work offline with downloaded content
- **Error handling**: Graceful degradation, no crashes
- **Network resilience**: Handle poor connections, timeouts gracefully
- **Data persistence**: No data loss on app crash or force quit

### 6.3 Usability
- **Accessibility**: Support screen readers, dynamic font sizes, high contrast mode
- **Localization**: Initially English and Arabic (UI text), expandable to more languages
- **Intuitive**: New users can play audio within 30 seconds of opening app

### 6.4 Storage
- **Efficient storage**: Use compressed audio formats, no redundant files
- **Cache management**: Stream cache cleaned periodically to free space
- **SD card support (Android)**: Allow downloads to external storage

### 6.5 Battery & Data
- **Battery efficient**: Background playback should not drain battery excessively
- **Data conscious**: Show data usage warnings, provide quality options
- **Cellular data**: Respect user's cellular data preferences

---

## 7. Technical Architecture

### 7.1 App Structure
```
/src
  /components
    /common
      - Button.js
      - Card.js
      - LoadingIndicator.js
    /player
      - PlayerControls.js
      - ProgressBar.js
      - PlaybackSpeedControl.js
    /reciter
      - ReciterCard.js
      - ReciterProfile.js
    /surah
      - SurahListItem.js
  /screens
    - HomeScreen.js
    - RecitersScreen.js
    - LibraryScreen.js
    - SettingsScreen.js
    - ReciterDetailScreen.js
    - PlayerScreen.js
  /services
    - AudioService.js (playback logic)
    - DownloadService.js (download management)
    - StorageService.js (file management)
    - ApiService.js (fetch from sources)
  /store
    - PlayerContext.js
    - DownloadContext.js
    - SettingsContext.js
  /utils
    - formatters.js (time, file size)
    - constants.js (colors, dimensions)
  /assets
    /images
    /fonts
  /data
    - reciters.json (initial reciter database)
    - surahs.json (114 surahs metadata)
```

### 7.2 Data Storage
- **AsyncStorage**: User preferences, playback state, favorites
- **File System**: Downloaded audio files (organized by reciter/surah)
- **SQLite (optional)**: For complex queries if needed, otherwise use JSON + AsyncStorage

### 7.3 Audio Playback
- **react-native-track-player**:
  - Handles streaming and local playback
  - Background audio
  - Lock screen controls
  - Notifications
  - Playback queue

### 7.4 Download Management
- **Strategy**: 
  - Use rn-fetch-blob or react-native-fs for downloading
  - Save files to document directory
  - Organize: `/reciters/{reciterId}/{surahId}.mp3`
  - Metadata stored in AsyncStorage

### 7.5 Source API Integration
- **Approach**:
  - Each source has different URL patterns
  - Create source adapters/configs
  - Example: `https://everyayah.com/data/{reciter}/{surah}{ayah}.mp3`
  - Store URL patterns in config, interpolate with reciter/surah IDs

### 7.6 Error Handling
- **Network errors**: Retry logic (3 attempts), then show error
- **Download failures**: Store in failed queue, allow manual retry
- **Audio playback errors**: Fallback to error state, suggest re-download
- **Storage full**: Warn user, prevent new downloads

---

## 8. Future Considerations (Post v1.0)

### 8.1 Phase 2 Features
- **Playlists**: User-created playlists of favorite surahs across reciters
- **Sleep timer**: Auto-stop after X minutes
- **Bookmarks**: Save specific ayah positions
- **Translation display**: Show translation while listening (requires text data)
- **Visualizer**: Audio waveform or spectrum visualizer

### 8.2 Phase 3 Features
- **Social sharing**: Share favorite reciters/surahs
- **Cloud sync**: Sync favorites and progress across devices
- **Recommendations**: Suggest reciters based on listening history
- **Offline-first sync**: Periodically update reciter database and sources

### 8.3 Monetization (If Applicable)
- **Free tier**: Full access, ad-supported (banner ads in non-player screens)
- **Premium**: Remove ads, higher quality audio, exclusive reciters
- **Donations**: In-app donation option to support development

---

## 9. Success Metrics (For Evaluation)

### 9.1 Usability Metrics
- Time to first play (from app open to audio playing)
- Download completion rate
- Daily/monthly active users
- Retention rate (Day 1, Day 7, Day 30)

### 9.2 Engagement Metrics
- Average session duration
- Number of surahs played per session
- Download vs stream ratio
- Most popular reciters and surahs

### 9.3 Technical Metrics
- Crash-free rate (target: > 99%)
- Average app launch time
- Audio playback start time
- Download success rate

---

## 10. Development Phases

### 10.1 Phase 1: Core MVP (Weeks 1-4)
- Basic UI setup (navigation, screens)
- Audio playback (stream and local)
- Reciter database (10 reciters to start)
- Single source integration (e.g., everyayah.com)
- Basic download (per surah only)

### 10.2 Phase 2: Download & Library (Weeks 5-6)
- Download queue and management
- Batch downloads (by Juz, multiple selection)
- Library screen with downloaded content
- Storage management

### 10.3 Phase 3: Polish & Lovable (Weeks 7-8)
- Full design implementation (colors, animations)
- Multiple source support
- 50+ reciters added
- Reciter profiles
- Recently played, favorites, continue listening

### 10.4 Phase 4: Testing & Launch (Weeks 9-10)
- Comprehensive testing (iOS & Android)
- Performance optimization
- Bug fixes
- App store preparation (screenshots, descriptions)
- Beta testing (TestFlight, Google Play Internal Testing)
- Launch

---

## 11. Open Questions & Decisions Needed

### 11.1 Reciter Database
- **Decision**: Maintain static JSON file or use remote database?
  - **Recommendation**: Start with static JSON, plan for remote config in Phase 2

### 11.2 Source URL Patterns
- **Decision**: Hardcode URL patterns or fetch from API?
  - **Recommendation**: Hardcode initially, add remote config later for flexibility

### 11.3 Audio Format
- **Decision**: MP3 only or support multiple formats (AAC, OGG)?
  - **Recommendation**: MP3 only for v1.0 (universal compatibility)

### 11.4 Localization
- **Decision**: English + Arabic UI from day 1, or English only first?
  - **Recommendation**: English + Arabic from start (target audience)

### 11.5 Analytics
- **Decision**: Include analytics from start?
  - **Recommendation**: Yes, use Firebase Analytics (privacy-friendly, no PII)

---

## 12. Appendix

### 12.1 Surah List (Reference)
```
1. Al-Fatihah (The Opening)
2. Al-Baqarah (The Cow)
3. Aali Imran (The Family of Imran)
... (full list of 114 surahs)
114. An-Nas (Mankind)
```

### 12.2 Juz Divisions
```
Juz 1: Surahs 1-2 (partial)
Juz 2: Surah 2 (partial)
... (30 Juz total)
```

### 12.3 Example Source URL Patterns
```
EveryAyah.com:
https://everyayah.com/data/{reciter_code}/{surah_padded}{ayah_padded}.mp3
Example: https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/001001.mp3

MP3Quran.net:
https://server{X}.mp3quran.net/{reciter_code}/{surah_padded}.mp3
Example: https://server8.mp3quran.net/basit/001.mp3
```

---

## 13. Development Checklist

### 13.1 Phase 1: Project Setup & Core Infrastructure
**Week 1: Project Initialization**
- [ ] Initialize React Native project with TypeScript
- [ ] Set up project structure (folders: components, screens, services, utils, assets)
- [ ] Install and configure essential dependencies:
  - [ ] React Navigation (Stack + Bottom Tabs)
  - [ ] react-native-track-player
  - [ ] @react-native-async-storage/async-storage
  - [ ] react-native-fs or rn-fetch-blob
  - [ ] @react-native-community/netinfo
  - [ ] react-native-reanimated
- [ ] Configure iOS project (Xcode, permissions)
- [ ] Configure Android project (Gradle, permissions)
- [ ] Set up basic navigation structure (4 bottom tabs)
- [ ] Create color constants and theme configuration
- [ ] Add app icons and splash screen

**Week 2: Data & Services Foundation**
- [ ] Create surahs.json data file (114 surahs with metadata)
- [ ] Create reciters.json data file (initial 10 reciters)
- [ ] Implement StorageService.js:
  - [ ] AsyncStorage wrapper functions
  - [ ] File system operations
  - [ ] Directory structure setup
- [ ] Implement data models/types:
  - [ ] Reciter type
  - [ ] Surah type
  - [ ] Download type
  - [ ] PlaybackState type
  - [ ] UserPreferences type
- [ ] Create Context providers:
  - [ ] PlayerContext (playback state)
  - [ ] SettingsContext (user preferences)

### 13.2 Phase 2: Audio Playback Core
**Week 2-3: Player Implementation**
- [ ] Configure react-native-track-player:
  - [ ] Set up service
  - [ ] Configure capabilities
  - [ ] Set up notification/lock screen controls
- [ ] Implement AudioService.js:
  - [ ] Play/pause functionality
  - [ ] Stream from URL
  - [ ] Play from local file
  - [ ] Next/previous track
  - [ ] Seek functionality
  - [ ] Playback speed control
  - [ ] Repeat modes (off, one, all)
  - [ ] Shuffle mode
  - [ ] Background playback
- [ ] Create Player UI components:
  - [ ] PlayerControls.js (play/pause, next/prev buttons)
  - [ ] ProgressBar.js (seekable progress bar)
  - [ ] PlaybackSpeedControl.js (speed selector)
  - [ ] RepeatModeButton.js
  - [ ] ShuffleButton.js
- [ ] Create PlayerScreen.js:
  - [ ] Display surah name (Arabic + transliteration)
  - [ ] Display reciter name
  - [ ] Show all player controls
  - [ ] Current time / total duration
  - [ ] Download button (if not downloaded)
  - [ ] Favorite button
- [ ] Implement playback state persistence:
  - [ ] Save current surah, reciter, position
  - [ ] Load state on app start
  - [ ] Resume functionality

### 13.3 Phase 3: Basic UI & Navigation
**Week 3: Screen Development**
- [ ] Create HomeScreen.js:
  - [ ] "Continue Listening" card
  - [ ] Recently played section (placeholder)
  - [ ] Quick access to featured reciters
- [ ] Create RecitersScreen.js:
  - [ ] List view of reciters
  - [ ] ReciterCard.js component (photo, name, style)
  - [ ] Search functionality
  - [ ] Navigation to reciter detail
- [ ] Create ReciterDetailScreen.js:
  - [ ] Reciter profile header (photo, name, bio, style)
  - [ ] List of 114 surahs
  - [ ] SurahListItem.js component
  - [ ] Download status indicators
  - [ ] Navigation to player on tap
- [ ] Create LibraryScreen.js (basic structure):
  - [ ] Empty state message
  - [ ] Placeholder for downloaded content
- [ ] Create SettingsScreen.js (basic structure):
  - [ ] Quality selection
  - [ ] WiFi-only toggle
  - [ ] About section

### 13.4 Phase 4: Source Integration & Streaming
**Week 4: API Integration**
- [ ] Create source configuration system:
  - [ ] Define source adapters for each website
  - [ ] EveryAyah.com URL pattern
  - [ ] MP3Quran.net URL pattern
  - [ ] Quran.com URL pattern
  - [ ] QuranicAudio.com URL pattern
  - [ ] Assabile.com URL pattern
- [ ] Implement ApiService.js:
  - [ ] Build URL for reciter + surah + source
  - [ ] Validate URL format
  - [ ] Test connectivity to sources
  - [ ] Error handling for failed requests
- [ ] Integrate streaming:
  - [ ] Pass source URL to AudioService
  - [ ] Handle loading states
  - [ ] Handle network errors
  - [ ] Fallback to alternative sources
- [ ] Test streaming with multiple reciters and sources
- [ ] Add network status detection:
  - [ ] Show offline indicator
  - [ ] Disable streaming when offline
  - [ ] Enable when online

### 13.5 Phase 5: Download System
**Week 5: Basic Downloads**
- [ ] Implement DownloadService.js:
  - [ ] Download single file function
  - [ ] Save to organized directory structure
  - [ ] Progress tracking
  - [ ] Download queue management
  - [ ] Pause/resume functionality
  - [ ] Cancel download
  - [ ] Retry failed downloads
- [ ] Create DownloadContext:
  - [ ] Manage download queue state
  - [ ] Track download progress
  - [ ] Store download metadata
- [ ] Implement per-surah download:
  - [ ] Download button in SurahListItem
  - [ ] Quality selection dialog
  - [ ] Show estimated file size
  - [ ] Progress indicator
  - [ ] Success notification
- [ ] Update UI to show download status:
  - [ ] Downloaded icon
  - [ ] Downloading progress
  - [ ] Queued indicator
  - [ ] Failed state with retry

**Week 5-6: Advanced Downloads**
- [ ] Implement batch downloads:
  - [ ] "Download by Juz" feature
  - [ ] Create Juz selector UI
  - [ ] Show surahs in selected Juz
  - [ ] Queue all surahs in Juz
  - [ ] Multi-select surahs UI (checkboxes)
  - [ ] "Download Selected" button
- [ ] Implement "Download All" (full Quran):
  - [ ] Button in reciter profile
  - [ ] Confirmation dialog with total size
  - [ ] Queue all 114 surahs
- [ ] Implement download queue UI:
  - [ ] Queue screen/modal
  - [ ] Show all queued/downloading items
  - [ ] Pause/resume individual downloads
  - [ ] Cancel downloads
  - [ ] Retry failed downloads
- [ ] WiFi-only download logic:
  - [ ] Check network type before download
  - [ ] Queue downloads if on cellular
  - [ ] Auto-start when WiFi detected
  - [ ] Override option for user
- [ ] Background download support:
  - [ ] Continue downloads when app backgrounded
  - [ ] Show notification with progress
  - [ ] Handle app termination gracefully

### 13.6 Phase 6: Library & Downloaded Content
**Week 6: Library Implementation**
- [ ] Update LibraryScreen.js:
  - [ ] List downloaded reciters
  - [ ] Show download count per reciter
  - [ ] Navigate to reciter's downloaded surahs
- [ ] Create downloaded surahs view:
  - [ ] Filter to show only downloaded surahs
  - [ ] Play from local storage
  - [ ] Delete individual surahs
- [ ] Implement favorites:
  - [ ] Add/remove favorite functionality
  - [ ] Favorite icon in SurahListItem
  - [ ] Favorites section in Library
  - [ ] Persist favorites in AsyncStorage
- [ ] Implement recently played:
  - [ ] Track play history
  - [ ] Show last 10-20 items
  - [ ] Display in Home screen
  - [ ] Tap to resume
- [ ] Implement "Continue Listening":
  - [ ] Load last playback state
  - [ ] Show card on Home screen
  - [ ] Display surah, reciter, position
  - [ ] One-tap resume

### 13.7 Phase 7: Storage Management
**Week 6-7: Storage Features**
- [ ] Implement storage calculation:
  - [ ] Calculate total app storage usage
  - [ ] Calculate storage per reciter
  - [ ] Get device available storage
- [ ] Create storage management UI:
  - [ ] Storage overview in Settings
  - [ ] Breakdown by reciter
  - [ ] Detailed view with delete options
- [ ] Implement delete functionality:
  - [ ] Delete individual surah
  - [ ] Delete all from reciter
  - [ ] Delete all downloaded content
  - [ ] Confirmation dialogs
  - [ ] Update UI after deletion
- [ ] Storage warnings:
  - [ ] Warn if device storage < 500 MB
  - [ ] Warn before large downloads
  - [ ] Prevent download if insufficient space
- [ ] Cache management:
  - [ ] Clear streaming cache
  - [ ] Auto-cleanup old cache files

### 13.8 Phase 8: Reciter Database Expansion
**Week 7: Content Addition**
- [ ] Expand reciters.json to 50+ reciters:
  - [ ] Research popular reciters globally
  - [ ] Include different styles (Murattal, Mujawwad)
  - [ ] Include regional preferences
  - [ ] Gather reciter photos (high-res, square)
  - [ ] Write short bios for each
  - [ ] Identify available sources per reciter
- [ ] Implement reciter profiles:
  - [ ] Full profile page with photo, bio, style
  - [ ] List available sources
  - [ ] Source selector dropdown
  - [ ] Persist selected source per reciter
- [ ] Add reciter filtering:
  - [ ] Filter by style
  - [ ] Filter by region (optional)
  - [ ] Sort by name, popularity
- [ ] Implement reciter search:
  - [ ] Search by name (Arabic/English)
  - [ ] Fuzzy matching
  - [ ] Search results screen

### 13.9 Phase 9: Polish & Design
**Week 7-8: Visual Design Implementation**
- [ ] Implement color scheme:
  - [ ] Define theme constants (teal, gold, cream, etc.)
  - [ ] Apply colors throughout app
  - [ ] Create light theme
  - [ ] Optional: Create dark theme
- [ ] Typography:
  - [ ] Set up Arabic font rendering
  - [ ] Define text styles (heading, body, caption)
  - [ ] Ensure readability
- [ ] Islamic aesthetic elements:
  - [ ] Add subtle geometric patterns (backgrounds, headers)
  - [ ] Integrate crescent moon/star motifs tastefully
  - [ ] Use calligraphy for surah names
- [ ] Icons:
  - [ ] Consistent icon set
  - [ ] Custom icons where needed
  - [ ] Proper sizing and alignment
- [ ] Cards and components:
  - [ ] Card-based UI design
  - [ ] Rounded corners
  - [ ] Subtle shadows
  - [ ] Consistent spacing
- [ ] Animations:
  - [ ] Page transitions (slide, fade)
  - [ ] Button press animations (scale)
  - [ ] Progress bar animations
  - [ ] Download progress (circular)
  - [ ] List item animations (fade-in on scroll)
  - [ ] Pull-to-refresh
- [ ] Micro-interactions:
  - [ ] Haptic feedback on taps
  - [ ] Toggle switch animations
  - [ ] Swipe gestures (where appropriate)
  - [ ] Loading indicators (custom design)

### 13.10 Phase 10: Settings & Preferences
**Week 8: Settings Implementation**
- [ ] Complete SettingsScreen.js:
  - [ ] Audio quality selector (Low, Medium, High)
  - [ ] WiFi-only downloads toggle
  - [ ] Auto-play next surah toggle
  - [ ] Theme selector (Light/Dark/Auto)
  - [ ] Language selector (future: English/Arabic UI)
  - [ ] Storage management link
  - [ ] About section (app version, credits)
  - [ ] Feedback/support link
- [ ] Implement UserPreferences:
  - [ ] Save preferences to AsyncStorage
  - [ ] Load on app start
  - [ ] Apply preferences throughout app
- [ ] Settings UI polish:
  - [ ] Organized sections
  - [ ] Clear labels and descriptions
  - [ ] Toggle switches with proper styling

### 13.11 Phase 11: Testing & Bug Fixes
**Week 9: Comprehensive Testing**
- [ ] Functional testing:
  - [ ] Test all playback features
  - [ ] Test streaming from all sources
  - [ ] Test downloads (single, batch, full)
  - [ ] Test offline playback
  - [ ] Test resume functionality
  - [ ] Test favorites and recently played
- [ ] UI testing:
  - [ ] Test on various screen sizes (iOS & Android)
  - [ ] Test on tablets
  - [ ] Test dark mode (if implemented)
  - [ ] Test animations and transitions
  - [ ] Test accessibility features
- [ ] Performance testing:
  - [ ] App launch time
  - [ ] Audio start time (stream & local)
  - [ ] List scrolling performance
  - [ ] Memory usage
  - [ ] Battery drain during playback
- [ ] Edge case testing:
  - [ ] Poor network conditions
  - [ ] Network switching (WiFi ↔ cellular)
  - [ ] Device storage full
  - [ ] App backgrounded/force quit during download
  - [ ] App backgrounded during playback
  - [ ] Interrupted downloads (retry logic)
- [ ] Cross-platform testing:
  - [ ] iOS testing (multiple devices/versions)
  - [ ] Android testing (multiple devices/versions)
  - [ ] Test permissions (storage, notifications)
- [ ] Bug fixes:
  - [ ] Document all bugs found
  - [ ] Prioritize critical bugs
  - [ ] Fix all high-priority bugs
  - [ ] Fix medium-priority bugs if time permits

### 13.12 Phase 12: Launch Preparation
**Week 10: App Store Preparation**
- [ ] iOS App Store preparation:
  - [ ] Create App Store Connect account
  - [ ] Prepare app metadata (name, description, keywords)
  - [ ] Create app screenshots (6.5", 5.5" displays)
  - [ ] Create app preview video (optional)
  - [ ] Write app privacy policy
  - [ ] Submit for review
- [ ] Google Play Store preparation:
  - [ ] Create Google Play Console account
  - [ ] Prepare app metadata (short/full description, keywords)
  - [ ] Create screenshots (phone, 7" tablet, 10" tablet)
  - [ ] Create feature graphic
  - [ ] Write app privacy policy
  - [ ] Submit for review
- [ ] Beta testing:
  - [ ] iOS: Set up TestFlight
  - [ ] Android: Set up Internal Testing track
  - [ ] Recruit beta testers (10-20)
  - [ ] Gather feedback
  - [ ] Fix critical issues from beta
- [ ] Final polish:
  - [ ] Code cleanup and optimization
  - [ ] Remove console.logs and debug code
  - [ ] Optimize bundle size
  - [ ] Final UI/UX review
- [ ] Documentation:
  - [ ] User guide (help section in app or website)
  - [ ] Developer documentation (if open-source)
  - [ ] Create simple website/landing page (optional)
- [ ] Analytics setup:
  - [ ] Integrate Firebase Analytics (privacy-friendly)
  - [ ] Set up key events tracking
  - [ ] Test analytics in beta
- [ ] Launch:
  - [ ] Submit final builds to stores
  - [ ] Monitor reviews and feedback
  - [ ] Prepare for post-launch support

### 13.13 Post-Launch (Ongoing)
- [ ] Monitor app performance:
  - [ ] Crash reports
  - [ ] User feedback
  - [ ] Analytics data
- [ ] Bug fixes and updates:
  - [ ] Address critical bugs immediately
  - [ ] Plan regular updates
- [ ] Content updates:
  - [ ] Add more reciters
  - [ ] Add more sources
  - [ ] Update reciter database
- [ ] Feature enhancements (Phase 2):
  - [ ] Playlists
  - [ ] Sleep timer
  - [ ] Bookmarks
  - [ ] Translation display
  - [ ] Audio visualizer

---

## 14. Contact & Feedback

**Product Owner**: [Your Name]
**Development Tool**: Claude Code
**Feedback**: Use in-app feedback mechanism or GitHub issues (if open-source)

---

**Document Version**: 1.1
**Last Updated**: November 2025
**Status**: Ready for Development

---

This PRD is comprehensive and ready for implementation. It provides Claude Code with all necessary specifications to build a beautiful, functional Quran MP3 player app. Use the checklist above to track progress throughout development!
