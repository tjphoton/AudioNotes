import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Share, Copy, Trash2, Play, Bot, FileText, Tag } from "lucide-react";
import { Note } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NoteViewProps {
  note: Note;
  onBack: () => void;
}

export default function NoteView({ note, onBack }: NoteViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/notes/${note.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note deleted",
        description: "The note has been permanently deleted.",
      });
      onBack();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not delete the note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShare = async () => {
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

  const handleCopy = async () => {
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

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Unknown date";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { 
      year: "numeric",
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDuration = (duration: number | null | undefined) => {
    if (!duration) return "0:00";
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-foreground mb-2">{note.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground font-mono mb-6">
              <span>{formatDate(note.createdAt)}</span>
              <span>Duration: {formatDuration(note.duration)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              data-testid="share-note-button"
            >
              <Share className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              data-testid="copy-note-button"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
              data-testid="delete-note-button"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Note Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI-Generated Note */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="text-primary w-5 h-5" />
                <h3 className="font-semibold text-foreground">AI-Organized Note</h3>
              </div>
              <div 
                className="prose prose-slate max-w-none font-serif text-foreground"
                style={{ whiteSpace: "pre-wrap" }}
                data-testid="ai-note-content"
              >
                {note.aiProcessedNote}
              </div>
            </CardContent>
          </Card>

          {/* Raw Transcription */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="text-muted-foreground w-5 h-5" />
                  <h3 className="font-semibold text-foreground">Raw Transcription</h3>
                </div>
              </div>
              <div 
                className="text-sm text-muted-foreground leading-relaxed max-h-48 overflow-y-auto"
                style={{ whiteSpace: "pre-wrap" }}
                data-testid="transcription-content"
              >
                {note.originalTranscription}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Audio Player */}
          {note.audioFilePath && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Play className="text-primary w-5 h-5" />
                  <h3 className="font-semibold text-foreground">Audio Recording</h3>
                </div>
                <div className="space-y-4">
                  <audio 
                    controls 
                    className="w-full"
                    src={`/api/audio/${note.audioFilePath.split('/').pop()}`}
                    data-testid="audio-player"
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>0:00</span>
                    <span>{formatDuration(note.duration)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Note Metadata */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground font-mono">{formatDate(note.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-foreground font-mono">{formatDuration(note.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <span className="text-foreground">{note.language || "English"}</span>
                </div>
                {note.fileSize && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size</span>
                    <span className="text-foreground font-mono">{formatFileSize(note.fileSize)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags (Future Feature) */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  voice-note
                </span>
                <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                  transcribed
                </span>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                Add Tag
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
