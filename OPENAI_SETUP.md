# OpenAI ChatGPT Integration Setup

## Current Status
✅ **Working Now**: Improved local AI-powered quiz generation  
🔧 **Future**: Real OpenAI API integration

## What's Currently Working

The app now has a much smarter quiz generation system that:
- **Analyzes note content** to find key terms and concepts
- **Creates different question types**: Fill-in-the-blank and short answer questions
- **Uses better logic** than simple word replacement
- **Handles partial answers** for short answer questions

## How to Use

1. **Add notes** to any folder with meaningful content
2. **Click "Generate Quiz"** button on the folder page
3. **Wait for generation** (shows "Generating..." status)
4. **Click "Start Quiz"** to begin taking the quiz

## Setting Up Real OpenAI Integration

When you're ready to use actual ChatGPT for even better quiz generation:

### 1. Get OpenAI API Key
- Visit [OpenAI Platform](https://platform.openai.com/)
- Create an account and get your API key
- Add billing information (required for API usage)

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```bash
VITE_OPENAI_API_KEY=your_api_key_here
```

### 3. Update the Code
In `src/services/openaiService.ts`, replace:
```typescript
const openai: OpenAI | null = null;
```

With:
```typescript
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo purposes
});
```

### 4. Uncomment the Real Implementation
- Uncomment the `generateQuizWithOpenAI` function
- Update `generateQuizWithAI` to call `generateQuizWithOpenAI` when API key is available

### 5. Production Considerations
⚠️ **Important**: Never expose API keys in client-side code in production!

For production:
- Move API calls to a backend server
- Implement proper authentication
- Use server-side environment variables
- Add rate limiting and cost controls

## Question Types Supported

### Fill-in-the-Blank
- Identifies key terms in sentences
- Creates blanks for important words
- Exact match required (case-insensitive)

### Short Answer
- Asks comprehension questions about note content
- Accepts partial matches for flexible grading
- Good for testing understanding of concepts

### Multiple Choice (Future)
- Will be supported when OpenAI integration is enabled
- AI will generate plausible distractors

## Benefits of ChatGPT Integration

When enabled, ChatGPT will:
- **Better question variety**: Multiple choice, true/false, essay questions
- **Contextual understanding**: Questions that test real comprehension
- **Adaptive difficulty**: Questions matched to content complexity
- **Better distractors**: Realistic wrong answers for multiple choice
- **Natural language**: More human-like question phrasing

## Current vs Future Comparison

| Feature | Current (Local AI) | Future (ChatGPT) |
|---------|-------------------|------------------|
| Cost | Free | ~$0.01-0.05 per quiz |
| Speed | Fast | Moderate (API calls) |
| Quality | Good | Excellent |
| Offline | ✅ Works | ❌ Needs internet |
| Question Types | 2 types | 5+ types |
| Understanding | Pattern-based | True comprehension |

## Troubleshooting

### No Questions Generated
- Ensure notes have substantial content (50+ characters)
- Check that notes contain complete sentences
- Try notes with more varied vocabulary

### Poor Question Quality
- Add more detailed notes with key concepts
- Use proper sentences and punctuation
- Include definitions and explanations

### API Errors (Future)
- Check API key validity
- Verify billing account has credits
- Monitor rate limits and usage 