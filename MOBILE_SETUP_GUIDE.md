# ShareWise AI Mobile Application Setup Guide

## ✅ Current Status
The mobile application is now **READY FOR TESTING**! All necessary configurations have been completed.

## 📱 What Has Been Set Up

### 1. Platform Folders
- ✅ Android folder configured
- ✅ iOS folder configured
- ✅ React Native 0.72.7 project structure

### 2. API Configuration
- ✅ Backend API endpoint configured for local development
- ✅ Using IP address: `http://192.168.1.94:8000`
- ✅ Cleartext traffic enabled for Android development

### 3. Dependencies
- ✅ All npm packages installed (1012 packages)
- ✅ React Native dependencies configured
- ✅ Redux, Navigation, and UI libraries ready

### 4. Backend Services
- ✅ Django backend server configured
- ✅ Redis server for caching
- ✅ PostgreSQL database

## 🚀 How to Run the Mobile App

### Quick Start (Windows)
1. **Start all services:**
   ```bash
   start_sharewise_complete.bat
   ```

2. **Start mobile app:**
   ```bash
   cd mobile
   start_mobile.bat
   ```

### Manual Setup

#### Prerequisites
- ✅ Node.js 16+ (Already installed)
- ✅ React Native environment
- ⚠️ Android Studio (Required for Android testing)
- ⚠️ Android Emulator or Physical Device

#### Step 1: Start Backend Services
```bash
# Start Redis
redis-server

# Start Django Backend (in new terminal)
cd backend
python manage.py runserver 0.0.0.0:8000
```

#### Step 2: Start Metro Bundler
```bash
cd mobile
npm start
```

#### Step 3: Run the Mobile App

**For Android:**
```bash
# In a new terminal
cd mobile
npm run android
```

**For iOS (Mac only):**
```bash
cd mobile
cd ios && pod install && cd ..
npm run ios
```

## 📲 Testing URLs

### Mobile App Access Points
- **Backend API:** `http://192.168.1.94:8000`
- **Metro Bundler:** `http://localhost:8081`
- **React Native Debugger:** `http://localhost:8081/debugger-ui`

### Test Credentials
Use the same credentials as the web application:
- **Username:** testuser (or email)
- **Password:** (as configured in your database)

## 🔧 Android Setup Requirements

### Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install Android SDK (API Level 31+)
3. Configure Android Virtual Device (AVD)

### Enable USB Debugging (Physical Device)
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run `adb devices` to verify connection

## 🎯 Testing Features

### Available Features to Test
1. **Authentication**
   - Login/Register
   - Biometric authentication
   - Token management

2. **Trading**
   - View trading signals
   - Execute trades
   - Portfolio management

3. **AI Studio** (Pro/Elite tiers)
   - Model creation
   - Training monitoring
   - Performance metrics

4. **Market Data**
   - Live indices
   - Watchlist
   - Charts

## 🐛 Troubleshooting

### Common Issues

**Metro bundler not starting:**
```bash
npx react-native start --reset-cache
```

**Android build fails:**
```bash
cd mobile/android
./gradlew clean
cd ../..
```

**API connection issues:**
- Ensure backend is running on `0.0.0.0:8000` (not localhost)
- Check firewall settings
- Verify IP address in `mobile/src/services/api.ts`

**Device not recognized:**
```bash
adb kill-server
adb start-server
adb devices
```

## 📊 Development Tools

### Debugging
- **React Native Debugger:** Press `Ctrl+M` (Android) or `Cmd+D` (iOS) in app
- **Chrome DevTools:** Available at `http://localhost:8081/debugger-ui`
- **Redux DevTools:** Integrated with React Native Debugger

### Performance Monitoring
- **Flipper:** https://fbflipper.com/
- **React DevTools:** `npm install -g react-devtools`

## 🎨 Customization

### Change App Icon
Replace files in:
- Android: `mobile/android/app/src/main/res/mipmap-*`
- iOS: `mobile/ios/SharewiseMobile/Images.xcassets`

### Update Splash Screen
- Android: Edit `mobile/android/app/src/main/res/values/styles.xml`
- iOS: Configure in Xcode

## 📦 Building for Production

### Android APK
```bash
cd mobile
npm run build:android
# APK location: android/app/build/outputs/apk/release/
```

### iOS IPA (Mac only)
```bash
cd mobile
npm run build:ios
```

## 🔗 Quick Links

- **Backend API Docs:** http://localhost:8000/api/docs/
- **Frontend Web:** http://localhost:3000
- **React Native Docs:** https://reactnative.dev/

## ✨ Next Steps

1. **Install Android Studio** if you haven't already
2. **Create an Android Virtual Device** or connect a physical device
3. **Run the mobile app** using the scripts provided
4. **Test the features** and provide feedback

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review logs in Metro bundler console
3. Check backend server logs
4. Verify network connectivity

---

**Mobile App Version:** 1.0.0  
**Last Updated:** September 2025  
**Supported Platforms:** Android 8.0+, iOS 13.0+