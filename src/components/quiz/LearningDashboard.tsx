import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Zap,
  Heart,
  Star,
  Timer,
  BarChart3,
  PieChart,
  Activity,
  Flame,
  Trophy,
  Settings,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { QuizQuestion, LearningStats, StudySession } from '@/types/models';
import { EnhancedSpacedRepetitionService } from '@/services/spacedRepetitionService';
import StudySessionService, { StudySessionConfig } from '@/services/studySessionService';
import MemoryTechniquesService from '@/services/memoryTechniquesService';

interface LearningDashboardProps {
  questions: QuizQuestion[];
  onStartSession: (config: StudySessionConfig) => void;
  recentSessions: StudySession[];
  userId: string;
}

export const LearningDashboard: React.FC<LearningDashboardProps> = ({
  questions,
  onStartSession,
  recentSessions,
  userId
}) => {
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<StudySession['sessionType']>('review');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  useEffect(() => {
    // Calculate learning statistics
    const stats = EnhancedSpacedRepetitionService.calculateLearningStats(questions);
    setLearningStats(stats);
    
    // Determine time of day
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, [questions]);

  const dueQuestions = questions.filter(q => 
    new Date(q.nextReviewDate) <= new Date() && !q.suspended && !q.buried
  );

  const newQuestions = questions.filter(q => q.repetitions === 0 && !q.suspended);
  const learningQuestions = questions.filter(q => q.repetitions > 0 && q.interval < 21);
  const matureQuestions = questions.filter(q => q.interval >= 21);

  const studyPlan = MemoryTechniquesService.createPersonalizedStudyPlan(questions);
  const studyTips = MemoryTechniquesService.generateStudyTips(timeOfDay, 'medium');

  const handleStartSession = () => {
    const config = StudySessionService.createConfigForType(selectedSessionType);
    onStartSession(config);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600';
    if (streak >= 14) return 'text-blue-600';
    if (streak >= 7) return 'text-green-600';
    if (streak >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getRetentionColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 80) return 'bg-blue-500';
    if (rate >= 70) return 'bg-yellow-500';
    if (rate >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const renderQuickStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Due Today</p>
              <p className="text-2xl font-bold text-red-600">{dueQuestions.length}</p>
            </div>
            <Clock className="w-8 h-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Cards</p>
              <p className="text-2xl font-bold text-blue-600">{newQuestions.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Learning</p>
              <p className="text-2xl font-bold text-yellow-600">{learningQuestions.length}</p>
            </div>
            <Brain className="w-8 h-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mature</p>
              <p className="text-2xl font-bold text-green-600">{matureQuestions.length}</p>
            </div>
            <Award className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSessionControls = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          Start Study Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {(['review', 'learn', 'cram', 'test'] as const).map((type) => (
            <Button
              key={type}
              variant={selectedSessionType === type ? "default" : "outline"}
              onClick={() => setSelectedSessionType(type)}
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedSessionType === 'review' && 'Focus on cards due for review'}
            {selectedSessionType === 'learn' && 'Learn new cards with spaced repetition'}
            {selectedSessionType === 'cram' && 'Quick review of many cards'}
            {selectedSessionType === 'test' && 'Test your knowledge without hints'}
          </div>
          <Button onClick={handleStartSession} className="ml-4">
            <Play className="w-4 h-4 mr-2" />
            Start Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderLearningStats = () => {
    if (!learningStats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Retention Rate</span>
                  <span>{learningStats.retention.overall}%</span>
                </div>
                <Progress 
                  value={learningStats.retention.overall} 
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">Young Cards</p>
                  <p className="font-semibold">{learningStats.retention.young}%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Mature Cards</p>
                  <p className="font-semibold">{learningStats.retention.mature}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Study */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Study
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cards Studied</span>
                <span className="font-semibold">{learningStats.todayStats.reviewsCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Cards</span>
                <span className="font-semibold">{learningStats.todayStats.newCardsStudied}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Time Spent</span>
                <span className="font-semibold">{learningStats.todayStats.timeSpent}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Accuracy</span>
                <span className="font-semibold">{learningStats.todayStats.accuracy}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak & Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Streaks & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Streak</span>
                <div className="flex items-center gap-1">
                  <Flame className={`w-4 h-4 ${getStreakColor(learningStats.streaks.currentStreak)}`} />
                  <span className="font-semibold">{learningStats.streaks.currentStreak} days</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Longest Streak</span>
                <span className="font-semibold">{learningStats.streaks.longestStreak} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Study</span>
                <span className="text-sm">
                  {learningStats.streaks.lastStudyDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStudyPlan = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Personalized Study Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="focus">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="focus">Focus Areas</TabsTrigger>
            <TabsTrigger value="techniques">Memory Techniques</TabsTrigger>
            <TabsTrigger value="schedule">Study Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="focus" className="space-y-3">
            {studyPlan.focusAreas.length > 0 ? (
              studyPlan.focusAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">{area}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Great job! No specific focus areas needed.</span>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="techniques" className="space-y-3">
            {studyPlan.recommendedTechniques.map((technique, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">{technique.name}</h4>
                  <Badge variant="outline">
                    <Star className="w-3 h-3 mr-1" />
                    {technique.effectiveness}/10
                  </Badge>
                </div>
                <p className="text-sm text-blue-800">{technique.description}</p>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-3">
            {Object.entries(studyPlan.studySchedule).map(([technique, minutes]) => (
              <div key={technique} className="flex items-center justify-between">
                <span className="text-sm">{technique}</span>
                <Badge variant="secondary">
                  <Timer className="w-3 h-3 mr-1" />
                  {minutes} min
                </Badge>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  const renderStudyTips = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Study Tips for {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {studyTips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{tip}</span>
            </div>
          ))}
          
          {studyPlan.tips.map((tip, index) => (
            <div key={`plan-${index}`} className="flex items-start gap-2">
              <Target className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{tip}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderRecentSessions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentSessions.slice(0, 5).map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  session.mood === 'excellent' ? 'bg-green-500' :
                  session.mood === 'good' ? 'bg-blue-500' :
                  session.mood === 'okay' ? 'bg-yellow-500' :
                  session.mood === 'poor' ? 'bg-orange-500' :
                  'bg-red-500'
                }`} />
                <div>
                  <p className="text-sm font-medium capitalize">{session.sessionType}</p>
                  <p className="text-xs text-gray-600">
                    {session.startTime.toLocaleDateString()} • {session.focusTime}m
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {session.correctAnswers}/{session.questionsReviewed}
                </p>
                <p className="text-xs text-gray-600">
                  {Math.round((session.correctAnswers / session.questionsReviewed) * 100)}%
                </p>
              </div>
            </div>
          ))}
          
          {recentSessions.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent sessions yet. Start studying to see your progress!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderQuickStats()}
      {renderSessionControls()}
      {renderLearningStats()}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {renderStudyPlan()}
          {renderStudyTips()}
        </div>
        <div>
          {renderRecentSessions()}
        </div>
      </div>
    </div>
  );
};

export default LearningDashboard; 