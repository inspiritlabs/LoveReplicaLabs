import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Play, Pause, User, Bot, ThumbsUp, ThumbsDown, Send, Loader, RefreshCw, Image as ImageIcon } from "lucide-react";
import ImmersiveChat from "./immersive-chat";

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

interface DemoWorkspaceProps {
  user: any;
  onSignOut: () => void;
}

export default function DemoWorkspace({ user, onSignOut }: DemoWorkspaceProps) {
  const [name, setName] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationComplete, setGenerationComplete] = useState(false)
  const [currentReplica, setCurrentReplica] = useState<any>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState("You are a warm, empathetic AI companion. Respond with care and understanding, drawing from the personality traits configured for you.")
  const [personalityTraits, setPersonalityTraits] = useState<PersonalityTraits>({
    warmth: 7,
    humor: 5,
    thoughtfulness: 8,
    empathy: 9,
    assertiveness: 4,
    energy: 6,
  })
  const [showImmersiveChat, setShowImmersiveChat] = useState(false)
  const [selectedReplica, setSelectedReplica] = useState<any>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const queryClient = useQueryClient()

  // Auto-launch immersive chat when generation completes
  useEffect(() => {
    if (generationComplete && currentReplica && !showImmersiveChat) {
      setSelectedReplica(currentReplica);
      setShowImmersiveChat(true);
    }
  }, [generationComplete, currentReplica, showImmersiveChat])

  const handleFileValidation = (file: File) => {
    const maxSize = 25 * 1024 * 1024 // 25MB
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm']
    
    if (file.size > maxSize) {
      alert('File size must be less than 25MB')
      return false
    }
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload an audio file (MP3, WAV, M4A, WebM)')
      return false
    }
    
    return true
  }

  const handleTraitChange = (trait: TraitName, value: number) => {
    setPersonalityTraits((prev) => ({
      ...prev,
      [trait]: value,
    }))
  }

  const createVoiceMutation = useMutation({
    mutationFn: async (file: File) => {
      // Convert file to base64
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/voice/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioFile: base64Audio,
          name: name
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create voice')
      }

      return response.json()
    },
  })

  const createReplicaMutation = useMutation({
    mutationFn: async (voiceData: any) => {
      const response = await fetch('/api/replicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name,
          voiceId: voiceData.voiceId,
          personalityTraits,
          photos: uploadedPhotos,
          systemPrompt,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create replica')
      }
      return response.json()
    },
    onSuccess: (replica) => {
      setCurrentReplica(replica)
      setGenerationComplete(true)
      queryClient.invalidateQueries({ queryKey: ['/api/replicas'] })
    },
  })

  const handleGenerate = async () => {
    if (!name.trim()) {
      alert('Please enter a name for your AI companion')
      return
    }

    if (!audioFile) {
      alert('Please upload an audio file')
      return
    }

    console.log('Audio file selected:', audioFile.name, audioFile.type, audioFile.size)
    setIsGenerating(true)

    try {
      const voiceData = await createVoiceMutation.mutateAsync(audioFile)
      await createReplicaMutation.mutateAsync(voiceData)
    } catch (error: any) {
      console.error('Generation failed:', error)
      alert(error.message || 'Failed to generate AI companion')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string
          setUploadedPhotos(prev => [...prev, imageUrl])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index))
  }

  if (showImmersiveChat && selectedReplica) {
    return (
      <ImmersiveChat
        replica={selectedReplica}
        user={user}
        onBack={() => setShowImmersiveChat(false)}
      />
    )
  }

  return (
    <section className="min-h-screen starry-bg relative overflow-hidden">
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold cosmic-glow mb-6">Create Your AI Companion</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Upload a voice sample and configure personality traits to bring your digital companion to life
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Setup */}
            <div className="space-y-6">
              {/* Name Input */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 cosmic-glow">Companion Name</h3>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name..."
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* System Prompt */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 cosmic-glow">System Prompt</h3>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Define how your AI companion should behave and respond..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  This defines your companion's personality and behavior patterns.
                </p>
              </div>

              {/* Voice Upload */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 cosmic-glow">Voice Sample</h3>
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-400">
                      {audioFile ? audioFile.name : "Click to upload audio file (MP3, WAV, M4A)"}
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && handleFileValidation(file)) {
                        setAudioFile(file)
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 cosmic-glow">Photos</h3>
                <div className="space-y-4">
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-400">Upload photos to animate in chat</p>
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  {uploadedPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-white/20"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Personality */}
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-6 cosmic-glow">Personality Traits</h3>
                <div className="space-y-6">
                  {Object.entries(personalityTraits).map(([trait, value]) => (
                    <div key={trait}>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium capitalize text-gray-300">
                          {trait}
                        </label>
                        <span className="text-sm text-purple-400">{value}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={value}
                        onChange={(e) => handleTraitChange(trait as TraitName, parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!name.trim() || !audioFile || isGenerating}
                className="w-full primary-button py-4 rounded-xl text-white text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #f472b6)',
                  boxShadow: '0 15px 30px rgba(139, 92, 246, 0.4)',
                }}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader className="w-6 h-6 animate-spin" />
                    Creating Your Companion...
                  </div>
                ) : (
                  "Generate AI Companion"
                )}
              </button>
            </div>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="mt-8 glass-card rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 cosmic-glow text-center">Creating Your AI Companion</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-500/20 rounded-lg">
                  <span className="text-sm">✓ Processing voice sample</span>
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-500/20 rounded-lg">
                  <span className="text-sm">✓ Configuring personality traits</span>
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                </div>
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg opacity-50">
                  <span className="text-sm">○ Training conversational patterns</span>
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}