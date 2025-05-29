import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  email: string;
  credits: number;
  isAdmin: boolean;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  content: string;
  role: string;
  audioUrl: string | null;
  createdAt: string;
  replicaName: string;
  userEmail: string;
}

interface Replica {
  id: number;
  name: string;
  audioUrl: string | null;
  voiceId: string | null;
  userEmail: string;
  createdAt: string;
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newCredits, setNewCredits] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "chats" | "voices">("users");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: {
          "Authorization": `Bearer ${password}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json() as Promise<User[]>;
    },
    enabled: isAuthenticated,
  });

  const { data: chats } = useQuery({
    queryKey: ["/api/admin/chats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/chats", {
        headers: {
          "Authorization": `Bearer ${password}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch chats");
      return response.json() as Promise<ChatMessage[]>;
    },
    enabled: isAuthenticated && activeTab === "chats",
  });

  const { data: replicas } = useQuery({
    queryKey: ["/api/admin/replicas"],
    queryFn: async () => {
      const response = await fetch("/api/admin/replicas", {
        headers: {
          "Authorization": `Bearer ${password}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch replicas");
      return response.json() as Promise<Replica[]>;
    },
    enabled: isAuthenticated && activeTab === "voices",
  });

  const updateCreditsMutation = useMutation({
    mutationFn: async ({ userId, credits }: { userId: number; credits: number }) => {
      const response = await fetch(`/api/admin/users/${userId}/credits`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${password}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credits }),
      });
      if (!response.ok) throw new Error("Failed to update credits");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      setNewCredits("");
    },
  });

  const handleLogin = () => {
    if (password === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("Invalid password");
    }
  };

  const handleUpdateCredits = (userId: number) => {
    const credits = parseInt(newCredits);
    if (isNaN(credits) || credits < 0) {
      alert("Please enter a valid credit amount");
      return;
    }
    updateCreditsMutation.mutate({ userId, credits });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold cosmic-glow mb-2">Admin Panel</h1>
            <p className="text-gray-400">Enter admin password</p>
          </div>

          <div className="space-y-6">
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
            
            <button
              onClick={handleLogin}
              className="w-full primary-button px-6 py-4 rounded-lg font-semibold text-white"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold cosmic-glow">Admin Dashboard</h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="secondary-button px-4 py-2 rounded-lg text-white"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          {[
            { key: "users", label: "Users & Credits" },
            { key: "chats", label: "Chat History" },
            { key: "voices", label: "Voice Uploads" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === tab.key 
                  ? "primary-button text-white" 
                  : "secondary-button text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="glass-card rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6">User Management</h2>
          
            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Credits</th>
                    <th className="text-left py-3 px-4">Admin</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user) => (
                    <tr key={user.id} className="border-b border-white/5">
                      <td className="py-3 px-4">{user.id}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        {editingUser === user.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={newCredits}
                              onChange={(e) => setNewCredits(e.target.value)}
                              className="w-20 px-2 py-1 bg-black/30 border border-white/10 rounded text-white"
                              min="0"
                            />
                            <button
                              onClick={() => handleUpdateCredits(user.id)}
                              className="primary-button px-2 py-1 rounded text-xs"
                              disabled={updateCreditsMutation.isPending}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(null);
                                setNewCredits("");
                              }}
                              className="secondary-button px-2 py-1 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold">{user.credits}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {user.isAdmin ? (
                          <span className="text-purple-400">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {editingUser !== user.id && (
                          <button
                            onClick={() => {
                              setEditingUser(user.id);
                              setNewCredits(user.credits.toString());
                            }}
                            className="secondary-button px-3 py-1 rounded text-sm"
                          >
                            Edit Credits
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}