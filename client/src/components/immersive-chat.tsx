import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Stop any playing audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }
    };
  }, [currentAudio]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      console.log("Sending message to replica:", replica.id);
      const response = await fetch(`/api/replicas/${replica.id}/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ content: content.trim() }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Chat API error:", response.status, errorText);
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || "Failed to send message";
        } catch {
          errorMessage = errorText || "Failed to send message";
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Add both user and AI messages
      setMessages(prev => [
        ...prev,
        {
          id: data.userMessage.id,
          role: "user",
          content: data.userMessage.content,
          audioUrl: null
        },
        {
          id: data.aiMessage.id,
          role: "assistant", 
          content: data.aiMessage.content,
          audioUrl: data.aiMessage.audioUrl
        }
      ]);

      // Auto-play audio if available
      if (data.aiMessage.audioUrl) {
        playAudio(data.aiMessage.audioUrl);
      }

      // Update user credits in cache
      queryClient.setQueryData(['/api/users/current'], (oldData: any) => ({
        ...oldData,
        credits: data.creditsRemaining
      }));
    },
    onError: (error: any) => {
      console.error("Chat error:", error);
      
      // Handle specific error cases
      if (error.message?.includes("402") || error.message?.includes("Insufficient credits")) {
        const paymentMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "You have used all 5 messages. Upgrade or wait for next period.",
          audioUrl: null
        };
        setMessages(prev => [...prev, paymentMessage]);
      } else {
        // Show actual error instead of generic message
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant", 
          content: `Error: ${error.message}`,
          audioUrl: null
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  });

  const voiceUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", replica.name || "Voice Clone");
      
      const response = await apiRequest("/api/voice/upload", {
        method: "POST",
        body: formData,
      });
      return response;
    },
    onSuccess: (data) => {
      // Update replica with new voice ID
      queryClient.invalidateQueries(['/api/replicas']);
    }
  });

  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }

    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };

    audio.play().catch(console.error);
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputMessage.trim(),
      audioUrl: null
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Check credits before sending
    if (user.credits <= 0) {
      const paymentMessage: Message = {
        id: `payment-${Date.now()}`,
        role: "assistant",
        content: "You have used all 5 messages. Upgrade or wait for next period.",
        audioUrl: null
      };
      setMessages(prev => [...prev, paymentMessage]);
      setInputMessage("");
      return;
    }

    sendMessageMutation.mutate(inputMessage.trim());
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={replica.photos?.[0]} />
            <AvatarFallback className="bg-purple-600 text-white">
              {replica.name?.[0]?.toUpperCase() || "R"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-white font-semibold">{replica.name}</h2>
            <p className="text-white/70 text-sm">
              {replica.voiceId ? "Voice enabled" : "Text only"}
            </p>
          </div>
        </div>
        
        {/* Credits display */}
        <div className="text-white/80 text-sm">
          {user.credits} messages remaining
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-white/60 mt-10">
            <p>Start a conversation with {replica.name}</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex items-start gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <Avatar className="w-8 h-8 mt-1">
                {message.role === "user" ? (
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={replica.photos?.[0]} />
                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                      {replica.name?.[0]?.toUpperCase() || "R"}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              
              <Card className={`p-3 ${
                message.role === "user" 
                  ? "bg-blue-600 text-white ml-2" 
                  : "bg-white/10 backdrop-blur-sm text-white mr-2"
              }`}>
                <p className="text-sm">{message.content}</p>
                
                {message.audioUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => message.audioUrl ? playAudio(message.audioUrl) : undefined}
                      className="p-1 h-auto text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    {isPlaying && currentAudio?.src === message.audioUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={stopAudio}
                        className="p-1 h-auto text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <VolumeX className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        ))}
        
        {sendMessageMutation.isPending && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-[80%]">
              <Avatar className="w-8 h-8 mt-1">
                <AvatarImage src={replica.photos?.[0]} />
                <AvatarFallback className="bg-purple-600 text-white text-xs">
                  {replica.name?.[0]?.toUpperCase() || "R"}
                </AvatarFallback>
              </Avatar>
              <Card className="bg-white/10 backdrop-blur-sm text-white mr-2 p-3">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse">Thinking...</div>
                </div>
              </Card>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={user.credits <= 0 ? "No messages remaining" : "Type a message..."}
              disabled={sendMessageMutation.isPending || user.credits <= 0}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-12"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sendMessageMutation.isPending || user.credits <= 0}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {user.credits <= 0 && (
          <p className="text-white/60 text-sm mt-2 text-center">
            You have used all 5 messages. Upgrade to continue chatting.
          </p>
        )}
      </div>
    </div>
  );
}