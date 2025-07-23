/**
 * Quiz Quality Analyzer
 * Tests and rates quiz generation across different content types
 */

import { QuizQuestion, Note } from '../src/types/models';
import { generateQuizWithAI } from '../src/services/openaiService';
import { testContent, expectedQuizTypes } from './test-content';

interface QuizQualityMetrics {
  relevance: number;      // How relevant questions are to content (0-10)
  difficulty: number;     // Appropriate difficulty level (0-10)
  variety: number;        // Variety of question types (0-10)
  clarity: number;        // Question clarity and grammar (0-10)
  coverage: number;       // Content coverage breadth (0-10)
  overall: number;        // Overall quality score (0-10)
}

interface QuizAnalysisResult {
  topic: string;
  questionsGenerated: number;
  metrics: QuizQualityMetrics;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  sampleQuestions: QuizQuestion[];
  detailedAnalysis: {
    questionTypes: { [key: string]: number };
    averageQuestionLength: number;
    averageAnswerLength: number;
    keyConceptsCovered: string[];
    missedOpportunities: string[];
  };
}

class QuizQualityAnalyzer {
  
  async analyzeAllTopics(): Promise<QuizAnalysisResult[]> {
    console.log('🧪 Starting comprehensive quiz quality analysis...');
    console.log('=' .repeat(60));

    const results: QuizAnalysisResult[] = [];

    for (const [topicKey, content] of Object.entries(testContent)) {
      console.log(`\n📝 Analyzing ${topicKey} content...`);
      
      const mockNote: Note = {
        id: `test-${topicKey}`,
        folder_id: 'test-folder',
        user_id: 'test-user',
        title: content.title,
        content: content.content,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      try {
        const questions = await generateQuizWithAI([mockNote]);
        const analysis = this.analyzeQuizQuality(topicKey, questions, content.content);
        results.push(analysis);
        
        this.printTopicAnalysis(analysis);
      } catch (error) {
        console.error(`❌ Error analyzing ${topicKey}:`, error);
      }
    }

    this.printOverallSummary(results);
    return results;
  }

  private analyzeQuizQuality(topic: string, questions: QuizQuestion[], content: string): QuizAnalysisResult {
    const metrics = this.calculateMetrics(questions, content, topic);
    const detailedAnalysis = this.performDetailedAnalysis(questions, content, topic);
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze strengths and weaknesses
    if (metrics.relevance >= 7) {
      strengths.push('High relevance to source content');
    } else {
      weaknesses.push('Questions not well-aligned with content');
      recommendations.push('Improve content analysis to identify key concepts');
    }

    if (metrics.variety >= 7) {
      strengths.push('Good variety in question types');
    } else {
      weaknesses.push('Limited question type diversity');
      recommendations.push('Implement more question type generators');
    }

    if (metrics.coverage >= 7) {
      strengths.push('Comprehensive content coverage');
    } else {
      weaknesses.push('Narrow content coverage');
      recommendations.push('Analyze content structure to identify all key topics');
    }

    if (metrics.clarity >= 7) {
      strengths.push('Clear and well-formed questions');
    } else {
      weaknesses.push('Questions lack clarity or have grammar issues');
      recommendations.push('Improve question formatting and validation');
    }

    if (questions.length < 5) {
      weaknesses.push('Too few questions generated');
      recommendations.push('Increase question generation capacity');
    }

    return {
      topic,
      questionsGenerated: questions.length,
      metrics,
      strengths,
      weaknesses,
      recommendations,
      sampleQuestions: questions.slice(0, 3),
      detailedAnalysis
    };
  }

  private calculateMetrics(questions: QuizQuestion[], content: string, topic: string): QuizQualityMetrics {
    const relevance = this.calculateRelevance(questions, content, topic);
    const difficulty = this.calculateDifficulty(questions);
    const variety = this.calculateVariety(questions);
    const clarity = this.calculateClarity(questions);
    const coverage = this.calculateCoverage(questions, content, topic);
    
    const overall = (relevance + difficulty + variety + clarity + coverage) / 5;

    return {
      relevance: Math.round(relevance * 10) / 10,
      difficulty: Math.round(difficulty * 10) / 10,
      variety: Math.round(variety * 10) / 10,
      clarity: Math.round(clarity * 10) / 10,
      coverage: Math.round(coverage * 10) / 10,
      overall: Math.round(overall * 10) / 10
    };
  }

  private calculateRelevance(questions: QuizQuestion[], content: string, topic: string): number {
    const expectedConcepts = expectedQuizTypes[topic as keyof typeof expectedQuizTypes] || [];
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let relevantQuestions = 0;
    
    questions.forEach(q => {
      const questionWords = q.question.toLowerCase().split(/\s+/);
      const answerWords = q.answer.toLowerCase().split(/\s+/);
      
      // Check if question/answer words appear in content
      const questionRelevance = questionWords.filter(word => 
        word.length > 3 && contentWords.includes(word)
      ).length / questionWords.length;
      
      const answerRelevance = answerWords.filter(word => 
        word.length > 3 && contentWords.includes(word)
      ).length / answerWords.length;
      
      if (questionRelevance > 0.3 || answerRelevance > 0.5) {
        relevantQuestions++;
      }
    });

    return questions.length > 0 ? (relevantQuestions / questions.length) * 10 : 0;
  }

  private calculateDifficulty(questions: QuizQuestion[]): number {
    // Assess difficulty based on question complexity, answer length, etc.
    let totalDifficulty = 0;
    
    questions.forEach(q => {
      let difficulty = 5; // Base difficulty
      
      // Longer questions tend to be more complex
      if (q.question.length > 100) difficulty += 1;
      if (q.question.length > 200) difficulty += 1;
      
      // Multiple choice questions with more options are harder
      if (q.type === 'multipleChoice' && q.options && q.options.length > 3) {
        difficulty += 1;
      }
      
      // Questions requiring explanation are harder
      if (q.type === 'shortAnswer' && q.answer.length > 50) {
        difficulty += 1;
      }
      
      // Questions with specific terminology are harder
      const technicalTerms = q.question.match(/\b[A-Z][a-z]*[A-Z][a-z]*\b/g) || [];
      difficulty += Math.min(technicalTerms.length * 0.5, 2);
      
      totalDifficulty += Math.min(difficulty, 10);
    });

    return questions.length > 0 ? totalDifficulty / questions.length : 5;
  }

  private calculateVariety(questions: QuizQuestion[]): number {
    const types = new Set(questions.map(q => q.type));
    const uniqueTypes = types.size;
    
    // Maximum variety is achieved with 3+ different question types
    return Math.min(uniqueTypes * 3.33, 10);
  }

  private calculateClarity(questions: QuizQuestion[]): number {
    let clarityScore = 0;
    
    questions.forEach(q => {
      let score = 10;
      
      // Deduct for grammar issues (simple heuristics)
      if (!q.question.endsWith('?') && !q.question.includes('Fill in')) score -= 1;
      if (q.question.length < 10) score -= 2;
      if (q.answer.length < 2) score -= 2;
      
      // Check for complete sentences
      if (!q.question.match(/^[A-Z]/)) score -= 1;
      
      // Check for reasonable answer length
      if (q.type === 'shortAnswer' && q.answer.length < 5) score -= 1;
      
      clarityScore += Math.max(score, 0);
    });

    return questions.length > 0 ? clarityScore / questions.length : 0;
  }

  private calculateCoverage(questions: QuizQuestion[], content: string, topic: string): number {
    const expectedConcepts = expectedQuizTypes[topic as keyof typeof expectedQuizTypes] || [];
    const contentSections = content.split(/\n\s*\n/); // Split by paragraphs
    
    let coveredSections = 0;
    
    contentSections.forEach(section => {
      const sectionWords = section.toLowerCase().split(/\s+/);
      const hasQuestionFromSection = questions.some(q => {
        const questionWords = q.question.toLowerCase().split(/\s+/);
        const answerWords = q.answer.toLowerCase().split(/\s+/);
        
        const questionOverlap = questionWords.filter(word => 
          word.length > 4 && sectionWords.includes(word)
        ).length;
        
        const answerOverlap = answerWords.filter(word => 
          word.length > 4 && sectionWords.includes(word)
        ).length;
        
        return questionOverlap > 0 || answerOverlap > 0;
      });
      
      if (hasQuestionFromSection) coveredSections++;
    });

    return contentSections.length > 0 ? (coveredSections / contentSections.length) * 10 : 0;
  }

  private performDetailedAnalysis(questions: QuizQuestion[], content: string, topic: string) {
    const questionTypes: { [key: string]: number } = {};
    let totalQuestionLength = 0;
    let totalAnswerLength = 0;

    questions.forEach(q => {
      questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
      totalQuestionLength += q.question.length;
      totalAnswerLength += q.answer.length;
    });

    const averageQuestionLength = questions.length > 0 ? totalQuestionLength / questions.length : 0;
    const averageAnswerLength = questions.length > 0 ? totalAnswerLength / questions.length : 0;

    // Identify key concepts covered
    const keyConceptsCovered: string[] = [];
    const expectedConcepts = expectedQuizTypes[topic as keyof typeof expectedQuizTypes] || [];
    
    expectedConcepts.forEach(concept => {
      const conceptWords = concept.toLowerCase().split(/\s+/);
      const hasConceptCoverage = questions.some(q => {
        const questionText = (q.question + ' ' + q.answer).toLowerCase();
        return conceptWords.some(word => questionText.includes(word));
      });
      
      if (hasConceptCoverage) {
        keyConceptsCovered.push(concept);
      }
    });

    const missedOpportunities = expectedConcepts.filter(concept => 
      !keyConceptsCovered.includes(concept)
    );

    return {
      questionTypes,
      averageQuestionLength: Math.round(averageQuestionLength),
      averageAnswerLength: Math.round(averageAnswerLength),
      keyConceptsCovered,
      missedOpportunities
    };
  }

  private printTopicAnalysis(analysis: QuizAnalysisResult): void {
    console.log(`\n📊 ${analysis.topic.toUpperCase()} ANALYSIS RESULTS`);
    console.log('-' .repeat(40));
    
    console.log(`Questions Generated: ${analysis.questionsGenerated}`);
    console.log(`Overall Quality Score: ${analysis.metrics.overall}/10`);
    
    console.log('\n📈 Detailed Metrics:');
    console.log(`  Relevance: ${analysis.metrics.relevance}/10`);
    console.log(`  Difficulty: ${analysis.metrics.difficulty}/10`);
    console.log(`  Variety: ${analysis.metrics.variety}/10`);
    console.log(`  Clarity: ${analysis.metrics.clarity}/10`);
    console.log(`  Coverage: ${analysis.metrics.coverage}/10`);

    if (analysis.strengths.length > 0) {
      console.log('\n✅ Strengths:');
      analysis.strengths.forEach(strength => console.log(`  • ${strength}`));
    }

    if (analysis.weaknesses.length > 0) {
      console.log('\n❌ Weaknesses:');
      analysis.weaknesses.forEach(weakness => console.log(`  • ${weakness}`));
    }

    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      analysis.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    console.log('\n🎯 Question Types Distribution:');
    Object.entries(analysis.detailedAnalysis.questionTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} questions`);
    });

    console.log('\n📝 Sample Questions:');
    analysis.sampleQuestions.slice(0, 2).forEach((q, index) => {
      console.log(`  ${index + 1}. [${q.type}] ${q.question}`);
      console.log(`     Answer: ${q.answer}`);
    });
  }

  private printOverallSummary(results: QuizAnalysisResult[]): void {
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 OVERALL QUIZ GENERATION ANALYSIS SUMMARY');
    console.log('=' .repeat(60));

    const avgOverallScore = results.reduce((sum, r) => sum + r.metrics.overall, 0) / results.length;
    const totalQuestions = results.reduce((sum, r) => sum + r.questionsGenerated, 0);

    console.log(`\n📊 Summary Statistics:`);
    console.log(`  Total Questions Generated: ${totalQuestions}`);
    console.log(`  Average Quality Score: ${avgOverallScore.toFixed(1)}/10`);
    console.log(`  Topics Analyzed: ${results.length}`);

    console.log(`\n🏆 Best Performing Topic: ${results.sort((a, b) => b.metrics.overall - a.metrics.overall)[0]?.topic}`);
    console.log(`🔧 Needs Improvement: ${results.sort((a, b) => a.metrics.overall - b.metrics.overall)[0]?.topic}`);

    // Overall recommendations
    console.log('\n🚀 Overall Improvement Recommendations:');
    
    const avgMetrics = {
      relevance: results.reduce((sum, r) => sum + r.metrics.relevance, 0) / results.length,
      difficulty: results.reduce((sum, r) => sum + r.metrics.difficulty, 0) / results.length,
      variety: results.reduce((sum, r) => sum + r.metrics.variety, 0) / results.length,
      clarity: results.reduce((sum, r) => sum + r.metrics.clarity, 0) / results.length,
      coverage: results.reduce((sum, r) => sum + r.metrics.coverage, 0) / results.length
    };

    if (avgMetrics.relevance < 7) {
      console.log('  • Improve content analysis and key concept extraction');
    }
    if (avgMetrics.variety < 7) {
      console.log('  • Implement more diverse question generation algorithms');
    }
    if (avgMetrics.coverage < 7) {
      console.log('  • Enhance content segmentation and topic coverage');
    }
    if (avgMetrics.clarity < 7) {
      console.log('  • Improve question formatting and grammar validation');
    }
    if (avgMetrics.difficulty < 6 || avgMetrics.difficulty > 8) {
      console.log('  • Calibrate difficulty levels for optimal learning');
    }

    console.log('\n🎉 Analysis Complete! Use these insights to improve quiz generation.');
  }
}

// Export for use in testing
export const quizQualityAnalyzer = new QuizQualityAnalyzer();

// Auto-run if called directly
if (typeof window !== 'undefined') {
  (window as any).quizQualityAnalyzer = quizQualityAnalyzer;
} 