import { Button } from "@/components/ui/button";
import { Mic, Settings } from "lucide-react";

type View = "record" | "library" | "note" | "settings";

interface AppHeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function AppHeader({ currentView, onViewChange }: AppHeaderProps) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mic className="text-primary-foreground w-4 h-4" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">VoiceNote</h1>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant={currentView === "record" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("record")}
              className={currentView === "record" ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"}
              data-testid="nav-record"
            >
              Record
            </Button>
            <Button
              variant={currentView === "library" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("library")}
              className={currentView === "library" ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"}
              data-testid="nav-library"
            >
              Library
            </Button>
          </nav>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewChange("settings")}
              className="text-muted-foreground hover:text-foreground"
              data-testid="nav-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2 pl-2 border-l border-border">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-accent-foreground">JD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
