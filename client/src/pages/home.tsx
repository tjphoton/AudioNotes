import { useState } from "react";
import AppHeader from "@/components/app-header";
import RecordingInterface from "@/components/recording-interface";
import NotesLibrary from "@/components/notes-library";
import NoteView from "@/components/note-view";
import SettingsView from "@/components/settings-view";
import { Note } from "@shared/schema";

type View = "record" | "library" | "note" | "settings";

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("record");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    if (view !== "note") {
      setSelectedNote(null);
    }
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setCurrentView("note");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <AppHeader currentView={currentView} onViewChange={handleViewChange} />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "record" && (
          <RecordingInterface onNoteCreated={() => setCurrentView("library")} />
        )}
        
        {currentView === "library" && (
          <NotesLibrary 
            onNoteSelect={handleNoteSelect}
            onNewNote={() => setCurrentView("record")}
          />
        )}
        
        {currentView === "note" && selectedNote && (
          <NoteView 
            note={selectedNote}
            onBack={() => setCurrentView("library")}
          />
        )}
        
        {currentView === "settings" && (
          <SettingsView />
        )}
      </main>
    </div>
  );
}
