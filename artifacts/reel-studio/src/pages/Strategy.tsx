import * as React from "react";
import { useState } from "react";
import {
  Calendar, Cloud, Database, HardDrive, Rocket, TrendingUp,
  Clock, Target, Globe, Server, CheckCircle, ChevronDown, ChevronUp,
  Zap, Shield, DollarSign, BarChart3, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function SectionCard({ icon: Icon, iconColor, title, subtitle, children, defaultOpen = false }: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className={cn("p-2.5 rounded-lg", iconColor)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border/40">{children}</div>}
    </div>
  );
}

interface OptionRowProps {
  name: string;
  badge?: string;
  badgeColor?: string;
  desc: string;
  features: string[];
  href?: string;
}

function OptionRow({ name, badge, badgeColor, desc, features, href }: OptionRowProps) {
  return (
    <div className="mt-4 rounded-lg border border-border/50 bg-background/50 p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{name}</p>
            {badge && (
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", badgeColor)}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline whitespace-nowrap mt-1">
            Visit →
          </a>
        )}
      </div>
      <ul className="mt-2 space-y-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

const CONTENT_PILLARS = [
  { icon: "💡", label: "Motivation",   desc: "Drive & hustle quotes — performs 30% better Mon/Tue morning" },
  { icon: "📚", label: "Wisdom",       desc: "Timeless insights from philosophers & thinkers — great for Fri" },
  { icon: "💼", label: "Success",      desc: "Business & mindset — strong engagement with professional audience" },
  { icon: "❤️", label: "Love & Life",  desc: "Relationship & lifestyle quotes — peak engagement Sat/Sun" },
  { icon: "🧘", label: "Mindfulness",  desc: "Calm & wellness — early morning (6–8am) posts outperform 2×" },
  { icon: "🦁", label: "Courage",      desc: "Bold & inspiring — spike after cultural events or news moments" },
];

const POSTING_SCHEDULE = [
  { day: "Mon", theme: "Motivation", time: "7am", note: "Start-the-week energy" },
  { day: "Tue", theme: "Success",    time: "12pm", note: "Lunch scroll peak" },
  { day: "Wed", theme: "Wisdom",     time: "6pm", note: "Midweek reflection" },
  { day: "Thu", theme: "Courage",    time: "7am", note: "Pre-weekend push" },
  { day: "Fri", theme: "Life",       time: "5pm", note: "End-of-week wind-down" },
  { day: "Sat", theme: "Love",       time: "10am", note: "Slow morning browse" },
  { day: "Sun", theme: "Mindfulness",time: "9am", note: "Weekend calm" },
];

export default function Strategy() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Growth & Deployment Guide</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Content strategy, infrastructure choices, and scaling roadmap for Reel Studio.
        </p>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: BarChart3, label: "Optimal posts/week", value: "7–14", color: "text-primary" },
          { icon: Clock, label: "Best posting window", value: "7–9am", color: "text-emerald-500" },
          { icon: Target, label: "Accounts to target", value: "5 platforms", color: "text-purple-400" },
          { icon: TrendingUp, label: "Growth horizon", value: "90 days", color: "text-amber-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-border/50 bg-card p-4 text-center">
            <Icon className={cn("h-5 w-5 mx-auto mb-2", color)} />
            <p className={cn("text-lg font-bold", color)}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Content Strategy */}
      <SectionCard
        icon={Calendar}
        iconColor="bg-primary"
        title="Content Strategy"
        subtitle="Content pillars, posting cadence & timing recommendations"
        defaultOpen
      >
        {/* Content pillars */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {CONTENT_PILLARS.map((p) => (
            <div key={p.label} className="rounded-lg border border-border/50 bg-background/50 p-3">
              <p className="text-base mb-1">{p.icon}</p>
              <p className="text-xs font-semibold">{p.label}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Weekly schedule */}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Suggested Weekly Schedule
          </p>
          <div className="grid grid-cols-7 gap-1">
            {POSTING_SCHEDULE.map((s) => (
              <div key={s.day} className="rounded-lg bg-primary/8 border border-primary/20 p-2 text-center">
                <p className="text-[11px] font-bold text-primary">{s.day}</p>
                <p className="text-[9px] text-foreground font-medium mt-0.5 leading-tight">{s.theme}</p>
                <p className="text-[9px] text-muted-foreground mt-1">{s.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pro tips */}
        <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
          <p className="text-xs font-semibold text-amber-400 mb-1.5">📈 Growth Tips</p>
          <ul className="space-y-1">
            {[
              "Post reels as a video first — Instagram Reels get 3× more reach than static posts",
              "Use 5–8 niche hashtags + 2–3 broad hashtags (e.g. #motivation #dailyquote #mindset)",
              "Pin your best-performing reel to your profile — visitors see it first",
              "Cross-post the same reel to Instagram Reels + TikTok + YouTube Shorts same day",
              "Engage with comments within the first 60 minutes of posting to boost algorithm reach",
              "Create a series: same font + template per category so your feed looks cohesive",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-amber-200/80">
                <span className="text-amber-400 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </SectionCard>

      {/* Deployment */}
      <SectionCard
        icon={Rocket}
        iconColor="bg-violet-600"
        title="Deploy Your App"
        subtitle="How to publish Reel Studio so it's live anywhere"
        defaultOpen
      >
        <OptionRow
          name="Replit Deployments"
          badge="RECOMMENDED"
          badgeColor="bg-primary/20 text-primary"
          desc="Deploy directly from this workspace — zero config, automatic HTTPS, global CDN."
          features={[
            "One-click deploy — no server setup or CI/CD needed",
            "Auto-scales to handle traffic spikes",
            "Built-in PostgreSQL (your current DB) carries over to prod at no extra cost",
            "Custom domain support with free SSL",
            "Starts at $7/month for reserved VM (always-on) — free autoscale tier available",
          ]}
          href="https://docs.replit.com/cloud-services/deployments/about-deployments"
        />
        <OptionRow
          name="Railway"
          badge="ALTERNATIVE"
          badgeColor="bg-zinc-700 text-zinc-200"
          desc="Modern PaaS with GitHub auto-deploy. Good if you want Git-based workflow."
          features={[
            "Connects to your GitHub repo — deploys on every push",
            "Managed PostgreSQL addon available",
            "Generous free tier (500 hours/month)",
            "Requires exporting this project to GitHub first",
          ]}
          href="https://railway.app"
        />
        <OptionRow
          name="Fly.io"
          badge="ALTERNATIVE"
          badgeColor="bg-zinc-700 text-zinc-200"
          desc="Container-based global edge deployment with persistent volumes."
          features={[
            "Deploy close to users — 30+ regions worldwide",
            "Persistent storage volumes (for uploaded files)",
            "More DevOps setup required (Dockerfile)",
            "Managed Postgres with daily backups",
          ]}
          href="https://fly.io"
        />

        {/* Key steps */}
        <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
          <p className="text-xs font-semibold text-emerald-400 mb-1.5">🚀 Replit Deploy Steps</p>
          {["Click the Deploy button (top right of your Replit workspace)",
            "Choose 'Reserved VM' for always-on, or 'Autoscale' for pay-per-request",
            "Set your SESSION_SECRET in the production environment secrets",
            "Your PostgreSQL DB automatically links to production",
            "Set a custom domain under Deployments → Networking"].map((s, i) => (
            <p key={i} className="text-[11px] text-emerald-200/80 mb-1">
              <span className="font-bold text-emerald-400">{i + 1}.</span> {s}
            </p>
          ))}
        </div>
      </SectionCard>

      {/* Database */}
      <SectionCard
        icon={Database}
        iconColor="bg-blue-600"
        title="Database Options"
        subtitle="You're currently using Replit's built-in PostgreSQL — here's how to scale"
      >
        <OptionRow
          name="Replit PostgreSQL (Current)"
          badge="ACTIVE"
          badgeColor="bg-emerald-500/20 text-emerald-400"
          desc="Already connected and running. Zero setup — shared between dev and prod environments."
          features={[
            "Included in your current Replit plan at no extra cost",
            "Auto-backed up daily by Replit",
            "Scales to ~10GB before you'd need an external DB",
            "Access via DATABASE_URL environment variable (already configured)",
          ]}
        />
        <OptionRow
          name="Neon"
          badge="SCALE UP"
          badgeColor="bg-blue-500/20 text-blue-400"
          desc="Serverless Postgres — branches for dev/prod, scales to zero when idle."
          features={[
            "Serverless branching: dev, staging, prod databases from one project",
            "Scales to zero cost when not in use",
            "Compatible with Drizzle ORM (just swap DATABASE_URL)",
            "Free tier: 512MB, paid from $19/month",
          ]}
          href="https://neon.tech"
        />
        <OptionRow
          name="Supabase"
          badge="SCALE UP"
          badgeColor="bg-blue-500/20 text-blue-400"
          desc="Postgres + built-in file storage + auth + realtime — all-in-one backend."
          features={[
            "Built-in Storage (replaces need for separate S3/R2)",
            "Row-level security policies",
            "Free tier: 500MB DB + 1GB storage",
            "Auth, realtime subscriptions, edge functions included",
          ]}
          href="https://supabase.com"
        />

        <div className="mt-4 p-3 rounded-lg bg-card border border-border/50">
          <p className="text-xs font-semibold mb-1">Migration path when you outgrow Replit DB:</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Run <code className="bg-muted px-1 rounded text-[10px]">pnpm --filter @workspace/db run push</code> against
            your new database's <code className="bg-muted px-1 rounded text-[10px]">DATABASE_URL</code> to migrate the schema automatically.
            Drizzle ORM handles schema creation — no manual SQL needed.
          </p>
        </div>
      </SectionCard>

      {/* File Storage */}
      <SectionCard
        icon={HardDrive}
        iconColor="bg-orange-600"
        title="File Storage — Where Uploads Go"
        subtitle="Logo uploads, background images & videos need persistent cloud storage in production"
      >
        <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 mb-1">
          <p className="text-xs text-amber-300">
            ⚠️ <strong>Current behavior:</strong> Background images, videos, and logos are stored as browser
            object URLs — they live only in memory and are lost on refresh. In production you need a storage
            service to persist uploads between sessions.
          </p>
        </div>

        <OptionRow
          name="Replit Object Storage (App Storage)"
          badge="EASIEST"
          badgeColor="bg-primary/20 text-primary"
          desc="Built-in S3-compatible storage inside Replit — zero config needed."
          features={[
            "Native Replit integration — no external account required",
            "S3-compatible API with SDK (@replit/object-storage)",
            "Free tier: 1GB. Paid tiers scale with your Replit plan",
            "Add an upload endpoint to the API server — files persist across deploys",
          ]}
          href="https://docs.replit.com/cloud-services/storage-and-databases/object-storage"
        />
        <OptionRow
          name="Cloudflare R2"
          badge="BEST VALUE"
          badgeColor="bg-orange-500/20 text-orange-400"
          desc="S3-compatible storage with zero egress fees — ideal for media files."
          features={[
            "Zero egress (download) costs — no bill shock when users download reels",
            "10GB free forever, then $0.015/GB/month",
            "Global CDN via Cloudflare Workers for fast delivery",
            "Needs API key + bucket setup, then plug into your upload route",
          ]}
          href="https://cloudflare.com/r2"
        />
        <OptionRow
          name="Uploadthing / Supabase Storage"
          badge="DEVELOPER-FRIENDLY"
          badgeColor="bg-zinc-700 text-zinc-200"
          desc="Managed upload services with React hooks — fast integration."
          features={[
            "Uploadthing: drop-in React upload hook, direct-to-CDN uploads",
            "Supabase Storage: included if you use Supabase for DB too",
            "Both handle CORS, presigned URLs, and size limits automatically",
            "Uploadthing free tier: 2GB/month",
          ]}
          href="https://uploadthing.com"
        />

        <div className="mt-4 rounded-lg bg-card border border-border/50 p-3">
          <p className="text-xs font-semibold mb-2">Recommended production upload flow:</p>
          {[
            "User selects file → browser sends to POST /api/uploads",
            "API server streams file to Replit Object Storage (or R2)",
            "Storage returns a public CDN URL",
            "URL saved to DB (e.g., reel.logoUrl, reel.bgImageUrl)",
            "Renderer loads image from persistent CDN URL — survives page reload",
          ].map((step, i) => (
            <p key={i} className="text-[11px] text-muted-foreground mb-1">
              <span className="font-bold text-foreground">{i + 1}.</span> {step}
            </p>
          ))}
        </div>
      </SectionCard>

      {/* Platform distribution */}
      <SectionCard
        icon={Globe}
        iconColor="bg-pink-600"
        title="Platform Distribution Strategy"
        subtitle="Where and how to post each reel format"
      >
        <div className="mt-4 space-y-2">
          {[
            { platform: "Instagram Reels", format: "9:16 Video (15–30s)", tip: "Best reach for new accounts. Add trending audio in-app after upload.", priority: "high" },
            { platform: "TikTok",          format: "9:16 Video (15–60s)", tip: "Post same video — TikTok algo pushes to non-followers aggressively.",  priority: "high" },
            { platform: "YouTube Shorts",  format: "9:16 Video (≤60s)",   tip: "Long-tail discovery — Shorts can trend weeks after posting.",           priority: "high" },
            { platform: "Pinterest",       format: "9:16 Image (PNG)",    tip: "Quote images last forever on Pinterest. Great for evergreen traffic.",  priority: "medium" },
            { platform: "LinkedIn",        format: "1:1 or 9:16 Image",   tip: "Wisdom & success quotes resonate. Post Tuesday/Wednesday noon.",        priority: "medium" },
            { platform: "Facebook",        format: "9:16 Video / PNG",    tip: "Declining organic reach but good for community groups and ads.",        priority: "low" },
          ].map(({ platform, format, tip, priority }) => (
            <div key={platform} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-background/40">
              <div className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap",
                priority === "high" ? "bg-emerald-500/20 text-emerald-400"
                : priority === "medium" ? "bg-amber-500/20 text-amber-400"
                : "bg-zinc-700 text-zinc-400"
              )}>
                {priority.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold">{platform}</p>
                  <span className="text-[10px] text-muted-foreground border border-border/50 px-1.5 rounded">
                    {format}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{tip}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 90-day roadmap */}
      <SectionCard
        icon={RefreshCw}
        iconColor="bg-teal-600"
        title="90-Day Growth Roadmap"
        subtitle="A simple phased plan from launch to scale"
      >
        <div className="mt-4 space-y-4">
          {[
            {
              phase: "Phase 1 — Days 1–30",
              color: "text-primary",
              border: "border-primary/30 bg-primary/5",
              goals: [
                "Create 30 reels — one per day, rotate all 6 content pillars",
                "Test 3 different fonts and 3 templates — see what gets the most saves",
                "Post daily to Instagram Reels + TikTok at 7am local time",
                "Target: 500 followers, 50 saves per post",
              ],
            },
            {
              phase: "Phase 2 — Days 31–60",
              color: "text-purple-400",
              border: "border-purple-500/30 bg-purple-500/5",
              goals: [
                "Scale to 2 reels/day — repurpose high-performing content with new templates",
                "Add YouTube Shorts + Pinterest to your posting stack",
                "Build your first 'themed week' series (e.g., Stoic Week, Love Week)",
                "Target: 2K followers, identify your top 5 performing quote categories",
              ],
            },
            {
              phase: "Phase 3 — Days 61–90",
              color: "text-emerald-400",
              border: "border-emerald-500/30 bg-emerald-500/5",
              goals: [
                "Launch custom-branded series with consistent template + font + sound",
                "Set up scheduling — pre-create 2 weeks of reels and schedule them",
                "Explore monetization: digital products, brand deals, affiliate quotes",
                "Target: 10K followers, consistent 1K+ views per reel",
              ],
            },
          ].map(({ phase, color, border, goals }) => (
            <div key={phase} className={cn("rounded-lg border p-4", border)}>
              <p className={cn("text-xs font-bold mb-2", color)}>{phase}</p>
              <ul className="space-y-1">
                {goals.map((g, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-current mt-0.5 flex-shrink-0 opacity-60" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="h-8" />
    </div>
  );
}
