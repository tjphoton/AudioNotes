import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoteSchema, insertUserSchema, insertSettingsSchema } from "@shared/schema";
import { transcribeAudio, processNote } from "./openai";
import multer from "multer";
import fs from "fs";
import path from "path";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      // Generate unique filename with .webm extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'audio-' + uniqueSuffix + '.webm');
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Create default settings for the user
      await storage.createOrUpdateSettings({
        userId: user.id,
        outputLanguage: userData.language || "en",
        transcriptionModel: "whisper-1",
        audioQuality: "high",
        noteOrganizationStyle: "minimal",
        keepRawAudio: true,
        dataRetention: "forever",
      });
      
      res.json({ id: user.id, username: user.username, email: user.email });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json({ 
        id: user.id, 
        username: user.username, 
        email: user.email,
        language: user.language 
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Notes routes
  app.get("/api/notes", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "User ID required" });
      }
      
      const notes = await storage.getNotesByUserId(userId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ error: "Failed to fetch note" });
    }
  });

  app.post("/api/notes/process-audio", upload.single("audio"), async (req: MulterRequest, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "User ID required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Audio file required" });
      }

      // Get user settings
      const settings = await storage.getUserSettings(userId);
      const language = settings?.outputLanguage || "en";
      const organizationStyle = settings?.noteOrganizationStyle || "minimal";

      // Transcribe audio
      const { text: transcription, duration } = await transcribeAudio(req.file.path);
      
      if (!transcription) {
        return res.status(400).json({ error: "Could not transcribe audio" });
      }

      // Process with AI
      const { title, processedNote } = await processNote(transcription, language, organizationStyle);

      // Save the note
      const noteData = {
        userId,
        title,
        originalTranscription: transcription,
        aiProcessedNote: processedNote,
        audioFilePath: settings?.keepRawAudio ? req.file.path : undefined,
        duration: Math.round(duration || 0),
        fileSize: req.file.size,
        language,
      };

      const note = await storage.createNote(noteData);

      // Clean up temp file if not keeping raw audio
      if (!settings?.keepRawAudio) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.warn("Could not delete temp file:", err);
        }
      }

      res.json(note);
    } catch (error) {
      console.error("Error processing audio:", error);
      res.status(500).json({ error: "Failed to process audio" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      // Get the note first to check for audio file
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Delete audio file if it exists
      if (note.audioFilePath && fs.existsSync(note.audioFilePath)) {
        try {
          fs.unlinkSync(note.audioFilePath);
        } catch (audioError) {
          console.warn("Could not delete audio file:", audioError);
        }
      }

      const deleted = await storage.deleteNote(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "User ID required" });
      }
      
      const settings = await storage.getUserSettings(userId);
      if (!settings) {
        // Return default settings
        const defaultSettings = {
          outputLanguage: "en",
          transcriptionModel: "whisper-1",
          audioQuality: "high",
          autoStopOnSilence: true,
          noteOrganizationStyle: "structured",
          autoGenerateTitles: true,
          extractActionItems: true,
          keepRawAudio: true,
          dataRetention: "forever",
        };
        return res.json(defaultSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "User ID required" });
      }
      
      const settingsData = { ...req.body, userId };
      const validatedSettings = insertSettingsSchema.parse(settingsData);
      
      const settings = await storage.createOrUpdateSettings(validatedSettings);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(400).json({ error: "Invalid settings data" });
    }
  });

  // Audio file serving
  app.get("/api/audio/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      const filepath = path.join("uploads", filename);
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: "Audio file not found" });
      }
      
      res.sendFile(path.resolve(filepath));
    } catch (error) {
      console.error("Error serving audio file:", error);
      res.status(500).json({ error: "Failed to serve audio file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
