import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, Upload, X } from "lucide-react";
import UpgradeOverlay from "./upgrade-overlay";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  id: string;
  audioUrl?: string | null;
  feedback?: "positive" | "negative" | null;
  feedbackText?: string;
}

interface ImmersiveChatProps {
  replica: any;
  user: any;
  initialMessages?: Message[];
  initialMessagesRemaining?: number;
  onBack: () => void;
}

export default function ImmersiveChat({ replica, user, initialMessages, initialMessagesRemaining, onBack }: ImmersiveChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [inputValue, setInputValue] = useState("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(replica.photos || []);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState(initialMessagesRemaining || user.messagesRemaining || 5);
  
  // Setup states
  const [showSetup, setShowSetup] = useState(!replica.voiceId);
  const [name, setName] = useState(replica.name || "");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [personalityDescription, setPersonalityDescription] = useState(replica.personalityDescription || "");
  const [personalityTraits, setPersonalityTraits] = useState(replica.personalityTraits || {
    warmth: 5, humor: 5, thoughtfulness: 5, empathy: 5, assertiveness: 5, energy: 5
  });
  const [voiceId, setVoiceId] = useState(replica.voiceId);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

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
      if (data.creditsRemaining !== undefined) {
        setMessagesRemaining(data.creditsRemaining);
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

  const handleFileValidation = (file: File) => {
    setUploadError(null);

    // Check file type for audio
    const validTypes = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-m4a"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a WAV, MP3, or M4A file.");
      return;
    }

    // Check file size (6MB max)
    if (file.size > 6 * 1024 * 1024) {
      setUploadError("File size exceeds 6MB limit.");
      return;
    }

    // Create object URL for preview
    const url = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioUrl(url);

    // Check audio duration
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      if (duration < 10 || duration > 60) {
        setUploadError("Audio must be between 10 and 60 seconds.");
        setAudioFile(null);
        setAudioUrl(null);
        URL.revokeObjectURL(url);
        return;
      }

      // Start upload and voice creation
      setIsUploading(true);

      // Create voice with ElevenLabs using the correct endpoint
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const audioBase64 = reader.result as string;
          
          const response = await fetch("/api/voice/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioFile: audioBase64,
              name: name || "Custom Voice"
            })
          });

          if (response.ok) {
            const data = await response.json();
            setVoiceId(data.voiceId);
            setShowSetup(false);
          } else {
            const errorData = await response.json();
            setUploadError(errorData.error || "Failed to create voice");
          }
        } catch (error) {
          setUploadError("Failed to create voice. Please try again.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    };

    audio.onerror = () => {
      setUploadError("Could not process audio file. Please try another file.");
      setAudioFile(null);
      setAudioUrl(null);
      URL.revokeObjectURL(url);
    };

    audio.src = url;
  };

  const handleTraitChange = (trait: string, value: number) => {
    setPersonalityTraits((prev: any) => ({ ...prev, [trait]: value }));
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      role: "user",
      content: inputValue.trim(),
      id: Date.now().toString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
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

  // Show setup interface if voice hasn't been created yet
  if (showSetup) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 w-full max-w-2xl my-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold cosmic-glow mb-2">Create Your AI Replica</h1>
              <p className="text-gray-400">Set up your digital companion's voice and personality</p>
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Replica Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name for your replica"
                  className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Voice Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voice Sample</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                  {audioUrl ? (
                    <div className="space-y-3">
                      <audio controls src={audioUrl} className="w-full" />
                      <button
                        onClick={() => {
                          setAudioFile(null);
                          setAudioUrl(null);
                          setUploadError(null);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove Audio
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="audio-upload"
                        accept=".wav,.mp3,.m4a"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileValidation(file);
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="audio-upload"
                        className="cursor-pointer block"
                      >
                        <div className="text-gray-400 mb-2">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          Click to upload voice sample
                        </div>
                        <p className="text-xs text-gray-500">10-60 seconds, WAV/MP3/M4A, max 6MB</p>
                      </label>
                    </div>
                  )}
                </div>
                {uploadError && (
                  <p className="text-red-400 text-sm mt-2">{uploadError}</p>
                )}
              </div>

              {/* Personality Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Personality Description</label>
                <textarea
                  value={personalityDescription}
                  onChange={(e) => setPersonalityDescription(e.target.value)}
                  placeholder="Describe your replica's personality, speaking style, and characteristics..."
                  className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              {/* Personality Traits */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">Personality Traits</label>
                <div className="space-y-4">
                  {Object.entries(personalityTraits).map(([trait, value]) => (
                    <div key={trait} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">{trait}</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={value}
                          onChange={(e) => handleTraitChange(trait, parseInt(e.target.value))}
                          className="w-32 accent-purple-500"
                        />
                        <span className="text-purple-400 w-6">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={onBack}
                  className="flex-1 secondary-button py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!audioFile) {
                      setUploadError("Please upload a voice sample first");
                      return;
                    }
                    handleFileValidation(audioFile);
                  }}
                  disabled={isUploading || !audioFile || !name.trim()}
                  className="flex-1 primary-button py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {isUploading ? "Creating Voice..." : "Create Replica"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20 backdrop-blur-3xl">
      {/* Upgrade Overlay - Show when messages exhausted */}
      {messagesRemaining <= 0 && <UpgradeOverlay />}
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
            <p className="text-sm text-white/60">
              {messagesRemaining} messages remaining
            </p>
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
          <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 p-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={messagesRemaining <= 0}
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
                disabled={!inputValue.trim() || sendMessageMutation.isPending || messagesRemaining <= 0}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
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