import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  X, 
  Send, 
  Upload, 
  Scissors, 
  Captions, 
  Volume2, 
  Share2,
  Loader2,
  Bot,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  prompt: string;
}

const quickActions: QuickAction[] = [
  { label: 'Upload content', icon: Upload, prompt: 'I want to upload new content to refine' },
  { label: 'Create clips', icon: Scissors, prompt: 'Help me create viral clips from my content' },
  { label: 'Add captions', icon: Captions, prompt: 'I need help adding captions to my video' },
  { label: 'Clean audio', icon: Volume2, prompt: 'How can I clean up the audio in my content?' },
  { label: 'Export tips', icon: Share2, prompt: 'What are the best export settings for social media?' },
];

export function RefinerAIPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/refiner')) return 'Refiner Studio';
    if (path.includes('/upload')) return 'Upload';
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/projects')) return 'Projects';
    if (path.includes('/library')) return 'Library';
    if (path.includes('/recording')) return 'Recording Studio';
    return 'Dashboard';
  };

  const streamChat = async (userMessage: string) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alchify-refiner-ai`;
    
    const allMessages = [...messages, { role: 'user' as const, content: userMessage }];
    
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: allMessages,
          context: {
            currentPage: getCurrentPage(),
          }
        }),
      });

      if (resp.status === 429) {
        toast({
          title: "Rate limited",
          description: "Too many requests. Please wait a moment.",
          variant: "destructive",
        });
        return;
      }

      if (resp.status === 402) {
        toast({
          title: "Credits exhausted",
          description: "Please add more AI credits to continue.",
          variant: "destructive",
        });
        return;
      }

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to start stream");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;

      // Add empty assistant message to start
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    await streamChat(userMessage);
    setIsLoading(false);
  };

  const handleQuickAction = async (action: QuickAction) => {
    if (isLoading) return;
    
    setMessages(prev => [...prev, { role: 'user', content: action.prompt }]);
    setIsLoading(true);
    
    await streamChat(action.prompt);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-gradient-to-r from-primary to-accent text-primary-foreground",
          "shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200",
          "font-medium",
          isOpen && "hidden"
        )}
      >
        <Sparkles className="h-5 w-5" />
        <span>Refiner AI</span>
      </button>

      {/* Slide-out Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[420px] z-50",
          "bg-card border-l border-border shadow-2xl",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Refiner AI</h2>
              <p className="text-xs text-muted-foreground">Your creative assistant</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat Area */}
        <ScrollArea className="h-[calc(100vh-180px)]" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  What would you like to refine today?
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  I can help you upload content, create clips, add captions, and more.
                </p>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action)}
                      disabled={isLoading}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-full",
                        "border border-border bg-background hover:bg-muted",
                        "text-sm font-medium transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <action.icon className="h-4 w-4 text-primary" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 p-2 rounded-full h-8 w-8 flex items-center justify-center",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-gradient-to-br from-primary/20 to-accent/20"
                  )}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className={cn(
                    "rounded-2xl px-4 py-3 max-w-[85%]",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content || '...'}</p>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 p-2 rounded-full h-8 w-8 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Refiner AI anything..."
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isLoading}
              size="icon"
              className="flex-shrink-0 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default RefinerAIPanel;
