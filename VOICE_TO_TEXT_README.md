# Voice-to-Text Feature

The Voice-to-Text feature allows users to dictate their notes instead of typing them, making note-taking more efficient and accessible. This feature uses the Web Speech API to provide real-time speech recognition.

## Features

### 🎤 **Real-time Speech Recognition**
- **Live Transcription**: See your words appear as you speak
- **Multiple Languages**: Support for 13+ languages including English, Spanish, French, German, and more
- **Confidence Scoring**: Visual feedback on recognition accuracy
- **Continuous Recognition**: Auto-restart after pauses for seamless dictation

### 🎛️ **Advanced Controls**
- **Language Selection**: Choose from 13+ supported languages
- **Continuous Mode**: Automatically restart listening after pauses
- **Interim Results**: See partial results while speaking
- **Error Handling**: Comprehensive error messages and recovery

### 🔧 **Integration**
- **Note Editor Integration**: Voice input button in the note editor toolbar
- **Cursor Position**: Transcribed text inserts at current cursor position
- **Seamless Workflow**: Switch between voice and keyboard input seamlessly

## How to Use

### Basic Voice Input
1. **Open a note** in the editor
2. **Click the microphone button** in the toolbar (🎤)
3. **Allow microphone access** when prompted
4. **Start speaking** - your words will appear in the note
5. **Click the stop button** (⏹️) when finished

### Advanced Settings
1. **Click the microphone button** to open settings
2. **Select your language** from the dropdown
3. **Toggle continuous mode** for auto-restart
4. **Toggle interim results** for real-time feedback
5. **Start dictating** with your preferred settings

### Language Support
- **English (US/UK)**: Primary support with highest accuracy
- **European Languages**: Spanish, French, German, Italian, Portuguese
- **Asian Languages**: Japanese, Korean, Chinese (Simplified)
- **Other Languages**: Russian, Arabic, Hindi

## Browser Compatibility

### ✅ **Supported Browsers**
- **Chrome**: Full support (recommended)
- **Edge**: Full support
- **Safari**: Full support
- **Firefox**: Limited support (may require additional setup)

### ❌ **Unsupported Browsers**
- Internet Explorer
- Older browser versions

## Voice Recognition Tips

### 🎯 **For Best Accuracy**
- **Speak clearly** at a normal pace
- **Minimize background noise** for better recognition
- **Use punctuation commands** like "period", "comma", "question mark"
- **Allow microphone access** when prompted
- **Use supported browsers** (Chrome, Edge, Safari)

### 📝 **Punctuation Commands**
- Say "period" or "full stop" for .
- Say "comma" for ,
- Say "question mark" for ?
- Say "exclamation mark" for !
- Say "new line" or "new paragraph" for line breaks

### 🌍 **Multilingual Usage**
- **Switch languages** in the settings popover
- **Mix languages** within the same session (some browsers support this)
- **Set default language** based on your primary language

## Technical Details

### Web Speech API
The feature uses the Web Speech API's `SpeechRecognition` interface:

```javascript
// Browser support check
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSupported = !!SpeechRecognition;
```

### Recognition Settings
```javascript
recognition.continuous = true;        // Auto-restart after pauses
recognition.interimResults = true;    // Show partial results
recognition.lang = 'en-US';          // Language setting
```

### Error Handling
The component handles various error scenarios:
- **No speech detected**: Prompts user to try again
- **Microphone not found**: Guides user to check microphone settings
- **Permission denied**: Explains how to allow microphone access
- **Network errors**: Suggests checking internet connection
- **Language not supported**: Recommends different language

## Integration Points

### Note Editor
The voice input is integrated into the note editor toolbar:
- **Compact button** with microphone icon
- **Settings popover** for configuration
- **Real-time status** indicators
- **Confidence scoring** display

### Accessibility
- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** mode support
- **Focus indicators** for all interactive elements

## Troubleshooting

### Common Issues

#### "Speech recognition not supported"
- **Solution**: Use Chrome, Edge, or Safari
- **Alternative**: Check if you're using HTTPS (required for microphone access)

#### "Microphone access denied"
- **Solution**: Click the microphone icon in the browser address bar and allow access
- **Alternative**: Check browser settings for microphone permissions

#### "No speech detected"
- **Solution**: Speak louder and more clearly
- **Alternative**: Check microphone settings and ensure it's working

#### "Poor recognition accuracy"
- **Solutions**:
  - Reduce background noise
  - Speak more slowly and clearly
  - Use a better microphone
  - Check internet connection
  - Try different language settings

### Performance Optimization
- **Close other tabs** using microphone
- **Use wired headphones** with microphone
- **Ensure stable internet** connection
- **Restart browser** if issues persist

## Future Enhancements

### Planned Features
- **Voice Commands**: "New paragraph", "Save note", "Bold text"
- **Custom Vocabulary**: Add domain-specific terms
- **Offline Recognition**: Work without internet connection
- **Voice Profiles**: Personalized recognition for different users
- **Audio Recording**: Save voice notes alongside text
- **Transcription History**: View and edit past transcriptions

### Advanced Features
- **Real-time Translation**: Speak in one language, get text in another
- **Voice Editing**: "Delete last sentence", "Replace word X with Y"
- **Formatting Commands**: "Make this bold", "Create a list"
- **Integration APIs**: Connect with external speech services

## Privacy & Security

### Data Handling
- **Local Processing**: Speech recognition happens in the browser
- **No Server Storage**: Voice data is not sent to our servers
- **Temporary Storage**: Only stored during active session
- **User Control**: Users can disable microphone access anytime

### Security Considerations
- **HTTPS Required**: Microphone access only works over secure connections
- **Permission-based**: Users must explicitly grant microphone access
- **Browser Security**: Follows browser security policies
- **No Recording**: Voice is not recorded or stored

## Testing

### Test Suite
A comprehensive test suite is available at `tests/voice-to-text-test.html`:

1. **Browser Support Test**: Check if speech recognition is available
2. **Basic Recognition Test**: Test core functionality
3. **Language Settings Test**: Test different languages
4. **Settings Configuration Test**: Test recognition options
5. **Error Handling Test**: Test error scenarios
6. **Performance Test**: Test accuracy and speed

### Manual Testing
- Test with different microphones
- Test in various noise environments
- Test with different speaking speeds
- Test with different accents
- Test multilingual content

## Support

### Getting Help
- **Check browser compatibility** first
- **Verify microphone permissions**
- **Test with the test suite**
- **Check network connection**
- **Try different browsers**

### Reporting Issues
When reporting voice recognition issues, please include:
- Browser and version
- Operating system
- Microphone type
- Language being used
- Error messages
- Steps to reproduce

---

**Happy Dictating! 🎤** 