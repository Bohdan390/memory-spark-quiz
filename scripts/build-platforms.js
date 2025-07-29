const { execSync } = require('child_process');
const os = require('os');

const platform = os.platform();

console.log(`Building for platform: ${platform}`);

try {
  // First build the application
  console.log('Building application...');
  execSync('npm run build:electron', { stdio: 'inherit' });
  
  // Then build for the current platform
  if (platform === 'win32') {
    console.log('Building for Windows...');
    execSync('npx electron-builder --win', { stdio: 'inherit' });
  } else if (platform === 'darwin') {
    console.log('Building for macOS...');
    execSync('npx electron-builder --mac', { stdio: 'inherit' });
  } else if (platform === 'linux') {
    console.log('Building for Linux...');
    execSync('npx electron-builder --linux', { stdio: 'inherit' });
  } else {
    console.log('Unsupported platform. Building for current platform...');
    execSync('npx electron-builder', { stdio: 'inherit' });
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}