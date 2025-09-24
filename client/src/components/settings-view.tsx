import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Languages, Mic, Bot, Shield, User, Download, Trash2, LogOut } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "@shared/schema";

export default function SettingsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<Settings>) => {
      const response = await apiRequest("PUT", "/api/settings", updatedSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof Settings, value: any) => {
    if (settings) {
      updateMutation.mutate({ [key]: value });
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-foreground mb-2">Settings</h2>
        <p className="text-muted-foreground">Customize your VoiceNote experience</p>
      </div>

      <div className="space-y-6">
        {/* Language Settings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Languages className="text-primary w-5 h-5" />
              <h3 className="font-semibold text-foreground">Language & Transcription</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="output-language" className="text-sm font-medium">Output Language</Label>
                <Select
                  value={settings.outputLanguage || "en"}
                  onValueChange={(value) => handleSettingChange("outputLanguage", value)}
                >
                  <SelectTrigger className="mt-2" data-testid="output-language-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Language for AI-generated note organization
                </p>
              </div>
              <div>
                <Label htmlFor="transcription-model" className="text-sm font-medium">Transcription Model</Label>
                <Select
                  value={settings.transcriptionModel || "whisper-1"}
                  onValueChange={(value) => handleSettingChange("transcriptionModel", value)}
                >
                  <SelectTrigger className="mt-2" data-testid="transcription-model-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whisper-1">Whisper v1 (Recommended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recording Settings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Mic className="text-primary w-5 h-5" />
              <h3 className="font-semibold text-foreground">Recording</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="audio-quality" className="text-sm font-medium">Audio Quality</Label>
                <Select
                  value={settings.audioQuality || "high"}
                  onValueChange={(value) => handleSettingChange("audioQuality", value)}
                >
                  <SelectTrigger className="mt-2" data-testid="audio-quality-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Quality (44.1 kHz, 256 kbps)</SelectItem>
                    <SelectItem value="standard">Standard Quality (22 kHz, 128 kbps)</SelectItem>
                    <SelectItem value="compressed">Compressed (16 kHz, 64 kbps)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Processing Settings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Bot className="text-primary w-5 h-5" />
              <h3 className="font-semibold text-foreground">AI Processing</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="note-style" className="text-sm font-medium">Note Organization Style</Label>
                <Select
                  value={settings.noteOrganizationStyle || "minimal"}
                  onValueChange={(value) => handleSettingChange("noteOrganizationStyle", value)}
                >
                  <SelectTrigger className="mt-2" data-testid="note-style-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narrative">Narrative (Paragraph format)</SelectItem>
                    <SelectItem value="minimal">Minimal (Clean up only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="text-primary w-5 h-5" />
              <h3 className="font-semibold text-foreground">Data & Privacy</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Keep raw audio files</Label>
                  <p className="text-xs text-muted-foreground">Store original recordings for playback</p>
                </div>
                <Switch
                  checked={settings.keepRawAudio ?? true}
                  onCheckedChange={(value) => handleSettingChange("keepRawAudio", value)}
                  data-testid="keep-audio-switch"
                />
              </div>
              <div>
                <Label htmlFor="data-retention" className="text-sm font-medium">Data Retention</Label>
                <Select
                  value={settings.dataRetention || "forever"}
                  onValueChange={(value) => handleSettingChange("dataRetention", value)}
                >
                  <SelectTrigger className="mt-2" data-testid="data-retention-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forever">Keep forever</SelectItem>
                    <SelectItem value="1year">1 year</SelectItem>
                    <SelectItem value="6months">6 months</SelectItem>
                    <SelectItem value="3months">3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex space-x-4">
                <Button variant="outline" size="sm" data-testid="export-data-button">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" data-testid="delete-all-data-button">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="text-primary w-5 h-5" />
              <h3 className="font-semibold text-foreground">Account</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value="john.doe@example.com"
                  className="mt-2"
                  readOnly
                  data-testid="email-input"
                />
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm">
                  Update Email
                </Button>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
              <Separator />
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" data-testid="sign-out-button">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
