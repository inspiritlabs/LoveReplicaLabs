"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  Upload,
  Play,
  Pause,
  Send,
  Trash2,
  Plus,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import ImmersiveChat from "./immersive-chat";

// TypeScript types
type Role = "system" | "user" | "assistant";
type TraitName =
  | "warmth"
  | "humor"
  | "thoughtfulness"
  | "empathy"
  | "assertiveness"
  | "energy";

interface Message {
  role: Role;
  content: string;
  id: string;
  feedback?: "positive" | "negative" | null;
  feedbackText?: string;
}

interface Memory {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

interface PersonalityTraits {
  warmth: number;
  humor: number;
  thoughtfulness: number;
  empathy: number;
  assertiveness: number;
  energy: number;
}

const traitDescriptions: Record<TraitName, string> = {
  warmth: "Higher warmth produces softer tone and more affectionate words",
  humor: "Higher humor increases jokes, wordplay, and lighthearted responses",
  thoughtfulness:
    "Higher thoughtfulness creates more reflective and detailed answers",
  empathy: "Higher empathy focuses on understanding and validating emotions",
  assertiveness:
    "Higher assertiveness leads to more direct and confident communication",
  energy: "Higher energy creates more enthusiastic and animated responses",
};

interface DemoWorkspaceProps {
  user: any;
  onSignOut: () => void;
}

export default function DemoWorkspace({ user, onSignOut }: DemoWorkspaceProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Form state
  const [name, setName] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [personalityDescription, setPersonalityDescription] = useState("");
  const [personalityTraits, setPersonalityTraits] = useState<PersonalityTraits>(
    {
      warmth: 5,
      humor: 5,
      thoughtfulness: 5,
      empathy: 5,
      assertiveness: 5,
      energy: 5,
    },
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const [consentChecked, setConsentChecked] = useState(false);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationTime, setGenerationTime] = useState(25);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);

  // Chat state
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState(5);
  const [showUpgradeOverlay, setShowUpgradeOverlay] = useState(false);
  const [currentReplica, setCurrentReplica] = useState<any>(null);
  const [showImmersiveChat, setShowImmersiveChat] = useState(false);
  const [selectedReplica, setSelectedReplica] = useState<any>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const isMounted = useRef(false);

  // Set isMounted to true when component mounts
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Focus name input on load
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  // Load persisted message count
  useEffect(() => {
    const stored = localStorage.getItem(`messagesRemaining_${user.id}`);
    if (stored !== null) {
      const remaining = parseInt(stored, 10);
      setMessagesRemaining(remaining);
      if (remaining <= 0) setShowUpgradeOverlay(true);
    }
  }, [user.id]);

  // Persist message count
  useEffect(() => {
    localStorage.setItem(
      `messagesRemaining_${user.id}`,
      messagesRemaining.toString(),
    );
  }, [messagesRemaining, user.id]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Initialize chat with system message when generation is complete
  useEffect(() => {
    if (generationComplete && chatMessages.length === 0 && isMounted.current) {
      setChatMessages([
        {
          id: "system-1",
          role: "assistant",
          content: `Hi ${name || "there"}! I'm here to chat whenever you need me. How are you feeling today?`,
          feedback: null,
        },
      ]);
    }
  }, [generationComplete, chatMessages.length, name]);

  // Simulate generation countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isGenerating && generationTime > 0 && isMounted.current) {
      interval = setInterval(() => {
        if (isMounted.current) {
          setGenerationTime((prev) => {
            const newTime = prev - 1;
            setGenerationProgress(((25 - newTime) / 25) * 100);
            return newTime;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating, generationTime]);

  // Check if form is valid
  const isFormValid = () => {
    return (
      name.trim() !== "" &&
      audioFile !== null &&
      voiceId !== null &&
      personalityDescription.length >= 120 &&
      Object.values(personalityTraits).some((value) => value !== 5) &&
      consentChecked
    );
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    handleFileValidation(file);
  };

  // Handle file drop
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileValidation(file);
    }
  };

  // Prevent default drag behavior
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Validate file
  const handleFileValidation = (file: File) => {
    // Reset previous errors
    setUploadError(null);

    // Check if it's an image file for photos
    if (file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, imageUrl]);
      return;
    }

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

    // Set file and URL first
    setAudioFile(file);
    setAudioUrl(url);

    // Check audio duration
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      if (!isMounted.current) return;

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

      // Create voice with ElevenLabs
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const audioBase64 = reader.result as string;

          const response = await fetch("/api/voice/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioFile: audioBase64,
              name: name || "Custom Voice",
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setVoiceId(data.voiceId);
            setUploadProgress(100);
          } else {
            throw new Error("Voice creation failed");
          }
        } catch (error) {
          console.error("Voice creation error:", error);
          setUploadError("Failed to create voice. Please try again.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    };

    audio.onerror = () => {
      if (!isMounted.current) return;
      setUploadError("Could not process audio file. Please try another file.");
      setAudioFile(null);
      setAudioUrl(null);
      URL.revokeObjectURL(url);
    };

    audio.src = url;
  };

  // Toggle audio playback
  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;

    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsAudioPlaying(!isAudioPlaying);
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
  };

  // Handle trait change
  const handleTraitChange = (trait: TraitName, value: number) => {
    setPersonalityTraits((prev) => ({
      ...prev,
      [trait]: value,
    }));
  };

  // Generate demo
  const generateDemo = async () => {
    if (!isFormValid()) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Create replica in database
      const response = await fetch("/api/replicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: name,
          audioUrl: audioUrl,
          voiceId: voiceId,
          personalityDescription: personalityDescription,
          personalityTraits: personalityTraits,
          photos: photos,
          isGenerated: false,
        }),
      });

      if (response.ok) {
        const replica = await response.json();
        setCurrentReplica(replica);

        // Simulate generation time
        const timer = setTimeout(() => {
          if (isMounted.current) {
            setIsGenerating(false);
            setGenerationComplete(true);
            // Update replica as generated
            fetch(`/api/replicas/${replica.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isGenerated: true }),
            });
          }
        }, 25000);

        return () => clearTimeout(timer);
      } else {
        throw new Error("Failed to create replica");
      }
    } catch (error) {
      console.error("Error creating replica:", error);
      setGenerationError("Failed to create replica. Please try again.");
      setIsGenerating(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || isProcessing || !currentReplica) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      feedback: null,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/replicas/${currentReplica.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        const aiMessage: Message = {
          id: data.aiMessage.id,
          role: "assistant",
          content: data.aiMessage.content,
          feedback: null,
        };

        setChatMessages((prev) => [...prev, aiMessage]);

        // Auto-play the audio response
        if (data.aiMessage.audioUrl) {
          const audio = new Audio(data.aiMessage.audioUrl);
          audio.play().catch(console.error);
        }

        setMessagesRemaining(data.creditsRemaining);
        if (data.creditsRemaining <= 0) {
          setShowUpgradeOverlay(true);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get AI response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        feedback: null,
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Reset conversation
  const resetConversation = () => {
    setChatMessages([
      {
        id: "system-reset",
        role: "assistant",
        content: `Hi ${name || "there"}! I'm here to chat whenever you need me. How are you feeling today?`,
        feedback: null,
      },
    ]);
    setMessagesRemaining(5);
    setShowUpgradeOverlay(false);
  };

  // Submit feedback
  const submitFeedback = (
    messageId: string,
    type: "positive" | "negative",
    text?: string,
  ) => {
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: type, feedbackText: text }
          : msg,
      ),
    );

    // Here you would send the feedback to your API
  };

  return (
    <section id="demo-workspace" className="py-12 min-h-screen" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold cosmic-glow">
            Create Your Replica
          </h1>
          <button
            onClick={onSignOut}
            className="secondary-button px-4 py-2 rounded-lg text-white"
          >
            Sign Out
          </button>
        </div>

        {/* Premium colorful box around the entire demo */}
        <div className="relative max-w-6xl mx-auto">
          {/* Colorful gradient border */}
          <div
            className="absolute inset-0 rounded-xl opacity-70"
            style={{
              background:
                "linear-gradient(45deg, #60a5fa, #a78bfa, #f472b6, #2dd4bf)",
              filter: "blur(20px)",
              transform: "scale(1.03)",
            }}
          />

          <div className="relative premium-card rounded-xl p-8">
            {!isGenerating && !generationComplete && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Configuration Panel */}
                <div className="space-y-6">
                  {/* Name Input */}
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Name Your AI Companion
                    </h3>
                    <input
                      ref={nameInputRef}
                      type="text"
                      placeholder="Enter a name..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-4 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Audio Upload */}
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-cyan-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Voice Sample Upload
                    </h3>
                    <div
                      className="upload-zone rounded-lg p-8 text-center cursor-pointer"
                      onDrop={handleFileDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mx-auto text-4xl text-gray-400 mb-4 w-12 h-12" />
                      <p className="text-lg mb-2">
                        Drop files here or click to browse
                      </p>
                      <p className="text-sm text-gray-400">
                        Audio: WAV, MP3, M4A • 10-60 seconds • Max 6MB
                      </p>
                      <p className="text-sm text-gray-400">
                        Photos: JPG, PNG • Unlimited uploads for chat
                        backgrounds
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*,image/*"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            Array.from(files).forEach((file) => {
                              handleFileValidation(file);
                            });
                          }
                        }}
                        className="hidden"
                        multiple
                      />
                    </div>

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="mt-4 p-4 bg-black/30 rounded-lg">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="progress-bar h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Audio Preview */}
                    {audioFile && !isUploading && (
                      <div className="mt-4 p-4 bg-black/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {audioFile.name}
                          </span>
                          <button
                            onClick={() => {
                              setAudioFile(null);
                              setAudioUrl(null);
                              if (audioUrl) URL.revokeObjectURL(audioUrl);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={toggleAudioPlayback}
                            className="primary-button p-2 rounded-full text-white"
                          >
                            {isAudioPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <div className="audio-wave">
                            <div className="audio-wave-bar" />
                            <div className="audio-wave-bar" />
                            <div className="audio-wave-bar" />
                            <div className="audio-wave-bar" />
                            <div className="audio-wave-bar" />
                            <div className="audio-wave-bar" />
                            <div className="audio-wave-bar" />
                          </div>
                          <span className="text-sm text-gray-400">
                            Audio ready
                          </span>
                        </div>
                        {audioUrl && (
                          <audio
                            ref={audioRef}
                            src={audioUrl}
                            onEnded={handleAudioEnded}
                            className="hidden"
                          />
                        )}
                      </div>
                    )}

                    {/* Photos Preview */}
                    {photos.length > 0 && (
                      <div className="mt-4 p-4 bg-black/30 rounded-lg">
                        <h4 className="text-sm font-medium text-white mb-3">
                          Uploaded Photos ({photos.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-white/20"
                              />
                              <button
                                onClick={() =>
                                  setPhotos((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  )
                                }
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload Error */}
                    {uploadError && (
                      <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        {uploadError}
                      </div>
                    )}
                  </div>

                  {/* Personality Description */}
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-pink-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Personality Description
                    </h3>
                    <textarea
                      placeholder="Describe their personality, mannerisms, and what made them special. Include their sense of humor, how they spoke, their favorite topics, and memorable phrases they used..."
                      value={personalityDescription}
                      onChange={(e) =>
                        setPersonalityDescription(e.target.value)
                      }
                      className="w-full h-32 p-4 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:border-purple-500 focus:outline-none transition-colors"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-400">
                        Minimum 120 characters for best results
                      </span>
                      <span
                        className={`text-sm ${
                          personalityDescription.length >= 120
                            ? "text-green-400"
                            : "text-gray-400"
                        }`}
                      >
                        {personalityDescription.length} / 120
                      </span>
                    </div>
                  </div>

                  {/* Personality Traits */}
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                        />
                      </svg>
                      Personality Traits
                    </h3>

                    <div className="space-y-6">
                      {Object.entries(personalityTraits).map(
                        ([trait, value]) => (
                          <div key={trait}>
                            <div className="flex justify-between items-center mb-2">
                              <label className="font-medium capitalize">
                                {trait}
                              </label>
                              <span className="text-sm text-purple-400 font-medium">
                                {value}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={value}
                              onChange={(e) =>
                                handleTraitChange(
                                  trait as TraitName,
                                  parseInt(e.target.value),
                                )
                              }
                              className="trait-slider w-full"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              {traitDescriptions[trait as TraitName]}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Consent and Generate Button */}
                  <div className="text-center space-y-4">
                    <label className="flex items-center justify-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                        className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                      />
                      <span className="text-gray-300">
                        I consent to creating an AI replica and understand the
                        technology limitations
                      </span>
                    </label>
                    <button
                      onClick={generateDemo}
                      disabled={!isFormValid()}
                      className="w-full max-w-md mx-auto primary-button px-16 py-6 rounded-2xl font-bold text-xl text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 transform hover:scale-105 transition-all duration-300 shadow-2xl"
                      style={{
                        background:
                          "linear-gradient(135deg, #8b5cf6, #f472b6, #06b6d4)",
                        boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)",
                      }}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Generate AI Companion
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Generation Progress */}
            {isGenerating && (
              <div className="text-center space-y-6 py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto pulse-glow">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold cosmic-glow">
                  Generating Your AI Companion
                </h3>
                <p className="text-xl text-gray-300">
                  Processing voice patterns and personality traits...
                </p>

                <div className="max-w-md mx-auto">
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                    <div
                      className="progress-bar h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    Estimated time remaining:{" "}
                    <span className="font-medium">{generationTime}</span>{" "}
                    seconds
                  </p>
                </div>

                <div className="space-y-3 text-left max-w-md mx-auto">
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <span className="text-sm">✓ Voice analysis complete</span>
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <span className="text-sm">
                      ⟳ Building personality model...
                    </span>
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg opacity-50">
                    <span className="text-sm">
                      ○ Training conversational patterns
                    </span>
                    <div className="w-3 h-3 rounded-full bg-gray-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Chat Interface */}
            {generationComplete && (
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20 backdrop-blur-3xl">
                {/* Floating Photos Background */}
                {photos.map((photo, index) => (
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
                        background:
                          "linear-gradient(45deg, #ff006e, #8338ec, #3a86ff, #06ffa5, #ffbe0b, #ff006e)",
                        backgroundSize: "300% 300%",
                        animation: "rainbow 3s ease infinite",
                        padding: "2px",
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

                <div className="absolute top-4 right-4 text-sm text-white/80 z-30">
                  {messagesRemaining} / 5
                </div>

                {/* Messages */}
                <div
                  className="relative pt-24 pb-24 px-6 h-96 overflow-y-auto"
                  ref={chatContainerRef}
                >
                  <div className="max-w-4xl mx-auto space-y-6">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className="flex flex-col space-y-2 max-w-[70%]">
                          {message.role === "user" && (
                            <div className="text-xs text-white/60 text-right pr-2">
                              You
                            </div>
                          )}
                          <div
                            className={`relative rounded-2xl px-5 py-3 transition-all duration-300 hover:scale-[1.02] ${
                              message.role === "user"
                                ? "bg-white/5 backdrop-blur-md ml-auto"
                                : "bg-black/10 backdrop-blur-md"
                            }`}
                            style={{
                              boxShadow:
                                message.role === "user"
                                  ? "0 8px 32px rgba(255, 255, 255, 0.1)"
                                  : "0 8px 32px rgba(0, 0, 0, 0.2)",
                            }}
                          >
                            <p className="text-white leading-relaxed font-medium">
                              {message.content}
                            </p>
                          </div>
                          {message.role === "assistant" && (
                            <div className="text-xs text-white/60 pl-2">
                              {name || "AI Companion"}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="flex flex-col space-y-2 max-w-[70%]">
                          <div className="bg-black/10 backdrop-blur-md rounded-2xl px-5 py-3">
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1 bg-white/60 rounded-full animate-pulse"
                                  style={{
                                    height: `${Math.random() * 20 + 10}px`,
                                    animationDelay: `${i * 0.1}s`,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 p-4">
                      <div className="flex items-end gap-4">
                        <div className="flex-1">
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            placeholder="Type your message..."
                            className="w-full bg-transparent text-white placeholder-white/50 border-none outline-none resize-none min-h-[24px] max-h-32"
                            rows={1}
                            disabled={messagesRemaining <= 0}
                          />
                        </div>
                        <button
                          onClick={sendMessage}
                          disabled={
                            !message.trim() ||
                            isProcessing ||
                            messagesRemaining <= 0
                          }
                          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <audio ref={audioRef} className="hidden" />
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Overlay */}
        {showUpgradeOverlay && (
          <div
            id="upgrade-overlay"
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-6">
              <div className="plan-card bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xl font-semibold mb-2">
                  Starter – First Light
                </h3>
                <p className="text-3xl font-bold mb-4">
                  $24<span className="text-base font-normal">/mo</span>
                </p>
                <ul className="text-sm space-y-1 flex-1">
                  <li>20 min voice time</li>
                  <li>1 M chat tokens</li>
                  <li>5 photos</li>
                </ul>
                <button
                  onClick={() =>
                    window.open("https://buy.stripe.com/test_xxx", "_blank")
                  }
                  data-plan="starter"
                  className="mt-6 primary-button w-full"
                >
                  Keep It Simple
                </button>
              </div>
              <div className="plan-card bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative">
                <span className="absolute -top-3 right-3 bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded shadow">
                  Most Loved
                </span>
                <h3 className="text-xl font-semibold mb-2">
                  Pro – Forever Within
                </h3>
                <p className="text-3xl font-bold mb-4">
                  $99<span className="text-base font-normal">/mo</span>
                </p>
                <ul className="text-sm space-y-1 flex-1">
                  <li>40 min voice time</li>
                  <li>5 M chat tokens</li>
                  <li>20 photos</li>
                  <li>Faster replies</li>
                  <li>Fine-tuning</li>
                </ul>
                <button
                  onClick={() =>
                    window.open("https://buy.stripe.com/test_xxx", "_blank")
                  }
                  data-plan="pro"
                  className="mt-6 primary-button w-full"
                >
                  Upgrade Now
                </button>
              </div>
              <div className="plan-card bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xl font-semibold mb-2">
                  Elite – Legacy Vault
                </h3>
                <p className="text-3xl font-bold mb-4">
                  $279<span className="text-base font-normal">/mo</span>
                </p>
                <ul className="text-sm space-y-1 flex-1">
                  <li>Hours of conversation</li>
                  <li>Unlimited memories</li>
                  <li>Quarterly re-training</li>
                  <li>Dedicated phone number</li>
                </ul>
                <button
                  onClick={() =>
                    window.open("https://buy.stripe.com/test_xxx", "_blank")
                  }
                  data-plan="elite"
                  className="mt-6 primary-button w-full"
                >
                  Preserve Forever
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Immersive Chat Overlay */}
        {showImmersiveChat && selectedReplica && (
          <ImmersiveChat
            replica={selectedReplica}
            user={user}
            initialMessages={chatMessages}
            initialMessagesRemaining={messagesRemaining}
            onBack={(updatedMessages, updatedRemaining) => {
              setChatMessages(updatedMessages);
              setMessagesRemaining(updatedRemaining);
              setShowImmersiveChat(false);
            }}
          />
        )}
      </div>
      <style>{`
        .plan-card {
          transition:
            transform 0.3s,
            box-shadow 0.3s;
        }
        .plan-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.4);
        }
        .primary-button {
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 9999px;
          padding: 0.75rem 1.5rem;
          color: #fff;
          font-weight: 600;
        }
      `}</style>
    </section>
  );
}
