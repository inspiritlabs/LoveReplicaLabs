import { pgTable, serial, text, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  accessCode: text("access_code"),
  credits: integer("credits").default(10),
  messagesRemaining: integer("messages_remaining").default(5),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accessCodes = pgTable("access_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  isUsed: boolean("is_used").default(false),
  usedBy: integer("used_by").references(() => users.id),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const replicas = pgTable("replicas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  audioUrl: text("audio_url"),
  voiceId: text("voice_id"),
  personalityDescription: text("personality_description"),
  personalityTraits: jsonb("personality_traits"),

  photos: jsonb("photos").$type<Array<string>>(),
  userName: text("user_name"),
  isGenerated: boolean("is_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  replicaId: integer("replica_id").notNull().references(() => replicas.id),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  audioUrl: text("audio_url"), // for AI responses with voice
  feedback: text("feedback"), // 'positive' | 'negative'
  feedbackText: text("feedback_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  replicas: many(replicas),
}));

export const accessCodesRelations = relations(accessCodes, ({ one }) => ({
  user: one(users, {
    fields: [accessCodes.usedBy],
    references: [users.id],
  }),
}));

export const replicasRelations = relations(replicas, ({ one, many }) => ({
  user: one(users, {
    fields: [replicas.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  replica: one(replicas, {
    fields: [chatMessages.replicaId],
    references: [replicas.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  accessCode: true,
});

export const insertAccessCodeSchema = createInsertSchema(accessCodes).pick({
  code: true,
});

export const insertReplicaSchema = createInsertSchema(replicas).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReplica = z.infer<typeof insertReplicaSchema>;
export type Replica = typeof replicas.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
