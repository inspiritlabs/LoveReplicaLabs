import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeSlide } from "@/lib/variants";
import { useReplicaWizard } from "@/hooks/use-replica-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Upload, Camera, Mic, Brain, Sparkles } from "lucide-react";

interface ReplicaWizardProps {
  onDone: (replicaId: number) => void;
}

interface DraftReplica {
  name: string;
  photos: string[];
  voiceFile: File | null;
  personalityDescription: string;
  personalityTraits: Record<string, number>;
}

const PERSONALITY_TRAITS = [
  { key: "warmth", label: "Warmth", description: "How warm and caring they are" },
  { key: "humor", label: "Humor", description: "How funny and playful they are" },
  { key: "thoughtfulness", label: "Thoughtfulness", description: "How deep and reflective they are" },
  { key: "empathy", label: "Empathy", description: "How understanding and compassionate they are" },
  { key: "assertiveness", label: "Assertiveness", description: "How confident and direct they are" },
  { key: "energy", label: "Energy", description: "How enthusiastic and energetic they are" },
];

export default function ReplicaWizard({ onDone }: ReplicaWizardProps) {
  const { step, next, back } = useReplicaWizard();
  const [draft, setDraft] = useState<DraftReplica>({
    name: "",
    photos: [],
    voiceFile: null,
    personalityDescription: "",
    personalityTraits: {
      warmth: 5,
      humor: 5,
      thoughtfulness: 5,
      empathy: 5,
      assertiveness: 5,
      energy: 5,
    },
  });
  const [replicaId, setReplicaId] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'voice' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'voice') {
      setDraft(d => ({ ...d, voiceFile: file }));
    } else if (type === 'photo') {
      // For simplicity, we'll use a placeholder URL for photos
      // In production, you'd upload to a service and get a URL
      const photoUrl = URL.createObjectURL(file);
      setDraft(d => ({ ...d, photos: [...d.photos, photoUrl] }));
    }
  };

  const submitNamePhoto = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/replicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: JSON.parse(localStorage.getItem("user") || "{}").id,
          name: draft.name,
          photos: draft.photos,
        }),
      });
      const replica = await response.json();
      setReplicaId(replica.id);
      next();
    } catch (error) {
      console.error('Error creating replica:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitVoice = async () => {
    if (!draft.voiceFile || !replicaId) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audioFile', draft.voiceFile);
      formData.append('name', draft.name);

      const response = await fetch('/api/voice/create', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const { voiceId } = await response.json();
        await fetch(`/api/replicas/${replicaId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceId }),
        });
        next();
      }
    } catch (error) {
      console.error('Error uploading voice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitBio = async () => {
    if (!replicaId) return;
    
    setIsLoading(true);
    try {
      await fetch(`/api/replicas/${replicaId}/bio`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalityDescription: draft.personalityDescription }),
      });
      next();
    } catch (error) {
      console.error('Error updating bio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitTraits = async () => {
    if (!replicaId) return;
    
    setIsLoading(true);
    try {
      await fetch(`/api/replicas/${replicaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalityTraits: draft.personalityTraits }),
      });
      onDone(replicaId);
    } catch (error) {
      console.error('Error updating traits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vision-pro-bg min-h-screen flex items-center justify-center px-4 text-white overflow-hidden">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8 flex justify-center">
          <div className="flex space-x-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="name"
              {...fadeSlide}
              className="rounded-2xl bg-white/5 backdrop-blur-xs shadow-card p-8 text-center"
            >
              <Camera className="w-12 h-12 mx-auto mb-4 text-white/80" />
              <h2 className="text-3xl font-bold mb-2">Create Your Replica</h2>
              <p className="text-gray-300 mb-8">Give your replica a name and add a photo</p>

              <div className="space-y-6">
                <Input
                  placeholder="Replica name"
                  value={draft.name}
                  onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))}
                  className="translucent-input text-center text-lg"
                />

                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-white/40 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-white/60" />
                    <p className="text-white/60">Click to upload a photo</p>
                  </label>
                </div>

                {draft.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {draft.photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}

                <Button
                  onClick={submitNamePhoto}
                  disabled={!draft.name.trim() || draft.photos.length === 0 || isLoading}
                  className="translucent-button w-full py-4 text-lg"
                >
                  {isLoading ? "Creating..." : "Next"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="voice"
              {...fadeSlide}
              className="rounded-2xl bg-white/5 backdrop-blur-xs shadow-card p-8 text-center"
            >
              <Mic className="w-12 h-12 mx-auto mb-4 text-white/80" />
              <h2 className="text-3xl font-bold mb-2">Add Voice Sample</h2>
              <p className="text-gray-300 mb-8">Upload an audio file to clone their voice</p>

              <div className="space-y-6">
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-white/40 transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileUpload(e, 'voice')}
                    className="hidden"
                    id="voice-upload"
                  />
                  <label htmlFor="voice-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-white/60" />
                    <p className="text-white/60">Click to upload audio file</p>
                    <p className="text-xs text-white/40 mt-2">MP3, WAV, or M4A format</p>
                  </label>
                </div>

                {draft.voiceFile && (
                  <p className="text-green-400">File selected: {draft.voiceFile.name}</p>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={back}
                    variant="secondary"
                    className="translucent-button flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={submitVoice}
                    disabled={!draft.voiceFile || isLoading}
                    className="translucent-button flex-1"
                  >
                    {isLoading ? "Processing..." : "Next"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="bio"
              {...fadeSlide}
              className="rounded-2xl bg-white/5 backdrop-blur-xs shadow-card p-8 text-center"
            >
              <Brain className="w-12 h-12 mx-auto mb-4 text-white/80" />
              <h2 className="text-3xl font-bold mb-2">Describe Their Personality</h2>
              <p className="text-gray-300 mb-8">Help us understand who they were</p>

              <div className="space-y-6">
                <Textarea
                  placeholder="Describe their personality, interests, and how they spoke..."
                  value={draft.personalityDescription}
                  onChange={(e) => setDraft(d => ({ ...d, personalityDescription: e.target.value }))}
                  className="translucent-input min-h-32 text-left"
                  rows={6}
                />

                <div className="flex gap-4">
                  <Button
                    onClick={back}
                    variant="secondary"
                    className="translucent-button flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={submitBio}
                    disabled={!draft.personalityDescription.trim() || isLoading}
                    className="translucent-button flex-1"
                  >
                    {isLoading ? "Saving..." : "Next"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="traits"
              {...fadeSlide}
              className="rounded-2xl bg-white/5 backdrop-blur-xs shadow-card p-8 text-center"
            >
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-white/80" />
              <h2 className="text-3xl font-bold mb-2">Fine-tune Personality</h2>
              <p className="text-gray-300 mb-8">Adjust these traits to match their personality</p>

              <div className="space-y-8">
                {PERSONALITY_TRAITS.map((trait) => (
                  <div key={trait.key} className="text-left">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-white font-medium">{trait.label}</Label>
                      <span className="text-white/60 text-sm">{draft.personalityTraits[trait.key]}/10</span>
                    </div>
                    <p className="text-xs text-white/40 mb-3">{trait.description}</p>
                    <Slider
                      value={[draft.personalityTraits[trait.key]]}
                      onValueChange={([value]) =>
                        setDraft(d => ({
                          ...d,
                          personalityTraits: { ...d.personalityTraits, [trait.key]: value }
                        }))
                      }
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={back}
                    variant="secondary"
                    className="translucent-button flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={submitTraits}
                    disabled={isLoading}
                    className="translucent-button flex-1"
                  >
                    {isLoading ? "Creating Replica..." : "Create Replica"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}