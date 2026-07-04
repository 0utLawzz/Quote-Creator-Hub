import * as React from "react";
import { useGetStats, useGetRecentReels } from "@workspace/api-client-react";
import { Clapperboard, CalendarDays, CheckCircle2, Clock, Star, Play, Plus, Search } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: recentReels, isLoading: recentLoading } = useGetRecentReels();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studio Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track your performance and manage your creative pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search library..." 
              className="pl-9 w-64 bg-card/50 border-border/50 focus-visible:ring-primary/30"
            />
          </div>
          <Link href="/create">
            <Button className="font-semibold shadow-primary/25 shadow-lg">
              <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
              New Reel
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Reels"
          value={stats?.totalReels}
          icon={Clapperboard}
          loading={statsLoading}
        />
        <StatCard
          title="Scheduled"
          value={stats?.scheduledPosts}
          icon={CalendarDays}
          loading={statsLoading}
          color="text-blue-400"
        />
        <StatCard
          title="Posted"
          value={stats?.postedReels}
          icon={CheckCircle2}
          loading={statsLoading}
          color="text-emerald-400"
        />
        <StatCard
          title="Drafts"
          value={stats?.draftReels}
          icon={Clock}
          loading={statsLoading}
          color="text-orange-400"
        />
        <StatCard
          title="Favorites"
          value={stats?.favoriteReels}
          icon={Star}
          loading={statsLoading}
          color="text-yellow-400"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" fill="currentColor" />
            Recent Creations
          </h2>
          <Link href="/library" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
            View All →
          </Link>
        </div>

        {recentLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl bg-card border border-border" />
            ))}
          </div>
        ) : recentReels && recentReels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentReels.map((reel) => (
              <Link key={reel.id} href={`/create?id=${reel.id}`}>
                <div className="group relative aspect-[9/16] bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent z-10" />
                  <div 
                    className="absolute inset-0 p-6 flex flex-col justify-end z-20"
                    style={{ backgroundColor: reel.templateId === 'dark' ? '#000' : 'transparent' }} // Simplified mock preview
                  >
                    <div className="space-y-3">
                      <div className="flex gap-2 mb-2 flex-wrap">
                        <Badge variant="secondary" className="bg-background/50 backdrop-blur-md border-border/50 text-xs">
                          {reel.category}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`bg-background/50 backdrop-blur-md border-border/50 text-xs capitalize
                            ${reel.status === 'posted' ? 'text-emerald-400' : 
                              reel.status === 'scheduled' ? 'text-blue-400' : 'text-orange-400'}`}
                        >
                          {reel.status}
                        </Badge>
                      </div>
                      <p className="font-serif text-lg font-medium leading-snug line-clamp-3 text-white">
                        "{reel.quote}"
                      </p>
                      {reel.author && (
                        <p className="text-sm text-white/70 font-sans">
                          — {reel.author}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="h-64 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center p-6 bg-card/30">
            <Clapperboard className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
            <h3 className="font-medium text-lg mb-1">No reels yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Your recent creations will appear here. Start making cinematic quote reels to fill up your studio.
            </p>
            <Link href="/create">
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground">
                Create Your First Reel
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  loading,
  color = "text-primary"
}: { 
  title: string; 
  value?: number; 
  icon: any; 
  loading: boolean;
  color?: string;
}) {
  return (
    <div className="bg-card border border-border p-5 rounded-xl shadow-sm hover:border-border/80 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-background border border-border ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <div className="text-3xl font-bold tracking-tight">{value ?? 0}</div>
      )}
    </div>
  );
}
