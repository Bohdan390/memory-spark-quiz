import { Note, QuizQuestion, QuestionType, QuestionDifficulty, LearningMetrics } from '@/types/models';

interface ContentContext {
  keyTerms: { term: string; frequency: number; importance: number }[];
  concepts: { concept: string; definition: string; context: string }[];
  facts: { fact: string; context: string; category: string }[];
  processes: { process: string; steps: string[]; category: string }[];
  relationships: { entities: string[]; relationship: string; context: string }[];
  definitions: { term: string; definition: string; context: string }[];
  examples: { concept: string; example: string; context: string }[];
  comparisons: { items: string[]; aspects: string[]; context: string }[];
}

class EnhancedQuizService {
  
  async generateEnhancedQuiz(notes: Note[]): Promise<QuizQuestion[]> {
    const allContent = notes.map(note => `${note.title}: ${note.content}`).join('\n\n');
    
    if (!allContent.trim()) {
      return [];
    }

    // Deep content analysis
    const context = this.performDeepContentAnalysis(allContent);
    
    // Generate diverse, high-quality questions with new types
    const questions: QuizQuestion[] = [];
    
    // 1. Flashcards (20% - core memory building)
    questions.push(...this.generateFlashcards(context, notes));
    
    // 2. Cloze deletion (15% - active recall)
    questions.push(...this.generateClozeDeletion(context, notes));
    
    // 3. Fill-in-blank (15% - maintains proven effectiveness)
    questions.push(...this.generateHighRelevanceFillBlanks(context, notes));
    
    // 4. Multiple choice (10% - recognition practice)
    questions.push(...this.generateMultipleChoiceQuestions(context, notes));
    
    // 5. Matching questions (10% - relationship learning)
    questions.push(...this.generateMatchingQuestions(context, notes));
    
    // 6. Ordering questions (8% - sequence learning)
    questions.push(...this.generateOrderingQuestions(context, notes));
    
    // 7. Definition questions (7% - concept mastery)
    questions.push(...this.generateDefinitionQuestions(context, notes));
    
    // 8. Comparison questions (5% - analytical thinking)
    questions.push(...this.generateComparisonQuestions(context, notes));
    
    // 9. Application questions (5% - practical application)
    questions.push(...this.generateApplicationQuestions(context, notes));
    
    // 10. Explanation questions (5% - deep understanding)
    questions.push(...this.generateExplanationQuestions(context, notes));
    
    // Quality enhancement and optimization
    const optimizedQuestions = this.optimizeQuestionSet(questions, context);
    
    return optimizedQuestions.slice(0, 25); // Target 25 diverse questions
  }

  private performDeepContentAnalysis(content: string): ContentContext {
    // Extract key terms with importance scoring
    const keyTerms = this.extractKeyTermsWithImportance(content);
    
    // Extract concepts and definitions
    const concepts = this.extractConceptsWithDefinitions(content);
    
    // Extract factual information
    const facts = this.extractCategorizedFacts(content);
    
    // Extract processes and procedures
    const processes = this.extractProcessesAndProcedures(content);
    
    // Extract relationships between entities
    const relationships = this.extractRelationships(content);
    
    // Extract definitions
    const definitions = this.extractDefinitions(content);
    
    // Extract examples
    const examples = this.extractExamples(content);
    
    // Extract comparisons
    const comparisons = this.extractComparisons(content);
    
    return {
      keyTerms,
      concepts,
      facts,
      processes,
      relationships,
      definitions,
      examples,
      comparisons
    };
  }

  private extractKeyTermsWithImportance(content: string) {
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const frequency: { [key: string]: number } = {};
    const positions: { [key: string]: number[] } = {};
    
    // Count frequency and track positions
    words.forEach((word, index) => {
      if (!this.isCommonWord(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
        if (!positions[word]) positions[word] = [];
        positions[word].push(index);
      }
    });
    
    // Calculate importance based on frequency, position, and context
    return Object.entries(frequency)
      .filter(([word, count]) => count >= 2)
      .map(([term, freq]) => {
        let importance = freq;
        
        // Boost importance for terms in titles or early positions
        const avgPosition = positions[term].reduce((a, b) => a + b, 0) / positions[term].length;
        if (avgPosition < words.length * 0.2) importance += 2; // Early in content
        
        // Boost for capitalized terms (proper nouns, concepts)
        if (content.includes(term.charAt(0).toUpperCase() + term.slice(1))) importance += 1;
        
        return { term, frequency: freq, importance };
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 20);
  }

  private extractConceptsWithDefinitions(content: string) {
    const concepts: { concept: string; definition: string; context: string }[] = [];
    
    // Look for definition patterns
    const definitionPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is\s+([^.!?]+[.!?])/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*:\s*([^.!?]+[.!?])/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+refers?\s+to\s+([^.!?]+[.!?])/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+means?\s+([^.!?]+[.!?])/g
    ];
    
    definitionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null && concepts.length < 10) {
        const concept = match[1].trim();
        const definition = match[2].trim();
        const context = this.extractSentenceContext(content, match.index);
        
        if (concept.length > 2 && definition.length > 10) {
          concepts.push({ concept, definition, context });
        }
      }
    });
    
    return concepts.slice(0, 8);
  }

  private extractCategorizedFacts(content: string) {
    const facts: { fact: string; context: string; category: string }[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length < 15 || trimmed.length > 200) return;
      
      // Categorize facts
      let category = 'general';
      if (/\b\d+\b/.test(trimmed)) category = 'numerical';
      if (/\b(when|where|who|what|how)\b/i.test(trimmed)) category = 'descriptive';
      if (/\b(because|since|due to|as a result)\b/i.test(trimmed)) category = 'causal';
      if (/\b(first|then|next|finally|after)\b/i.test(trimmed)) category = 'sequential';
      
      const context = this.extractSentenceContext(content, content.indexOf(trimmed));
      facts.push({ fact: trimmed, context, category });
    });
    
    return facts.slice(0, 12);
  }

  private extractProcessesAndProcedures(content: string) {
    const processes: { process: string; steps: string[]; category: string }[] = [];
    
    // Look for step-by-step patterns
    const stepPatterns = [
      /(?:first|1\.?\s*|step\s*1)/i,
      /(?:second|2\.?\s*|step\s*2)/i,
      /(?:third|3\.?\s*|step\s*3)/i,
      /(?:then|next|after)/i,
      /(?:finally|last|end)/i
    ];
    
    const sentences = content.split(/[.!?]+/);
    let currentProcess: string[] = [];
    let processTitle = '';
    
    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (trimmed.length < 10) return;
      
      const hasStepIndicator = stepPatterns.some(pattern => pattern.test(trimmed));
      
      if (hasStepIndicator) {
        if (currentProcess.length === 0 && index > 0) {
          processTitle = sentences[index - 1].trim();
        }
        currentProcess.push(trimmed);
      } else if (currentProcess.length > 0) {
        // End of process
        if (currentProcess.length >= 2) {
          processes.push({
            process: processTitle || currentProcess[0],
            steps: currentProcess,
            category: 'procedure'
          });
        }
        currentProcess = [];
        processTitle = '';
      }
    });
    
    return processes.slice(0, 5);
  }

  private extractRelationships(content: string) {
    const relationships: { entities: string[]; relationship: string; context: string }[] = [];
    
    // Look for relationship patterns
    const relationshipPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:causes?|leads?\s+to|results?\s+in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is\s+related\s+to|connects?\s+to|influences?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:vs\.?|versus|compared\s+to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    ];
    
    relationshipPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null && relationships.length < 8) {
        const entity1 = match[1].trim();
        const entity2 = match[2].trim();
        const context = this.extractSentenceContext(content, match.index);
        
        relationships.push({
          entities: [entity1, entity2],
          relationship: match[0],
          context
        });
      }
    });
    
    return relationships.slice(0, 6);
  }

  private extractDefinitions(content: string) {
    const definitions: { term: string; definition: string; context: string }[] = [];
    
    // Enhanced definition patterns
    const patterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is\s+defined\s+as\s+([^.!?]+)/g,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*-\s*([^.!?]+)/g,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(\s*([^)]+)\s*\)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null && definitions.length < 10) {
        const term = match[1].trim();
        const definition = match[2].trim();
        const context = this.extractSentenceContext(content, match.index);
        
        if (term.length > 2 && definition.length > 5) {
          definitions.push({ term, definition, context });
        }
      }
    });
    
    return definitions.slice(0, 8);
  }

  private extractExamples(content: string) {
    const examples: { concept: string; example: string; context: string }[] = [];
    
    // Look for example patterns
    const examplePatterns = [
      /(?:for\s+example|e\.g\.|such\s+as|including|like)\s+([^.!?]+)/gi,
      /([^.!?]+)\s+(?:is\s+an?\s+example\s+of|exemplifies|illustrates)\s+([^.!?]+)/gi
    ];
    
    examplePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null && examples.length < 6) {
        const context = this.extractSentenceContext(content, match.index);
        examples.push({
          concept: 'example',
          example: match[1].trim(),
          context
        });
      }
    });
    
    return examples.slice(0, 5);
  }

  private extractComparisons(content: string) {
    const comparisons: { items: string[]; aspects: string[]; context: string }[] = [];
    
    // Look for comparison patterns
    const comparisonPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:differs?\s+from|vs\.?|versus|compared\s+to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /(?:both|either)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+and\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    ];
    
    comparisonPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null && comparisons.length < 4) {
        const item1 = match[1].trim();
        const item2 = match[2].trim();
        const context = this.extractSentenceContext(content, match.index);
        
        comparisons.push({
          items: [item1, item2],
          aspects: ['comparison'],
          context
        });
      }
    });
    
    return comparisons.slice(0, 3);
  }

  private generateFlashcards(context: ContentContext, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    // Generate flashcards from key concepts
    context.concepts.slice(0, 5).forEach((concept, index) => {
      questions.push(this.createQuestion({
        id: `flashcard-concept-${Date.now()}-${index}`,
        type: 'flashcard',
        front: concept.concept,
        back: concept.definition,
        question: concept.concept,
        answer: concept.definition,
        explanation: `This is a key concept from your notes: ${concept.context}`,
        difficulty: this.determineDifficulty(concept.definition.length, 'intermediate'),
        notes
      }));
    });
    
    // Generate flashcards from definitions
    context.definitions.slice(0, 3).forEach((def, index) => {
      questions.push(this.createQuestion({
        id: `flashcard-def-${Date.now()}-${index}`,
        type: 'flashcard',
        front: `What is ${def.term}?`,
        back: def.definition,
        question: `What is ${def.term}?`,
        answer: def.definition,
        difficulty: this.determineDifficulty(def.definition.length, 'beginner'),
        notes
      }));
    });
    
    return questions;
  }

  private generateClozeDeletion(context: ContentContext, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    // Generate cloze deletion from important facts
    context.facts.slice(0, 4).forEach((fact, index) => {
      const keyTerms = context.keyTerms.slice(0, 5).map(kt => kt.term);
      const blanks: string[] = [];
      let clozedText = fact.fact;
      
      // Create multiple blanks in the same sentence
      keyTerms.forEach(term => {
        if (fact.fact.toLowerCase().includes(term.toLowerCase())) {
          const regex = new RegExp(`\\b${term}\\b`, 'gi');
          clozedText = clozedText.replace(regex, `{{c${blanks.length + 1}::${term}}}`);
          blanks.push(term);
        }
      });
      
      if (blanks.length > 0) {
        questions.push(this.createQuestion({
          id: `cloze-${Date.now()}-${index}`,
          type: 'cloze',
          question: clozedText,
          answer: blanks.join(', '),
          blanks,
          explanation: `Cloze deletion helps with active recall of key terms.`,
          difficulty: this.determineDifficulty(blanks.length * 20, 'intermediate'),
          notes
        }));
      }
    });
    
    return questions;
  }

  private generateMatchingQuestions(context: ContentContext, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    // Generate matching from concepts and definitions
    if (context.concepts.length >= 3) {
      const concepts = context.concepts.slice(0, 4);
      const terms = concepts.map(c => c.concept);
      const definitions = concepts.map(c => c.definition);
      
      questions.push(this.createQuestion({
        id: `matching-concepts-${Date.now()}`,
        type: 'matching',
        question: 'Match each concept with its correct definition:',
        answer: terms.map((term, i) => `${term}: ${definitions[i]}`).join('\n'),
        options: [...terms, ...definitions.sort(() => Math.random() - 0.5)],
        explanation: 'Matching questions help reinforce concept-definition relationships.',
        difficulty: this.determineDifficulty(concepts.length * 15, 'intermediate'),
        notes
      }));
    }
    
    // Generate matching from relationships
    if (context.relationships.length >= 2) {
      const rels = context.relationships.slice(0, 3);
      const entities = rels.flatMap(r => r.entities);
      const relationships = rels.map(r => r.relationship);
      
      questions.push(this.createQuestion({
        id: `matching-relationships-${Date.now()}`,
        type: 'matching',
        question: 'Match the related entities:',
        answer: rels.map(r => `${r.entities.join(' ↔ ')}`).join('\n'),
        options: [...entities, ...relationships],
        difficulty: this.determineDifficulty(rels.length * 12, 'advanced'),
        notes
      }));
    }
    
    return questions;
  }

  private generateOrderingQuestions(context: ContentContext, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    // Generate ordering from processes
    context.processes.forEach((process, index) => {
      if (process.steps.length >= 3) {
        const shuffledSteps = [...process.steps].sort(() => Math.random() - 0.5);
        
        questions.push(this.createQuestion({
          id: `ordering-${Date.now()}-${index}`,
          type: 'ordering',
          question: `Put the following steps in the correct order for: ${process.process}`,
          answer: process.steps.join(' → '),
          options: shuffledSteps,
          correctOrder: process.steps,
          explanation: `This process has ${process.steps.length} sequential steps.`,
          difficulty: this.determineDifficulty(process.steps.length * 10, 'intermediate'),
          notes
        }));
      }
    });
    
    return questions;
  }

  private generateDefinitionQuestions(context: ContentContext, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    // Generate definition questions from key terms
    context.keyTerms.slice(0, 3).forEach((keyTerm, index) => {
      const relatedConcept = context.concepts.find(c => 
        c.concept.toLowerCase().includes(keyTerm.term.toLowerCase())
      );
      
      if (relatedConcept) {
        questions.push(this.createQuestion({
          id: `definition-${Date.now()}-${index}`,
          type: 'definition',
          question: `Define: ${keyTerm.term}`,
          answer: relatedConcept.definition,
          hint: `This term appears ${keyTerm.frequency} times in your notes`,
          difficulty: this.determineDifficulty(keyTerm.importance * 5, 'beginner'),
          notes
        }));
      }
    });
    
    return questions;
  }

  private generateComparisonQuestions(context: ContentContext, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    // Generate comparison questions
    context.comparisons.forEach((comparison, index) => {
      questions.push(this.createQuestion({
        id: `comparison-${Date.now()}-${index}`,
        type: 'comparison',
        question: `Compare and contrast: ${comparison.items.join(' vs ')}`,
        answer: `Key differences and similarities between ${comparison.items.join(' and ')}: ${comparison.context}`,
        explanation: 'Comparison questions develop analytical thinking skills.',
        difficulty: this.determineDifficulty(comparison.items.length * 20, 'advanced'),
        notes
      }));
    });
    
    return questions;
  }

  private generateApplicationQuestions(context: ContentContext, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    // Generate application scenarios from key concepts
    context.concepts.slice(0, 2).forEach((concept, index) => {
      questions.push(this.createQuestion({
        id: `application-${Date.now()}-${index}`,
        type: 'application',
        question: `How would you apply the concept of "${concept.concept}" in a real-world scenario?`,
        answer: `Application of ${concept.concept}: ${concept.definition}. This could be applied by...`,
        explanation: 'Application questions test practical understanding.',
        difficulty: this.determineDifficulty(40, 'advanced'),
        notes
      }));
    });
    
    return questions;
  }

  private generateExplanationQuestions(context: ContentContext, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    // Generate explanation questions from complex concepts
    context.concepts.slice(0, 2).forEach((concept, index) => {
      if (concept.definition.length > 50) {
        questions.push(this.createQuestion({
          id: `explanation-${Date.now()}-${index}`,
          type: 'explanation',
          question: `Explain in detail: ${concept.concept}`,
          answer: concept.definition,
          explanation: 'Explanation questions test deep understanding.',
          difficulty: this.determineDifficulty(concept.definition.length, 'expert'),
          notes
        }));
      }
    });
    
    return questions;
  }

  private generateHighRelevanceFillBlanks(context: ContentContext, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    // Use the most important key terms for fill-in-blank questions
    context.keyTerms.slice(0, 4).forEach((keyTerm, index) => {
      const termContext = this.findBestContextForTerm(keyTerm.term, notes);
      if (termContext) {
        const questionText = termContext.replace(new RegExp(`\\b${keyTerm.term}\\b`, 'gi'), '____');
        questions.push(this.createQuestion({
          id: `fillblank-${Date.now()}-${index}`,
          type: 'fillInBlank',
          question: `Fill in the blank: ${questionText}`,
          answer: keyTerm.term,
          hint: `This term has high importance (${keyTerm.importance}) in your notes`,
          difficulty: this.determineDifficulty(keyTerm.importance * 3, 'beginner'),
          notes
        }));
      }
    });
    
    return questions;
  }

  private generateMultipleChoiceQuestions(context: ContentContext, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    context.keyTerms.slice(0, 3).forEach((keyTerm, index) => {
      const distractors = context.keyTerms
        .filter(kt => kt.term !== keyTerm.term)
        .slice(0, 3)
        .map(kt => kt.term);
      
      if (distractors.length >= 3) {
        questions.push(this.createQuestion({
          id: `mc-${Date.now()}-${index}`,
          type: 'multipleChoice',
          question: `Which of the following is a key concept discussed in the content?`,
          answer: keyTerm.term,
          options: [keyTerm.term, ...distractors].sort(() => Math.random() - 0.5),
          difficulty: this.determineDifficulty(15, 'beginner'),
          notes
        }));
      }
    });
    
    return questions;
  }

  private createQuestion(params: {
    id: string;
    type: QuestionType;
    question: string;
    answer: string;
    front?: string;
    back?: string;
    hint?: string;
    explanation?: string;
    options?: string[];
    blanks?: string[];
    correctOrder?: string[];
    difficulty: QuestionDifficulty;
    notes: Note[];
  }): QuizQuestion {
    const now = new Date();
    
    return {
      id: params.id,
      folder_id: params.notes[0]?.folder_id || '',
      note_id: params.notes[0]?.id || '',
      user_id: params.notes[0]?.user_id || '',
      
      // Core question data
      question: params.question,
      answer: params.answer,
      type: params.type,
      
      // Enhanced question data
      front: params.front,
      back: params.back,
      hint: params.hint,
      explanation: params.explanation,
      options: params.options,
      blanks: params.blanks,
      correctOrder: params.correctOrder,
      tags: [params.type, params.difficulty.level],
      
      // Difficulty and learning
      difficulty: params.difficulty,
      learningMetrics: {
        totalReviews: 0,
        correctStreak: 0,
        longestStreak: 0,
        averageResponseTime: 0,
        difficultyRating: 3,
        retentionRate: 0,
        lastAccuracy: 0
      },
      
      // Spaced repetition
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      lastReviewed: null,
      nextReviewDate: now,
      
      // Advanced features
      stability: 1,
      difficulty_sr: 5,
      retrievability: 0,
      lapses: 0,
      suspended: false,
      buried: false,
      
      // Metadata
      createdAt: now,
      updatedAt: now,
      source: 'generated',
      confidence: 3
    };
  }

  private determineDifficulty(complexity: number, baseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'): QuestionDifficulty {
    let level = baseLevel;
    let cognitiveLoad: 'low' | 'medium' | 'high' = 'medium';
    let timeEstimate = 30; // seconds
    
    // Adjust based on complexity
    if (complexity < 20) {
      level = 'beginner';
      cognitiveLoad = 'low';
      timeEstimate = 15;
    } else if (complexity < 40) {
      level = 'intermediate';
      cognitiveLoad = 'medium';
      timeEstimate = 30;
    } else if (complexity < 60) {
      level = 'advanced';
      cognitiveLoad = 'high';
      timeEstimate = 45;
    } else {
      level = 'expert';
      cognitiveLoad = 'high';
      timeEstimate = 60;
    }
    
    return { level, cognitiveLoad, timeEstimate };
  }

  private optimizeQuestionSet(questions: QuizQuestion[], context: ContentContext): QuizQuestion[] {
    // Score each question for quality
    const scoredQuestions = questions.map(question => ({
      question,
      score: this.calculateEnhancedQuestionQuality(question, context)
    }));
    
    // Filter by minimum quality threshold
    const qualityFiltered = scoredQuestions.filter(sq => sq.score >= 7.0);
    
    // Remove duplicates and ensure variety
    const deduplicated = this.removeDuplicatesAndEnsureVariety(qualityFiltered);
    
    // Balance question types
    const balanced = this.balanceQuestionTypes(deduplicated);
    
    return balanced.map(sq => sq.question);
  }

  private calculateEnhancedQuestionQuality(question: QuizQuestion, context: ContentContext): number {
    let score = 0;
    
    // Relevance (30%)
    const relevanceScore = this.calculateRelevanceScore(question, context);
    score += relevanceScore * 0.3;
    
    // Clarity (25%)
    const clarityScore = this.calculateClarityScore(question);
    score += clarityScore * 0.25;
    
    // Difficulty appropriateness (20%)
    const difficultyScore = this.calculateDifficultyScore(question);
    score += difficultyScore * 0.2;
    
    // Variety bonus (15%)
    const varietyScore = this.calculateVarietyScore(question);
    score += varietyScore * 0.15;
    
    // Coverage (10%)
    const coverageScore = this.calculateCoverageScore(question, context);
    score += coverageScore * 0.1;
    
    return Math.min(10, score);
  }

  private calculateRelevanceScore(question: QuizQuestion, context: ContentContext): number {
    const questionWords = question.question.toLowerCase().split(/\s+/);
    const answerWords = question.answer.toLowerCase().split(/\s+/);
    
    let relevanceScore = 0;
    
    // Check against key terms
    context.keyTerms.forEach(kt => {
      if (questionWords.includes(kt.term) || answerWords.includes(kt.term)) {
        relevanceScore += kt.importance;
      }
    });
    
    // Check against concepts
    context.concepts.forEach(c => {
      if (question.question.toLowerCase().includes(c.concept.toLowerCase()) ||
          question.answer.toLowerCase().includes(c.concept.toLowerCase())) {
        relevanceScore += 3;
      }
    });
    
    return Math.min(10, relevanceScore);
  }

  private calculateClarityScore(question: QuizQuestion): number {
    let score = 8; // Base score
    
    // Check question clarity
    if (question.question.length < 10) score -= 2;
    if (question.question.length > 200) score -= 1;
    if (!question.question.includes('?') && !question.question.includes(':')) score -= 1;
    
    // Check answer clarity
    if (question.answer.length < 3) score -= 2;
    if (question.answer.length > 500) score -= 1;
    
    // Bonus for explanation
    if (question.explanation) score += 1;
    
    return Math.max(0, Math.min(10, score));
  }

  private calculateDifficultyScore(question: QuizQuestion): number {
    const { difficulty } = question;
    let score = 7; // Base score
    
    // Appropriate time estimate
    if (difficulty.timeEstimate >= 10 && difficulty.timeEstimate <= 60) score += 1;
    
    // Cognitive load alignment
    if (difficulty.cognitiveLoad === 'medium') score += 1;
    
    // Level appropriateness
    if (difficulty.level === 'intermediate' || difficulty.level === 'beginner') score += 1;
    
    return Math.min(10, score);
  }

  private calculateVarietyScore(question: QuizQuestion): number {
    // Score based on question type variety
    const typeScores: { [key in QuestionType]: number } = {
      flashcard: 8,
      cloze: 9,
      fillInBlank: 7,
      multipleChoice: 6,
      matching: 9,
      ordering: 8,
      definition: 7,
      comparison: 9,
      application: 10,
      explanation: 10,
      shortAnswer: 6,
      trueFalse: 5,
      imageOcclusion: 8,
      typing: 7,
      reversedCard: 8
    };
    
    return typeScores[question.type] || 5;
  }

  private calculateCoverageScore(question: QuizQuestion, context: ContentContext): number {
    // Check if question covers important content areas
    let score = 5; // Base score
    
    // Bonus for covering key terms
    const questionText = `${question.question} ${question.answer}`.toLowerCase();
    const keyTermsCovered = context.keyTerms.filter(kt => 
      questionText.includes(kt.term.toLowerCase())
    ).length;
    
    score += Math.min(3, keyTermsCovered);
    
    // Bonus for covering concepts
    const conceptsCovered = context.concepts.filter(c => 
      questionText.includes(c.concept.toLowerCase())
    ).length;
    
    score += Math.min(2, conceptsCovered);
    
    return Math.min(10, score);
  }

  private removeDuplicatesAndEnsureVariety(scoredQuestions: { question: QuizQuestion; score: number }[]): { question: QuizQuestion; score: number }[] {
    const deduplicated: { question: QuizQuestion; score: number }[] = [];
    
    scoredQuestions.forEach(item => {
      const isDuplicate = deduplicated.some(existing => 
        this.calculateSimilarity(item.question.question, existing.question.question) > 0.6 ||
        this.calculateSimilarity(item.question.answer, existing.question.answer) > 0.7
      );
      
      if (!isDuplicate) {
        deduplicated.push(item);
      }
    });
    
    return deduplicated;
  }

  private balanceQuestionTypes(scoredQuestions: { question: QuizQuestion; score: number }[]): { question: QuizQuestion; score: number }[] {
    // Group by question type
    const typeGroups: { [key in QuestionType]?: { question: QuizQuestion; score: number }[] } = {};
    
    scoredQuestions.forEach(sq => {
      if (!typeGroups[sq.question.type]) {
        typeGroups[sq.question.type] = [];
      }
      typeGroups[sq.question.type]!.push(sq);
    });
    
    // Balance types - take top questions from each type
    const balanced: { question: QuizQuestion; score: number }[] = [];
    const maxPerType = 4;
    
    Object.values(typeGroups).forEach(group => {
      if (group) {
        const sorted = group.sort((a, b) => b.score - a.score);
        balanced.push(...sorted.slice(0, maxPerType));
      }
    });
    
    return balanced.sort((a, b) => b.score - a.score);
  }

  // Helper methods
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use', 'way', 'will', 'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were', 'what', 'this', 'that', 'said', 'each', 'which', 'their', 'would', 'there', 'could', 'other', 'after', 'first', 'never', 'these', 'think', 'where', 'being', 'every', 'great', 'might', 'shall', 'still', 'those', 'under', 'while', 'should', 'through', 'before', 'between', 'another', 'because', 'without', 'against', 'nothing', 'someone', 'something'
    ];
    return commonWords.includes(word.toLowerCase()) || word.length < 3;
  }

  private extractSentenceContext(content: string, position: number): string {
    const sentences = content.split(/[.!?]+/);
    let currentPos = 0;
    
    for (const sentence of sentences) {
      if (currentPos + sentence.length >= position) {
        return sentence.trim();
      }
      currentPos += sentence.length + 1;
    }
    
    return content.substring(Math.max(0, position - 50), position + 50);
  }

  private findBestContextForTerm(term: string, notes: Note[]): string | null {
    const allContent = notes.map(note => note.content).join(' ');
    const regex = new RegExp(`[^.!?]*\\b${term}\\b[^.!?]*[.!?]`, 'i');
    const match = allContent.match(regex);
    return match ? match[0].trim() : null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }
}

export default EnhancedQuizService; 