import { QuizQuestion, MemoryTechnique, QuestionType } from '@/types/models';

export class MemoryTechniquesService {
  
  // Predefined memory techniques
  private static techniques: MemoryTechnique[] = [
    {
      id: 'acronym',
      name: 'Acronyms',
      description: 'Create memorable abbreviations using first letters of items',
      instructions: [
        'Take the first letter of each item you need to remember',
        'Create a memorable word or phrase from these letters',
        'Practice saying the acronym and what each letter represents',
        'Example: ROYGBIV for rainbow colors (Red, Orange, Yellow, Green, Blue, Indigo, Violet)'
      ],
      effectiveness: 8,
      applicableTypes: ['fillInBlank', 'ordering', 'multipleChoice', 'cloze']
    },
    {
      id: 'visualization',
      name: 'Visualization',
      description: 'Create vivid mental images to remember information',
      instructions: [
        'Form a clear, detailed mental picture of the concept',
        'Make the image unusual, colorful, or exaggerated',
        'Connect the image to something you already know',
        'Practice recalling the image and its meaning'
      ],
      effectiveness: 9,
      applicableTypes: ['flashcard', 'definition', 'explanation', 'application']
    },
    {
      id: 'storytelling',
      name: 'Story Method',
      description: 'Connect information through narrative storytelling',
      instructions: [
        'Create a story that includes all the items you need to remember',
        'Make the story vivid and memorable with action and emotion',
        'Practice telling the story from beginning to end',
        'Use the story structure to recall the information in order'
      ],
      effectiveness: 8,
      applicableTypes: ['ordering', 'cloze', 'explanation', 'comparison']
    },
    {
      id: 'chunking',
      name: 'Chunking',
      description: 'Break large amounts of information into smaller, manageable pieces',
      instructions: [
        'Divide the information into logical groups or categories',
        'Limit each chunk to 5-7 items maximum',
        'Find patterns or relationships within each chunk',
        'Practice recalling one chunk at a time, then combine them'
      ],
      effectiveness: 7,
      applicableTypes: ['multipleChoice', 'matching', 'fillInBlank', 'cloze']
    },
    {
      id: 'association',
      name: 'Association',
      description: 'Link new information to things you already know',
      instructions: [
        'Find similarities between new and familiar information',
        'Create logical connections or relationships',
        'Use analogies and metaphors to make connections',
        'Practice explaining the new concept using familiar terms'
      ],
      effectiveness: 8,
      applicableTypes: ['definition', 'comparison', 'application', 'explanation']
    },
    {
      id: 'rhyme',
      name: 'Rhymes and Songs',
      description: 'Use rhythm and rhyme to make information memorable',
      instructions: [
        'Create a simple rhyme or song with the information',
        'Use a familiar tune if possible',
        'Include rhythm and repetition',
        'Practice singing or reciting until it becomes automatic'
      ],
      effectiveness: 7,
      applicableTypes: ['fillInBlank', 'ordering', 'flashcard', 'typing']
    },
    {
      id: 'memoryPalace',
      name: 'Memory Palace',
      description: 'Use familiar locations to organize and remember information',
      instructions: [
        'Choose a familiar place (your home, school, etc.)',
        'Create a specific route through this place',
        'Place each piece of information at specific locations along the route',
        'Walk through your memory palace mentally to recall information'
      ],
      effectiveness: 9,
      applicableTypes: ['ordering', 'matching', 'explanation', 'application']
    },
    {
      id: 'repetition',
      name: 'Spaced Repetition',
      description: 'Review information at increasing intervals',
      instructions: [
        'Review the information immediately after learning',
        'Review again after 1 day, then 3 days, then 1 week',
        'Continue increasing intervals: 2 weeks, 1 month, 3 months',
        'Focus more time on items you find difficult'
      ],
      effectiveness: 10,
      applicableTypes: ['flashcard', 'fillInBlank', 'definition', 'typing']
    }
  ];

  /**
   * Get all available memory techniques
   */
  static getAllTechniques(): MemoryTechnique[] {
    return this.techniques;
  }

  /**
   * Get techniques suitable for a specific question type
   */
  static getTechniquesForQuestionType(questionType: QuestionType): MemoryTechnique[] {
    return this.techniques.filter(technique => 
      technique.applicableTypes.includes(questionType)
    ).sort((a, b) => b.effectiveness - a.effectiveness);
  }

  /**
   * Generate specific mnemonics for a question
   */
  static generateMnemonicsForQuestion(question: QuizQuestion): string[] {
    const mnemonics: string[] = [];
    const { type, question: questionText, answer, front, back } = question;

    // Generate acronym mnemonics
    if (['fillInBlank', 'ordering', 'multipleChoice'].includes(type)) {
      const acronymMnemonic = this.generateAcronymMnemonic(answer);
      if (acronymMnemonic) mnemonics.push(acronymMnemonic);
    }

    // Generate visualization mnemonics
    if (['flashcard', 'definition', 'explanation'].includes(type)) {
      const visualMnemonic = this.generateVisualizationMnemonic(questionText, answer);
      if (visualMnemonic) mnemonics.push(visualMnemonic);
    }

    // Generate association mnemonics
    if (['definition', 'comparison', 'application'].includes(type)) {
      const associationMnemonic = this.generateAssociationMnemonic(questionText, answer);
      if (associationMnemonic) mnemonics.push(associationMnemonic);
    }

    // Generate rhyme mnemonics
    if (['fillInBlank', 'flashcard', 'typing'].includes(type)) {
      const rhymeMnemonic = this.generateRhymeMnemonic(answer);
      if (rhymeMnemonic) mnemonics.push(rhymeMnemonic);
    }

    return mnemonics.slice(0, 3); // Limit to 3 mnemonics per question
  }

  /**
   * Generate memory palace location for a question
   */
  static generateMemoryPalaceLocation(question: QuizQuestion, locationIndex: number): {
    location: string;
    visualization: string;
    associations: string[];
  } | null {
    const locations = [
      'front door', 'living room', 'kitchen', 'bedroom', 'bathroom',
      'garage', 'garden', 'attic', 'basement', 'study room'
    ];

    if (locationIndex >= locations.length) return null;

    const location = locations[locationIndex];
    const concept = this.extractMainConcept(question.question);
    const answer = question.answer;

    return {
      location,
      visualization: `In the ${location}, imagine ${concept} represented by ${answer}`,
      associations: [
        `${location} → ${concept}`,
        `Visual: ${answer} in ${location}`,
        `Action: Interacting with ${answer} in ${location}`
      ]
    };
  }

  /**
   * Analyze question difficulty and suggest appropriate techniques
   */
  static suggestTechniquesForDifficulty(question: QuizQuestion): MemoryTechnique[] {
    const { difficulty, type, learningMetrics } = question;
    let suggestedTechniques: MemoryTechnique[] = [];

    // For difficult questions or low retention
    if (difficulty.level === 'expert' || difficulty.level === 'advanced' || 
        learningMetrics.retentionRate < 70) {
      suggestedTechniques = this.techniques.filter(t => 
        t.effectiveness >= 8 && t.applicableTypes.includes(type)
      );
    }
    // For intermediate questions
    else if (difficulty.level === 'intermediate') {
      suggestedTechniques = this.techniques.filter(t => 
        t.effectiveness >= 7 && t.applicableTypes.includes(type)
      );
    }
    // For beginner questions
    else {
      suggestedTechniques = this.techniques.filter(t => 
        t.applicableTypes.includes(type)
      );
    }

    return suggestedTechniques.sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 3);
  }

  /**
   * Create personalized study plan based on learning metrics
   */
  static createPersonalizedStudyPlan(questions: QuizQuestion[]): {
    focusAreas: string[];
    recommendedTechniques: MemoryTechnique[];
    studySchedule: { [key: string]: number }; // minutes per technique
    tips: string[];
  } {
    // Analyze performance patterns
    const lowPerformanceQuestions = questions.filter(q => 
      q.learningMetrics.retentionRate < 70 || q.learningMetrics.correctStreak < 3
    );

    const questionTypes = [...new Set(questions.map(q => q.type))];
    const difficultTypes = [...new Set(lowPerformanceQuestions.map(q => q.type))];

    // Identify focus areas
    const focusAreas: string[] = [];
    if (difficultTypes.includes('flashcard')) focusAreas.push('Basic recall and recognition');
    if (difficultTypes.includes('cloze')) focusAreas.push('Active recall with context');
    if (difficultTypes.includes('application')) focusAreas.push('Practical application of concepts');
    if (difficultTypes.includes('explanation')) focusAreas.push('Deep understanding and explanation');

    // Recommend techniques based on difficult types
    const recommendedTechniques = difficultTypes.flatMap(type => 
      this.getTechniquesForQuestionType(type as QuestionType)
    ).filter((technique, index, self) => 
      index === self.findIndex(t => t.id === technique.id)
    ).slice(0, 4);

    // Create study schedule
    const studySchedule: { [key: string]: number } = {};
    recommendedTechniques.forEach(technique => {
      studySchedule[technique.name] = Math.max(10, technique.effectiveness * 2);
    });

    // Generate personalized tips
    const tips: string[] = [];
    const avgRetention = questions.reduce((sum, q) => sum + q.learningMetrics.retentionRate, 0) / questions.length;
    
    if (avgRetention < 60) {
      tips.push('Focus on spaced repetition - review difficult cards more frequently');
      tips.push('Use multiple memory techniques for the same information');
    } else if (avgRetention < 80) {
      tips.push('You\'re making good progress! Try adding visualization techniques');
      tips.push('Create connections between related concepts');
    } else {
      tips.push('Excellent retention! Consider teaching concepts to others');
      tips.push('Challenge yourself with application and explanation questions');
    }

    if (lowPerformanceQuestions.length > questions.length * 0.3) {
      tips.push('Consider breaking study sessions into shorter, more frequent intervals');
    }

    return {
      focusAreas,
      recommendedTechniques,
      studySchedule,
      tips
    };
  }

  // Private helper methods

  private static generateAcronymMnemonic(text: string): string | null {
    const words = text.split(/\s+/).filter(word => word.length > 2);
    if (words.length < 2 || words.length > 7) return null;

    const acronym = words.map(word => word.charAt(0).toUpperCase()).join('');
    return `Remember "${acronym}" for: ${words.join(', ')}`;
  }

  private static generateVisualizationMnemonic(question: string, answer: string): string | null {
    const concept = this.extractMainConcept(question);
    if (!concept) return null;

    const visualElements = [
      'bright colors', 'unusual size', 'unexpected movement', 'strong emotions',
      'familiar faces', 'exaggerated features', 'memorable sounds', 'distinctive textures'
    ];

    const randomElement = visualElements[Math.floor(Math.random() * visualElements.length)];
    return `Visualize ${concept} with ${randomElement} to remember: ${answer}`;
  }

  private static generateAssociationMnemonic(question: string, answer: string): string | null {
    const concept = this.extractMainConcept(question);
    if (!concept) return null;

    const commonAssociations = [
      'similar to', 'opposite of', 'reminds me of', 'works like',
      'shaped like', 'sounds like', 'feels like', 'functions as'
    ];

    const randomAssociation = commonAssociations[Math.floor(Math.random() * commonAssociations.length)];
    return `Think: ${concept} ${randomAssociation} ${this.findSimilarConcept(answer)}`;
  }

  private static generateRhymeMnemonic(text: string): string | null {
    const words = text.toLowerCase().split(/\s+/);
    const lastWord = words[words.length - 1];
    
    const rhymingWords: { [key: string]: string[] } = {
      'tion': ['nation', 'station', 'creation', 'relation'],
      'ing': ['ring', 'sing', 'bring', 'thing'],
      'ness': ['mess', 'dress', 'stress', 'success'],
      'ly': ['sky', 'high', 'try', 'fly'],
      'er': ['her', 'were', 'sure', 'pure'],
      'ed': ['red', 'bed', 'said', 'head']
    };

    for (const [ending, rhymes] of Object.entries(rhymingWords)) {
      if (lastWord.endsWith(ending)) {
        const rhyme = rhymes[Math.floor(Math.random() * rhymes.length)];
        return `"${lastWord}" rhymes with "${rhyme}" - create a simple rhyme to remember`;
      }
    }

    return null;
  }

  private static extractMainConcept(text: string): string | null {
    // Simple extraction of key concept from question text
    const words = text.split(/\s+/);
    const meaningfulWords = words.filter(word => 
      word.length > 4 && 
      !['what', 'when', 'where', 'which', 'define', 'explain', 'describe'].includes(word.toLowerCase())
    );

    return meaningfulWords.length > 0 ? meaningfulWords[0] : null;
  }

  private static findSimilarConcept(text: string): string {
    // Simple similarity matching (in a real app, this could use NLP)
    const concepts = [
      'a puzzle piece', 'a building block', 'a tool', 'a bridge',
      'a key', 'a map', 'a recipe', 'a story', 'a game', 'a journey'
    ];

    return concepts[Math.floor(Math.random() * concepts.length)];
  }

  /**
   * Generate study tips based on time of day and cognitive load
   */
  static generateStudyTips(timeOfDay: 'morning' | 'afternoon' | 'evening', cognitiveLoad: 'low' | 'medium' | 'high'): string[] {
    const tips: string[] = [];

    // Time-based tips
    if (timeOfDay === 'morning') {
      tips.push('Morning is great for learning new concepts - your mind is fresh!');
      if (cognitiveLoad === 'high') {
        tips.push('Tackle your most challenging material now while your focus is peak');
      }
    } else if (timeOfDay === 'afternoon') {
      tips.push('Afternoon is perfect for review and practice questions');
      if (cognitiveLoad === 'high') {
        tips.push('Take short breaks every 25 minutes to maintain focus');
      }
    } else {
      tips.push('Evening is ideal for light review and reflection');
      tips.push('Avoid intense new learning - focus on consolidating what you learned today');
    }

    // Cognitive load tips
    if (cognitiveLoad === 'low') {
      tips.push('Perfect time for quick flashcard reviews and easy recall practice');
      tips.push('Use this time to reinforce concepts you already know well');
    } else if (cognitiveLoad === 'medium') {
      tips.push('Good balance for mixed practice - combine review with new material');
      tips.push('Try explaining concepts out loud to deepen understanding');
    } else {
      tips.push('Focus on one concept at a time to avoid cognitive overload');
      tips.push('Use memory techniques like visualization to reduce mental effort');
    }

    return tips;
  }

  /**
   * Adaptive difficulty adjustment based on performance
   */
  static suggestDifficultyAdjustment(question: QuizQuestion): {
    shouldIncrease: boolean;
    shouldDecrease: boolean;
    reason: string;
    suggestion: string;
  } {
    const { learningMetrics, difficulty } = question;
    const { retentionRate, correctStreak, totalReviews } = learningMetrics;

    // Increase difficulty if performing well consistently
    if (retentionRate >= 90 && correctStreak >= 5 && totalReviews >= 3) {
      return {
        shouldIncrease: true,
        shouldDecrease: false,
        reason: 'Excellent performance with high retention and streak',
        suggestion: 'Try more challenging question types or advanced applications'
      };
    }

    // Decrease difficulty if struggling
    if (retentionRate < 50 && totalReviews >= 3) {
      return {
        shouldIncrease: false,
        shouldDecrease: true,
        reason: 'Low retention rate indicates difficulty is too high',
        suggestion: 'Break down into simpler concepts or use more memory aids'
      };
    }

    // Maintain current difficulty
    return {
      shouldIncrease: false,
      shouldDecrease: false,
      reason: 'Performance indicates appropriate difficulty level',
      suggestion: 'Continue with current approach and monitor progress'
    };
  }
}

export default MemoryTechniquesService; 