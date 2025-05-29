import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertReplicaSchema, insertChatMessageSchema } from "@shared/schema";
import bcrypt from "bcrypt";

const OPENAI_API_KEY = "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";
const ELEVEN_API_KEY = "sk_f72f4feb31e66e38d86804d2a56846744cbc89d8ecfa552d";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({ email, password: hashedPassword });
      
      // Don't return password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = insertUserSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Don't return password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Replica routes
  app.post("/api/replicas", async (req, res) => {
    try {
      const replicaData = insertReplicaSchema.parse(req.body);
      const replica = await storage.createReplica(replicaData);
      res.json(replica);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.get("/api/replicas/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const replicas = await storage.getUserReplicas(userId);
      res.json(replicas);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.patch("/api/replicas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const replica = await storage.updateReplica(id, updates);
      if (!replica) {
        return res.status(404).json({ error: "Replica not found" });
      }
      res.json(replica);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Chat routes
  app.post("/api/chat/messages", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.get("/api/chat/messages/:replicaId", async (req, res) => {
    try {
      const replicaId = parseInt(req.params.replicaId);
      const messages = await storage.getReplicaMessages(replicaId);
      res.json(messages);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // AI Chat endpoint with OpenAI and ElevenLabs
  app.post("/api/chat/ai-response", async (req, res) => {
    try {
      const { message, replicaId, personalityTraits, personalityDescription } = req.body;

      // Build system prompt based on personality
      const systemPrompt = `You are a digital replica with the following personality:
${personalityDescription}

Personality traits (1-10 scale):
- Warmth: ${personalityTraits.warmth}/10
- Humor: ${personalityTraits.humor}/10  
- Thoughtfulness: ${personalityTraits.thoughtfulness}/10
- Empathy: ${personalityTraits.empathy}/10
- Assertiveness: ${personalityTraits.assertiveness}/10
- Energy: ${personalityTraits.energy}/10

Respond naturally as this person would, incorporating these traits into your communication style.`;

      // Call OpenAI API
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          max_tokens: 150,
          temperature: 0.8,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error("OpenAI API error");
      }

      const openaiData = await openaiResponse.json();
      const aiMessage = openaiData.choices[0].message.content;

      // Generate audio with ElevenLabs
      const elevenResponse = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: aiMessage,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!elevenResponse.ok) {
        throw new Error("ElevenLabs API error");
      }

      const audioBuffer = await elevenResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');

      // Save both messages to database
      await storage.createChatMessage({
        replicaId: parseInt(replicaId),
        role: "user",
        content: message,
        audioUrl: null,
        feedback: null,
        feedbackText: null,
      });

      const assistantMessage = await storage.createChatMessage({
        replicaId: parseInt(replicaId),
        role: "assistant", 
        content: aiMessage,
        audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
        feedback: null,
        feedbackText: null,
      });

      res.json({
        message: aiMessage,
        audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
        messageId: assistantMessage.id,
      });

    } catch (error) {
      console.error("AI response error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
