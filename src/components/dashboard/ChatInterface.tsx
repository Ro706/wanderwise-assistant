import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import ItineraryCard from './ItineraryCard';
import TradeoffSlider from './TradeoffSlider';
import { generateItineraries, sampleQueries, Itinerary } from '@/lib/mockData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  itineraries?: Itinerary[];
  showTradeoff?: boolean;
}

interface ChatInterfaceProps {
  conversationId: string | null;
}

const ChatInterface = ({ conversationId }: ChatInterfaceProps) => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tradeoff, setTradeoff] = useState(50);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response with itineraries
    setTimeout(() => {
      const itineraries = generateItineraries(2);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've analyzed your travel request and generated 3 optimized options based on your preferences. Each option is tailored to different priorities - budget, balanced value, or premium comfort.

Here's what I considered:
• Your mention of ${input.includes('senior') ? 'senior citizens - prioritizing comfort and minimal layovers' : 'your travel needs'}
• Flight timing and convenience
• Hotel quality and amenities
• Overall value for money

You can use the preference slider below to adjust the recommendations based on what matters most to you.`,
        itineraries,
        showTradeoff: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Travel Copilot</h2>
            <p className="text-xs text-muted-foreground">AI-powered travel planning</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mb-6 animate-bounce-subtle">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
              {t('welcome')} to Travel Copilot
            </h3>
            <p className="text-muted-foreground max-w-md mb-8">
              I'm your AI travel assistant. Tell me about your travel needs and I'll find the best options for you.
            </p>
            
            {/* Sample Queries */}
            <div className="w-full max-w-2xl">
              <p className="text-sm text-muted-foreground mb-4">Try asking:</p>
              <div className="grid gap-3">
                {sampleQueries.slice(0, 3).map((query, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(query)}
                    className="p-4 text-left rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-soft transition-all duration-200"
                  >
                    <p className="text-sm text-foreground">{query}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4 animate-slide-up",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-xl gradient-primary flex-shrink-0 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] space-y-4",
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-5 py-4",
                      message.role === 'user'
                        ? "gradient-primary text-primary-foreground"
                        : "bg-card border border-border shadow-soft"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Tradeoff Slider */}
                  {message.showTradeoff && (
                    <TradeoffSlider value={tradeoff} onChange={setTradeoff} />
                  )}
                  
                  {/* Itinerary Cards */}
                  {message.itineraries && (
                    <div className="grid gap-4 mt-4">
                      {message.itineraries.map((itinerary) => (
                        <ItineraryCard key={itinerary.id} itinerary={itinerary} />
                      ))}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-10 h-10 rounded-xl bg-accent flex-shrink-0 flex items-center justify-center">
                    <User className="w-5 h-5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 animate-slide-up">
                <div className="w-10 h-10 rounded-xl gradient-primary flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="bg-card border border-border rounded-2xl px-5 py-4 shadow-soft">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing your request...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('typeMessage')}
              className="min-h-[52px] max-h-[200px] resize-none bg-background"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-[52px] w-[52px] gradient-primary text-primary-foreground shadow-glow-primary"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;