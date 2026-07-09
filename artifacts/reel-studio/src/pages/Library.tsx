import * as React from "react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { 
  useListReels, 
  useDeleteReel, 
  useToggleReelFavorite,
  useUpdateReel,
  Reel 
} from "@workspace/api-client-react";
import { 
  Search, Star, Trash2, Edit3, CalendarPlus, 
  Download, Filter, MoreVertical, PlayCircle,
  CheckCircle2, RotateCcw, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getListReelsQueryKey, getGetStatsQueryKey, getGetRecentReelsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Library() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = {
    ...(filterCategory !== "all" && { category: filterCategory }),
    ...(filterStatus !== "all" && { status: filterStatus }),
  };

  const { data: reels, isLoading } = useListReels(queryParams);

  const deleteReel = useDeleteReel({
    mutation: {
      onSuccess: () => {
        toast({ title: "Reel deleted", description: "The reel has been removed from your library." });
        queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() });
      }
    }
  });

  const toggleFavorite = useToggleReelFavorite({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() });
      }
    }
  });

  const updateReel = useUpdateReel({
    mutation: {
      onSuccess: (data) => {
        const label = data.status === "posted" ? "Marked as posted" : "Marked as draft";
        toast({ title: label });
        queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentReelsQueryKey() });
      },
      onError: () => toast({ title: "Update failed", variant: "destructive" }),
    }
  });

  const categories = ["Motivation", "Success", "Love", "Wisdom", "Friendship", "Courage", "Life", "Mindfulness"];

  const filteredReels = reels?.filter(r => 
    search ? r.quote.toLowerCase().includes(search.toLowerCase()) || 
             (r.author && r.author.toLowerCase().includes(search.toLowerCase()))
           : true
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your collection of cinematic reels.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search quotes..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64 bg-card/50"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px] bg-card/50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px] bg-card/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : filteredReels && filteredReels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredReels.map((reel) => (
            <div key={reel.id} className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              {/* Preview Box */}
              <div 
                className="aspect-[9/16] bg-zinc-900 relative p-6 flex flex-col justify-center items-center text-center cursor-pointer"
                onClick={() => setLocation(`/create?id=${reel.id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
                
                {/* Mockup visual representing template */}
                <p className="relative z-10 text-lg font-serif font-medium leading-snug line-clamp-4 text-white/90">
                  "{reel.quote}"
                </p>
                {reel.author && (
                  <p className="relative z-10 text-xs font-sans mt-4 text-white/60 uppercase tracking-widest">
                    {reel.author}
                  </p>
                )}

                {/* Overlays */}
                <button 
                  className="absolute top-3 right-3 z-20 p-2 rounded-full bg-background/40 backdrop-blur hover:bg-background/80 transition-colors"
                  onClick={(e) => { e.stopPropagation(); toggleFavorite.mutate({ id: reel.id }); }}
                >
                  <Star 
                    className={`h-4 w-4 ${reel.isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-white'}`} 
                  />
                </button>
                <div className="absolute top-3 left-3 z-20">
                  <Badge variant="outline" className={`bg-background/40 backdrop-blur text-[10px] uppercase tracking-wider border-0
                    ${reel.status === 'posted' ? 'text-emerald-400' : 
                      reel.status === 'scheduled' ? 'text-blue-400' : 'text-zinc-300'}`}>
                    {reel.status}
                  </Badge>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-3 border-t border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="truncate max-w-[100px] font-medium text-foreground">{reel.category}</span>
                  <span>•</span>
                  <span>{format(new Date(reel.createdAt), "MMM d")}</span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setLocation(`/create?id=${reel.id}`)}>
                      <Edit3 className="mr-2 h-4 w-4" /> Edit Reel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation(`/schedule?reelId=${reel.id}`)}>
                      <CalendarPlus className="mr-2 h-4 w-4" /> Schedule
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {reel.status !== "posted" ? (
                      <DropdownMenuItem
                        onClick={() => updateReel.mutate({ id: reel.id, data: { status: "posted" } })}
                      >
                        <Send className="mr-2 h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Mark as Posted</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => updateReel.mutate({ id: reel.id, data: { status: "draft" } })}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> Revert to Draft
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this reel?")) {
                          deleteReel.mutate({ id: reel.id });
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card rounded-xl border border-dashed border-border/50">
          <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No reels found</h3>
          <p className="text-muted-foreground mt-1 mb-6">
            {search || filterCategory !== "all" || filterStatus !== "all" 
              ? "Try adjusting your filters or search." 
              : "Your library is empty. Start creating!"}
          </p>
          <Button onClick={() => setLocation("/create")} variant="default">
            Create New Reel
          </Button>
        </div>
      )}
    </div>
  );
}
