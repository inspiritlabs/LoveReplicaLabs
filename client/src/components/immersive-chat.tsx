import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Volume2, VolumeX } from "lucide-react";

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
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputMessage.trim(),
      audioUrl: null
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      console.log("Sending message to replica:", replica.id);

      const response = await fetch(`/api/replicas/${replica.id}/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Chat API error:", response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Chat response:", data);

      // Add AI message
      const aiMessage: Message = {
        id: data.aiMessage.id,
        role: "assistant", 
        content: data.aiMessage.content,
        audioUrl: data.aiMessage.audioUrl
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-play audio if available
      if (data.aiMessage.audioUrl) {
        playAudio(data.aiMessage.audioUrl);
      }

    } catch (error: any) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant", 
        content: `Error: ${error.message}`,
        audioUrl: null
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
          {user.credits || 5} messages remaining
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

        {isLoading && (
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
              placeholder="Type a message..."
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-12"
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}