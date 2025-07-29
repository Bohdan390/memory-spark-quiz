# Troubleshooting White Screen on macOS

## Quick Fixes to Try

### 1. Check Console Logs
Open Terminal and run:
```bash
# Navigate to your app directory
cd /Applications/MemoQuiz\ Enhanced.app/Contents/MacOS/
./MemoQuiz\ Enhanced
```

This will show you console output and error messages.

### 2. Enable Debug Mode
If you have the source code, run:
```bash
npm run electron:debug
```

This will:
- Load a test page first
- Open DevTools automatically
- Show detailed error messages

### 3. Check Gatekeeper Settings
Right-click the app and select "Open" to bypass Gatekeeper restrictions.

### 4. Check App Permissions
Go to System Preferences → Security & Privacy → Privacy:
- Check "Accessibility" permissions
- Check "Microphone" permissions (if using voice features)

## Common Causes and Solutions

### Issue 1: File Path Problems
**Symptoms**: White screen, no error messages
**Solution**: The app can't find the HTML files

**Fix**: 
1. Open the app in debug mode
2. Check the console for file path errors
3. Verify the `dist` folder is properly packaged

### Issue 2: JavaScript Errors
**Symptoms**: White screen, console shows errors
**Solution**: Check for JavaScript runtime errors

**Fix**:
1. Open DevTools (Cmd+Option+I)
2. Check Console tab for errors
3. Look for missing dependencies or syntax errors

### Issue 3: Security Restrictions
**Symptoms**: App won't start or shows white screen
**Solution**: macOS security features are blocking the app

**Fix**:
1. Right-click app → "Open"
2. Go to System Preferences → Security & Privacy
3. Click "Allow Anyway" for the app

### Issue 4: Resource Loading Issues
**Symptoms**: Partial white screen, missing assets
**Solution**: CSS/JS files not loading properly

**Fix**:
1. Check Network tab in DevTools
2. Verify all assets are included in the build
3. Check file permissions

## Debugging Steps

### Step 1: Run in Debug Mode
```bash
# From your project directory
npm run electron:debug
```

### Step 2: Check Console Output
Look for these messages:
- ✅ "Found index.html at: [path]" - Good
- ❌ "Could not find index.html" - Bad
- ❌ "Failed to load" - Bad

### Step 3: Test File Loading
The debug mode will load a test page first. If you see:
- ✅ "Electron Test Page" - File loading works
- ❌ White screen - File loading broken

### Step 4: Check DevTools
1. Open DevTools (Cmd+Option+I)
2. Check Console for errors
3. Check Network tab for failed requests
4. Check Sources tab for missing files

## Advanced Debugging

### Check App Structure
```bash
# Navigate to the app bundle
cd "/Applications/MemoQuiz Enhanced.app/Contents/"

# Check if dist folder exists
ls -la Resources/app/dist/

# Check if index.html exists
ls -la Resources/app/dist/index.html
```

### Check File Permissions
```bash
# Check file permissions
ls -la "/Applications/MemoQuiz Enhanced.app/Contents/Resources/app/dist/"

# Fix permissions if needed
chmod -R 755 "/Applications/MemoQuiz Enhanced.app/Contents/Resources/app/dist/"
```

### Check for Missing Dependencies
```bash
# Check if all required files are present
find "/Applications/MemoQuiz Enhanced.app/Contents/Resources/app/dist/" -name "*.js" -o -name "*.css" -o -name "*.html"
```

## Prevention

### 1. Always Test in Debug Mode First
```bash
npm run electron:debug
```

### 2. Check Build Output
After building, verify:
- `dist/index.html` exists
- All assets are present
- No build errors

### 3. Test on Clean macOS
- Test on a fresh macOS installation
- Check with different macOS versions
- Verify on both Intel and Apple Silicon Macs

## Getting Help

If the issue persists:

1. **Collect Debug Info**:
   ```bash
   npm run electron:debug
   ```

2. **Check Console Output**:
   - Copy all console messages
   - Note any error codes

3. **Check System Info**:
   - macOS version
   - Mac model (Intel/Apple Silicon)
   - Available disk space

4. **Report the Issue**:
   - Include console output
   - Include system information
   - Describe exact steps to reproduce

## Quick Test Commands

```bash
# Test if app can load basic HTML
npm run electron:debug

# Check if build is complete
ls -la dist/

# Verify Electron can start
npx electron .

# Test production build locally
npm run build:electron && npx electron .
```