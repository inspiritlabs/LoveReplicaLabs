import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertReplicaSchema, insertChatMessageSchema } from "@shared/schema";
import bcrypt from "bcrypt";

const OPENAI_API_KEY = "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";
const ELEVEN_API_KEY = "sk_f72f4feb31e66e38d86804d2a56846744cbc89d8ecfa552d";

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate access code (step 1)
  app.post("/api/auth/validate-code", async (req, res) => {
    try {
      const { accessCode } = req.body;
      
      if (!accessCode || typeof accessCode !== 'string') {
        return res.status(400).json({ error: "Access code required" });
      }

      // Validate access code pattern: INSP-XXXX-YYYY
      const codePattern = /^INSP-\d{4}-[A-Z]{4}$/;
      if (!codePattern.test(accessCode)) {
        return res.status(401).json({ error: "Invalid access code format" });
      }

      // Extract sequence number from code
      const parts = accessCode.split('-');
      const sequenceNum = parseInt(parts[1]);
      
      // Generate valid suffix based on sequence - MUST match generator exactly
      const suffixes = [
        // NATO Phonetic Alphabet
        "ALFA", "BETA", "GAMA", "DELT", "ECHO", "FXTX", "GOLF", "HOTL", "INDI", "JULI",
        "KILO", "LIMA", "MIKE", "NOVA", "OSCA", "PAPA", "QUBE", "ROME", "SIER", "TANG",
        "UNIC", "VICT", "WHIS", "XRAY", "YANK", "ZULU",
        
        // Tech/Space Terms
        "APEX", "CORE", "FLUX", "HAWK", "IRON", "JADE", "KING", "LYNX", "MARS", "NEON",
        "OPUS", "PEAK", "QUAD", "RUSH", "SYNC", "TIDE", "UNIX", "VOLT", "WAVE", "XENO",
        "YAML", "ZERO", "ATOM", "BYTE", "CODE", "DATA", "EDGE", "FIRE", "GRID", "HASH",
        
        // Space/Cosmic Terms
        "STAR", "VOID", "BEAM", "COIL", "DAWN", "EONS", "FLUX", "GLOW", "HALO", "IONS",
        "JETS", "KNOT", "LENS", "MOON", "NODE", "ORBS", "POLE", "QARK", "RAYS", "SPIN",
        "TWIN", "UNIT", "VIBE", "WARP", "ZONE", "ARCH", "BIND", "CELL", "DECK", "EMIT",
        
        // Premium Tech
        "FLOW", "GEAR", "HOPE", "IDEA", "JACK", "KEEP", "LEAP", "MIND", "NEXT", "OPEN",
        "PATH", "QUIT", "RISE", "SOUL", "TIME", "UBER", "VIEW", "WILD", "ZOOM", "ABLE",
        "BOLD", "COOL", "DEEP", "EPIC", "FAST", "GOOD", "HIGH", "LIVE", "MOVE", "NICE",
        
        // Abstract Concepts
        "PURE", "REAL", "SAFE", "TRUE", "WISE", "CALM", "DARK", "EASY", "FREE", "HUGE",
        "KIND", "LAST", "MEGA", "NEAR", "ONLY", "PLUS", "RICH", "SLIM", "TALL", "VAST"
      ];
      
      const expectedSuffix = suffixes[(sequenceNum - 1) % suffixes.length];
      
      if (parts[2] !== expectedSuffix) {
        return res.status(401).json({ error: "Invalid access code" });
      }

      res.json({ valid: true, message: "Access code verified" });

    } catch (error) {
      console.error("Access code validation error:", error);
      res.status(500).json({ error: "Validation failed" });
    }
  });

  // Register with access code (step 2)
  app.post("/api/auth/register-with-code", async (req, res) => {
    try {
      const { accessCode, email, password } = req.body;
      
      if (!accessCode || !email || !password) {
        return res.status(400).json({ error: "All fields required" });
      }

      // Re-validate access code
      const codePattern = /^INSP-\d{4}-[A-Z]{4}$/;
      if (!codePattern.test(accessCode)) {
        return res.status(401).json({ error: "Invalid access code" });
      }

      // Extract sequence number and validate suffix
      const parts = accessCode.split('-');
      const sequenceNum = parseInt(parts[1]);
      
      const suffixes = [
        // NATO Phonetic Alphabet
        "ALFA", "BETA", "GAMA", "DELT", "ECHO", "FXTX", "GOLF", "HOTL", "INDI", "JULI",
        "KILO", "LIMA", "MIKE", "NOVA", "OSCA", "PAPA", "QUBE", "ROME", "SIER", "TANG",
        "UNIC", "VICT", "WHIS", "XRAY", "YANK", "ZULU",
        
        // Tech/Space Terms
        "APEX", "CORE", "FLUX", "HAWK", "IRON", "JADE", "KING", "LYNX", "MARS", "NEON",
        "OPUS", "PEAK", "QUAD", "RUSH", "SYNC", "TIDE", "UNIX", "VOLT", "WAVE", "XENO",
        "YAML", "ZERO", "ATOM", "BYTE", "CODE", "DATA", "EDGE", "FIRE", "GRID", "HASH",
        
        // Space/Cosmic Terms
        "STAR", "VOID", "BEAM", "COIL", "DAWN", "EONS", "FLUX", "GLOW", "HALO", "IONS",
        "JETS", "KNOT", "LENS", "MOON", "NODE", "ORBS", "POLE", "QARK", "RAYS", "SPIN",
        "TWIN", "UNIT", "VIBE", "WARP", "ZONE", "ARCH", "BIND", "CELL", "DECK", "EMIT",
        
        // Premium Tech
        "FLOW", "GEAR", "HOPE", "IDEA", "JACK", "KEEP", "LEAP", "MIND", "NEXT", "OPEN",
        "PATH", "QUIT", "RISE", "SOUL", "TIME", "UBER", "VIEW", "WILD", "ZOOM", "ABLE",
        "BOLD", "COOL", "DEEP", "EPIC", "FAST", "GOOD", "HIGH", "LIVE", "MOVE", "NICE",
        
        // Abstract Concepts
        "PURE", "REAL", "SAFE", "TRUE", "WISE", "CALM", "DARK", "EASY", "FREE", "HUGE",
        "KIND", "LAST", "MEGA", "NEAR", "ONLY", "PLUS", "RICH", "SLIM", "TALL", "VAST"
      ];
      
      const expectedSuffix = suffixes[(sequenceNum - 1) % suffixes.length];
      
      if (parts[2] !== expectedSuffix) {
        return res.status(401).json({ error: "Invalid access code" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({ 
        email, 
        password: hashedPassword 
      });
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          credits: user.credits, 
          isAdmin: user.isAdmin 
        } 
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

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

  // Voice upload and creation endpoint
  app.post("/api/voice/create", async (req, res) => {
    try {
      const { audioFile, name } = req.body;
      
      if (!audioFile) {
        return res.status(400).json({ error: "Audio file required" });
      }

      if (!ELEVEN_API_KEY) {
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      // Convert base64 to buffer
      const base64Data = audioFile.includes(',') ? audioFile.split(',')[1] : audioFile;
      const audioBuffer = Buffer.from(base64Data, 'base64');
      
      // Validate file size (max 6MB)
      if (audioBuffer.length > 6 * 1024 * 1024) {
        return res.status(400).json({ error: "Audio file too large. Maximum 6MB allowed." });
      }

      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      formData.append("files", blob, "voice.wav");
      formData.append("name", name || "Voice Clone");
      formData.append("description", `Voice clone created for ${name || "user"}`);

      const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: { 
          "xi-api-key": ELEVEN_API_KEY,
        },
        body: formData
      });

      const responseText = await response.text();
      console.log("ElevenLabs response:", response.status, responseText);

      if (!response.ok) {
        let errorMessage = "Voice creation failed";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail?.message || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        return res.status(response.status).json({ error: errorMessage });
      }

      const data = JSON.parse(responseText);
      console.log("Voice created successfully:", data.voice_id);
      res.json({ voiceId: data.voice_id });

    } catch (error) {
      console.error("Voice creation error:", error);
      res.status(500).json({ error: (error as Error).message || "Failed to create voice" });
    }
  });

  // AI Chat endpoint with OpenAI and ElevenLabs
  app.post("/api/chat/ai-response", async (req, res) => {
    try {
      const { message, replicaId, personalityTraits, personalityDescription, voiceId, userId } = req.body;

      // Check user credits
      const user = await storage.getUser(userId);
      if (!user || (user.credits || 0) <= 0) {
        return res.status(402).json({ error: "Insufficient credits" });
      }

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
          model: "gpt-4o-mini",
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

      // Generate audio with ElevenLabs using the created voice
      const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
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

      // Deduct 1 credit after successful response
      const newCredits = (user.credits || 0) - 1;
      await storage.updateUserCredits(userId, newCredits);

      res.json({
        message: aiMessage,
        audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
        messageId: assistantMessage.id,
        creditsRemaining: newCredits,
      });

    } catch (error) {
      console.error("AI response error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  // Replica chat endpoint with real OpenAI and ElevenLabs integration
  app.post("/api/replicas/:id/chat", async (req, res) => {
    try {
      const replicaId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Message content required" });
      }

      console.log("Processing chat request for replica:", replicaId, "Message:", content);

      // Get replica data - simplified for now
      const allUsers = await storage.getAllUsers();
      let currentReplica = null;
      let replicaUser = null;

      for (const user of allUsers) {
        const userReplicas = await storage.getUserReplicas(user.id);
        const found = userReplicas.find(r => r.id === replicaId);
        if (found) {
          currentReplica = found;
          replicaUser = user;
          break;
        }
      }
      
      if (!currentReplica || !replicaUser) {
        return res.status(404).json({ error: "Replica not found" });
      }

      // Check user credits
      if ((replicaUser.credits || 0) <= 0) {
        return res.status(402).json({ error: "Insufficient credits" });
      }

      // Build system prompt with personality traits
      const personalityTraits = currentReplica.personalityTraits as any || {
        warmth: 5, humor: 5, thoughtfulness: 5, empathy: 5, assertiveness: 5, energy: 5
      };

      const systemPrompt = `You are a digital replica with the following personality:
${currentReplica.personalityDescription || "You are a helpful and engaging AI assistant."}

Personality traits (1-10 scale):
- Warmth: ${personalityTraits.warmth}/10
- Humor: ${personalityTraits.humor}/10  
- Thoughtfulness: ${personalityTraits.thoughtfulness}/10
- Empathy: ${personalityTraits.empathy}/10
- Assertiveness: ${personalityTraits.assertiveness}/10
- Energy: ${personalityTraits.energy}/10

Respond naturally as this person would, incorporating these traits into your communication style. Keep responses conversational and under 100 words.`;

      console.log("Sending request to OpenAI with system prompt length:", systemPrompt.length);

      // Call OpenAI API
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: content }
          ],
          max_tokens: 150,
          temperature: 0.8,
        }),
      });

      const openaiResponseText = await openaiResponse.text();
      console.log("OpenAI response status:", openaiResponse.status);
      console.log("OpenAI response:", openaiResponseText.substring(0, 200));

      if (!openaiResponse.ok) {
        console.error("OpenAI API error:", openaiResponse.status, openaiResponseText);
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = JSON.parse(openaiResponseText);
      const aiMessage = openaiData.choices[0].message.content;
      
      console.log("AI generated message:", aiMessage);

      let audioUrl = null;

      // Generate audio with ElevenLabs if voice ID exists
      if (currentReplica.voiceId) {
        try {
          console.log("Generating voice with ElevenLabs for voice ID:", currentReplica.voiceId);
          
          const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${currentReplica.voiceId}/stream`, {
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

          console.log("ElevenLabs TTS response status:", elevenResponse.status);

          if (elevenResponse.ok) {
            const audioBuffer = await elevenResponse.arrayBuffer();
            const audioBase64 = Buffer.from(audioBuffer).toString('base64');
            audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
            console.log("Voice generation successful, audio size:", audioBuffer.byteLength, "bytes");
          } else {
            const errorText = await elevenResponse.text();
            console.error("ElevenLabs TTS error:", elevenResponse.status, errorText);
          }
        } catch (voiceError) {
          console.error("Voice generation failed:", voiceError);
        }
      } else {
        console.log("No voice ID available for replica, skipping voice generation");
      }

      // Save messages to database
      const userMessage = await storage.createChatMessage({
        replicaId: replicaId,
        role: "user",
        content: content,
        audioUrl: null,
        feedback: null,
        feedbackText: null,
      });

      const assistantMessage = await storage.createChatMessage({
        replicaId: replicaId,
        role: "assistant", 
        content: aiMessage,
        audioUrl: audioUrl,
        feedback: null,
        feedbackText: null,
      });

      // Deduct 1 credit
      const newCredits = (replicaUser.credits || 0) - 1;
      await storage.updateUserCredits(replicaUser.id, newCredits);

      console.log("Chat completed successfully, credits remaining:", newCredits);

      res.json({
        userMessage: {
          id: userMessage.id.toString(),
          role: "user",
          content: content,
          audioUrl: null,
        },
        aiMessage: {
          id: assistantMessage.id.toString(),
          role: "assistant", 
          content: aiMessage,
          audioUrl: audioUrl,
        },
        creditsRemaining: newCredits
      });

    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      // Simple password protection - in production use proper auth
      const adminPassword = req.headers.authorization;
      if (adminPassword !== "Bearer admin123") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const users = await storage.getAllUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/credits", async (req, res) => {
    try {
      const adminPassword = req.headers.authorization;
      if (adminPassword !== "Bearer admin123") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = parseInt(req.params.id);
      const { credits } = req.body;
      
      if (typeof credits !== 'number' || credits < 0) {
        return res.status(400).json({ error: "Invalid credits amount" });
      }

      const updatedUser = await storage.updateUserCredits(userId, credits);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update credits" });
    }
  });

  app.get("/api/admin/chats", async (req, res) => {
    try {
      const adminPassword = req.headers.authorization;
      if (adminPassword !== "Bearer admin123") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const chats = await storage.getAllChatMessages();
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  app.get("/api/admin/replicas", async (req, res) => {
    try {
      const adminPassword = req.headers.authorization;
      if (adminPassword !== "Bearer admin123") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const users = await storage.getAllUsers();
      const allReplicas = [];
      
      for (const user of users) {
        const userReplicas = await storage.getUserReplicas(user.id);
        const replicasWithUser = userReplicas.map(replica => ({
          ...replica,
          userEmail: user.email
        }));
        allReplicas.push(...replicasWithUser);
      }

      res.json(allReplicas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch replicas" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const adminPassword = req.headers.authorization;
      if (adminPassword !== "Bearer admin123") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
