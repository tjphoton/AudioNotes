import { type User, type InsertUser, type Note, type InsertNote, type Settings, type InsertSettings } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Note methods
  getNotesByUserId(userId: string): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;
  
  // Settings methods
  getUserSettings(userId: string): Promise<Settings | undefined>;
  createOrUpdateSettings(settings: InsertSettings): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private notes: Map<string, Note>;
  private settings: Map<string, Settings>;

  constructor() {
    this.users = new Map();
    this.notes = new Map();
    this.settings = new Map();
    
    // Create demo user for testing
    const demoUser: User = {
      id: "demo-user-123",
      username: "demo",
      email: "demo@example.com",
      password: "demo123",
      language: "en",
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);
    
    // Create default settings for demo user
    const demoSettings: Settings = {
      id: "demo-settings-123",
      userId: "demo-user-123",
      outputLanguage: "en",
      transcriptionModel: "whisper-1",
      audioQuality: "high",
      autoStopOnSilence: true,
      noteOrganizationStyle: "structured",
      autoGenerateTitles: true,
      extractActionItems: true,
      keepRawAudio: false, // Default to false to prevent storage leakage
      dataRetention: "forever",
    };
    this.settings.set(demoSettings.id, demoSettings);
    
    // Create a sample note for testing the notes library
    const sampleNote: Note = {
      id: "sample-note-123",
      userId: "demo-user-123",
      title: "Welcome to VoiceNote",
      originalTranscription: "Welcome to VoiceNote, the elegant audio note-taking app that automatically transcribes and organizes your voice memos. This is a sample note to demonstrate the library functionality.",
      aiProcessedNote: "# Welcome to VoiceNote\n\nWelcome to VoiceNote, the elegant audio note-taking app that automatically transcribes and organizes your voice memos.\n\n## Key Features\n- **Automatic Transcription**: Convert speech to text using OpenAI's Whisper\n- **AI Organization**: Clean up and structure your notes with GPT\n- **Elegant Interface**: Inspired by AudioPen and Notion's clean design\n- **Voice-First**: Capture thoughts naturally through speech\n\nThis is a sample note to demonstrate the library functionality and showcase the clean, organized output that VoiceNote produces from your voice recordings.",
      audioFilePath: null,
      duration: 45,
      fileSize: 2048,
      language: "en",
      createdAt: new Date(),
    };
    this.notes.set(sampleNote.id, sampleNote);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      language: insertUser.language || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Note methods
  async getNotesByUserId(userId: string): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter((note) => note.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const note: Note = {
      ...insertNote,
      id,
      duration: insertNote.duration || null,
      fileSize: insertNote.fileSize || null,
      language: insertNote.language || null,
      audioFilePath: insertNote.audioFilePath || null,
      createdAt: new Date(),
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined> {
    const existingNote = this.notes.get(id);
    if (!existingNote) return undefined;
    
    const updatedNote = { ...existingNote, ...updates };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Settings methods
  async getUserSettings(userId: string): Promise<Settings | undefined> {
    return Array.from(this.settings.values()).find(
      (setting) => setting.userId === userId,
    );
  }

  async createOrUpdateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const existing = await this.getUserSettings(insertSettings.userId);
    
    if (existing) {
      const updated = { ...existing, ...insertSettings };
      this.settings.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const settings: Settings = {
        ...insertSettings,
        id,
        outputLanguage: insertSettings.outputLanguage || null,
        transcriptionModel: insertSettings.transcriptionModel || null,
        audioQuality: insertSettings.audioQuality || null,
        autoStopOnSilence: insertSettings.autoStopOnSilence || null,
        noteOrganizationStyle: insertSettings.noteOrganizationStyle || null,
        autoGenerateTitles: insertSettings.autoGenerateTitles || null,
        extractActionItems: insertSettings.extractActionItems || null,
        keepRawAudio: insertSettings.keepRawAudio || null,
        dataRetention: insertSettings.dataRetention || null,
      };
      this.settings.set(id, settings);
      return settings;
    }
  }
}

export const storage = new MemStorage();
