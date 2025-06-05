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

interface AdminStats {
  totalUsers: number;
  totalReplicas: number;
  totalMessages: number;
  totalCreditsUsed: number;
  avgMessagesPerUser: number;
  recentActivity: Array<{
    type: string;
    content: string;
    role: string;
    userEmail: string;
    replicaName: string;
    createdAt: string;
  }>;
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newCredits, setNewCredits] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "chats" | "voices" | "stats">("users");
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

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats", {
        headers: {
          "Authorization": `Bearer ${password}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json() as Promise<AdminStats>;
    },
    enabled: isAuthenticated && activeTab === "stats",
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

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${password}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const cleanupVoicesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/cleanup-voices", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${password}`,
        },
      });
      if (!response.ok) throw new Error("Failed to cleanup voices");
      return response.json();
    },
    onSuccess: (data) => {
      alert(`Voice cleanup completed: ${data.deleted} deleted, ${data.errors} errors`);
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
            { key: "stats", label: "Statistics" },
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">User Management</h2>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete ALL cloned voices from ElevenLabs? This action cannot be undone.")) {
                    cleanupVoicesMutation.mutate();
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                disabled={cleanupVoicesMutation.isPending}
              >
                {cleanupVoicesMutation.isPending ? "Cleaning..." : "Cleanup All Voices"}
              </button>
            </div>
          
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
                        <div className="flex gap-2">
                          {editingUser !== user.id && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingUser(user.id);
                                  setNewCredits(user.credits.toString());
                                }}
                                className="secondary-button px-3 py-1 rounded text-sm"
                              >
                                Edit Credits
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete user ${user.email}? This will also delete all their replicas and chat messages.`)) {
                                    deleteUserMutation.mutate(user.id);
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                disabled={deleteUserMutation.isPending}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === "chats" && (
          <div className="glass-card rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Chat History</h2>
            
            {chats && chats.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {chats.map((chat) => (
                  <div key={chat.id} className="p-4 bg-black/20 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-400">
                        {chat.userEmail} → {chat.replicaName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(chat.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        chat.role === 'user' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {chat.role}
                      </span>
                    </div>
                    <div className="text-white">{chat.content}</div>
                    {chat.audioUrl && (
                      <div className="mt-2">
                        <audio controls className="w-full">
                          <source src={chat.audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">No chat messages found</div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && (
          <div className="glass-card rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6">System Statistics</h2>
            
            {stats ? (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <div className="text-2xl font-bold text-blue-400">{stats.totalUsers}</div>
                    <div className="text-sm text-gray-400">Total Users</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <div className="text-2xl font-bold text-purple-400">{stats.totalReplicas}</div>
                    <div className="text-sm text-gray-400">Voice Replicas</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <div className="text-2xl font-bold text-green-400">{stats.totalMessages}</div>
                    <div className="text-sm text-gray-400">Total Messages</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <div className="text-2xl font-bold text-orange-400">{stats.totalCreditsUsed}</div>
                    <div className="text-sm text-gray-400">Credits Used</div>
                  </div>
                </div>

                {/* Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-black/20 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold mb-4">Usage Analytics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Messages/User:</span>
                        <span className="text-white font-medium">{stats.avgMessagesPerUser}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Credit Usage Rate:</span>
                        <span className="text-white font-medium">
                          {((stats.totalCreditsUsed / (stats.totalUsers * 10)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Active Replicas:</span>
                        <span className="text-white font-medium">{stats.totalReplicas}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {stats.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 bg-black/10 rounded">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.role === 'user' ? 'bg-blue-400' : 'bg-purple-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-400">
                              {activity.userEmail} → {activity.replicaName}
                            </div>
                            <div className="text-sm text-white truncate">
                              {activity.content}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(activity.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Voice Creation Status */}
                <div className="bg-black/20 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold mb-4">Voice Creation Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">
                        {replicas?.filter(r => r.voiceId).length || 0}
                      </div>
                      <div className="text-sm text-gray-400">Successful Voices</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-400">
                        {replicas?.filter(r => !r.voiceId).length || 0}
                      </div>
                      <div className="text-sm text-gray-400">Failed Voices</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-yellow-400">
                        {replicas?.length ? 
                          ((replicas.filter(r => r.voiceId).length / replicas.length) * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-sm text-gray-400">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">Loading statistics...</div>
            )}
          </div>
        )}

        {/* Voices Tab */}
        {activeTab === "voices" && (
          <div className="glass-card rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Voice Uploads</h2>
            
            {replicas && replicas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {replicas.map((replica) => (
                  <div key={replica.id} className="p-4 bg-black/20 rounded-lg border border-white/10">
                    <div className="text-lg font-semibold text-white mb-2">{replica.name}</div>
                    <div className="text-sm text-gray-400 mb-3">
                      Created by: {replica.userEmail}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      {new Date(replica.createdAt).toLocaleString()}
                    </div>
                    {replica.audioUrl && (
                      <div>
                        <audio controls className="w-full">
                          <source src={replica.audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                    {replica.voiceId && (
                      <div className="mt-2 text-xs text-green-400">
                        Voice ID: {replica.voiceId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">No voice uploads found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}