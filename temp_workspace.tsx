import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Play, Pause, Upload, Plus, User, Heart, Brain, Zap, Shield, Smile, Trash2, X, Loader, CheckCircle, AlertCircle, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import ImmersiveChat from "./immersive-chat"

type Role = "system" | "user" | "assistant"
type TraitName = "warmth" | "humor" | "thoughtfulness" | "empathy" | "assertiveness" | "energy"

interface Message {
  role: Role
  content: string
  id: string
  feedback?: "positive" | "negative" | null
  feedbackText?: string
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
  const [photos, setPhotos] = useState<Array<{ id: string; url: string }>>([])
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
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

  // Demo state
  const [isDemoReady, setIsDemoReady] = useState(false)
  const [generatedReplica, setGeneratedReplica] = useState<any>(null)

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const { toast } = useToast()

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        setIsUploadingPhoto(true)
        const url = URL.createObjectURL(file)
        const newPhoto = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          url: url
        }
        setPhotos(prev => [...prev, newPhoto])
        setIsUploadingPhoto(false)
      }
    })
  }

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
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 25 * 1024 * 1024) { // 25MB limit
      toast({
        title: "File too large",
        description: "Please select an audio file under 25MB.",
        variant: "destructive",
      })
      return
    }

    setAudioFile(file)
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
    
    // Auto-upload voice
    uploadVoice(file)
  }

  // Upload voice to ElevenLabs
  const uploadVoice = async (file: File) => {
    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('audio', file)
      formData.append('name', name || 'Replica Voice')

      const response = await fetch('/api/voice/create', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Voice upload failed')
      }

      const data = await response.json()
      setVoiceId(data.voiceId)
      setUploadProgress(100)

      toast({
        title: "Voice uploaded successfully!",
        description: "Your voice has been processed and is ready for use.",
      })

    } catch (error: any) {
      setUploadError(error.message)
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
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

      if (!response.ok) {
        throw new Error("Failed to create replica")
      }

      const replica = await response.json()
      setGeneratedReplica(replica)
      setIsDemoReady(true)
      setGenerationComplete(true)

      toast({
        title: "Replica created successfully!",
        description: "Your digital replica is ready for interaction.",
      })

    } catch (error: any) {
      setGenerationError(error.message)
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle audio playback
  const toggleAudio = () => {
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

  if (showImmersiveChat && selectedReplica) {
    return (
      <ImmersiveChat
        replica={selectedReplica}
        user={user}
        onBack={() => {
          setShowImmersiveChat(false)
          setSelectedReplica(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Create Your Digital Replica
            </h1>
            <p className="text-gray-300">
              Build an AI version of yourself or a loved one with voice and personality
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-300">{user.email}</p>
              <p className="text-xs text-purple-300">{user.credits || 0} credits remaining</p>
            </div>
            <Button onClick={onSignOut} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Sign Out
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="premium-card rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Replica Name</label>
                  <Input
                    type="text"
                    placeholder="Enter the name for your replica"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-black/50 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Voice Sample</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="primary-button px-4 py-2 rounded-lg text-sm font-medium cursor-pointer flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Choose Audio File
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      {audioFile && (
                        <span className="text-sm text-gray-300">{audioFile.name}</span>
                      )}
                    </div>

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Processing voice...</span>
                          <span className="text-gray-300">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="bg-gray-700" />
                      </div>
                    )}

                    {uploadError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {uploadError}
                      </div>
                    )}

                    {voiceId && (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Voice processed successfully
                      </div>
                    )}

                    {audioUrl && (
                      <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                        <button onClick={toggleAudio} className="text-white hover:text-purple-300">
                          {isAudioPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <span className="text-sm text-gray-300">Preview your voice sample</span>
                        <audio
                          ref={audioRef}
                          src={audioUrl}
                          onEnded={handleAudioEnded}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personality Configuration */}
            <div className="premium-card rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Personality & Traits</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Personality Description <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    placeholder="Describe the personality, speaking style, and unique characteristics of this person. Include how they express emotions, their sense of humor, communication patterns, and what makes them unique. (Minimum 120 characters)"
                    value={personalityDescription}
                    onChange={(e) => setPersonalityDescription(e.target.value)}
                    className="bg-black/50 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {personalityDescription.length}/120 characters minimum
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">Trait Adjustments</h4>
                  {Object.entries(personalityTraits).map(([trait, value]) => (
                    <div key={trait} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300 capitalize flex items-center gap-2">
                          {trait === "warmth" && <Heart className="w-4 h-4" />}
                          {trait === "humor" && <Smile className="w-4 h-4" />}
                          {trait === "thoughtfulness" && <Brain className="w-4 h-4" />}
                          {trait === "empathy" && <User className="w-4 h-4" />}
                          {trait === "assertiveness" && <Shield className="w-4 h-4" />}
                          {trait === "energy" && <Zap className="w-4 h-4" />}
                          {trait}
                        </label>
                        <span className="text-sm text-gray-400">{value}/10</span>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={(newValue) => handleTraitChange(trait as TraitName, newValue[0])}
                        max={10}
                        min={1}
                        step={1}
                        className="slider-custom"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Photos Panel */}
            <div className="premium-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Photos
                </h3>
                <label className="secondary-button px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 cursor-pointer">
                  <Plus className="w-4 h-4" />
                  Add Photos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No photos uploaded yet</p>
                    <p className="text-sm">Upload photos that will float in the chat background</p>
                  </div>
                ) : (
                  photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt="Upload"
                        className="w-full h-24 object-cover rounded-lg border-2 border-transparent group-hover:border-purple-500/50 transition-all"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Consent & Generate */}
            <div className="premium-card rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consent"
                    checked={consentChecked}
                    onCheckedChange={setConsentChecked}
                  />
                  <label htmlFor="consent" className="text-sm text-gray-300 leading-relaxed">
                    I confirm that I have the right to use this voice and create this digital replica. 
                    I understand that this technology should be used responsibly and ethically.
                  </label>
                </div>

                <Button
                  onClick={generateDemo}
                  disabled={!isFormValid() || isGenerating}
                  className="w-full primary-button py-3 text-lg font-medium"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      Creating Replica...
                    </div>
                  ) : (
                    "Create Replica"
                  )}
                </Button>

                {generationError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {generationError}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {isDemoReady && generatedReplica ? (
              <div className="premium-card rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Your Replica is Ready!</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-lg font-medium text-white">{generatedReplica.name}</h4>
                    <p className="text-sm text-gray-300">Digital Replica</p>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedReplica(generatedReplica)
                      setShowImmersiveChat(true)
                    }}
                    className="w-full primary-button py-3 text-lg font-medium"
                  >
                    Start Conversation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="premium-card rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Preview</h3>
                <div className="space-y-4">
                  <div className="text-center py-12 text-gray-400">
                    <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Complete the form to create your replica</p>
                    <p className="text-sm">Your digital version will appear here once ready</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}