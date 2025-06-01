import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function SimpleChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{role: string, content: string, audio?: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [replicaId, setReplicaId] = useState(16); // Default to test replica
  const [userCredits, setUserCredits] = useState(5);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;
    
    setLoading(true);
    const userMsg = message;
    setMessage("");
    
    // Add user message immediately
    setMessages(prev => [...prev, {role: "user", content: userMsg}]);
    
    try {
      const response = await fetch(`/api/replicas/${replicaId}/chat`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({content: userMsg})
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Add AI response
        setMessages(prev => [...prev, {
          role: "assistant", 
          content: data.aiMessage.content,
          audio: data.aiMessage.audioUrl
        }]);
        setUserCredits(data.creditsRemaining);
        
        // Auto-play audio if available
        if (data.aiMessage.audioUrl) {
          const audio = new Audio(data.aiMessage.audioUrl);
          audio.play().catch(console.error);
        }
      } else {
        // Show error
        setMessages(prev => [...prev, {
          role: "error", 
          content: data.error || "Error occurred"
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "error", 
        content: "Network error: " + error.message
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Simple Chat Test</h1>
        
        <div className="mb-4">
          <label className="block text-sm mb-1">Replica ID:</label>
          <Input 
            type="number" 
            value={replicaId} 
            onChange={(e) => setReplicaId(parseInt(e.target.value))}
            className="w-20 bg-gray-800 border-gray-600"
          />
          <p className="text-sm text-gray-400 mt-1">Credits remaining: {userCredits}</p>
        </div>

        <div className="space-y-3 mb-4 h-96 overflow-y-auto bg-gray-800 p-4 rounded">
          {messages.map((msg, i) => (
            <Card key={i} className={`p-3 ${
              msg.role === "user" ? "bg-blue-600 ml-auto max-w-xs" : 
              msg.role === "error" ? "bg-red-600" : "bg-gray-700"
            }`}>
              <div className="text-sm">
                <strong>{msg.role}:</strong> {msg.content}
              </div>
              {msg.audio && (
                <Button 
                  size="sm" 
                  onClick={() => new Audio(msg.audio).play()}
                  className="mt-2 text-xs"
                >
                  🔊 Play Audio
                </Button>
              )}
            </Card>
          ))}
          {loading && (
            <Card className="bg-gray-700 p-3">
              <div className="text-sm">AI is thinking...</div>
            </Card>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            disabled={loading || userCredits <= 0}
            className="bg-gray-800 border-gray-600"
          />
          <Button 
            onClick={sendMessage}
            disabled={loading || !message.trim() || userCredits <= 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Send
          </Button>
        </div>
        
        {userCredits <= 0 && (
          <p className="text-red-400 text-sm mt-2">
            No credits remaining. The 5-message limit is enforced.
          </p>
        )}
      </div>
    </div>
  );
}