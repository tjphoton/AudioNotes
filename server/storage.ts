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
