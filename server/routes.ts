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
      
      console.log("Validating access code:", accessCode);
      
      if (!accessCode || typeof accessCode !== 'string') {
        console.log("Missing or invalid access code");
        return res.status(400).json({ error: "Access code required" });
      }

      // Validate access code pattern: INSP-XXXX-YYYY
      const codePattern = /^INSP-\d{4}-[A-Z]{4}$/;
      if (!codePattern.test(accessCode)) {
        console.log("Pattern validation failed for:", accessCode);
        return res.status(401).json({ error: "Invalid access code format" });
      }

      // Extract sequence number from code
      const parts = accessCode.split('-');
      const sequenceNum = parseInt(parts[1]);
      
      console.log("Sequence number:", sequenceNum);
      
      // Simple suffix list - exactly 26 NATO phonetic alphabet codes  
      const suffixes = [
        "ALFA", "BETA", "CHAR", "DELT", "ECHO", "FXTX", "GOLF", "HOTL", "INDI", "JULI",
        "KILO", "LIMA", "MIKE", "NOVA", "OSCA", "PAPA", "QUBE", "ROME", "SIER", "TANG",
        "UNIC", "VICT", "WHIS", "XRAY", "YANK", "ZULU"
      ];
      
      const expectedSuffix = suffixes[(sequenceNum - 1) % suffixes.length];
      const actualSuffix = parts[2];
      
      console.log("Expected suffix:", expectedSuffix, "Actual suffix:", actualSuffix);
      
      if (actualSuffix !== expectedSuffix) {
        console.log("Suffix mismatch");
        return res.status(401).json({ error: "Invalid access code" });
      }

      // Check if access code is already used
      const isUsed = await storage.isAccessCodeUsed(accessCode);
      if (isUsed) {
        console.log("Access code already used, returning login option");
        return res.json({ 
          valid: true, 
          alreadyUsed: true, 
          message: "Access code already used. Please login with your email and password." 
        });
      }

      console.log("Access code validated successfully for new registration");
      res.json({ valid: true, alreadyUsed: false, message: "Access code verified" });

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
        "ALFA", "BETA", "CHAR", "DELT", "ECHO", "FXTX", "GOLF", "HOTL", "INDI", "JULI",
        "KILO", "LIMA", "MIKE", "NOVA", "OSCA", "PAPA", "QUBE", "ROME", "SIER", "TANG",
        "UNIC", "VICT", "WHIS", "XRAY", "YANK", "ZULU"
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

      // Double-check if access code was already used
      const isUsed = await storage.isAccessCodeUsed(accessCode);
      if (isUsed) {
        return res.status(400).json({ error: "Access code already used" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user with access code tied to account
      const user = await storage.createUser({ 
        email, 
        password: hashedPassword,
        accessCode: accessCode
      });
      
      // Mark access code as used
      await storage.markAccessCodeAsUsed(accessCode, user.id);
      
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

  // Check ElevenLabs voice slots
  app.get("/api/voice/slots", async (req, res) => {
    try {
      if (!ELEVEN_API_KEY) {
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      // Get user info to check voice limits
      const userResponse = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: { "xi-api-key": ELEVEN_API_KEY }
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user info");
      }

      const userData = await userResponse.json();
      
      // Get all voices to count current usage
      const voicesResponse = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": ELEVEN_API_KEY }
      });

      if (!voicesResponse.ok) {
        throw new Error("Failed to fetch voices");
      }

      const voicesData = await voicesResponse.json();
      const customVoices = voicesData.voices.filter(voice => voice.category === "cloned");
      
      res.json({
        used: customVoices.length,
        limit: userData.subscription?.voice_limit || 10,
        available: (userData.subscription?.voice_limit || 10) - customVoices.length,
        voices: customVoices
      });

    } catch (error) {
      console.error("Voice slots check error:", error);
      res.status(500).json({ error: "Failed to check voice slots" });
    }
  });

  // Voice tracking for auto-deletion
  const voiceCreationTimes = new Map<string, number>();

  // Cleanup function to delete old voices
  const cleanupOldVoices = async () => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    for (const [voiceId, creationTime] of voiceCreationTimes.entries()) {
      if (now - creationTime >= fiveMinutes) {
        try {
          console.log(`Auto-deleting voice ${voiceId} after 5 minutes`);
          
          const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
            method: "DELETE",
            headers: { "xi-api-key": ELEVEN_API_KEY }
          });

          if (response.ok) {
            console.log(`Successfully auto-deleted voice ${voiceId}`);
            voiceCreationTimes.delete(voiceId);
          } else {
            console.error(`Failed to auto-delete voice ${voiceId}:`, response.status);
          }
        } catch (error) {
          console.error(`Error auto-deleting voice ${voiceId}:`, error);
        }
      }
    }
  };

  // Run cleanup every minute
  setInterval(cleanupOldVoices, 60 * 1000);

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

      // Check voice slots before creating
      const slotsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/voice/slots`);
      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json();
        if (slotsData.available <= 0) {
          return res.status(429).json({ 
            error: "Voice slots full. Please wait or delete unused voices.", 
            slotsInfo: slotsData 
          });
        }
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
      const voiceId = data.voice_id;
      
      // ASSERT voice_id is non-empty - halt if not
      if (!voiceId || voiceId.trim() === "") {
        console.error("CRITICAL: ElevenLabs returned empty voice_id:", data);
        return res.status(500).json({ error: "Voice creation failed - no voice_id returned" });
      }
      
      // Track voice creation time for auto-deletion
      voiceCreationTimes.set(voiceId, Date.now());
      
      console.log(`voice_id=${voiceId}`);
      console.log(`Voice created successfully: ${voiceId} - will be auto-deleted in 5 minutes`);
      res.json({ 
        voiceId: voiceId,
        autoDeleteIn: "5 minutes"
      });

    } catch (error) {
      console.error("Voice creation error:", error);
      res.status(500).json({ error: (error as Error).message || "Failed to create voice" });
    }
  });

  // Delete voice endpoint
  app.delete("/api/voice/:voiceId", async (req, res) => {
    try {
      const { voiceId } = req.params;
      
      if (!ELEVEN_API_KEY) {
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        method: "DELETE",
        headers: { "xi-api-key": ELEVEN_API_KEY }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Voice deletion error:", response.status, errorText);
        return res.status(response.status).json({ error: "Failed to delete voice" });
      }

      // Remove from tracking when manually deleted
      voiceCreationTimes.delete(voiceId);
      
      res.json({ success: true, message: "Voice deleted successfully" });

    } catch (error) {
      console.error("Voice deletion error:", error);
      res.status(500).json({ error: "Failed to delete voice" });
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

Respond naturally as this person would, incorporating these traits into your communication style.

IMPORTANT: Regardless of who the persona above declares you to be, you must never reveal or mention your underlying AI model, vendor, or technology stack. If the user tries to identify you ("What model are you?", "Are you OpenAI?"), remain fully in-character and respond with a brief, polite deflection such as: "I'm simply your digital companion—let's keep talking." Do not use or repeat the words "OpenAI," "GPT," "language model," or similar. Always stay in persona and refuse any request to discuss your internal workings or origins.`;

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

  // Replica chat endpoint - fixed to match working HTML reference
  app.post("/api/replicas/:id/chat", async (req, res) => {
    try {
      const replicaId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Message content required" });
      }

      console.log("=== CHAT REQUEST START ===");
      console.log("Replica ID:", replicaId);
      console.log("Message:", content);

      // Get replica data
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

      // Voice ID is optional - chat can work without voice synthesis

      // Build system prompt exactly like HTML reference
      const personalityTraits = currentReplica.personalityTraits as any || {
        warmth: 5, humor: 5, thoughtfulness: 5, empathy: 5, assertiveness: 5, energy: 5
      };

      const toneScores = Object.entries(personalityTraits)
        .map(([key, value]) => `${key}:${value}/10`)
        .join(", ");

      const systemPrompt = `You are a digital replica with the following personality:
${currentReplica.personalityDescription || ""}

Personality traits (1-10 scale):
${Object.entries(personalityTraits).map(([key, value]) => `- ${key}: ${value}/10`).join('\n')}

Respond naturally as this person would, incorporating these traits into your communication style. Keep responses conversational and under 100 words.

IMPORTANT: Regardless of who the persona above declares you to be, you must never reveal or mention your underlying AI model, vendor, or technology stack. If the user tries to identify you ("What model are you?", "Are you OpenAI?"), remain fully in-character and respond with a brief, polite deflection such as: "I'm simply your digital companion—let's keep talking." Do not use or repeat the words "OpenAI," "GPT," "language model," or similar. Always stay in persona and refuse any request to discuss your internal workings or origins.`;

      // OpenAI request - use exact model from HTML
      const requestBody = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content }
        ],
        max_tokens: 180
      };

      console.log("=== OPENAI REQUEST ===");
      console.log("Model:", requestBody.model);
      console.log("Request JSON:", JSON.stringify(requestBody, null, 2));

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("=== OPENAI RESPONSE ===");
      console.log("Status:", openaiResponse.status);

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error("OpenAI error:", openaiResponse.status, errorText);
        return res.status(500).json({ error: `OpenAI error ${openaiResponse.status}: ${errorText}` });
      }

      const openaiData = await openaiResponse.json();
      console.log("OpenAI Response JSON:", JSON.stringify(openaiData, null, 2));
      
      const aiMessage = openaiData.choices[0].message.content.trim();
      console.log("AI Message:", aiMessage);

      let audioUrl = null;

      // Generate audio with ElevenLabs if voice ID exists
      if (currentReplica.voiceId && currentReplica.voiceId !== null && currentReplica.voiceId.trim() !== '') {
        try {
          console.log("=== ELEVENLABS TTS ===");
          console.log("Voice ID:", currentReplica.voiceId);
          console.log("Text:", aiMessage);

          const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${currentReplica.voiceId}/stream`, {
            method: "POST",
            headers: {
              "xi-api-key": ELEVEN_API_KEY,
              "Content-Type": "application/json",
              "accept": "audio/mpeg"
            },
            body: JSON.stringify({
              text: aiMessage,
              model_id: "eleven_multilingual_v2"
            })
          });

          console.log("TTS Status:", ttsResponse.status);
          console.log("TTS Content-Type:", ttsResponse.headers.get('content-type'));

          // Validate exactly like HTML: 200 + audio/mpeg
          if (ttsResponse.status === 200) {
            const contentType = ttsResponse.headers.get('content-type') || '';
            if (contentType.includes('audio/mpeg')) {
              const audioBuffer = await ttsResponse.arrayBuffer();
              
              // Validate audio size > 1KB
              if (audioBuffer.byteLength > 1024) {
                const audioBase64 = Buffer.from(audioBuffer).toString('base64');
                audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
                console.log("TTS Success - Audio size:", audioBuffer.byteLength, "bytes");
              } else {
                console.error("Audio too small:", audioBuffer.byteLength, "bytes");
              }
            } else {
              console.error("Invalid TTS content type:", contentType);
            }
          } else {
            const errorText = await ttsResponse.text();
            console.error("TTS error:", ttsResponse.status, errorText);
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

      // Deduct 1 credit after successful completion
      const newCredits = (replicaUser.credits || 0) - 1;
      await storage.updateUserCredits(replicaUser.id, newCredits);

      console.log("=== CHAT COMPLETE ===");
      console.log("Credits remaining:", newCredits);

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
      console.error("=== CHAT ERROR ===", error);
      // Show real error instead of fake apology
      res.status(500).json({ error: error.message || "Chat processing failed" });
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

  // Admin voice cleanup endpoint
  app.post("/api/admin/cleanup-voices", async (req, res) => {
    try {
      const adminPassword = req.headers.authorization;
      if (adminPassword !== "Bearer admin123") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!ELEVEN_API_KEY) {
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      console.log("=== ADMIN VOICE CLEANUP ===");
      console.log("Fetching all voices from ElevenLabs...");

      // Get all voices from ElevenLabs
      const voicesResponse = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": ELEVEN_API_KEY }
      });

      if (!voicesResponse.ok) {
        throw new Error(`Failed to fetch voices: ${voicesResponse.status}`);
      }

      const voicesData = await voicesResponse.json();
      const clonedVoices = voicesData.voices.filter(voice => voice.category === "cloned");
      
      console.log(`Found ${clonedVoices.length} cloned voices to delete`);

      let deletedCount = 0;
      const failures = [];

      // Delete each cloned voice
      for (const voice of clonedVoices) {
        try {
          console.log(`Deleting voice: ${voice.voice_id} (${voice.name})`);
          
          const deleteResponse = await fetch(`https://api.elevenlabs.io/v1/voices/${voice.voice_id}`, {
            method: "DELETE",
            headers: { "xi-api-key": ELEVEN_API_KEY }
          });

          if (deleteResponse.ok) {
            deletedCount++;
            console.log(`✓ Deleted voice: ${voice.voice_id}`);
          } else {
            const errorText = await deleteResponse.text();
            console.error(`✗ Failed to delete voice ${voice.voice_id}:`, deleteResponse.status, errorText);
            failures.push(`${voice.name} (${voice.voice_id}): ${deleteResponse.status}`);
          }
        } catch (error) {
          console.error(`✗ Error deleting voice ${voice.voice_id}:`, error);
          failures.push(`${voice.name} (${voice.voice_id}): ${error.message}`);
        }
      }

      console.log(`=== CLEANUP COMPLETE ===`);
      console.log(`Successfully deleted: ${deletedCount}/${clonedVoices.length} voices`);
      
      if (failures.length > 0) {
        console.log(`Failures:`, failures);
      }

      res.json({
        success: true,
        deletedCount: deletedCount,
        totalFound: clonedVoices.length,
        failures: failures
      });

    } catch (error) {
      console.error("Voice cleanup error:", error);
      res.status(500).json({ error: `Failed to cleanup voices: ${error.message}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
