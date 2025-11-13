# Khalwa Quran Player

<div align="center">

  **A beautiful, simple, and lovable mobile app for listening to Quran recitations**

  ![React Native](https://img.shields.io/badge/React_Native-0.82.1-61DAFB?logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
  ![iOS](https://img.shields.io/badge/iOS-13.0+-000000?logo=apple)
  ![Android](https://img.shields.io/badge/Android-8.0+-3DDC84?logo=android)

</div>

---

## 📖 About

Khalwa Quran Player is a Simple, Lovable, and Complete (SLC) mobile application that allows Muslims worldwide to listen to Quran recitations with:

- ✨ Beautiful Islamic aesthetic design
- 🎵 Multiple reciters and recitation styles
- 📥 Flexible download options (per surah, by Juz, or full Quran)
- 🔄 Seamless streaming and offline playback
- 🎨 Elegant, minimalist UI with calming colors

**Core Value Proposition**: Easy-to-use Quran audio player with multiple sources and reciters, flexible download options, and beautiful Islamic design that works seamlessly online and offline.

---

## 🚀 Features

### Core Features (v1.0)

- **Audio Player**
  - Stream from multiple sources or play from local storage
  - Background playback with lock screen controls
  - Variable playback speed (0.5x - 2x)
  - Repeat modes (off, one, all)
  - Shuffle mode

- **50+ Reciters**
  - Different recitation styles (Murattal, Mujawwad, Hafs, Warsh)
  - Reciter profiles with bios and photos
  - Multiple sources per reciter

- **Smart Downloads**
  - Download individual surahs
  - Batch download by Juz (1-30)
  - Download full Quran (all 114 surahs)
  - WiFi-only option
  - Download queue management

- **Library Management**
  - View all downloaded content
  - Favorites system
  - Recently played history
  - Resume listening from where you left off

- **Storage Management**
  - View storage usage by reciter
  - Manage downloaded content
  - Storage warnings and optimization

---

## 🏗️ Technical Stack

### Framework & Platform
- **React Native** 0.82.1
- **TypeScript** 5.x
- **iOS** 13.0+ / **Android** 8.0+ (API Level 26)

### Key Dependencies
- **Audio Playback**: `react-native-track-player`
- **Storage**: `@react-native-async-storage/async-storage`
- **Downloads**: `react-native-fs`
- **Navigation**: `@react-navigation/native`
- **State Management**: React Context API / Zustand
- **Network Detection**: `@react-native-community/netinfo`
- **Animations**: `react-native-reanimated`

### Audio Sources
1. EveryAyah.com
2. MP3Quran.net
3. Quran.com
4. QuranicAudio.com
5. Assabile.com

---

## 📁 Project Structure

```
app/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Buttons, Cards, Loading indicators
│   │   ├── player/      # Player controls, Progress bar
│   │   ├── reciter/     # Reciter cards, profiles
│   │   └── surah/       # Surah list items
│   ├── screens/         # App screens
│   │   ├── HomeScreen.js
│   │   ├── RecitersScreen.js
│   │   ├── LibraryScreen.js
│   │   ├── SettingsScreen.js
│   │   ├── ReciterDetailScreen.js
│   │   └── PlayerScreen.js
│   ├── services/        # Business logic
│   │   ├── AudioService.js
│   │   ├── DownloadService.js
│   │   ├── StorageService.js
│   │   └── ApiService.js
│   ├── store/           # State management
│   │   ├── PlayerContext.js
│   │   ├── DownloadContext.js
│   │   └── SettingsContext.js
│   ├── utils/           # Utilities and constants
│   │   ├── constants.ts
│   │   └── formatters.js
│   ├── assets/          # Images, fonts, etc.
│   │   ├── images/
│   │   └── fonts/
│   └── data/            # Static data
│       ├── reciters.json
│       └── surahs.json
├── android/             # Android-specific code
├── ios/                 # iOS-specific code
└── PRD.md              # Product Requirements Document
```

---

## 🛠️ Setup & Installation

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **React Native CLI** (`npm install -g react-native-cli`)
- **Xcode** 14+ (for iOS development, macOS only)
- **Android Studio** (for Android development)
- **CocoaPods** (for iOS dependencies)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/abdulhameed/Khalwa-Quran-Player.git
   cd Khalwa-Quran-Player/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install iOS dependencies** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Run on iOS**
   ```bash
   npx react-native run-ios
   ```

5. **Run on Android**
   ```bash
   npx react-native run-android
   ```

---

## 🎨 Design Philosophy

The app follows a **Simple, Lovable, and Complete (SLC)** approach with:

- **Elegant Islamic Aesthetic**
  - Subtle geometric patterns
  - Crescent moon and star motifs
  - Arabic calligraphy for surah names

- **Modern Minimalist UI**
  - Clean lines and ample white space
  - Card-based interface
  - Clear visual hierarchy

- **Calming Color Palette**
  - Primary: Deep teal (#006B5E)
  - Secondary: Soft gold (#F9A825)
  - Background: Off-white (#FAFAFA)
  - Text: Dark gray (#212121)

---

## 📱 Screenshots

_Coming soon..._

---

## 🗺️ Roadmap

### ✅ Phase 1: Core Infrastructure (Week 1-2)
- [x] Project setup with TypeScript
- [x] Folder structure
- [x] Theme constants
- [ ] Basic navigation
- [ ] Data models

### 🔄 Phase 2: Audio Playback (Week 2-3)
- [ ] Audio player implementation
- [ ] Stream and local playback
- [ ] Lock screen controls
- [ ] Playback modes

### 📋 Phase 3: UI Development (Week 3-4)
- [ ] Home screen
- [ ] Reciters screen
- [ ] Player screen
- [ ] Library screen
- [ ] Settings screen

### 🌐 Phase 4: Source Integration (Week 4)
- [ ] API service
- [ ] Source adapters
- [ ] Streaming implementation

### 📥 Phase 5: Download System (Week 5-6)
- [ ] Download service
- [ ] Queue management
- [ ] Batch downloads
- [ ] WiFi-only option

### 📚 Phase 6: Library & Storage (Week 6-7)
- [ ] Library implementation
- [ ] Favorites system
- [ ] Storage management

### 🎨 Phase 7: Polish & Design (Week 7-8)
- [ ] Visual design implementation
- [ ] Animations
- [ ] Islamic aesthetic elements

### 🚀 Phase 8: Testing & Launch (Week 9-10)
- [ ] Comprehensive testing
- [ ] Bug fixes
- [ ] App store preparation
- [ ] Beta testing
- [ ] Launch

### Future Enhancements (Post v1.0)
- [ ] Playlists
- [ ] Sleep timer
- [ ] Bookmarks
- [ ] Translation display
- [ ] Audio visualizer
- [ ] Cloud sync

---

## 📄 Documentation

For detailed product specifications, see the [Product Requirements Document](../PRD.md).

---

## 🤝 Contributing

This project is currently in active development. Contributions, issues, and feature requests are welcome!

---

## 📝 License

_To be determined_

---

## 🙏 Acknowledgments

- All Quran recitation sources (EveryAyah.com, MP3Quran.net, etc.)
- The React Native community
- All contributors and supporters

---

## 📧 Contact

**Product Owner**: [Your Name]

**GitHub**: [abdulhameed](https://github.com/abdulhameed)

**Repository**: [Khalwa-Quran-Player](https://github.com/abdulhameed/Khalwa-Quran-Player)

---

<div align="center">

  **Built with ❤️ for the Muslim community**

  May Allah accept this effort and make it beneficial for all

</div>
