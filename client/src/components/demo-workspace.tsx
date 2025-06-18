import { useState, useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Send, Heart, Infinity, Crown } from "lucide-react";
import ReplicaWizard from "./replica-wizard";
import ImmersiveChat from "./immersive-chat";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
  feedback?: "positive" | "negative" | null;
  feedbackText?: string;
}

interface DemoWorkspaceProps {
  user: any;
  onSignOut: () => void;
}

export default function DemoWorkspace({ user, onSignOut }: DemoWorkspaceProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // State
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState(5);
  const [showUpgradeOverlay, setShowUpgradeOverlay] = useState(false);
  const [currentReplica, setCurrentReplica] = useState<any>(null);
  const [hasExistingReplica, setHasExistingReplica] = useState(false);
  const [isLoadingReplica, setIsLoadingReplica] = useState(true);
  const [name, setName] = useState("");

  // Refs
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const isMounted = useRef(false);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTime = useRef(Date.now());

  // Set isMounted to true when component mounts
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check for existing replicas on mount
  useEffect(() => {
    const checkExistingReplicas = async () => {
      try {
        const response = await fetch("/api/replicas");
        if (response.ok) {
          const replicas = await response.json();
          if (replicas.length > 0) {
            const replica = replicas[0];
            setCurrentReplica(replica);
            setHasExistingReplica(true);
            setName(replica.name);
            setMessagesRemaining(user.credits || 0);
            
            // Initialize chat
            setChatMessages([
              {
                id: "system-1",
                role: "assistant",
                content: `Hi! I'm ${replica.name}. How are you feeling today?`,
                feedback: null,
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Error checking existing replicas:", error);
      } finally {
        setIsLoadingReplica(false);
      }
    };

    checkExistingReplicas();
  }, [user.credits]);

  // Inactivity timer for upgrade redirect
  useEffect(() => {
    const resetTimer = () => {
      lastActivityTime.current = Date.now();
      
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      
      inactivityTimer.current = setTimeout(() => {
        if (isMounted.current) {
          setShowUpgradeOverlay(true);
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    resetTimer();

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, []);

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
          message: currentMessage,
          userId: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.response,
          feedback: null,
        };

        setChatMessages((prev) => [...prev, aiMessage]);
        setMessagesRemaining(data.creditsRemaining || 0);

        if (data.creditsRemaining <= 0) {
          setTimeout(() => setShowUpgradeOverlay(true), 2000);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading state while checking for existing replicas
  if (isLoadingReplica) {
    return (
      <section id="demo-workspace" className="py-12 min-h-screen" ref={ref}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white">Loading your replica...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="demo-workspace" className="py-12 min-h-screen" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold cosmic-glow">
            {hasExistingReplica ? `Chat with ${name}` : "Create Your Replica"}
          </h1>
          <div className="flex items-center gap-4">
            <a 
              href="mailto:inspiritlabs@gmail.com" 
              className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
            >
              Contact: inspiritlabs@gmail.com
            </a>
            <button
              onClick={onSignOut}
              className="secondary-button px-4 py-2 rounded-lg text-white"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="flex justify-center">
            {/* Show existing replica chat */}
            {hasExistingReplica && (
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20 backdrop-blur-3xl w-full max-w-4xl">
                <div className="absolute top-4 right-4 text-sm text-white/80 z-30">
                  {messagesRemaining} / 5
                </div>

                {/* Messages */}
                <div className="h-[500px] overflow-y-auto p-6 space-y-4" ref={chatContainerRef}>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                            : "bg-white/10 backdrop-blur-sm text-white border border-white/20"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-4 py-2 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-6">
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
                  <div className="text-center mt-4">
                    <span className="text-sm text-white/70">
                      {messagesRemaining} messages remaining
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Show creation wizard only if user doesn't have a replica */}
            {!hasExistingReplica && (
              <ReplicaWizard 
                onDone={(replicaId) => {
                  // Refresh the page to load the new replica
                  window.location.reload();
                }}
              />
            )}
          </div>
        </div>

        {/* Upgrade Overlay */}
        {showUpgradeOverlay && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <div className="space-y-4 text-center mb-8 absolute top-10 inset-x-0 px-6">
              <p className="text-lg text-white font-semibold">
                You've used all 5 demo messages. Upgrade to continue.
              </p>
              <p className="text-sm text-gray-400">
                For payment assistance, contact{" "}
                <a 
                  href="mailto:inspiritlabs@gmail.com" 
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  inspiritlabs@gmail.com
                </a>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-6">
              <div className="plan-card group relative p-px rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 flex flex-col h-full">
                  <Heart className="w-10 h-10 text-pink-400 mb-4 mx-auto" />
                  <h3 className="text-xl font-semibold mb-2">
                    Starter – Love in Small Doses
                  </h3>
                  <p className="text-3xl font-bold mb-4">
                    $24<span className="text-base font-normal">/mo</span>
                  </p>
                  <ul className="text-sm space-y-1 flex-1">
                    <li className="font-bold">20 voice minutes</li>
                    <li className="font-bold">Standard model</li>
                    <li className="font-bold">5 photos</li>
                  </ul>
                  <button
                    onClick={() =>
                      window.open("mailto:inspiritlabs@gmail.com?subject=Starter Plan Payment Request", "_blank")
                    }
                    className="mt-6 primary-button w-full"
                  >
                    Contact for Payment
                  </button>
                </div>
              </div>
              <div className="plan-card group relative p-px rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 flex flex-col h-full relative">
                  <span className="absolute -top-3 right-3 bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded shadow">
                    Most Loved
                  </span>
                  <Infinity className="w-10 h-10 text-purple-300 mb-4 mx-auto" />
                  <h3 className="text-xl font-semibold mb-2">
                    Pro – Daily Presence, Zero Limits
                  </h3>
                  <p className="text-3xl font-bold mb-4">
                    $99<span className="text-base font-normal">/mo</span>
                  </p>
                  <ul className="text-sm space-y-1 flex-1">
                    <li className="font-bold">60 voice minutes</li>
                    <li className="font-bold">Faster model</li>
                    <li className="font-bold">20 photos</li>
                  </ul>
                  <button
                    onClick={() =>
                      window.open("mailto:inspiritlabs@gmail.com?subject=Pro Plan Payment Request", "_blank")
                    }
                    className="mt-6 primary-button w-full"
                  >
                    Contact for Payment
                  </button>
                </div>
              </div>
              <div className="plan-card group relative p-px rounded-2xl bg-gradient-to-br from-pink-500 to-yellow-500">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 flex flex-col h-full">
                  <Crown className="w-10 h-10 text-yellow-300 mb-4 mx-auto" />
                  <h3 className="text-xl font-semibold mb-2">
                    Elite – Legacy that Never Sleeps
                  </h3>
                  <p className="text-3xl font-bold mb-4">
                    $279<span className="text-base font-normal">/mo</span>
                  </p>
                  <ul className="text-sm space-y-1 flex-1">
                    <li className="font-bold">200 voice minutes</li>
                    <li className="font-bold">Fastest model</li>
                    <li className="font-bold">Unlimited photos</li>
                  </ul>
                  <button
                    onClick={() =>
                      window.open("mailto:inspiritlabs@gmail.com?subject=Elite Plan Payment Request", "_blank")
                    }
                    className="mt-6 primary-button w-full"
                  >
                    Contact for Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .plan-card {
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .plan-card:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.5);
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