import { QuizQuestion, LearningStats, StudySession } from '@/types/models';

// FSRS (Free Spaced Repetition Scheduler) Algorithm Parameters
const FSRS_PARAMS = {
  // Memory decay parameters
  requestRetention: 0.9,
  maximumInterval: 36500, // 100 years in days
  
  // FSRS algorithm weights (optimized for general learning)
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  
  // Grade definitions (Anki-style)
  grades: {
    AGAIN: 1,    // Forgot completely
    HARD: 2,     // Remembered with difficulty
    GOOD: 3,     // Remembered correctly
    EASY: 4      // Remembered easily
  }
};

// SM-2 Algorithm (fallback for compatibility)
const SM2_PARAMS = {
  MIN_EASE_FACTOR: 1.3,
  MAX_INTERVAL_DAYS: 365,
  INITIAL_EASE: 2.5
};

export interface ReviewResult {
  grade: number; // 1-4 (Again, Hard, Good, Easy)
  responseTime: number; // milliseconds
  confidence: number; // 1-5
  difficulty: number; // 1-5 (user-rated)
}

// FSRS Algorithm Implementation
export class FSRSScheduler {
  
  /**
   * Calculate next review parameters using FSRS algorithm
   */
  static calculateFSRS(question: QuizQuestion, result: ReviewResult): {
    stability: number;
    difficulty: number;
    retrievability: number;
    interval: number;
    nextReviewDate: Date;
  } {
    const { grade, responseTime } = result;
    const { stability, difficulty_sr, retrievability, repetitions } = question;
    
    let newStability = stability;
    let newDifficulty = difficulty_sr;
    
    if (repetitions === 0) {
      // First review
      newStability = this.initStability(grade);
      newDifficulty = this.initDifficulty(grade);
    } else {
      // Subsequent reviews
      const currentRetrievability = this.forgettingCurve(
        this.daysSinceLastReview(question),
        stability
      );
      
      newStability = this.nextStability(
        grade,
        stability,
        retrievability,
        currentRetrievability
      );
      
      newDifficulty = this.nextDifficulty(
        grade,
        difficulty_sr,
        currentRetrievability
      );
    }
    
    const interval = Math.round(this.nextInterval(newStability));
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    
    return {
      stability: newStability,
      difficulty: newDifficulty,
      retrievability: this.forgettingCurve(interval, newStability),
      interval,
      nextReviewDate
    };
  }
  
  private static initStability(grade: number): number {
    return Math.max(0.1, FSRS_PARAMS.w[grade - 1] || 1.0);
  }
  
  private static initDifficulty(grade: number): number {
    return Math.min(10, Math.max(1, FSRS_PARAMS.w[4] - (grade - 3) * FSRS_PARAMS.w[5]));
  }
  
  private static forgettingCurve(elapsedDays: number, stability: number): number {
    return Math.pow(1 + elapsedDays / (9 * stability), -1);
  }
  
  private static nextStability(
    grade: number,
    stability: number,
    oldRetrievability: number,
    currentRetrievability: number
  ): number {
    if (grade === FSRS_PARAMS.grades.AGAIN) {
      return stability * Math.exp(FSRS_PARAMS.w[11] * (grade - 3) * FSRS_PARAMS.w[12]);
    }
    
    const hardPenalty = grade === FSRS_PARAMS.grades.HARD ? FSRS_PARAMS.w[15] : 1;
    const easyBonus = grade === FSRS_PARAMS.grades.EASY ? FSRS_PARAMS.w[16] : 1;
    
    return stability * (
      1 + 
      Math.exp(FSRS_PARAMS.w[8]) * 
      (11 - grade) * 
      Math.pow(stability, -FSRS_PARAMS.w[9]) * 
      (Math.exp((1 - currentRetrievability) * FSRS_PARAMS.w[10]) - 1) * 
      hardPenalty * 
      easyBonus
    );
  }
  
  private static nextDifficulty(
    grade: number,
    difficulty: number,
    retrievability: number
  ): number {
    const deltaD = -FSRS_PARAMS.w[6] * (grade - 3);
    const meanReversion = FSRS_PARAMS.w[7] * (this.initDifficulty(4) - difficulty);
    
    return Math.min(10, Math.max(1, difficulty + deltaD + meanReversion));
  }
  
  private static nextInterval(stability: number): number {
    const interval = stability / Math.log(FSRS_PARAMS.requestRetention) * Math.log(0.9);
    return Math.min(FSRS_PARAMS.maximumInterval, Math.max(1, interval));
  }
  
  private static daysSinceLastReview(question: QuizQuestion): number {
    if (!question.lastReviewed) return 0;
    const now = new Date();
    const lastReview = new Date(question.lastReviewed);
    return Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
  }
}

// Enhanced SM-2 Algorithm (improved version)
export class SM2Scheduler {
  
  static calculateSM2(question: QuizQuestion, result: ReviewResult): {
    easeFactor: number;
    interval: number;
    repetitions: number;
    nextReviewDate: Date;
  } {
    const { grade } = result;
    let { easeFactor, interval, repetitions } = question;
    
    // Convert FSRS grade to SM-2 quality (0-5)
    const quality = this.gradeToQuality(grade);
    
    if (quality >= 3) {
      // Correct response
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      // Incorrect response
      repetitions = 0;
      interval = 1;
    }
    
    // Update ease factor
    easeFactor = Math.max(
      SM2_PARAMS.MIN_EASE_FACTOR,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    
    // Cap interval
    interval = Math.min(interval, SM2_PARAMS.MAX_INTERVAL_DAYS);
    
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    
    return { easeFactor, interval, repetitions, nextReviewDate };
  }
  
  private static gradeToQuality(grade: number): number {
    switch (grade) {
      case 1: return 0; // Again -> Fail
      case 2: return 3; // Hard -> Pass with difficulty
      case 3: return 4; // Good -> Pass
      case 4: return 5; // Easy -> Perfect
      default: return 3;
    }
  }
}

// Main Spaced Repetition Service
export class EnhancedSpacedRepetitionService {
  
  /**
   * Update question after review using FSRS algorithm
   */
  static updateQuestionAfterReview(
    question: QuizQuestion,
    result: ReviewResult
  ): QuizQuestion {
    const now = new Date();
    
    // Use FSRS algorithm
    const fsrsResult = FSRSScheduler.calculateFSRS(question, result);
    
    // Update learning metrics
    const updatedMetrics = this.updateLearningMetrics(question, result);
    
    // Handle lapses
    const lapses = result.grade === 1 ? question.lapses + 1 : question.lapses;
    
    return {
      ...question,
      // FSRS updates
      stability: fsrsResult.stability,
      difficulty_sr: fsrsResult.difficulty,
      retrievability: fsrsResult.retrievability,
      interval: fsrsResult.interval,
      nextReviewDate: fsrsResult.nextReviewDate,
      
      // General updates
      repetitions: result.grade >= 3 ? question.repetitions + 1 : 0,
      lastReviewed: now,
      lapses,
      learningMetrics: updatedMetrics,
      confidence: result.confidence,
      updatedAt: now,
      
      // Reset burial/suspension on successful review
      buried: false,
      suspended: result.grade === 1 && lapses >= 8 // Auto-suspend after 8 lapses
    };
  }
  
  private static updateLearningMetrics(
    question: QuizQuestion,
    result: ReviewResult
  ): typeof question.learningMetrics {
    const { learningMetrics } = question;
    const isCorrect = result.grade >= 3;
    
    const totalReviews = learningMetrics.totalReviews + 1;
    const correctStreak = isCorrect ? learningMetrics.correctStreak + 1 : 0;
    const longestStreak = Math.max(learningMetrics.longestStreak, correctStreak);
    
    // Update average response time (exponential moving average)
    const avgResponseTime = learningMetrics.totalReviews === 0 
      ? result.responseTime
      : (learningMetrics.averageResponseTime * 0.8 + result.responseTime * 0.2);
    
    // Calculate retention rate
    const retentionRate = totalReviews === 0 
      ? (isCorrect ? 100 : 0)
      : ((learningMetrics.retentionRate * learningMetrics.totalReviews + (isCorrect ? 1 : 0)) / totalReviews) * 100;
    
    // Calculate last 10 reviews accuracy
    const recentAccuracy = this.calculateRecentAccuracy(question, isCorrect);
    
    return {
      totalReviews,
      correctStreak,
      longestStreak,
      averageResponseTime: avgResponseTime,
      difficultyRating: result.difficulty,
      retentionRate,
      lastAccuracy: recentAccuracy
    };
  }
  
  private static calculateRecentAccuracy(question: QuizQuestion, isCorrect: boolean): number {
    // This would ideally track last 10 results, simplified for now
    const { learningMetrics } = question;
    if (learningMetrics.totalReviews < 10) {
      return learningMetrics.retentionRate;
    }
    
    // Exponential moving average for recent accuracy
    return learningMetrics.lastAccuracy * 0.9 + (isCorrect ? 10 : 0);
  }
  
  /**
   * Select questions for review based on advanced scheduling
   */
  static selectQuestionsForReview(
    allQuestions: QuizQuestion[],
    maxQuestions: number = 20,
    options: {
      includeNew?: boolean;
      includeLearning?: boolean;
      includeReview?: boolean;
      prioritizeOverdue?: boolean;
    } = {}
  ): QuizQuestion[] {
    const {
      includeNew = true,
      includeLearning = true,
      includeReview = true,
      prioritizeOverdue = true
    } = options;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Filter out suspended and buried cards
    const availableQuestions = allQuestions.filter(q => !q.suspended && !q.buried);
    
    // Categorize questions
    const newQuestions = availableQuestions.filter(q => 
      includeNew && q.repetitions === 0
    );
    
    const learningQuestions = availableQuestions.filter(q => 
      includeLearning && q.repetitions > 0 && q.interval < 21
    );
    
    const reviewQuestions = availableQuestions.filter(q => 
      includeReview && q.repetitions > 0 && q.interval >= 21
    );
    
    // Get due questions
    const dueQuestions = [...learningQuestions, ...reviewQuestions]
      .filter(q => new Date(q.nextReviewDate) <= now)
      .sort((a, b) => {
        if (prioritizeOverdue) {
          // Prioritize by how overdue they are
          const aOverdue = now.getTime() - new Date(a.nextReviewDate).getTime();
          const bOverdue = now.getTime() - new Date(b.nextReviewDate).getTime();
          return bOverdue - aOverdue;
        }
        return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
      });
    
    // Build selection
    const selectedQuestions: QuizQuestion[] = [];
    
    // Add due questions first
    selectedQuestions.push(...dueQuestions.slice(0, maxQuestions));
    
    // Fill remaining slots with new questions
    const remainingSlots = maxQuestions - selectedQuestions.length;
    if (remainingSlots > 0 && includeNew) {
      const newToAdd = newQuestions
        .filter(q => !selectedQuestions.includes(q))
        .slice(0, remainingSlots);
      selectedQuestions.push(...newToAdd);
    }
    
    return selectedQuestions;
  }
  
  /**
   * Calculate learning statistics
   */
  static calculateLearningStats(questions: QuizQuestion[]): LearningStats {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    // Categorize cards
    const newCards = questions.filter(q => q.repetitions === 0 && !q.suspended).length;
    const learningCards = questions.filter(q => q.repetitions > 0 && q.interval < 21 && !q.suspended).length;
    const reviewCards = questions.filter(q => q.repetitions > 0 && q.interval >= 21 && !q.suspended).length;
    const matureCards = questions.filter(q => q.interval >= 21 && !q.suspended).length;
    const suspendedCards = questions.filter(q => q.suspended).length;
    
    // Today's stats
    const todayReviews = questions.filter(q => 
      q.lastReviewed && new Date(q.lastReviewed) >= todayStart
    );
    
    const todayNew = todayReviews.filter(q => q.repetitions === 1);
    const todayAccuracy = todayReviews.length > 0 
      ? (todayReviews.reduce((sum, q) => sum + q.learningMetrics.retentionRate, 0) / todayReviews.length)
      : 0;
    
    // Calculate streaks (simplified)
    const lastStudyDate = questions
      .filter(q => q.lastReviewed)
      .reduce((latest, q) => {
        const reviewDate = new Date(q.lastReviewed!);
        return reviewDate > latest ? reviewDate : latest;
      }, new Date(0));
    
    const currentStreak = this.calculateCurrentStreak(questions);
    
    // Retention rates
    const youngCards = questions.filter(q => q.interval < 21 && q.repetitions > 0);
    const matureCardsForRetention = questions.filter(q => q.interval >= 21);
    
    const youngRetention = youngCards.length > 0
      ? youngCards.reduce((sum, q) => sum + q.learningMetrics.retentionRate, 0) / youngCards.length
      : 0;
    
    const matureRetention = matureCardsForRetention.length > 0
      ? matureCardsForRetention.reduce((sum, q) => sum + q.learningMetrics.retentionRate, 0) / matureCardsForRetention.length
      : 0;
    
    const overallRetention = questions.length > 0
      ? questions.reduce((sum, q) => sum + q.learningMetrics.retentionRate, 0) / questions.length
      : 0;
    
    return {
      totalCards: questions.length,
      newCards,
      learningCards,
      reviewCards,
      matureCards,
      suspendedCards,
      
      todayStats: {
        newCardsStudied: todayNew.length,
        reviewsCompleted: todayReviews.length,
        timeSpent: Math.round(todayReviews.reduce((sum, q) => sum + q.learningMetrics.averageResponseTime, 0) / 60000), // Convert to minutes
        accuracy: Math.round(todayAccuracy)
      },
      
      streaks: {
        currentStreak,
        longestStreak: Math.max(...questions.map(q => q.learningMetrics.longestStreak), 0),
        lastStudyDate
      },
      
      retention: {
        overall: Math.round(overallRetention),
        young: Math.round(youngRetention),
        mature: Math.round(matureRetention)
      }
    };
  }
  
  private static calculateCurrentStreak(questions: QuizQuestion[]): number {
    // Simplified streak calculation
    const recentQuestions = questions
      .filter(q => q.lastReviewed)
      .sort((a, b) => new Date(b.lastReviewed!).getTime() - new Date(a.lastReviewed!).getTime());
    
    let streak = 0;
    for (const question of recentQuestions) {
      if (question.learningMetrics.correctStreak > 0) {
        streak = Math.max(streak, question.learningMetrics.correctStreak);
      } else {
        break;
      }
    }
    
    return streak;
  }
  
  /**
   * Bury cards until tomorrow
   */
  static buryCard(question: QuizQuestion): QuizQuestion {
    return {
      ...question,
      buried: true,
      updatedAt: new Date()
    };
  }
  
  /**
   * Suspend cards indefinitely
   */
  static suspendCard(question: QuizQuestion): QuizQuestion {
    return {
      ...question,
      suspended: true,
      updatedAt: new Date()
    };
  }
  
  /**
   * Unsuspend cards
   */
  static unsuspendCard(question: QuizQuestion): QuizQuestion {
    return {
      ...question,
      suspended: false,
      updatedAt: new Date()
    };
  }
  
  /**
   * Reset card progress
   */
  static resetCard(question: QuizQuestion): QuizQuestion {
    return {
      ...question,
      repetitions: 0,
      interval: 1,
      easeFactor: SM2_PARAMS.INITIAL_EASE,
      stability: 1,
      difficulty_sr: 5,
      retrievability: 0,
      lapses: 0,
      lastReviewed: null,
      nextReviewDate: new Date(),
      suspended: false,
      buried: false,
      learningMetrics: {
        totalReviews: 0,
        correctStreak: 0,
        longestStreak: 0,
        averageResponseTime: 0,
        difficultyRating: 3,
        retentionRate: 0,
        lastAccuracy: 0
      },
      updatedAt: new Date()
    };
  }
}

// Legacy exports for backward compatibility
export const calculateNextReview = (
  question: QuizQuestion,
  performanceRating: number
): { easeFactor: number; interval: number; nextReviewDate: Date } => {
  const result: ReviewResult = {
    grade: performanceRating === 1 ? 3 : 1, // Convert 0/1 to FSRS grade
    responseTime: 3000,
    confidence: 3,
    difficulty: 3
  };
  
  const sm2Result = SM2Scheduler.calculateSM2(question, result);
  return {
    easeFactor: sm2Result.easeFactor,
    interval: sm2Result.interval,
    nextReviewDate: sm2Result.nextReviewDate
  };
};

export const selectQuestionsForReview = (
  allQuestions: QuizQuestion[],
  maxQuestions: number = 10
): QuizQuestion[] => {
  return EnhancedSpacedRepetitionService.selectQuestionsForReview(allQuestions, maxQuestions);
};
