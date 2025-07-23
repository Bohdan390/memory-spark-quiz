#!/bin/bash

echo "🧠 MemoQuiz Enhanced - Testing System"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the MemoQuiz-Enhanced-Permanent directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo "✅ Found package.json"
echo ""

# Start the development server
echo "🚀 Starting development server..."
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Development server is running on http://localhost:8080"
else
    echo "❌ Development server failed to start"
    kill $DEV_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🧪 Opening Enhanced Quiz Test..."
echo "Target: 7+ on ALL quality metrics"
echo ""

# Open the enhanced test
open "http://localhost:8080/tests/enhanced-quiz-test.html"

echo "🎯 Test opened in browser!"
echo "Look for the achievement banner when all targets are met!"
echo ""
echo "📊 Available tests:"
echo "  - Enhanced Test: http://localhost:8080/tests/enhanced-quiz-test.html"
echo "  - Comprehensive Comparison: http://localhost:8080/tests/comprehensive-quiz-test.html"
echo "  - Main App: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the development server"

# Keep the script running
wait $DEV_PID 