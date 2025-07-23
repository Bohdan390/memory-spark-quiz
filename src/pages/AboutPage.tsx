
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  Star, 
  Github, 
  Twitter, 
  Mail, 
  BookOpen, 
  Users, 
  Zap,
  Bug,
  FileText
} from 'lucide-react';
import LogViewer from '@/components/debug/LogViewer';

const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          About MemoQuiz
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          An intelligent spaced repetition learning system designed to help you master any subject through scientifically-backed memory techniques.
        </p>
      </div>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="logs">Debug Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                MemoQuiz is built on the principle that effective learning requires more than just repetition. 
                Our system combines the proven spaced repetition algorithm with modern AI to create personalized 
                learning experiences that adapt to your unique learning patterns and preferences.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Built with Love
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                This project is a labor of love, created by developers who believe in the power of 
                technology to enhance human learning. We're committed to making education more 
                accessible, effective, and enjoyable for everyone.
              </p>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/yourusername/memoquiz" target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    View on GitHub
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://twitter.com/memoquiz" target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-4 h-4 mr-2" />
                    Follow Updates
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Tailwind CSS</Badge>
                <Badge variant="secondary">Electron</Badge>
                <Badge variant="secondary">Vite</Badge>
                <Badge variant="secondary">Lucide Icons</Badge>
                <Badge variant="secondary">Radix UI</Badge>
                <Badge variant="secondary">OpenAI API</Badge>
                <Badge variant="secondary">Ollama</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Spaced Repetition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Our algorithm optimizes review timing based on your performance, 
                  ensuring you review material just before you're likely to forget it.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  AI-Powered Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Generate diverse question types automatically from your notes, 
                  creating comprehensive quizzes that test different aspects of your knowledge.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Organized Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Organize your study materials into folders and categories, 
                  making it easy to focus on specific topics or subjects.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  Progress Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Monitor your learning progress with detailed analytics and insights 
                  into your retention rates and study patterns.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meet the Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">MQ</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">MemoQuiz Team</h3>
                <p className="text-gray-600 mb-4">
                  A dedicated team of developers, educators, and learning enthusiasts 
                  working together to revolutionize how people learn and retain information.
                </p>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contributing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                We welcome contributions from the community! Whether you're interested in 
                adding new features, fixing bugs, or improving documentation, there are 
                many ways to get involved.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  <span className="text-sm">Fork the repository and submit pull requests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  <span className="text-sm">Report bugs and suggest improvements</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Help improve documentation and guides</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                This section shows detailed application logs for debugging purposes. 
                All logs are stored locally in your Documents/MemoQuiz folder and can be 
                exported for troubleshooting.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Logs are automatically saved to your local storage</div>
                <div>• Use the filters to find specific types of events</div>
                <div>• Export logs to share with support if needed</div>
                <div>• All data stays on your device - nothing is sent to external servers</div>
              </div>
            </CardContent>
          </Card>

          <LogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AboutPage;
