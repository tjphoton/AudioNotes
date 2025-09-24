import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Pause, Square, RotateCcw, Loader2, Check, Clock } from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecordingInterfaceProps {
  onNoteCreated: () => void;
}

export default function RecordingInterface({ onNoteCreated }: RecordingInterfaceProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    stopRecording,
    resetRecording,
    audioBlob,
  } = useAudioRecorder();

  const processMutation = useMutation({
    mutationFn: async (audioFile: Blob) => {
      const formData = new FormData();
      formData.append("audio", audioFile, "recording.wav");
      
      const response = await apiRequest("POST", "/api/notes/process-audio", formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note created successfully!",
        description: "Your voice note has been transcribed and organized.",
      });
      resetRecording();
      onNoteCreated();
    },
    onError: (error) => {
      toast({
        title: "Processing failed",
        description: "Could not process your audio. Please try again.",
        variant: "destructive",
      });
      console.error("Error processing audio:", error);
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = () => (duration / 900) * 100; // 900 seconds = 15 minutes

  const handleRecord = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) {
        setIsProcessing(true);
        processMutation.mutate(blob);
      }
    } else {
      startRecording();
    }
  };

  const getRecordButtonContent = () => {
    if (isProcessing || processMutation.isPending) {
      return <Loader2 className="text-primary-foreground w-6 h-6 animate-spin" />;
    }
    if (isRecording) {
      return <Square className="text-primary-foreground w-6 h-6" />;
    }
    return <Mic className="text-primary-foreground w-6 h-6" />;
  };

  const getRecordButtonText = () => {
    if (isProcessing || processMutation.isPending) return "Processing your note...";
    if (isRecording && !isPaused) return "Recording... Click to stop";
    if (isPaused) return "Recording paused";
    return "Click to start recording";
  };

  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-foreground mb-4">Record Your Voice Note</h2>
        <p className="text-muted-foreground text-lg">
          Start recording and we'll automatically transcribe and organize your thoughts
        </p>
      </div>

      <Card className="p-8 shadow-sm border border-border">
        <CardContent className="p-0 space-y-8">
          {/* Timer Display */}
          <div className="space-y-4">
            <div className="timer-font text-6xl font-light text-secondary mb-2 font-mono">
              {formatTime(duration)}
            </div>
            <div className="text-sm text-muted-foreground font-mono">/ 15:00 max</div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(getProgress(), 100)}%` }}
              />
            </div>
          </div>

          {/* Record Button */}
          <div className="space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <Button
                onClick={handleRecord}
                disabled={isProcessing || processMutation.isPending}
                className={`relative w-24 h-24 rounded-full transition-all duration-200 transform hover:scale-105 ${
                  isRecording && !isPaused ? "animate-recording-pulse" : ""
                }`}
                data-testid="record-button"
              >
                {getRecordButtonContent()}
                {isRecording && !isPaused && (
                  <div className="absolute -inset-4 border-2 border-primary/30 rounded-full animate-recording-ring" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{getRecordButtonText()}</p>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              onClick={pauseRecording}
              disabled={!isRecording || isProcessing || processMutation.isPending}
              data-testid="pause-button"
            >
              <Pause className="w-4 h-4 mr-2" />
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button
              variant="outline"
              onClick={resetRecording}
              disabled={(!isRecording && duration === 0) || isProcessing || processMutation.isPending}
              data-testid="reset-button"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {(isProcessing || processMutation.isPending) && (
        <Card className="mt-6 fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Processing your note...</span>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground text-left max-w-md mx-auto">
              <div className="flex items-center space-x-2">
                <Check className="w-3 h-3 text-primary" />
                <span>Audio recorded successfully</span>
              </div>
              <div className="flex items-center space-x-2">
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span>Transcribing audio...</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-muted-foreground/50">Generating clean notes...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
