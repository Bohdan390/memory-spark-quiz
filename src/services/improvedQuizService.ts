import { QuizQuestion, Note } from '@/types/models';

interface ContentAnalysis {
  keyTerms: string[];
  concepts: string[];
  facts: string[];
  processes: string[];
  relationships: string[];
}

class ImprovedQuizService {
  
  async generateQuizWithImprovedAI(notes: Note[]): Promise<QuizQuestion[]> {
    const allContent = notes.map(note => `${note.title}: ${note.content}`).join('\n\n');
    
    if (!allContent.trim()) {
      return [];
    }

    // Analyze content structure
    const analysis = this.analyzeContent(allContent);
    
    // Generate diverse question types
    const questions: QuizQuestion[] = [];
    
    // 1. Concept-based questions (30%)
    questions.push(...this.generateConceptQuestions(analysis, notes));
    
    // 2. Fact-based questions (25%)
    questions.push(...this.generateFactQuestions(analysis, notes));
    
    // 3. Process/procedure questions (20%)
    questions.push(...this.generateProcessQuestions(analysis, notes));
    
    // 4. Relationship/comparison questions (15%)
    questions.push(...this.generateRelationshipQuestions(analysis, notes));
    
    // 5. Application/scenario questions (10%)
    questions.push(...this.generateApplicationQuestions(analysis, notes));
    
    // Ensure variety and quality
    return this.optimizeQuestionSet(questions);
  }

  private analyzeContent(content: string): ContentAnalysis {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
    const words = content.toLowerCase().split(/\s+/);
    
    // Identify key terms (important nouns and concepts)
    const keyTerms = this.extractKeyTerms(content);
    
    // Identify concepts (abstract ideas, theories, principles)
    const concepts = this.extractConcepts(sentences);
    
    // Identify facts (specific information, numbers, names)
    const facts = this.extractFacts(sentences);
    
    // Identify processes (step-by-step procedures, workflows)
    const processes = this.extractProcesses(sentences);
    
    // Identify relationships (connections between ideas)
    const relationships = this.extractRelationships(sentences);
    
    return {
      keyTerms,
      concepts,
      facts,
      processes,
      relationships
    };
  }

  private extractKeyTerms(content: string): string[] {
    // Extract important terms using frequency and context analysis
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const frequency: { [key: string]: number } = {};
    
    // Count word frequency
    words.forEach(word => {
      if (!this.isCommonWord(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    // Sort by frequency and filter
    return Object.entries(frequency)
      .filter(([word, count]) => count >= 2 && word.length > 4)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  private extractConcepts(sentences: string[]): string[] {
    const conceptIndicators = [
      'concept of', 'principle of', 'theory of', 'idea of', 'notion of',
      'approach to', 'method of', 'technique of', 'practice of',
      'framework', 'model', 'system', 'strategy', 'philosophy'
    ];
    
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
    
    return [...new Set(concepts)].slice(0, 10);
  }

  private extractFacts(sentences: string[]): string[] {
    const facts: string[] = [];
    
    sentences.forEach(sentence => {
      // Look for numerical facts
      const numberMatches = sentence.match(/\b\d+[%\w\s]*\b/g);
      if (numberMatches) {
        facts.push(...numberMatches);
      }
      
      // Look for specific names and proper nouns
      const nameMatches = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
      if (nameMatches) {
        facts.push(...nameMatches.filter(name => name.length > 3));
      }
    });
    
    return [...new Set(facts)].slice(0, 15);
  }

  private extractProcesses(sentences: string[]): string[] {
    const processIndicators = [
      'first', 'second', 'third', 'next', 'then', 'finally',
      'step', 'stage', 'phase', 'process', 'procedure',
      'involves', 'requires', 'begins with', 'starts by'
    ];
    
    const processes: string[] = [];
    
    sentences.forEach(sentence => {
      const hasProcessIndicator = processIndicators.some(indicator => 
        sentence.toLowerCase().includes(indicator)
      );
      
      if (hasProcessIndicator) {
        processes.push(sentence.trim());
      }
    });
    
    return processes.slice(0, 8);
  }

  private extractRelationships(sentences: string[]): string[] {
    const relationshipIndicators = [
      'compared to', 'versus', 'while', 'whereas', 'however',
      'similar to', 'different from', 'relates to', 'connects to',
      'causes', 'leads to', 'results in', 'because', 'due to'
    ];
    
    const relationships: string[] = [];
    
    sentences.forEach(sentence => {
      relationshipIndicators.forEach(indicator => {
        if (sentence.toLowerCase().includes(indicator)) {
          relationships.push(sentence.trim());
        }
      });
    });
    
    return [...new Set(relationships)].slice(0, 6);
  }

  private generateConceptQuestions(analysis: ContentAnalysis, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    analysis.concepts.forEach((concept, index) => {
      if (index < 3) { // Limit to 3 concept questions
        questions.push({
          id: `concept-${Date.now()}-${index}`,
          folder_id: '',
          note_id: notes[0]?.id || '',
          user_id: '',
          question: `Explain the concept of ${concept.toLowerCase()}.`,
          answer: this.extractConceptDefinition(concept, notes),
          type: 'shortAnswer',
          easeFactor: 2.5,
          interval: 1,
          lastReviewed: null,
          nextReviewDate: new Date(),
        });
      }
    });
    
    return questions;
  }

  private generateFactQuestions(analysis: ContentAnalysis, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    analysis.facts.forEach((fact, index) => {
      if (index < 3 && fact.length > 3) {
        // Create fill-in-the-blank questions for facts
        const noteContent = notes.map(n => n.content).join(' ');
        const factContext = this.findFactContext(fact, noteContent);
        
        if (factContext) {
          const questionText = factContext.replace(fact, '____');
          questions.push({
            id: `fact-${Date.now()}-${index}`,
            folder_id: '',
            note_id: notes[0]?.id || '',
            user_id: '',
            question: `Fill in the blank: ${questionText}`,
            answer: fact,
            type: 'fillInBlank',
            easeFactor: 2.5,
            interval: 1,
            lastReviewed: null,
            nextReviewDate: new Date(),
          });
        }
      }
    });
    
    return questions;
  }

  private generateProcessQuestions(analysis: ContentAnalysis, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    analysis.processes.forEach((process, index) => {
      if (index < 2) {
        questions.push({
          id: `process-${Date.now()}-${index}`,
          folder_id: '',
          note_id: notes[0]?.id || '',
          user_id: '',
          question: `Describe the process mentioned: "${process.substring(0, 50)}..."`,
          answer: process,
          type: 'shortAnswer',
          easeFactor: 2.5,
          interval: 1,
          lastReviewed: null,
          nextReviewDate: new Date(),
        });
      }
    });
    
    return questions;
  }

  private generateRelationshipQuestions(analysis: ContentAnalysis, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    analysis.relationships.forEach((relationship, index) => {
      if (index < 2) {
        questions.push({
          id: `relationship-${Date.now()}-${index}`,
          folder_id: '',
          note_id: notes[0]?.id || '',
          user_id: '',
          question: `What is the relationship described in: "${relationship.substring(0, 60)}..."?`,
          answer: this.extractRelationshipCore(relationship),
          type: 'shortAnswer',
          easeFactor: 2.5,
          interval: 1,
          lastReviewed: null,
          nextReviewDate: new Date(),
        });
      }
    });
    
    return questions;
  }

  private generateApplicationQuestions(analysis: ContentAnalysis, notes: Note[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    // Generate scenario-based questions
    const mainTopics = analysis.keyTerms.slice(0, 3);
    
    mainTopics.forEach((topic, index) => {
      questions.push({
        id: `application-${Date.now()}-${index}`,
        folder_id: '',
        note_id: notes[0]?.id || '',
        user_id: '',
        question: `How would you apply the principles related to ${topic} in a real-world scenario?`,
        answer: `Application would involve understanding ${topic} and implementing its core principles in practical situations.`,
        type: 'shortAnswer',
        easeFactor: 2.5,
        interval: 1,
        lastReviewed: null,
        nextReviewDate: new Date(),
      });
    });
    
    return questions.slice(0, 1); // Limit to 1 application question
  }

  private optimizeQuestionSet(questions: QuizQuestion[]): QuizQuestion[] {
    // Remove duplicates
    const uniqueQuestions = questions.filter((q, index, arr) => 
      arr.findIndex(other => other.question === q.question) === index
    );
    
    // Ensure variety in question types
    const typeDistribution = this.balanceQuestionTypes(uniqueQuestions);
    
    // Sort by quality (longer, more detailed questions first)
    return typeDistribution
      .sort((a, b) => (b.question.length + b.answer.length) - (a.question.length + a.answer.length))
      .slice(0, 12); // Limit to 12 questions max
  }

  private balanceQuestionTypes(questions: QuizQuestion[]): QuizQuestion[] {
    const typeGroups: { [key: string]: QuizQuestion[] } = {};
    
    questions.forEach(q => {
      if (!typeGroups[q.type]) typeGroups[q.type] = [];
      typeGroups[q.type].push(q);
    });
    
    // Ensure we have at least 2 of each type if available
    const balanced: QuizQuestion[] = [];
    
    Object.values(typeGroups).forEach(group => {
      balanced.push(...group.slice(0, Math.max(2, Math.floor(group.length / 2))));
    });
    
    return balanced;
  }

  private extractConceptDefinition(concept: string, notes: Note[]): string {
    const allContent = notes.map(n => n.content).join(' ');
    const sentences = allContent.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(concept.toLowerCase())) {
        return sentence.trim().substring(0, 150) + '...';
      }
    }
    
    return `The concept of ${concept} as discussed in the content.`;
  }

  private findFactContext(fact: string, content: string): string | null {
    const sentences = content.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.includes(fact)) {
        return sentence.trim();
      }
    }
    
    return null;
  }

  private extractRelationshipCore(relationship: string): string {
    // Extract the core relationship being described
    const relationshipWords = ['because', 'due to', 'leads to', 'causes', 'results in'];
    
    for (const word of relationshipWords) {
      if (relationship.toLowerCase().includes(word)) {
        const parts = relationship.split(new RegExp(word, 'i'));
        if (parts.length === 2) {
          return `${parts[0].trim()} ${word} ${parts[1].trim()}`;
        }
      }
    }
    
    return relationship.substring(0, 100) + '...';
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'way', 'she', 'may', 'use', 'her', 'than', 'this', 'that', 'they', 'them', 'then', 'when', 'where', 'what', 'which', 'would', 'could', 'should', 'have', 'will', 'been', 'were', 'said', 'each', 'more', 'very', 'like', 'into', 'over', 'also', 'back', 'after', 'first', 'well', 'year', 'work', 'such', 'make', 'even', 'most', 'some', 'time'
    ];
    
    return commonWords.includes(word.toLowerCase()) || word.length < 4;
  }
}

export const improvedQuizService = new ImprovedQuizService(); 