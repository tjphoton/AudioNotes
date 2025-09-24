import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Plus, Search, Share, Copy, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Note } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface NotesLibraryProps {
  onNoteSelect: (note: Note) => void;
  onNewNote: () => void;
}

export default function NotesLibrary({ onNoteSelect, onNewNote }: NotesLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notes");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiRequest("DELETE", `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note deleted",
        description: "The note has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not delete the note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShare = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({
          title: note.title,
          text: note.aiProcessedNote,
        });
      } else {
        toast({
          title: "Share functionality not available",
          description: "Your browser doesn't support native sharing.",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleCopy = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${note.title}\n\n${note.aiProcessedNote}`);
      toast({
        title: "Copied to clipboard",
        description: "Note content has been copied.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      deleteMutation.mutate(note.id);
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Unknown date";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const formatDuration = (duration: number | null | undefined) => {
    if (!duration) return "0:00";
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.aiProcessedNote.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (timeFilter === "all") return matchesSearch;
    
    const noteDate = note.createdAt ? new Date(note.createdAt) : new Date(0);
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    
    switch (timeFilter) {
      case "week":
        return matchesSearch && (now.getTime() - noteDate.getTime()) <= (7 * dayMs);
      case "month":
        return matchesSearch && (now.getTime() - noteDate.getTime()) <= (30 * dayMs);
      case "older":
        return matchesSearch && (now.getTime() - noteDate.getTime()) > (30 * dayMs);
      default:
        return matchesSearch;
    }
  });

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your notes...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground mb-2">Your Notes</h2>
          <p className="text-muted-foreground">All your voice notes, transcribed and organized</p>
        </div>
        <Button onClick={onNewNote} data-testid="new-note-button">
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="time-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notes</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="older">Older</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="cursor-pointer hover:shadow-md transition-all duration-200 group"
              onClick={() => onNoteSelect(note)}
              data-testid={`note-card-${note.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                    {note.title}
                  </h3>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleShare(note, e)}
                      className="p-1 h-auto text-muted-foreground hover:text-primary"
                      data-testid={`share-note-${note.id}`}
                    >
                      <Share className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleCopy(note, e)}
                      className="p-1 h-auto text-muted-foreground hover:text-accent"
                      data-testid={`copy-note-${note.id}`}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(note, e)}
                      className="p-1 h-auto text-muted-foreground hover:text-destructive"
                      data-testid={`delete-note-${note.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {note.aiProcessedNote.substring(0, 150)}...
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>{formatDate(note.createdAt)}</span>
                  <span>{formatDuration(note.duration)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16" data-testid="empty-state">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic className="text-muted-foreground w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchTerm ? "No notes found" : "No notes yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm 
              ? "Try adjusting your search terms or filters" 
              : "Start recording your first voice note to get started"
            }
          </p>
          <Button onClick={onNewNote} data-testid="create-first-note-button">
            Create Your First Note
          </Button>
        </div>
      )}
    </div>
  );
}
