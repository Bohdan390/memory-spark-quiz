import { QuizQuestion, StudySession, LearningStats, ReviewResult } from '@/types/models';
import { EnhancedSpacedRepetitionService } from './spacedRepetitionService';
import MemoryTechniquesService from './memoryTechniquesService';

export interface StudySessionConfig {
  maxNewCards: number;
  maxReviewCards: number;
  sessionTimeLimit: number; // minutes
  sessionType: 'review' | 'learn' | 'cram' | 'test';
  includeDifficultCards: boolean;
  shuffleCards: boolean;
  showHints: boolean;
  enableMemoryTechniques: boolean;
}

export interface SessionProgress {
  cardsCompleted: number;
  cardsRemaining: number;
  timeElapsed: number; // minutes
  accuracy: number; // percentage
  currentStreak: number;
  estimatedTimeRemaining: number; // minutes
}

export class StudySessionService {
  private currentSession: StudySession | null = null;
  private sessionQuestions: QuizQuestion[] = [];
  private currentQuestionIndex: number = 0;
  private sessionStartTime: Date = new Date();
  private sessionResults: ReviewResult[] = [];
  private config: StudySessionConfig;

  constructor(config: StudySessionConfig) {
    this.config = config;
  }

  /**
   * Start a new study session
   */
  startSession(
    allQuestions: QuizQuestion[],
    userId: string,
    sessionType: StudySession['sessionType'] = 'review'
  ): StudySession {
    this.sessionStartTime = new Date();
    this.currentQuestionIndex = 0;
    this.sessionResults = [];

    // Select questions based on session configuration
    this.sessionQuestions = this.selectQuestionsForSession(allQuestions);

    // Create session record
    this.currentSession = {
      id: this.generateSessionId(),
      user_id: userId,
      startTime: this.sessionStartTime,
      questionsReviewed: 0,
      correctAnswers: 0,
      averageResponseTime: 0,
      focusTime: 0,
      sessionType,
      mood: 'okay' // Will be updated at end of session
    };

    return this.currentSession;
  }

  /**
   * Get current session progress
   */
  getSessionProgress(): SessionProgress {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const timeElapsed = (Date.now() - this.sessionStartTime.getTime()) / (1000 * 60);
    const cardsCompleted = this.currentQuestionIndex;
    const cardsRemaining = this.sessionQuestions.length - cardsCompleted;
    
    const correctAnswers = this.sessionResults.filter(r => r.grade >= 3).length;
    const accuracy = cardsCompleted > 0 ? (correctAnswers / cardsCompleted) * 100 : 0;

    // Calculate current streak
    let currentStreak = 0;
    for (let i = this.sessionResults.length - 1; i >= 0; i--) {
      if (this.sessionResults[i].grade >= 3) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Estimate remaining time based on average response time
    const avgResponseTime = this.sessionResults.length > 0
      ? this.sessionResults.reduce((sum, r) => sum + r.responseTime, 0) / this.sessionResults.length
      : 30000; // 30 seconds default

    const estimatedTimeRemaining = (cardsRemaining * avgResponseTime) / (1000 * 60);

    return {
      cardsCompleted,
      cardsRemaining,
      timeElapsed,
      accuracy,
      currentStreak,
      estimatedTimeRemaining
    };
  }

  /**
   * Get current question
   */
  getCurrentQuestion(): QuizQuestion | null {
    if (this.currentQuestionIndex >= this.sessionQuestions.length) {
      return null;
    }
    return this.sessionQuestions[this.currentQuestionIndex];
  }

  /**
   * Submit answer for current question
   */
  submitAnswer(result: ReviewResult): QuizQuestion {
    if (!this.currentSession || this.currentQuestionIndex >= this.sessionQuestions.length) {
      throw new Error('No active question to answer');
    }

    const currentQuestion = this.sessionQuestions[this.currentQuestionIndex];
    
    // Update question with spaced repetition algorithm
    const updatedQuestion = EnhancedSpacedRepetitionService.updateQuestionAfterReview(
      currentQuestion,
      result
    );

    // Store result
    this.sessionResults.push(result);
    
    // Update session stats
    this.currentSession.questionsReviewed++;
    if (result.grade >= 3) {
      this.currentSession.correctAnswers++;
    }

    // Update average response time
    const totalResponseTime = this.sessionResults.reduce((sum, r) => sum + r.responseTime, 0);
    this.currentSession.averageResponseTime = totalResponseTime / this.sessionResults.length;

    // Move to next question
    this.currentQuestionIndex++;

    return updatedQuestion;
  }

  /**
   * Skip current question
   */
  skipQuestion(): void {
    if (this.currentQuestionIndex < this.sessionQuestions.length) {
      this.currentQuestionIndex++;
    }
  }

  /**
   * End current session
   */
  endSession(mood: StudySession['mood'] = 'okay', notes?: string): StudySession {
    if (!this.currentSession) {
      throw new Error('No active session to end');
    }

    this.currentSession.endTime = new Date();
    this.currentSession.mood = mood;
    this.currentSession.notes = notes;

    // Calculate focus time (total time minus estimated break time)
    const totalTime = (this.currentSession.endTime.getTime() - this.sessionStartTime.getTime()) / (1000 * 60);
    this.currentSession.focusTime = Math.max(0, totalTime - this.estimateBreakTime(totalTime));

    const completedSession = { ...this.currentSession };
    this.currentSession = null;
    
    return completedSession;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    averageResponseTime: number;
    timePerCard: number;
    difficultyBreakdown: { [key: string]: number };
    typeBreakdown: { [key: string]: number };
    gradeDistribution: { [key: number]: number };
  } {
    const totalQuestions = this.sessionResults.length;
    const correctAnswers = this.sessionResults.filter(r => r.grade >= 3).length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    const averageResponseTime = totalQuestions > 0
      ? this.sessionResults.reduce((sum, r) => sum + r.responseTime, 0) / totalQuestions
      : 0;

    const timePerCard = averageResponseTime / 1000; // seconds

    // Difficulty breakdown
    const difficultyBreakdown: { [key: string]: number } = {};
    this.sessionQuestions.slice(0, this.currentQuestionIndex).forEach(q => {
      const level = q.difficulty.level;
      difficultyBreakdown[level] = (difficultyBreakdown[level] || 0) + 1;
    });

    // Type breakdown
    const typeBreakdown: { [key: string]: number } = {};
    this.sessionQuestions.slice(0, this.currentQuestionIndex).forEach(q => {
      const type = q.type;
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
    });

    // Grade distribution
    const gradeDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
    this.sessionResults.forEach(r => {
      gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
    });

    return {
      totalQuestions,
      correctAnswers,
      accuracy,
      averageResponseTime,
      timePerCard,
      difficultyBreakdown,
      typeBreakdown,
      gradeDistribution
    };
  }

  /**
   * Get adaptive recommendations for next session
   */
  getAdaptiveRecommendations(): {
    suggestedSessionLength: number; // minutes
    recommendedQuestionTypes: string[];
    difficultyAdjustment: 'increase' | 'decrease' | 'maintain';
    memoryTechniques: string[];
    studyTips: string[];
  } {
    const stats = this.getSessionStats();
    const progress = this.getSessionProgress();

    // Suggest session length based on performance and focus
    let suggestedSessionLength = 20; // default
    if (stats.accuracy > 80 && progress.currentStreak > 5) {
      suggestedSessionLength = 30; // Longer sessions when performing well
    } else if (stats.accuracy < 60) {
      suggestedSessionLength = 15; // Shorter sessions when struggling
    }

    // Recommend question types based on performance
    const recommendedQuestionTypes: string[] = [];
    Object.entries(stats.typeBreakdown).forEach(([type, count]) => {
      const typeAccuracy = this.getTypeAccuracy(type);
      if (typeAccuracy < 70) {
        recommendedQuestionTypes.push(type);
      }
    });

    // Difficulty adjustment
    let difficultyAdjustment: 'increase' | 'decrease' | 'maintain' = 'maintain';
    if (stats.accuracy > 85 && stats.averageResponseTime < 15000) {
      difficultyAdjustment = 'increase';
    } else if (stats.accuracy < 60) {
      difficultyAdjustment = 'decrease';
    }

    // Memory techniques based on difficult question types
    const memoryTechniques = recommendedQuestionTypes.flatMap(type => 
      MemoryTechniquesService.getTechniquesForQuestionType(type as any)
        .slice(0, 2)
        .map(t => t.name)
    );

    // Study tips
    const studyTips: string[] = [];
    if (stats.accuracy < 70) {
      studyTips.push('Focus on understanding concepts before memorizing facts');
      studyTips.push('Use active recall techniques like flashcards');
    }
    if (stats.averageResponseTime > 30000) {
      studyTips.push('Practice quick recall to improve response time');
      studyTips.push('Review material more frequently to build familiarity');
    }
    if (progress.currentStreak > 10) {
      studyTips.push('Great streak! Try teaching concepts to someone else');
      studyTips.push('Consider increasing difficulty for more challenge');
    }

    return {
      suggestedSessionLength,
      recommendedQuestionTypes,
      difficultyAdjustment,
      memoryTechniques: [...new Set(memoryTechniques)],
      studyTips
    };
  }

  /**
   * Calculate learning velocity (cards learned per hour)
   */
  calculateLearningVelocity(): number {
    if (!this.currentSession || this.sessionResults.length === 0) {
      return 0;
    }

    const timeElapsed = (Date.now() - this.sessionStartTime.getTime()) / (1000 * 60 * 60); // hours
    const cardsLearned = this.sessionResults.filter(r => r.grade >= 3).length;
    
    return timeElapsed > 0 ? cardsLearned / timeElapsed : 0;
  }

  /**
   * Get burnout risk assessment
   */
  getBurnoutRisk(): {
    risk: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  } {
    const progress = this.getSessionProgress();
    const stats = this.getSessionStats();
    
    const factors: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Long session time
    if (progress.timeElapsed > 45) {
      factors.push('Extended session duration');
      riskScore += 2;
    }

    // Low accuracy
    if (stats.accuracy < 50) {
      factors.push('Low accuracy indicating fatigue');
      riskScore += 2;
    }

    // Slow response times
    if (stats.averageResponseTime > 45000) {
      factors.push('Slow response times');
      riskScore += 1;
    }

    // Many difficult cards
    const difficultCards = Object.entries(stats.difficultyBreakdown)
      .filter(([level]) => level === 'advanced' || level === 'expert')
      .reduce((sum, [, count]) => sum + count, 0);
    
    if (difficultCards > stats.totalQuestions * 0.6) {
      factors.push('High proportion of difficult cards');
      riskScore += 1;
    }

    // Generate recommendations
    if (riskScore >= 4) {
      recommendations.push('Take a 10-15 minute break');
      recommendations.push('Switch to easier review cards');
      recommendations.push('Consider ending session and resuming later');
    } else if (riskScore >= 2) {
      recommendations.push('Take a 5-minute break');
      recommendations.push('Focus on easier cards for a while');
    } else {
      recommendations.push('You\'re doing well! Keep up the good pace');
    }

    const risk = riskScore >= 4 ? 'high' : riskScore >= 2 ? 'medium' : 'low';

    return { risk, factors, recommendations };
  }

  // Private helper methods

  private selectQuestionsForSession(allQuestions: QuizQuestion[]): QuizQuestion[] {
    const selectedQuestions: QuizQuestion[] = [];

    // Get due questions for review
    const dueQuestions = EnhancedSpacedRepetitionService.selectQuestionsForReview(
      allQuestions,
      this.config.maxReviewCards,
      {
        includeNew: false,
        includeLearning: true,
        includeReview: true,
        prioritizeOverdue: true
      }
    );

    selectedQuestions.push(...dueQuestions);

    // Add new cards if there's room
    const remainingSlots = Math.max(0, 
      (this.config.maxNewCards + this.config.maxReviewCards) - selectedQuestions.length
    );

    if (remainingSlots > 0) {
      const newQuestions = allQuestions
        .filter(q => q.repetitions === 0 && !q.suspended)
        .slice(0, Math.min(remainingSlots, this.config.maxNewCards));
      
      selectedQuestions.push(...newQuestions);
    }

    // Filter difficult cards if not enabled
    let finalQuestions = selectedQuestions;
    if (!this.config.includeDifficultCards) {
      finalQuestions = selectedQuestions.filter(q => 
        q.difficulty.level === 'beginner' || q.difficulty.level === 'intermediate'
      );
    }

    // Shuffle if enabled
    if (this.config.shuffleCards) {
      finalQuestions = finalQuestions.sort(() => Math.random() - 0.5);
    }

    return finalQuestions;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateBreakTime(totalMinutes: number): number {
    // Estimate break time based on session length
    if (totalMinutes > 60) return totalMinutes * 0.2; // 20% for long sessions
    if (totalMinutes > 30) return totalMinutes * 0.1; // 10% for medium sessions
    return 0; // No break time for short sessions
  }

  private getTypeAccuracy(questionType: string): number {
    const typeResults = this.sessionResults.filter((_, index) => 
      this.sessionQuestions[index]?.type === questionType
    );
    
    if (typeResults.length === 0) return 100;
    
    const correct = typeResults.filter(r => r.grade >= 3).length;
    return (correct / typeResults.length) * 100;
  }

  /**
   * Create default session configuration
   */
  static createDefaultConfig(): StudySessionConfig {
    return {
      maxNewCards: 10,
      maxReviewCards: 20,
      sessionTimeLimit: 30,
      sessionType: 'review',
      includeDifficultCards: true,
      shuffleCards: true,
      showHints: true,
      enableMemoryTechniques: true
    };
  }

  /**
   * Create configuration for specific session types
   */
  static createConfigForType(type: StudySession['sessionType']): StudySessionConfig {
    const baseConfig = this.createDefaultConfig();
    
    switch (type) {
      case 'learn':
        return {
          ...baseConfig,
          maxNewCards: 15,
          maxReviewCards: 5,
          sessionTimeLimit: 25,
          includeDifficultCards: false,
          shuffleCards: false
        };
        
      case 'review':
        return {
          ...baseConfig,
          maxNewCards: 5,
          maxReviewCards: 25,
          sessionTimeLimit: 30
        };
        
      case 'cram':
        return {
          ...baseConfig,
          maxNewCards: 0,
          maxReviewCards: 50,
          sessionTimeLimit: 60,
          shuffleCards: true,
          showHints: false
        };
        
      case 'test':
        return {
          ...baseConfig,
          maxNewCards: 0,
          maxReviewCards: 30,
          sessionTimeLimit: 45,
          shuffleCards: true,
          showHints: false,
          enableMemoryTechniques: false
        };
        
      default:
        return baseConfig;
    }
  }
}

export default StudySessionService; 