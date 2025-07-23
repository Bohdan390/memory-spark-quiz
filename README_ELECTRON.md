# MemoQuiz Desktop App

## Overview

MemoQuiz is now a desktop application built with Electron that lets you:

- **Journal Entries**: Create personal journal folders to record thoughts, experiences, and reflections
- **Work Notes**: Organize professional notes, meeting minutes, and project documentation  
- **Quiz Yourself**: Generate AI-powered quizzes from your content to test retention
- **Offline Storage**: All data is stored locally on your computer in `~/Documents/MemoQuiz`

## Getting Started

### Development Mode
```bash
npm run electron:dev
```

### Build for Production
```bash
npm run build:electron
```

### Create Installer
```bash
npm run dist
```

## Features

### 📝 Note Taking
- Rich text editor with formatting options
- Organize content in folders by type (Journal/Work/Other)
- Search across all your notes
- Auto-save functionality

### 🧠 Quiz System
- AI-powered question generation from your notes
- Multiple question types: fill-in-blank, short answer, multiple choice
- Spaced repetition for better learning
- Track your progress and performance

### 💾 Data Storage
- All data stored locally in `~/Documents/MemoQuiz/`
- Export/Import functionality for backup and sharing
- No internet connection required after initial setup

## File Structure

Your data is stored in:
```
~/Documents/MemoQuiz/
├── categories.json      # Folder structure
├── entries.json         # Your notes/entries
├── quiz_questions.json  # Generated quiz questions
└── quiz_results.json    # Quiz performance history
```

## Usage Tips

1. **Create Focused Folders**: Use specific folder names like "Daily Journal 2024" or "Project Alpha Notes"
2. **Use Rich Formatting**: Take advantage of headers, lists, and emphasis to structure your notes
3. **Regular Quizzing**: Generate quizzes weekly to reinforce what you've learned
4. **Tag Important Content**: Use the search feature to quickly find specific topics

## Backup Your Data

The Export button in the main interface creates a complete backup of all your data that you can:
- Store in cloud storage
- Share with other devices
- Import into a fresh installation

## Troubleshooting

- **App won't start**: Make sure you've run `npm run build:electron` first
- **No quiz questions**: Ensure your notes have substantial content (at least a few sentences)
- **Missing data**: Check that the MemoQuiz folder exists in your Documents directory

## Development

This app uses:
- **Electron** for desktop functionality
- **React + TypeScript** for the interface  
- **TipTap** for rich text editing
- **Local JSON files** for data persistence

## Future Enhancements

- [ ] Cloud sync options
- [ ] Advanced search with filters
- [ ] Note linking and backlinks
- [ ] Custom quiz question types
- [ ] Statistics and learning analytics 