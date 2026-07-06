import * as React from "react";
import { useListTemplates } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Templates() {
  const { data: templates, isLoading } = useListTemplates();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Template Gallery</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse visual styles for your reels. All templates are responsive 9:16 vertical video ready.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-[9/16] rounded-xl bg-card border border-border" />
          ))}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div 
              key={template.id} 
              className="group relative aspect-[9/16] rounded-xl border border-border overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
              style={{ backgroundColor: template.bgColor }}
            >
              {/* Template Preview Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-center text-center z-20">
                <p 
                  className="text-2xl mb-6 font-serif tracking-wide leading-tight drop-shadow-md"
                  style={{ color: template.textColor, fontFamily: template.fontStyle === 'serif' ? 'var(--app-font-serif)' : 'var(--app-font-sans)' }}
                >
                  "Your bold cinematic quote goes right here."
                </p>
                <div className="w-12 h-1 mx-auto mb-4" style={{ backgroundColor: template.accentColor }} />
                <p 
                  className="text-sm font-medium tracking-widest uppercase opacity-80"
                  style={{ color: template.textColor, fontFamily: 'var(--app-font-sans)' }}
                >
                  Author Name
                </p>
              </div>

              {/* Template Info Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-30 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-foreground">{template.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: template.bgColor }} title="Background" />
                  <div className="w-6 h-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: template.textColor }} title="Text" />
                  <div className="w-6 h-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: template.accentColor }} title="Accent" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">No templates available yet.</p>
        </div>
      )}
    </div>
  );
}
