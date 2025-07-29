import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Mic, 
  MicOff, 
  Square, 
  RotateCcw, 
  Copy, 
  Volume2, 
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Languages
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface VoiceToTextProps {
  onTextChange: (text: string) => void;
  initialText?: string;
  placeholder?: string;
  disabled?: boolean;
}

interface RecognitionState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  language: string;
  continuous: boolean;
  interimResults: boolean;
}

const VoiceToText: React.FC<VoiceToTextProps> = ({
  onTextChange,
  initialText = '',
  placeholder = 'Start speaking or type here...',
  disabled = false
}) => {
  const { toast } = useToast();
  const [state, setState] = useState<RecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: initialText,
    confidence: 0,
    error: null,
    language: 'en-US',
    continuous: true,
    interimResults: true
  });

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Available languages for speech recognition
  const availableLanguages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'hi-IN', name: 'Hindi' }
  ];

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;
    
    setState(prev => ({ ...prev, isSupported }));

    if (isSupported) {
      initializeRecognition();
    } else {
      setState(prev => ({ 
        ...prev, 
        error: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.' 
      }));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Initialize speech recognition
  const initializeRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = state.continuous;
    recognition.interimResults = state.interimResults;
    recognition.lang = state.language;

    recognition.onstart = () => {
      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null 
      }));
      toast({
        title: 'Listening...',
        description: 'Start speaking now. Click the stop button when finished.',
      });
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
        
        maxConfidence = Math.max(maxConfidence, confidence);
      }

      const newText = state.transcript + finalTranscript + interimTranscript;
      setState(prev => ({ 
        ...prev, 
        transcript: newText,
        confidence: maxConfidence
      }));
      
      onTextChange(newText);
    };

    recognition.onerror = (event: any) => {
      let errorMessage = 'An error occurred during speech recognition.';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Please check your microphone settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access was denied. Please allow microphone access and try again.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your internet connection.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service is not allowed.';
          break;
        case 'bad-grammar':
          errorMessage = 'Speech recognition grammar error.';
          break;
        case 'language-not-supported':
          errorMessage = 'The selected language is not supported.';
          break;
      }

      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        error: errorMessage 
      }));

      toast({
        title: 'Recognition Error',
        description: errorMessage,
        variant: 'destructive'
      });
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
      
      // Auto-restart if continuous mode is enabled and we were listening
      if (state.continuous && state.isListening) {
        timeoutRef.current = setTimeout(() => {
          startListening();
        }, 100);
      }
    };
  };

  // Start listening
  const startListening = () => {
    if (!recognitionRef.current || state.isListening) return;

    try {
      // Reinitialize with current settings
      initializeRecognition();
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start speech recognition. Please try again.' 
      }));
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  };

  // Clear transcript
  const clearTranscript = () => {
    setState(prev => ({ 
      ...prev, 
      transcript: '',
      confidence: 0 
    }));
    onTextChange('');
  };

  // Copy transcript to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(state.transcript);
      toast({
        title: 'Copied!',
        description: 'Text copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy text to clipboard.',
        variant: 'destructive'
      });
    }
  };

  // Handle language change
  const handleLanguageChange = (language: string) => {
    setState(prev => ({ ...prev, language }));
    
    if (state.isListening) {
      stopListening();
      setTimeout(() => {
        startListening();
      }, 200);
    }
  };

  // Handle settings change
  const handleSettingChange = (setting: 'continuous' | 'interimResults', value: boolean) => {
    setState(prev => ({ ...prev, [setting]: value }));
  };

  // Format confidence as percentage
  const formatConfidence = (confidence: number) => {
    return Math.round(confidence * 100);
  };

  // Get status color
  const getStatusColor = () => {
    if (state.error) return 'text-red-600';
    if (state.isListening) return 'text-green-600';
    return 'text-gray-600';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (state.error) return <AlertCircle className="h-4 w-4" />;
    if (state.isListening) return <CheckCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  if (!state.isSupported) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Speech Recognition Not Supported</span>
          </div>
          <p className="text-sm text-red-500 mt-1">
            {state.error || 'Please use Chrome, Edge, or Safari for voice-to-text functionality.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Voice Input Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice-to-Text
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="text-sm font-medium">
                  {state.isListening ? 'Listening...' : 
                   state.error ? 'Error' : 'Ready'}
                </span>
              </div>
              
              {state.isListening && state.confidence > 0 && (
                <Badge variant="outline" className="text-xs">
                  {formatConfidence(state.confidence)}% confidence
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={state.isListening ? stopListening : startListening}
                disabled={disabled || !!state.error}
                variant={state.isListening ? "destructive" : "default"}
                size="sm"
              >
                {state.isListening ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start
                  </>
                )}
              </Button>

              <Button
                onClick={clearTranscript}
                variant="outline"
                size="sm"
                disabled={!state.transcript}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear
              </Button>

              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                disabled={!state.transcript}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>

          {/* Progress Bar for Listening */}
          {state.isListening && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Listening...</span>
                <span>{formatConfidence(state.confidence)}% confidence</span>
              </div>
              <Progress value={formatConfidence(state.confidence)} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-red-500 mt-1">{state.error}</p>
            </div>
          )}

          {/* Text Output */}
          <div className="space-y-2">
            <Label htmlFor="voice-text">Transcribed Text</Label>
            <Textarea
              id="voice-text"
              value={state.transcript}
              onChange={(e) => {
                setState(prev => ({ ...prev, transcript: e.target.value }));
                onTextChange(e.target.value);
              }}
              placeholder={placeholder}
              className="min-h-[120px] resize-none"
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Voice Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language-select">Language</Label>
            <Select value={state.language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      {lang.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recognition Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="continuous-mode">Continuous Recognition</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically restart listening after pauses
                </p>
              </div>
              <Switch
                id="continuous-mode"
                checked={state.continuous}
                onCheckedChange={(checked) => handleSettingChange('continuous', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="interim-results">Interim Results</Label>
                <p className="text-xs text-muted-foreground">
                  Show partial results while speaking
                </p>
              </div>
              <Switch
                id="interim-results"
                checked={state.interimResults}
                onCheckedChange={(checked) => handleSettingChange('interimResults', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Voice Recognition Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Speak clearly and at a normal pace</li>
            <li>• Minimize background noise for better accuracy</li>
            <li>• Use punctuation commands like "period" or "comma"</li>
            <li>• Try different languages for multilingual content</li>
            <li>• Allow microphone access when prompted</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceToText; 