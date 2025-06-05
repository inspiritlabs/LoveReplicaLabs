import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ImmersiveChat from "@/components/immersive-chat";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLocation("/");
      return;
    }
    setUser(JSON.parse(userData));
  }, [setLocation]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    setLocation("/");
  };

  if (!user) {
    return null; // Loading or redirecting
  }

  // Create a default replica for the user
  const defaultReplica = {
    id: 1,
    name: "Your AI Companion",
    audioUrl: null,
    voiceId: null,
    personalityDescription: "A helpful and engaging AI assistant",
    personalityTraits: {
      warmth: 5,
      humor: 5,
      thoughtfulness: 5,
      empathy: 5,
      assertiveness: 5,
      energy: 5
    },
    photos: [],
    userName: user.email?.split('@')[0] || "User"
  };

  return (
    <div className="min-h-screen">
      <ImmersiveChat
        replica={defaultReplica}
        user={user}
        onBack={handleSignOut}
      />
    </div>
  );
}