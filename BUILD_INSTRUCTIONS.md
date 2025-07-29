# Build Instructions for MemoQuiz Enhanced

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Electron in development mode
npm run electron:dev
```

## Building for Different Platforms

### Windows (from Windows)
```bash
npm run build:platform
# or
npm run build:electron && npx electron-builder --win
```

### macOS (from macOS)
```bash
npm run build:platform
# or
npm run build:electron && npx electron-builder --mac
```

### Linux (from Linux)
```bash
npm run build:platform
# or
npm run build:electron && npx electron-builder --linux
```

## Cross-Platform Building

### Option 1: GitHub Actions (Recommended)
1. Push your code to GitHub
2. The GitHub Actions workflow will automatically build for all platforms
3. Download the built artifacts from the Actions tab

### Option 2: Use a Mac Cloud Service
- **GitHub Codespaces** with Mac runners
- **MacStadium** for Mac cloud instances
- **CircleCI** with Mac executors

### Option 3: Local Mac Setup
If you have access to a Mac:
1. Clone the repository on the Mac
2. Run `npm install`
3. Run `npm run build:platform`

## Build Artifacts

After building, you'll find the following files in the `release/` directory:

- **Windows**: `.exe` files (installer and portable)
- **macOS**: `.dmg` files (installer) and `.zip` files (portable)
- **Linux**: `.AppImage`, `.deb`, `.rpm` files

## Troubleshooting

### Common Issues

1. **"Build for macOS is supported only on macOS"**
   - Solution: Use GitHub Actions or build on a Mac

2. **Code signing issues on macOS**
   - Solution: Add your Apple Developer certificate to the build configuration

3. **Permission denied errors**
   - Solution: Ensure the `assets/entitlements.mac.plist` file is properly configured

4. **App not starting on macOS**
   - Solution: Check if the app is blocked by Gatekeeper
   - Right-click the app and select "Open" to bypass Gatekeeper

### macOS Specific Notes

- The app includes entitlements for microphone and speech recognition
- Hardened runtime is enabled for better security
- The app supports both Intel (x64) and Apple Silicon (arm64) Macs

## Development vs Production

- **Development**: Uses local development server
- **Production**: Uses bundled files from `dist/` directory

## Code Signing (Optional)

For distribution on macOS App Store or outside the Mac App Store:

1. Get an Apple Developer certificate
2. Add certificate information to `package.json`:

```json
{
  "build": {
    "mac": {
      "identity": "Your Developer ID"
    }
  }
}
```

## Distribution

- **Windows**: Use the `.exe` installer
- **macOS**: Use the `.dmg` file
- **Linux**: Use the `.AppImage` file for universal compatibility