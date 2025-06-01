import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Volume2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
  audioUrl?: string | null;
}

interface ImmersiveChatProps {
  replica: any;
  user: any;
  onBack: () => void;
}

export default function ImmersiveChat({ replica, user, onBack }: ImmersiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [credits, setCredits] = useState(user?.credits || 5);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const playAudio = (url: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }
    
    const audio = new Audio(url);
    setCurrentAudio(audio);
    audio.play().catch(console.error);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
    };
  }, [currentAudio]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || credits <= 0) return;
    
    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    
    // Add user message immediately
    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      content: userMessage,
      audioUrl: null
    };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      const response = await fetch(`/api/replicas/${replica.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Add AI response
        const aiMsg: Message = {
          id: String(Date.now() + 1),
          role: "assistant",
          content: data.aiMessage?.content || data.content || "No response received",
          audioUrl: data.aiMessage?.audioUrl || data.audioUrl || null
        };
        
        setMessages(prev => [...prev, aiMsg]);
        setCredits(data.creditsRemaining || credits - 1);
        
        // Play audio if available
        if (aiMsg.audioUrl) {
          playAudio(aiMsg.audioUrl);
        }
      } else {
        // Show error
        const errorMsg: Message = {
          id: String(Date.now() + 2),
          role: "assistant",
          content: `Error: ${data.error || "Failed to get response"}`,
          audioUrl: null
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      // Show network error
      const errorMsg: Message = {
        id: String(Date.now() + 3),
        role: "assistant",
        content: `Network error: ${String(error)}`,
        audioUrl: null
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-white">{replica.name}</h1>
            <p className="text-sm text-white/60">AI Replica</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-white/10 text-white">
          {credits} credits remaining
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-white/60 mt-8">
            <p>Start a conversation with {replica.name}</p>
            <p className="text-sm mt-2">You have {credits} messages remaining</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-[80%] p-4 ${
                message.role === "user"
                  ? "bg-blue-600 text-white ml-auto"
                  : "bg-white/10 text-white backdrop-blur-sm"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              {message.audioUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => playAudio(message.audioUrl!)}
                  className="mt-2 text-xs hover:bg-white/10"
                >
                  <Volume2 className="w-3 h-3 mr-1" />
                  Play Audio
                </Button>
              )}
            </Card>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <Card className="bg-white/10 text-white backdrop-blur-sm p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-150"></div>
                <span className="text-sm text-white/60 ml-2">Thinking...</span>
              </div>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 backdrop-blur-sm">
        {credits <= 0 ? (
          <div className="text-center text-white/60">
            <p>No credits remaining</p>
            <Button
              onClick={onBack}
              className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Upgrade Plan
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${replica.name}...`}
              disabled={isLoading}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}