import { users, replicas, chatMessages, usedAccessCodes, type User, type InsertUser, type Replica, type InsertReplica, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserCredits(userId: number, credits: number): Promise<User | undefined>;
  updateUserReplicaStatus(userId: number, hasCreatedReplica: boolean): Promise<User | undefined>;
  
  // Access code tracking
  isAccessCodeUsed(accessCode: string): Promise<boolean>;
  markAccessCodeAsUsed(accessCode: string, userId: number): Promise<void>;
  
  // Replica methods
  createReplica(replica: InsertReplica): Promise<Replica>;
  getUserReplicas(userId: number): Promise<Replica[]>;
  getReplicaById(id: number): Promise<Replica | undefined>;
  updateReplica(id: number, updates: Partial<InsertReplica>): Promise<Replica | undefined>;
  
  // Chat methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getReplicaMessages(replicaId: number): Promise<ChatMessage[]>;
  getAllChatMessages(): Promise<(ChatMessage & { replicaName: string; userEmail: string })[]>;
  
  // Admin statistics
  getAdminStats(): Promise<{
    totalUsers: number;
    totalReplicas: number;
    totalMessages: number;
    totalCreditsUsed: number;
    avgMessagesPerUser: number;
    recentActivity: any[];
  }>;
}

export class DatabaseStorage implements IStorage {
  private usedAccessCodes = new Set<string>();
  private accessCodeUsers = new Map<string, number>();

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByAccessCode(accessCode: string): Promise<User | undefined> {
    const userId = this.accessCodeUsers.get(accessCode);
    if (!userId) return undefined;
    return this.getUser(userId);
  }

  async isAccessCodeUsed(accessCode: string): Promise<boolean> {
    try {
      const [existingCode] = await db
        .select()
        .from(usedAccessCodes) 
        .where(eq(usedAccessCodes.accessCode, accessCode));
      return !!existingCode;
    } catch (error) {
      // Fallback to memory check if table doesn't exist yet
      return this.usedAccessCodes.has(accessCode);
    }
  }

  async markAccessCodeAsUsed(accessCode: string, userId: number): Promise<void> {
    try {
      await db.insert(usedAccessCodes).values({
        accessCode,
        userId
      });
    } catch (error) {
      // Fallback to memory storage if table doesn't exist yet
      this.usedAccessCodes.add(accessCode);
      this.accessCodeUsers.set(accessCode, userId);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createReplica(replica: InsertReplica): Promise<Replica> {
    const [newReplica] = await db
      .insert(replicas)
      .values(replica)
      .returning();
    return newReplica;
  }

  async getUserReplicas(userId: number): Promise<Replica[]> {
    return await db.select().from(replicas).where(eq(replicas.userId, userId));
  }

  async getReplicaById(id: number): Promise<Replica | undefined> {
    const [replica] = await db.select().from(replicas).where(eq(replicas.id, id));
    return replica || undefined;
  }

  async updateReplica(id: number, updates: Partial<InsertReplica>): Promise<Replica | undefined> {
    const [updatedReplica] = await db
      .update(replicas)
      .set(updates)
      .where(eq(replicas.id, id))
      .returning();
    return updatedReplica || undefined;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getReplicaMessages(replicaId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.replicaId, replicaId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserCredits(userId: number, credits: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ credits })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async getAllChatMessages(): Promise<(ChatMessage & { replicaName: string; userEmail: string })[]> {
    const result = await db
      .select({
        id: chatMessages.id,
        replicaId: chatMessages.replicaId,
        role: chatMessages.role,
        content: chatMessages.content,
        audioUrl: chatMessages.audioUrl,
        feedback: chatMessages.feedback,
        feedbackText: chatMessages.feedbackText,
        createdAt: chatMessages.createdAt,
        replicaName: replicas.name,
        userEmail: users.email,
      })
      .from(chatMessages)
      .innerJoin(replicas, eq(chatMessages.replicaId, replicas.id))
      .innerJoin(users, eq(replicas.userId, users.id))
      .orderBy(chatMessages.createdAt);
    
    return result;
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalReplicas: number;
    totalMessages: number;
    totalCreditsUsed: number;
    avgMessagesPerUser: number;
    recentActivity: any[];
  }> {
    const allUsers = await db.select().from(users);
    const allReplicas = await db.select().from(replicas);
    const allMessages = await db.select().from(chatMessages);
    
    const totalUsers = allUsers.length;
    const totalReplicas = allReplicas.length;
    const totalMessages = allMessages.length;
    
    const totalCreditsRemaining = allUsers.reduce((sum, user) => sum + (user.credits || 0), 0);
    const totalCreditsUsed = (totalUsers * 10) - totalCreditsRemaining;
    
    const avgMessagesPerUser = totalUsers > 0 ? 
      Math.round((totalMessages / totalUsers) * 100) / 100 : 0;

    // Get recent activity (last 10 messages)
    const recentMessages = await db
      .select({
        content: chatMessages.content,
        role: chatMessages.role,
        createdAt: chatMessages.createdAt,
        replicaId: chatMessages.replicaId,
      })
      .from(chatMessages)
      .orderBy(chatMessages.createdAt)
      .limit(10);

    // Get replica names and user emails for recent messages
    const recentActivity = [];
    for (const message of recentMessages) {
      const replica = allReplicas.find(r => r.id === message.replicaId);
      const user = replica ? allUsers.find(u => u.id === replica.userId) : null;
      
      recentActivity.push({
        type: 'message',
        content: message.content.substring(0, 50) + '...',
        role: message.role,
        userEmail: user?.email || 'Unknown',
        replicaName: replica?.name || 'Unknown',
        createdAt: message.createdAt,
      });
    }

    return {
      totalUsers,
      totalReplicas,
      totalMessages,
      totalCreditsUsed,
      avgMessagesPerUser,
      recentActivity: recentActivity.reverse(), // Most recent first
    };
  }

  async updateUserReplicaStatus(userId: number, hasCreatedReplica: boolean): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ hasCreatedReplica })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();