import { pgTable, serial, text, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").default(10),
  isAdmin: boolean("is_admin").default(false),
  accessCode: text("access_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accessCodes = pgTable("access_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  isUsed: boolean("is_used").default(false),
  userId: integer("user_id").references(() => users.id),
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
export const usersRelations = relations(users, ({ many, one }) => ({
  replicas: many(replicas),
  accessCodeRecord: one(accessCodes, {
    fields: [users.id],
    references: [accessCodes.userId],
  }),
}));

export const accessCodesRelations = relations(accessCodes, ({ one }) => ({
  user: one(users, {
    fields: [accessCodes.userId],
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
export type AccessCode = typeof accessCodes.$inferSelect;
export type InsertAccessCode = typeof accessCodes.$inferInsert;
