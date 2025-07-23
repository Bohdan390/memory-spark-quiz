import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, PenSquare, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { useIsMobile } from '@/hooks/use-mobile';
import Footer from '@/components/layout/Footer';

const Index = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <main className="flex-grow">
        <div className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-memoquiz-purple/10 to-background z-0"></div>
          
          <div className="container mx-auto px-4 pt-24 pb-20 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block bg-memoquiz-purple/10 dark:bg-memoquiz-purple/20 px-4 py-1.5 rounded-full mb-6">
                <p className="text-sm font-medium text-memoquiz-purple">
                  Your personal knowledge vault with built-in quizzes
                </p>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                Remember <span className="text-memoquiz-purple">everything</span> with{" "}
                <span className="text-memoquiz-purple">MemoQuiz</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Take smarter notes and never forget what you learn with personalized quizzes generated from your content.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5 justify-center mb-16">
                <Button 
                  onClick={() => navigate('/folders')}
                  className="text-lg py-6 px-8 rounded-xl"
                  size="lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/about')}
                  className="text-lg py-6 px-8 rounded-xl"
                  size="lg"
                >
                  Learn More
                </Button>
              </div>
            </div>
            
            {/* Hero image/mockup */}
            <div className="relative mx-auto max-w-5xl mt-10">
              <div className="bg-memoquiz-purple/5 backdrop-blur-sm border border-memoquiz-purple/10 rounded-2xl p-1 shadow-xl">
                <div className="relative rounded-xl overflow-hidden bg-background">
                  <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800">
                    <img 
                      src="/placeholder.svg" 
                      alt="MemoQuiz interface" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-memoquiz-purple/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-10 right-10 w-20 h-20 bg-memoquiz-blue/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How MemoQuiz Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                MemoQuiz combines note-taking with science-backed memory techniques to help you learn better.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard 
                icon={<FileText className="h-12 w-12 text-memoquiz-purple" />}
                title="Create and Organize"
                description="Create folders for different subjects, add notes with rich text formatting, and organize your knowledge."
              />
              
              <FeatureCard 
                icon={<BookOpen className="h-12 w-12 text-memoquiz-purple" />}
                title="Take Smart Quizzes"
                description="Let the app generate quizzes from your notes using AI and spaced repetition to optimize learning."
              />
              
              <FeatureCard 
                icon={<PenSquare className="h-12 w-12 text-memoquiz-purple" />}
                title="Improve Retention"
                description="Track your progress over time and identify areas where you need more review."
              />
            </div>
          </div>
        </div>
        
        {/* Testimonials Section */}
        <div className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Users Love MemoQuiz</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join students, professionals, and lifelong learners who use MemoQuiz to enhance their knowledge.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <TestimonialCard 
                quote="MemoQuiz completely changed how I study for exams. The quizzes helped me identify weak spots in my understanding."
                name="Alex K."
                title="Computer Science Student"
              />
              
              <TestimonialCard 
                quote="I use it to keep track of books I read. Being quizzed on the content helps me remember important details months later."
                name="Sarah J."
                title="Avid Reader"
              />
              
              <TestimonialCard 
                quote="The ability to organize knowledge in folders and then test myself has been invaluable for my professional development."
                name="Michael T."
                title="Software Engineer"
              />
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="py-20 bg-gradient-to-br from-memoquiz-purple/10 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">
                Ready to remember more of what you learn?
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Start taking smarter notes today and never forget important information again.
              </p>
              
              <Button 
                onClick={() => navigate('/folders')}
                className="text-lg py-6 px-8 rounded-xl"
                size="lg"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Helper components for the page
const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="pt-6 text-center p-8">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">
        {description}
      </p>
    </CardContent>
  </Card>
);

const TestimonialCard = ({ quote, name, title }: {
  quote: string;
  name: string;
  title: string;
}) => (
  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-8">
      <div className="flex justify-start mb-4">
        <Star className="h-5 w-5 text-memoquiz-purple" />
        <Star className="h-5 w-5 text-memoquiz-purple" />
        <Star className="h-5 w-5 text-memoquiz-purple" />
        <Star className="h-5 w-5 text-memoquiz-purple" />
        <Star className="h-5 w-5 text-memoquiz-purple" />
      </div>
      <p className="mb-4 italic">"{quote}"</p>
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </CardContent>
  </Card>
);

export default Index;
