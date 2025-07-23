import { QuizQuestion, Note } from '@/types/models';

interface QuizGenerationConfig {
  originalWeight: number;    // 0-1, weight for original algorithm
  improvedWeight: number;    // 0-1, weight for improved algorithm
  minQualityScore: number;   // 0-10, minimum quality threshold
  maxQuestions: number;      // Maximum questions to generate
  contentType: 'journal' | 'bookNotes' | 'business' | 'general';
}

class HybridQuizService {
  
  private defaultConfig: QuizGenerationConfig = {
    originalWeight: 0.6,
    improvedWeight: 0.4,
    minQualityScore: 6.0,
    maxQuestions: 12,
    contentType: 'general'
  };

  async generateHybridQuiz(notes: Note[], config?: Partial<QuizGenerationConfig>): Promise<QuizQuestion[]> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const allContent = notes.map(note => `${note.title}: ${note.content}`).join('\n\n');
    
    if (!allContent.trim()) {
      return [];
    }

    // Detect content type if not specified
    if (!config?.contentType) {
      finalConfig.contentType = this.detectContentType(allContent);
    }

    // Generate questions using both algorithms
    const originalQuestions = this.generateOriginalQuestions(allContent, notes);
    const improvedQuestions = this.generateImprovedQuestions(allContent, notes);

    // Calculate target distribution
    const totalQuestions = finalConfig.maxQuestions;
    const originalCount = Math.floor(totalQuestions * finalConfig.originalWeight);
    const improvedCount = totalQuestions - originalCount;

    // Select best questions from each algorithm
    const selectedOriginal = this.selectBestQuestions(originalQuestions, originalCount, allContent);
    const selectedImproved = this.selectBestQuestions(improvedQuestions, improvedCount, allContent);

    // Combine and optimize
    const combinedQuestions = [...selectedOriginal, ...selectedImproved];
    
    // Apply content-type-specific optimizations
    const optimizedQuestions = this.applyContentTypeOptimizations(combinedQuestions, finalConfig.contentType);
    
    // Filter by quality and remove duplicates
    const filteredQuestions = this.filterAndDeduplicateQuestions(optimizedQuestions, finalConfig.minQualityScore, allContent);

    return filteredQuestions.slice(0, finalConfig.maxQuestions);
  }

  private detectContentType(content: string): 'journal' | 'bookNotes' | 'business' | 'general' {
    const journalIndicators = ['i feel', 'i think', 'today', 'my experience', 'personal', 'emotion', 'mindfulness', 'meditation'];
    const bookIndicators = ['author', 'chapter', 'book', 'theory', 'concept', 'framework', 'principle', 'clear explains'];
    const businessIndicators = ['strategy', 'market', 'business', 'company', 'competitive', 'analysis', 'swot', 'porter'];

    const lowerContent = content.toLowerCase();
    
    const journalScore = journalIndicators.filter(indicator => lowerContent.includes(indicator)).length;
    const bookScore = bookIndicators.filter(indicator => lowerContent.includes(indicator)).length;
    const businessScore = businessIndicators.filter(indicator => lowerContent.includes(indicator)).length;

    const maxScore = Math.max(journalScore, bookScore, businessScore);
    
    if (maxScore === 0) return 'general';
    if (journalScore === maxScore) return 'journal';
    if (bookScore === maxScore) return 'bookNotes';
    if (businessScore === maxScore) return 'business';
    
    return 'general';
  }

  private generateOriginalQuestions(content: string, notes: Note[]): QuizQuestion[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const questions: QuizQuestion[] = [];

    // Generate fill-in-blank questions (original algorithm strength)
    sentences.slice(0, 8).forEach((sentence, index) => {
      const words = sentence.trim().split(/\s+/);
      const keyWordIndex = this.findKeyWordIndex(words);
      
      if (keyWordIndex !== -1) {
        const targetWord = words[keyWordIndex];
        const questionText = words.map((word, i) => 
          i === keyWordIndex ? '____' : word
        ).join(' ');
        
        questions.push({
          id: `hybrid-original-${Date.now()}-${index}`,
          folder_id: notes[0]?.folder_id || '',
          note_id: notes[0]?.id || '',
          user_id: notes[0]?.user_id || '',
          question: `Fill in the blank: ${questionText.trim()}`,
          answer: targetWord.replace(/[^\w\s]/g, ''),
          type: 'fillInBlank',
          easeFactor: 2.5,
          interval: 1,
          lastReviewed: null,
          nextReviewDate: new Date(),
        });
      }
    });

    return questions;
  }

  private generateImprovedQuestions(content: string, notes: Note[]): QuizQuestion[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
    const analysis = this.analyzeContent(content);
    const questions: QuizQuestion[] = [];

    // Concept questions
    analysis.concepts.slice(0, 3).forEach((concept, index) => {
      questions.push({
        id: `hybrid-improved-concept-${Date.now()}-${index}`,
        folder_id: notes[0]?.folder_id || '',
        note_id: notes[0]?.id || '',
        user_id: notes[0]?.user_id || '',
        question: `Explain the concept of ${concept.toLowerCase()}.`,
        answer: this.extractConceptDefinition(concept, content),
        type: 'shortAnswer',
        easeFactor: 2.5,
        interval: 1,
        lastReviewed: null,
        nextReviewDate: new Date(),
      });
    });

    // Multiple choice questions
    analysis.keyTerms.slice(0, 2).forEach((term, index) => {
      const distractors = analysis.keyTerms.filter(t => t !== term).slice(0, 3);
      if (distractors.length >= 3) {
        questions.push({
          id: `hybrid-improved-mc-${Date.now()}-${index}`,
          folder_id: notes[0]?.folder_id || '',
          note_id: notes[0]?.id || '',
          user_id: notes[0]?.user_id || '',
          question: `Which term is most central to the main concepts discussed?`,
          answer: term,
          type: 'multipleChoice',
          options: [term, ...distractors].sort(() => Math.random() - 0.5),
          easeFactor: 2.5,
          interval: 1,
          lastReviewed: null,
          nextReviewDate: new Date(),
        });
      }
    });

    // Process questions
    analysis.processes.slice(0, 2).forEach((process, index) => {
      questions.push({
        id: `hybrid-improved-process-${Date.now()}-${index}`,
        folder_id: notes[0]?.folder_id || '',
        note_id: notes[0]?.id || '',
        user_id: notes[0]?.user_id || '',
        question: `Describe the process: "${process.substring(0, 50)}..."`,
        answer: process,
        type: 'shortAnswer',
        easeFactor: 2.5,
        interval: 1,
        lastReviewed: null,
        nextReviewDate: new Date(),
      });
    });

    return questions;
  }

  private analyzeContent(content: string) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    
    // Extract key terms
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      if (!this.isCommonWord(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    const keyTerms = Object.entries(frequency)
      .filter(([word, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);

    // Extract concepts
    const conceptIndicators = ['concept of', 'principle of', 'framework', 'approach', 'theory', 'method'];
    const concepts: string[] = [];
    
    sentences.forEach(sentence => {
      conceptIndicators.forEach(indicator => {
        if (sentence.toLowerCase().includes(indicator)) {
          const match = sentence.match(new RegExp(`${indicator}\\s+([^,.!?]+)`, 'i'));
          if (match) {
            concepts.push(match[1].trim());
          }
        }
      });
    });

    // Extract processes
    const processIndicators = ['first', 'second', 'then', 'next', 'finally', 'step', 'process'];
    const processes: string[] = [];
    
    sentences.forEach(sentence => {
      if (processIndicators.some(indicator => sentence.toLowerCase().includes(indicator))) {
        processes.push(sentence.trim());
      }
    });

    return {
      keyTerms,
      concepts: [...new Set(concepts)].slice(0, 8),
      processes: processes.slice(0, 6)
    };
  }

  private findKeyWordIndex(words: string[]): number {
    // Find the most meaningful word to blank out
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[^\w]/g, '');
      if (word.length > 4 && !this.isCommonWord(word)) {
        return i;
      }
    }
    return Math.floor(words.length / 2); // Fallback to middle word
  }

  private selectBestQuestions(questions: QuizQuestion[], count: number, content: string): QuizQuestion[] {
    // Score each question based on quality metrics
    const scoredQuestions = questions.map(q => ({
      question: q,
      score: this.calculateQuestionQuality(q, content)
    }));

    // Sort by score and select top questions
    return scoredQuestions
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.question);
  }

  private calculateQuestionQuality(question: QuizQuestion, content: string): number {
    let score = 5; // Base score

    // Relevance scoring
    const contentWords = content.toLowerCase().split(/\s+/);
    const questionWords = question.question.toLowerCase().split(/\s+/);
    const relevance = questionWords.filter(word => 
      word.length > 3 && contentWords.includes(word)
    ).length / questionWords.length;
    score += relevance * 3;

    // Length and complexity scoring
    if (question.question.length > 50) score += 1;
    if (question.answer.length > 10) score += 1;
    if (question.type === 'multipleChoice') score += 1;
    if (question.type === 'shortAnswer') score += 0.5;

    // Penalize very short or very long questions
    if (question.question.length < 20) score -= 2;
    if (question.question.length > 200) score -= 1;

    return Math.max(0, Math.min(10, score));
  }

  private applyContentTypeOptimizations(questions: QuizQuestion[], contentType: string): QuizQuestion[] {
    switch (contentType) {
      case 'journal':
        // Prefer short answer and reflection questions for journal content
        return questions.filter(q => 
          q.type === 'shortAnswer' || q.type === 'fillInBlank'
        );
      
      case 'bookNotes':
        // Prefer structured questions for book notes
        return questions.filter(q => 
          q.type === 'fillInBlank' || q.type === 'multipleChoice'
        );
      
      case 'business':
        // Prefer application and process questions for business content
        return questions.filter(q => 
          q.type === 'shortAnswer' || q.type === 'multipleChoice'
        );
      
      default:
        return questions;
    }
  }

  private filterAndDeduplicateQuestions(questions: QuizQuestion[], minQuality: number, content: string): QuizQuestion[] {
    // Filter by quality
    const qualityFiltered = questions.filter(q => 
      this.calculateQuestionQuality(q, content) >= minQuality
    );

    // Remove duplicates based on question similarity
    const deduplicated: QuizQuestion[] = [];
    
    qualityFiltered.forEach(question => {
      const isDuplicate = deduplicated.some(existing => 
        this.calculateSimilarity(question.question, existing.question) > 0.7
      );
      
      if (!isDuplicate) {
        deduplicated.push(question);
      }
    });

    return deduplicated;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word)).length;
    const union = new Set([...words1, ...words2]).size;
    
    return intersection / union;
  }

  private extractConceptDefinition(concept: string, content: string): string {
    const sentences = content.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(concept.toLowerCase())) {
        return sentence.trim().substring(0, 120) + '...';
      }
    }
    
    return `The concept of ${concept} as discussed in the content.`;
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 
      'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 
      'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'way',
      'this', 'that', 'they', 'them', 'then', 'when', 'where', 'what', 
      'which', 'would', 'could', 'should', 'have', 'will', 'been', 'were',
      'said', 'each', 'more', 'very', 'like', 'into', 'over', 'also', 'back',
      'after', 'first', 'well', 'year', 'work', 'such', 'make', 'even', 'most'
    ];
    
    return commonWords.includes(word.toLowerCase()) || word.length < 4;
  }
}

export const hybridQuizService = new HybridQuizService(); 