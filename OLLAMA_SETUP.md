# 🤖 Ollama AI Setup for MemoQuiz

## Why Ollama?

Ollama is the **BEST choice** for your personal journal/work notes app because:

✅ **100% Free** - No API costs, ever  
✅ **Private** - Your notes never leave your computer  
✅ **Unlimited** - Generate as many quizzes as you want  
✅ **Works Offline** - No internet required  
✅ **High Quality** - Uses powerful models like Llama 3.1  

## Installation

### 1. Install Ollama

**macOS:**
```bash
# Download and install from website
curl -fsSL https://ollama.ai/install.sh | sh

# Or use Homebrew
brew install ollama
```

**Windows:**
- Download installer from [ollama.ai](https://ollama.ai)
- Run the installer

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Download a Model

After installation, download a model (choose one):

```bash
# Recommended: Llama 3.1 8B (good balance of speed/quality)
ollama pull llama3.1:8b

# Faster but smaller: Llama 3.1 7B
ollama pull llama3.1:7b

# Larger and more capable: Llama 3.1 70B (requires more RAM)
ollama pull llama3.1:70b

# Alternative: Mistral (also very good)
ollama pull mistral:7b
```

### 3. Start Ollama

```bash
# Start the Ollama service
ollama serve
```

The service will run on `http://localhost:11434`

### 4. Test It's Working

```bash
# Test with a simple question
ollama run llama3.1:8b "What is the capital of France?"
```

## Integration with MemoQuiz

The app will automatically detect if Ollama is running and use it for quiz generation.

### Current Status
- ✅ Ollama service integration code ready
- ✅ Automatic fallback to local algorithm if Ollama unavailable
- ✅ Model selection and configuration
- ⏳ UI integration (next step)

### How It Works

1. **Automatic Detection**: App checks if Ollama is running on startup
2. **Smart Prompting**: Sends your notes with specific instructions for educational questions
3. **JSON Parsing**: Extracts structured quiz questions from AI response
4. **Fallback**: Uses local algorithm if Ollama is unavailable

## Usage Tips

### Best Models for Quiz Generation
- **llama3.1:8b** - Best overall choice (4GB RAM)
- **mistral:7b** - Good alternative (4GB RAM)
- **llama3.1:70b** - Highest quality (40GB+ RAM)

### Performance
- **8B models**: ~2-5 seconds per quiz
- **70B models**: ~10-20 seconds per quiz (if you have the RAM)

### Troubleshooting

**Ollama not detected:**
```bash
# Check if running
ps aux | grep ollama

# Start if not running
ollama serve
```

**Model not found:**
```bash
# List installed models
ollama list

# Pull missing model
ollama pull llama3.1:8b
```

**Out of memory:**
- Use smaller model (7b instead of 8b)
- Close other applications
- Check system requirements

## System Requirements

### Minimum (for 7B models):
- **RAM**: 8GB
- **Storage**: 4GB free space
- **CPU**: Modern processor (2015+)

### Recommended (for 8B models):
- **RAM**: 16GB
- **Storage**: 8GB free space
- **CPU**: Multi-core processor

### High-end (for 70B models):
- **RAM**: 64GB+
- **Storage**: 40GB+ free space
- **CPU**: High-end processor

## Advanced Configuration

### Change Model in App
The app will use `llama3.1:8b` by default. To change:

1. Open browser dev tools (F12)
2. Run: `ollamaService.setModel('mistral:7b')`
3. Or modify the code in `src/services/ollamaService.ts`

### Custom Prompts
Edit the `createQuizPrompt` method in `ollamaService.ts` to customize how questions are generated.

## Comparison with Other AI Options

| Feature | Ollama | OpenAI GPT | Google Gemini | Anthropic Claude |
|---------|---------|------------|---------------|------------------|
| **Cost** | Free | $0.002/1K tokens | Free tier limited | Limited free |
| **Privacy** | 100% local | Sent to OpenAI | Sent to Google | Sent to Anthropic |
| **Speed** | Fast locally | Depends on API | Depends on API | Depends on API |
| **Offline** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Setup** | One-time install | API key needed | API key needed | API key needed |
| **Quality** | Very good | Excellent | Very good | Excellent |

## Next Steps

1. **Install Ollama** following the steps above
2. **Start the service** with `ollama serve`
3. **Download a model** like `llama3.1:8b`
4. **Restart MemoQuiz** - it will automatically detect and use Ollama
5. **Create some notes** and generate quizzes to test it out!

## Support

If you need help:
1. Check the [Ollama documentation](https://ollama.ai/docs)
2. Verify the service is running: `curl http://localhost:11434/api/tags`
3. Check MemoQuiz console for error messages (F12 → Console)

---

**Ready to get started?** Install Ollama and experience AI-powered quiz generation that's completely free and private! 