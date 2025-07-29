import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Mic, 
  MicOff, 
  Square, 
  Settings,
  AlertCircle,
  CheckCircle,
  Languages,
  Volume2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface VoiceInputProps {
  onTextChange: (text: string) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  language: string;
  continuous: boolean;
  interimResults: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTextChange,
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const { toast } = useToast();
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    confidence: 0,
    error: null,
    language: 'en-US',
    continuous: true,
    interimResults: true
  });

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Available languages
  const availableLanguages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'hi-IN', name: 'Hindi' }
  ];

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;
    
    setState(prev => ({ ...prev, isSupported }));

    if (isSupported) {
      initializeRecognition();
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
        error: null,
        transcript: ''
      }));
      toast({
        title: 'Listening...',
        description: 'Start speaking now.',
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
      
      // Send final transcript to parent
      if (finalTranscript) {
        onTextChange(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error.';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied.';
          break;
        case 'network':
          errorMessage = 'Network error.';
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
      
      // Auto-restart if continuous mode is enabled
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
      initializeRecognition();
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start speech recognition.' 
      }));
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  };

  // Toggle listening
  const toggleListening = () => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle language change
  const handleLanguageChange = (language: string) => {
    setState(prev => ({ ...prev, language }));
    
    // Stop current recognition if active
    if (state.isListening) {
      stopListening();
    }
    
    // Start listening with new language after a short delay
    setTimeout(() => {
      startListening();
    }, 200);
  };

  // Handle settings change
  const handleSettingChange = (setting: 'continuous' | 'interimResults', value: boolean) => {
    setState(prev => ({ ...prev, [setting]: value }));
  };

  // Get button size classes
  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'lg': return 'h-12 w-12';
      default: return 'h-10 w-10';
    }
  };

  // Get icon size
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-6 w-6';
      default: return 'h-5 w-5';
    }
  };

  if (!state.isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled
              className={`${getButtonSize()} ${className}`}
            >
              <AlertCircle className={getIconSize()} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice input not supported in this browser</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                onClick={toggleListening}
                disabled={disabled || !!state.error}
                variant={state.isListening ? "destructive" : "outline"}
                size="icon"
                className={`${getButtonSize()} ${className} relative`}
              >
                {state.isListening ? (
                  <Square className={getIconSize()} />
                ) : (
                  <Mic className={getIconSize()} />
                )}
                
                {/* Confidence indicator */}
                {state.isListening && state.confidence > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {Math.round(state.confidence * 100)}%
                    </Badge>
                  </div>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{state.isListening ? 'Stop voice input' : 'Start voice input'}</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {state.isListening ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Volume2 className="h-4 w-4 text-gray-600" />
                )}
                <span className="text-sm font-medium">
                  {state.isListening ? 'Listening...' : 'Voice Input'}
                </span>
              </div>
              
              {state.isListening && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(state.confidence * 100)}% confidence
                </Badge>
              )}
            </div>

            {/* Error Display */}
            {state.error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {state.error}
              </div>
            )}

            {/* Language Selection */}
            <div className="space-y-2">
              <Label htmlFor="voice-language" className="text-xs">Language</Label>
              <Select value={state.language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="voice-language" className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <Languages className="h-3 w-3" />
                        {lang.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="continuous-voice" className="text-xs">Continuous</Label>
                  <p className="text-xs text-muted-foreground">Auto-restart after pauses</p>
                </div>
                <Switch
                  id="continuous-voice"
                  checked={state.continuous}
                  onCheckedChange={(checked) => handleSettingChange('continuous', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="interim-voice" className="text-xs">Interim Results</Label>
                  <p className="text-xs text-muted-foreground">Show partial results</p>
                </div>
                <Switch
                  id="interim-voice"
                  checked={state.interimResults}
                  onCheckedChange={(checked) => handleSettingChange('interimResults', checked)}
                />
              </div>
            </div>

            {/* Quick Tips */}
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Tips:</p>
              <ul className="space-y-0.5">
                <li>• Speak clearly and at normal pace</li>
                <li>• Say "period" or "comma" for punctuation</li>
                <li>• Minimize background noise</li>
              </ul>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

export default VoiceInput; 