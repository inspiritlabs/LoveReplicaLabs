import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, Upload, X } from "lucide-react";

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
  const [inputValue, setInputValue] = useState("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(replica.photos || []);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const MAX_MESSAGES = 5;
  const audioRef = useRef<HTMLAudioElement>(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Auto-launch fullscreen
  useEffect(() => {
    const requestFullscreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Silently handle fullscreen rejection
        });
      }
    };
    requestFullscreen();
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/replicas/${replica.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, data.userMessage, data.aiMessage]);
      if (data.aiMessage.audioUrl) {
        playAudio(data.aiMessage.audioUrl);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      // For now, create a local URL for the uploaded photo
      const photoUrl = URL.createObjectURL(file);
      return { photoUrl };
    },
    onSuccess: (data) => {
      setUploadedPhotos(prev => [...prev, data.photoUrl]);
      setShowPhotoUpload(false);
    },
  });

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsAudioPlaying(true);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || hasReachedLimit) return;
    
    // Count user messages only
    const userMessageCount = messages.filter(msg => msg.role === "user").length;
    
    if (userMessageCount >= MAX_MESSAGES) {
      setHasReachedLimit(true);
      return;
    }
    
    const userMessage: Message = {
      role: "user",
      content: inputValue.trim(),
      id: Date.now().toString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    
    // Check if this is the 5th message
    if (userMessageCount + 1 >= MAX_MESSAGES) {
      setHasReachedLimit(true);
      // Add payment invitation message after a short delay
      setTimeout(() => {
        const paymentMessage: Message = {
          role: "assistant",
          content: "I've truly enjoyed our conversation together. There's so much more I'd love to share with you - deeper memories, more stories, and continued connection. To keep talking and exploring all the moments we could create together, would you like to explore our plans? I'm here whenever you're ready to continue our journey.",
          id: (Date.now() + 1).toString(),
        };
        setMessages(prev => [...prev, paymentMessage]);
      }, 1000);
      return;
    }
    
    sendMessageMutation.mutate(userMessage.content);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const getRandomPosition = (index: number) => {
    const positions = [
      { top: "10%", left: "5%" },
      { top: "20%", right: "8%" },
      { top: "50%", left: "3%" },
      { top: "70%", right: "5%" },
      { top: "30%", left: "15%" },
      { top: "60%", right: "12%" },
    ];
    return positions[index % positions.length];
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20 backdrop-blur-3xl">
      {/* Floating Photos Background */}
      {uploadedPhotos.map((photo, index) => (
        <div
          key={index}
          className="absolute pointer-events-none transition-opacity duration-700"
          style={{
            left: `${Math.random() * 70 + 15}%`,
            top: `${Math.random() * 70 + 15}%`,
            animation: `float ${20 + Math.random() * 10}s ease-in-out infinite alternate`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        >
          <div 
            className="relative rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff, #06ffa5, #ffbe0b, #ff006e)',
              backgroundSize: '300% 300%',
              animation: 'rainbow 3s ease infinite',
              padding: '2px',
            }}
          >
            <img
              src={photo}
              alt="Memory"
              className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg"
            />
          </div>
        </div>
      ))}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
            Back
          </button>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">{replica.name}</h1>
            <p className="text-sm text-white/60">Digital Replica</p>
            <div className="text-white/70 text-sm">{messages.length}</div>
          </div>
          <button
            onClick={() => setShowPhotoUpload(!showPhotoUpload)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <Upload className="w-5 h-5" />
            Photos
          </button>
        </div>
      </div>

      {/* Photo Upload Panel */}
      {showPhotoUpload && (
        <div className="absolute top-20 right-6 z-30 bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3">Add Photos</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="w-full text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-white/10 file:text-white/80 hover:file:bg-white/20"
          />
        </div>
      )}

      {/* Messages Container */}
      <div className="absolute inset-0 pt-24 pb-24 px-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col space-y-2 max-w-[70%]">
                {message.role === "user" && (
                  <div className="text-xs text-white/60 text-right pr-2">
                    {replica.userName || "You"}
                  </div>
                )}
                <div
                  className={`relative rounded-2xl px-5 py-3 transition-all duration-300 hover:scale-[1.02] ${
                    message.role === "user" 
                      ? "bg-white/5 backdrop-blur-md ml-auto" 
                      : "bg-black/10 backdrop-blur-md"
                  }`}
                  style={{
                    boxShadow: message.role === "user" 
                      ? "0 8px 32px rgba(255, 255, 255, 0.1)" 
                      : "0 8px 32px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <p className="text-white leading-relaxed font-medium">{message.content}</p>
                  
                  {/* Show Explore Plans button for payment invitation message */}
                  {message.role === "assistant" && hasReachedLimit && message.content.includes("explore our plans") && (
                    <div className="mt-4 flex justify-center">
                      <button 
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                        onClick={() => {
                          // TODO: Navigate to plans page when implemented
                          alert("Plans page coming soon!");
                        }}
                      >
                        Explore Plans
                      </button>
                    </div>
                  )}
                  
                  {message.audioUrl && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 bg-white/60 rounded-full ${
                              isAudioPlaying ? "animate-pulse" : ""
                            }`}
                            style={{
                              height: `${Math.random() * 20 + 10}px`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-white/60">Playing...</span>
                    </div>
                  )}
                </div>
                {message.role === "assistant" && (
                  <div className="text-xs text-white/60 pl-2">
                    {replica.name}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
        <div className="max-w-4xl mx-auto">
          {hasReachedLimit ? (
            <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 p-6 text-center">
              <p className="text-white/70 text-sm mb-2">You've reached your free message limit</p>
              <p className="text-white/50 text-xs">Explore our plans to continue the conversation</p>
            </div>
          ) : (
            <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 p-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="w-full bg-transparent text-white placeholder-white/50 border-none outline-none resize-none min-h-[24px] max-h-32"
                    rows={1}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || sendMessageMutation.isPending}
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {/* Message counter */}
              <div className="mt-2 text-right">
                <span className="text-xs text-white/40">
                  {messages.filter(msg => msg.role === "user").length}/{MAX_MESSAGES} messages
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onPlay={() => setIsAudioPlaying(true)}
        onEnded={() => setIsAudioPlaying(false)}
        onPause={() => setIsAudioPlaying(false)}
      />
    </div>
  );
}