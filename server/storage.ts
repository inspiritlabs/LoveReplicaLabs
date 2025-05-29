import { users, replicas, chatMessages, type User, type InsertUser, type Replica, type InsertReplica, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserCredits(userId: number, credits: number): Promise<User | undefined>;
  
  // Replica methods
  createReplica(replica: InsertReplica): Promise<Replica>;
  getUserReplicas(userId: number): Promise<Replica[]>;
  updateReplica(id: number, updates: Partial<InsertReplica>): Promise<Replica | undefined>;
  
  // Chat methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getReplicaMessages(replicaId: number): Promise<ChatMessage[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
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
}

export const storage = new DatabaseStorage();