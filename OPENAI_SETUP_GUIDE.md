# OpenAI Setup Guide - Fix Strange Quiz Responses

## 🎯 **The Problem**
You're getting "strange" quiz responses because the app is currently using a local algorithm instead of the actual OpenAI API.

## 🚀 **Solution: Enable Real OpenAI Integration**

### Step 1: Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Go to "API Keys" section
4. Click "Create new secret key"
5. Copy your API key (starts with `sk-`)

### Step 2: Create Environment File
Create a file named `.env` in your project root (same level as `package.json`):

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-your_actual_api_key_here

# Optional settings
VITE_OPENAI_MODEL=gpt-3.5-turbo
VITE_OPENAI_MAX_TOKENS=1500
VITE_OPENAI_TEMPERATURE=0.7
```

**Important**: Replace `sk-your_actual_api_key_here` with your real API key.

### Step 3: Add Billing (Required)
1. Go to [OpenAI Billing](https://platform.openai.com/account/billing)
2. Add a payment method
3. Add some credits (minimum $5)

### Step 4: Test the Integration
1. Restart your development server
2. Go to any folder with notes
3. Click "Generate Quiz"
4. You should now see much better, more natural questions

## 🔧 **What Will Change**

### Before (Local Algorithm):
- Strange, repetitive questions
- Basic fill-in-the-blank only
- Limited question types
- Poor context understanding

### After (OpenAI):
- Natural, educational questions
- Multiple question types (MCQ, fill-in-blank, short answer)
- Better understanding of content
- More varied and interesting questions

## 📊 **Cost Estimate**
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens
- **Typical quiz generation**: ~$0.01-0.05 per quiz
- **Monthly usage**: $1-5 for regular use

## 🛠️ **Troubleshooting**

### API Key Not Working
- Check that your API key starts with `sk-`
- Verify billing is set up
- Ensure the `.env` file is in the project root

### No Questions Generated
- Check browser console for errors
- Verify API key is correct
- Ensure notes have substantial content

### Still Getting Strange Responses
- Clear browser cache
- Restart the development server
- Check that the `.env` file is loaded

## 🔒 **Security Note**
For production use, never expose API keys in client-side code. Use a backend server instead.

## ✅ **Verification**
After setup, you should see:
- More natural question phrasing
- Better question variety
- Improved answer quality
- Questions that actually test understanding

The questions should now feel much more like they were written by a human teacher!