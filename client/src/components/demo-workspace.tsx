"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { Upload, Play, Pause, Send, Trash2, Plus, X, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react"
import ImmersiveChat from "./immersive-chat"

// TypeScript types
type Role = "system" | "user" | "assistant"
type TraitName = "warmth" | "humor" | "thoughtfulness" | "empathy" | "assertiveness" | "energy"

interface Message {
  role: Role
  content: string
  id: string
  feedback?: "positive" | "negative" | null
  feedbackText?: string
}

interface Memory {
  id: string
  title: string
  description: string
  imageUrl?: string
}

interface PersonalityTraits {
  warmth: number
  humor: number
  thoughtfulness: number
  empathy: number
  assertiveness: number
  energy: number
}

const traitDescriptions: Record<TraitName, string> = {
  warmth: "Higher warmth produces softer tone and more affectionate words",
  humor: "Higher humor increases jokes, wordplay, and lighthearted responses",
  thoughtfulness: "Higher thoughtfulness creates more reflective and detailed answers",
  empathy: "Higher empathy focuses on understanding and validating emotions",
  assertiveness: "Higher assertiveness leads to more direct and confident communication",
  energy: "Higher energy creates more enthusiastic and animated responses",
}

interface DemoWorkspaceProps {
  user: any;
  onSignOut: () => void;
}

export default function DemoWorkspace({ user, onSignOut }: DemoWorkspaceProps) {
  const [showImmersiveChat, setShowImmersiveChat] = useState(false);
  const [selectedReplica, setSelectedReplica] = useState<any>(null);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Form state
  const [name, setName] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [personalityDescription, setPersonalityDescription] = useState("")
  const [personalityTraits, setPersonalityTraits] = useState<PersonalityTraits>({
    warmth: 5,
    humor: 5,
    thoughtfulness: 5,
    empathy: 5,
    assertiveness: 5,
    energy: 5,
  })
  const [photos, setPhotos] = useState<string[]>([])
  const [consentChecked, setConsentChecked] = useState(false)

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [voiceId, setVoiceId] = useState<string | null>(null)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationTime, setGenerationTime] = useState(25)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generationComplete, setGenerationComplete] = useState(false)

  // Chat state
  const [message, setMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [messagesRemaining, setMessagesRemaining] = useState(10)
  const [showUpgradeOverlay, setShowUpgradeOverlay] = useState(false)
  const [currentReplica, setCurrentReplica] = useState<any>(null)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const isMounted = useRef(false)

  // Set isMounted to true when component mounts
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Focus name input on load
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [])

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

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
      ])
    }
  }, [generationComplete, chatMessages.length, name])

  // Simulate generation countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    if (isGenerating && generationTime > 0 && isMounted.current) {
      interval = setInterval(() => {
        if (isMounted.current) {
          setGenerationTime((prev) => {
            const newTime = prev - 1
            setGenerationProgress(((25 - newTime) / 25) * 100)
            return newTime
          })
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isGenerating, generationTime])

  // Check if form is valid
  const isFormValid = () => {
    return (
      name.trim() !== "" &&
      audioFile !== null &&
      voiceId !== null &&
      personalityDescription.length >= 120 &&
      Object.values(personalityTraits).some((value) => value !== 5) &&
      consentChecked
    )
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    handleFileValidation(file)
  }

  // Handle file drop
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      handleFileValidation(file)
    }
  }

  // Prevent default drag behavior
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Validate file
  const handleFileValidation = (file: File) => {
    // Reset previous errors
    setUploadError(null)

    // Check if it's an image file for photos
    if (file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file)
      setPhotos(prev => [...prev, imageUrl])
      return
    }

    // Check file type for audio
    const validTypes = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-m4a"]
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a WAV, MP3, or M4A file.")
      return
    }

    // Check file size (6MB max)
    if (file.size > 6 * 1024 * 1024) {
      setUploadError("File size exceeds 6MB limit.")
      return
    }

    // Create object URL for preview
    const url = URL.createObjectURL(file)

    // Set file and URL first
    setAudioFile(file)
    setAudioUrl(url)

    // Check audio duration
    const audio = new Audio()
    audio.onloadedmetadata = () => {
      if (!isMounted.current) return

      const duration = audio.duration
      if (duration < 10 || duration > 60) {
        setUploadError("Audio must be between 10 and 60 seconds.")
        setAudioFile(null)
        setAudioUrl(null)
        URL.revokeObjectURL(url)
        return
      }

      // Start upload and voice creation
      setIsUploading(true)

      // Create voice with ElevenLabs
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const audioBase64 = reader.result as string
          
          const response = await fetch("/api/voice/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioFile: audioBase64,
              name: name || "Custom Voice"
            })
          })

          if (response.ok) {
            const data = await response.json()
            setVoiceId(data.voiceId)
            setUploadProgress(100)
          } else {
            throw new Error("Voice creation failed")
          }
        } catch (error) {
          console.error("Voice creation error:", error)
          setUploadError("Failed to create voice. Please try again.")
        } finally {
          setIsUploading(false)
        }
      }
      reader.readAsDataURL(file)
    }

    audio.onerror = () => {
      if (!isMounted.current) return
      setUploadError("Could not process audio file. Please try another file.")
      setAudioFile(null)
      setAudioUrl(null)
      URL.revokeObjectURL(url)
    }

    audio.src = url
  }

  // Toggle audio playback
  const toggleAudioPlayback = () => {
    if (!audioRef.current) return

    if (isAudioPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }

    setIsAudioPlaying(!isAudioPlaying)
  }

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsAudioPlaying(false)
  }

  // Handle trait change
  const handleTraitChange = (trait: TraitName, value: number) => {
    setPersonalityTraits((prev) => ({
      ...prev,
      [trait]: value,
    }))
  }



  // Generate demo
  const generateDemo = async () => {
    if (!isFormValid()) return

    setIsGenerating(true)
    setGenerationError(null)

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
      })

      if (response.ok) {
        const replica = await response.json()
        setCurrentReplica(replica)
        
        // Simulate generation time
        const timer = setTimeout(() => {
          if (isMounted.current) {
            setIsGenerating(false)
            setGenerationComplete(true)
            // Update replica as generated
            fetch(`/api/replicas/${replica.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isGenerated: true }),
            })
          }
        }, 25000)

        return () => clearTimeout(timer)
      } else {
        throw new Error("Failed to create replica")
      }
    } catch (error) {
      console.error("Error creating replica:", error)
      setGenerationError("Failed to create replica. Please try again.")
      setIsGenerating(false)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || isProcessing || !currentReplica) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      feedback: null,
    }

    setChatMessages((prev) => [...prev, userMessage])
    const currentMessage = message
    setMessage("")
    setIsProcessing(true)

    try {
      const response = await fetch(`/api/replicas/${currentReplica.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentMessage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        const aiMessage: Message = {
          id: data.aiMessage.id,
          role: "assistant",
          content: data.aiMessage.content,
          feedback: null,
        }

        setChatMessages((prev) => [...prev, aiMessage])
        
        // Auto-play the audio response
        if (data.aiMessage.audioUrl) {
          const audio = new Audio(data.aiMessage.audioUrl)
          audio.play().catch(console.error)
        }
        
        setMessagesRemaining(data.creditsRemaining)
        if (data.creditsRemaining <= 0) {
          setShowUpgradeOverlay(true)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get AI response")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        feedback: null,
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Reset conversation
  const resetConversation = () => {
    setChatMessages([
      {
        id: "system-reset",
        role: "assistant",
        content: `Hi ${name || "there"}! I'm here to chat whenever you need me. How are you feeling today?`,
        feedback: null,
      },
    ])
    setMessagesRemaining(10)
    setShowUpgradeOverlay(false)
  }

  // Submit feedback
  const submitFeedback = (messageId: string, type: "positive" | "negative", text?: string) => {
    setChatMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: type, feedbackText: text } : msg)),
    )

    // Here you would send the feedback to your API
  }

  return (
    <section id="demo-workspace" className="py-12 min-h-screen" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold cosmic-glow">Create Your Replica</h1>
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
              background: "linear-gradient(45deg, #60a5fa, #a78bfa, #f472b6, #2dd4bf)",
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
                      <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
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
                      <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
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
                      <p className="text-lg mb-2">Drop files here or click to browse</p>
                      <p className="text-sm text-gray-400">Audio: WAV, MP3, M4A • 10-60 seconds • Max 6MB</p>
                      <p className="text-sm text-gray-400">Photos: JPG, PNG • Unlimited uploads for chat backgrounds</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*,image/*"
                        onChange={(e) => {
                          const files = e.target.files
                          if (files) {
                            Array.from(files).forEach(file => {
                              handleFileValidation(file)
                            })
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
                          <span className="text-sm font-medium">{audioFile.name}</span>
                          <button
                            onClick={() => {
                              setAudioFile(null)
                              setAudioUrl(null)
                              if (audioUrl) URL.revokeObjectURL(audioUrl)
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
                            {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
                          <span className="text-sm text-gray-400">Audio ready</span>
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
                        <h4 className="text-sm font-medium text-white mb-3">Uploaded Photos ({photos.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-white/20"
                              />
                              <button
                                onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
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
                      <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      Personality Description
                    </h3>
                    <textarea
                      placeholder="Describe their personality, mannerisms, and what made them special. Include their sense of humor, how they spoke, their favorite topics, and memorable phrases they used..."
                      value={personalityDescription}
                      onChange={(e) => setPersonalityDescription(e.target.value)}
                      className="w-full h-32 p-4 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:border-purple-500 focus:outline-none transition-colors"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-400">Minimum 120 characters for best results</span>
                      <span
                        className={`text-sm ${
                          personalityDescription.length >= 120 ? "text-green-400" : "text-gray-400"
                        }`}
                      >
                        {personalityDescription.length} / 120
                      </span>
                    </div>
                  </div>

                  {/* Personality Traits */}
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      Personality Traits
                    </h3>

                    <div className="space-y-6">
                      {Object.entries(personalityTraits).map(([trait, value]) => (
                        <div key={trait}>
                          <div className="flex justify-between items-center mb-2">
                            <label className="font-medium capitalize">{trait}</label>
                            <span className="text-sm text-purple-400 font-medium">{value}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={value}
                            onChange={(e) => handleTraitChange(trait as TraitName, parseInt(e.target.value))}
                            className="trait-slider w-full"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            {traitDescriptions[trait as TraitName]}
                          </p>
                        </div>
                      ))}
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
                        I consent to creating an AI replica and understand the technology limitations
                      </span>
                    </label>
                    <button
                      onClick={generateDemo}
                      disabled={!isFormValid()}
                      className="w-full max-w-md mx-auto primary-button px-16 py-6 rounded-2xl font-bold text-xl text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 transform hover:scale-105 transition-all duration-300 shadow-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #f472b6, #06b6d4)',
                        boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
                      }}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
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
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold cosmic-glow">Generating Your AI Companion</h3>
                <p className="text-xl text-gray-300">Processing voice patterns and personality traits...</p>
                
                <div className="max-w-md mx-auto">
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                    <div
                      className="progress-bar h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    Estimated time remaining: <span className="font-medium">{generationTime}</span> seconds
                  </p>
                </div>

                <div className="space-y-3 text-left max-w-md mx-auto">
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <span className="text-sm">✓ Voice analysis complete</span>
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <span className="text-sm">⟳ Building personality model...</span>
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg opacity-50">
                    <span className="text-sm">○ Training conversational patterns</span>
                    <div className="w-3 h-3 rounded-full bg-gray-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Chat Interface */}
            {generationComplete && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-semibold cosmic-glow mb-4">Your AI Companion is Ready!</h3>
                  <p className="text-gray-300">
                    Start chatting below. You have{" "}
                    <span className="text-purple-400 font-medium">{messagesRemaining}</span> messages remaining.
                  </p>
                </div>

                {/* Chat Header */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold">{name || "AI Companion"}</h4>
                        <p className="text-sm text-gray-400">Ready to chat</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">Messages:</span>
                      <span className="text-sm font-medium text-purple-400">{messagesRemaining}</span>
                      <button
                        onClick={() => {
                          setSelectedReplica(currentReplica);
                          setShowImmersiveChat(true);
                        }}
                        className="primary-button px-8 py-4 rounded-xl text-white text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-xl"
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6, #f472b6)',
                          boxShadow: '0 15px 30px rgba(139, 92, 246, 0.4)',
                        }}
                      >
                        Enter Immersive Chat
                      </button>
                      <button
                        onClick={resetConversation}
                        className="secondary-button p-2 rounded-lg text-white"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div
                  ref={chatContainerRef}
                  className="glass-card rounded-xl p-6 h-96 overflow-y-auto space-y-4 scroll-smooth"
                >
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-blue-500 to-purple-500"
                            : "bg-gradient-to-r from-purple-500 to-pink-500"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                        )}
                      </div>
                      <div
                        className={`message-bubble rounded-lg p-4 ${
                          msg.role === "user" ? "user-message text-white" : "assistant-message"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.role === "assistant" && (
                            <div className="flex gap-2 ml-auto">
                              <button
                                onClick={() => submitFeedback(msg.id, "positive")}
                                className={`text-xs hover:text-green-400 ${
                                  msg.feedback === "positive" ? "text-green-400" : "text-gray-400"
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => submitFeedback(msg.id, "negative")}
                                className={`text-xs hover:text-red-400 ${
                                  msg.feedback === "negative" ? "text-red-400" : "text-gray-400"
                                }`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Processing Indicator */}
                  {isProcessing && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <div className="assistant-message rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <div className="audio-wave">
                            <div className="audio-wave-bar" />
                            <div className="audio-wave-bar" />
                            <div className="audio-wave-bar" />
                          </div>
                          <span className="text-sm text-gray-400">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex gap-3">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 p-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:border-purple-500 focus:outline-none transition-colors"
                      rows={2}
                      disabled={messagesRemaining <= 0}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!message.trim() || isProcessing || messagesRemaining <= 0}
                      className="primary-button px-6 py-3 rounded-lg font-medium text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>



        {/* Upgrade Overlay */}
        {showUpgradeOverlay && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="premium-card rounded-xl p-8 w-full max-w-md text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4 cosmic-glow">Demo Limit Reached</h3>
              <p className="text-gray-300 mb-6">
                You've used all 10 demo messages. Upgrade to continue unlimited conversations with your AI companion.
              </p>

              <div className="space-y-3">
                <button className="primary-button w-full py-3 rounded-lg font-medium text-white">
                  <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Upgrade to Premium
                </button>
                <button
                  onClick={resetConversation}
                  className="secondary-button w-full py-3 rounded-lg font-medium text-white"
                >
                  Reset Demo
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
            onBack={(updatedMessages: Message[], updatedRemaining: number) => {
              setChatMessages(updatedMessages);
              setMessagesRemaining(updatedRemaining);
              setShowImmersiveChat(false);
            }}
          />
        )}
      </div>
    </section>
  )
}
