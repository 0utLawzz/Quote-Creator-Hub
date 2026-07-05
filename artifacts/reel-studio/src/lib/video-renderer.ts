export interface VideoTemplate {
  bgColor: string;
  textColor: string;
  accentColor: string;
}

export type TransitionEffect = "fade" | "slide-up" | "slide-left" | "zoom" | "blur";
export type QualityPreset = "720p" | "1080p" | "2K";

export interface VideoConfig {
  quote: string;
  author: string;
  category: string;
  template: VideoTemplate;
  fontFamily: string;
  brandName: string;
  logoUrl?: string;          // uploaded logo image for branding scene
  bgImageUrl?: string;
  bgVideoUrl?: string;
  audioUrl?: string;         // background music (object URL or remote URL)
  audioVolume?: number;      // 0.0 – 1.0, default 0.7
  transition?: TransitionEffect; // scene transition style, default "fade"
  duration?: number;         // total ms, default 15000
  quality?: QualityPreset;   // output resolution, default "1080p"
  onProgress?: (pct: number) => void;
}

export const TRANSITION_EFFECTS: { id: TransitionEffect; label: string; desc: string }[] = [
  { id: "fade",       label: "Cross-Fade",  desc: "Smooth alpha blend" },
  { id: "slide-up",   label: "Slide Up",    desc: "Scenes rise in" },
  { id: "slide-left", label: "Slide Left",  desc: "Horizontal sweep" },
  { id: "zoom",       label: "Zoom",        desc: "Subtle scale push" },
  { id: "blur",       label: "Blur",        desc: "Focus pull" },
];

export const DURATION_PRESETS = [
  { value: 15000,  label: "15s" },
  { value: 30000,  label: "30s" },
  { value: 60000,  label: "60s" },
];

export const QUALITY_PRESETS: { id: QualityPreset; label: string; width: number; height: number; bitrate: number; note: string }[] = [
  { id: "720p",  label: "720p",  width: 720,  height: 1280, bitrate: 4_000_000,  note: "Fast export" },
  { id: "1080p", label: "1080p", width: 1080, height: 1920, bitrate: 8_000_000,  note: "Standard" },
  { id: "2K",    label: "2K",    width: 1440, height: 2560, bitrate: 16_000_000, note: "High quality" },
];

// ── Scene timing (proportional to total duration) ──────────────────────────
interface SceneTiming {
  scene: "category" | "quote" | "author" | "branding";
  fadeIn: number;
  peakStart: number;
  peakEnd: number;
  fadeOut: number;
}

function buildTimings(total: number): SceneTiming[] {
  const fade = Math.min(500, total * 0.03);
  const t1 = total * 0.20; // end of scene 1
  const t2 = total * 0.50; // end of scene 2
  const t3 = total * 0.75; // end of scene 3
  return [
    { scene: "category", fadeIn: 0,       peakStart: fade,       peakEnd: t1 - fade,     fadeOut: t1 },
    { scene: "quote",    fadeIn: t1 - fade, peakStart: t1 + fade * 0.5, peakEnd: t2 - fade, fadeOut: t2 },
    { scene: "author",   fadeIn: t2 - fade, peakStart: t2 + fade * 0.5, peakEnd: t3 - fade, fadeOut: t3 },
    { scene: "branding", fadeIn: t3 - fade, peakStart: t3 + fade * 0.5, peakEnd: total - fade * 0.5, fadeOut: total },
  ];
}

function getAlpha(t: SceneTiming, ms: number): number {
  if (ms < t.fadeIn || ms > t.fadeOut) return 0;
  if (ms < t.peakStart) return (ms - t.fadeIn) / (t.peakStart - t.fadeIn);
  if (ms <= t.peakEnd) return 1;
  return 1 - (ms - t.peakEnd) / (t.fadeOut - t.peakEnd);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Transition transforms ──────────────────────────────────────────────────
function applyTransition(
  ctx: CanvasRenderingContext2D,
  timing: SceneTiming,
  ms: number,
  transition: TransitionEffect,
  alpha: number,
  W: number,
  H: number
) {
  if (transition === "fade") return; // globalAlpha handled by caller

  const isEntering = ms < timing.peakStart && alpha < 1;
  const isExiting = ms > timing.peakEnd && alpha < 1;

  switch (transition) {
    case "slide-up": {
      const offset = H * 0.06;
      if (isEntering) ctx.translate(0, offset * (1 - alpha));
      else if (isExiting) ctx.translate(0, -offset * (1 - alpha));
      break;
    }
    case "slide-left": {
      const offset = W * 0.06;
      if (isEntering) ctx.translate(-offset * (1 - alpha), 0);
      else if (isExiting) ctx.translate(offset * (1 - alpha), 0);
      break;
    }
    case "zoom": {
      const sf = isEntering ? (0.93 + 0.07 * alpha) : isExiting ? (1 + 0.04 * (1 - alpha)) : 1;
      ctx.translate(W / 2, H / 2);
      ctx.scale(sf, sf);
      ctx.translate(-W / 2, -H / 2);
      break;
    }
    case "blur": {
      const px = isEntering ? 14 * (1 - alpha) : isExiting ? 14 * (1 - alpha) : 0;
      if (px > 0.5) ctx.filter = `blur(${px.toFixed(1)}px)`;
      break;
    }
  }
}

// ── Background ──────────────────────────────────────────────────────────────
function drawBackground(
  ctx: CanvasRenderingContext2D,
  cfg: VideoConfig,
  bgImg: HTMLImageElement | null,
  bgVid: HTMLVideoElement | null,
  W: number,
  H: number
) {
  if (bgImg) {
    const ar = bgImg.naturalWidth / bgImg.naturalHeight;
    const cr = W / H;
    let sw = bgImg.naturalWidth, sh = bgImg.naturalHeight, sx = 0, sy = 0;
    if (ar > cr) { sw = sh * cr; sx = (bgImg.naturalWidth - sw) / 2; }
    else { sh = sw / cr; sy = (bgImg.naturalHeight - sh) / 2; }
    ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
  } else if (bgVid) {
    ctx.drawImage(bgVid, 0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = cfg.template.bgColor;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawAccentBars(ctx: CanvasRenderingContext2D, cfg: VideoConfig, W: number, H: number) {
  ctx.fillStyle = cfg.template.accentColor;
  ctx.fillRect(0, 0, W, 8);
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha *= 0.5;
  ctx.fillRect(0, H - 8, W, 8);
  ctx.globalAlpha = prevAlpha;
}

// ── Scene drawing ──────────────────────────────────────────────────────────
function drawCategoryScene(ctx: CanvasRenderingContext2D, cfg: VideoConfig, W: number, H: number) {
  const cx = W / 2;
  const cy = H / 2;
  const [ar, ag, ab] = hexToRgb(cfg.template.accentColor);

  ctx.strokeStyle = cfg.template.accentColor;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(120, cy - 200); ctx.lineTo(W - 120, cy - 200); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(120, cy + 200); ctx.lineTo(W - 120, cy + 200); ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.4)`;
  ctx.beginPath(); ctx.moveTo(120, cy - 185); ctx.lineTo(W - 120, cy - 185); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(120, cy + 185); ctx.lineTo(W - 120, cy + 185); ctx.stroke();

  ctx.font = `600 ${36 * (W / 1080)}px "Outfit", sans-serif`;
  ctx.fillStyle = `rgba(${ar},${ag},${ab},0.7)`;
  ctx.textAlign = "center";
  ctx.fillText("CATEGORY", cx, cy - 260);

  const catText = cfg.category.toUpperCase();
  const fontSize = Math.min(200, Math.floor(1600 / (catText.length * 0.6))) * (W / 1080);
  ctx.font = `900 ${fontSize}px ${cfg.fontFamily}`;
  ctx.fillStyle = cfg.template.textColor;
  ctx.textBaseline = "middle";
  ctx.fillText(catText, cx, cy);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = cfg.template.accentColor;
  const dotSpacing = 28 * (W / 1080);
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * dotSpacing, cy + 250, (i === 0 ? 7 : 4) * (W / 1080), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawQuoteScene(ctx: CanvasRenderingContext2D, cfg: VideoConfig, W: number, H: number) {
  const cx = W / 2;
  const cy = H / 2;
  const scale = W / 1080;
  const [ar, ag, ab] = hexToRgb(cfg.template.accentColor);

  ctx.font = `900 ${400 * scale}px Georgia, serif`;
  ctx.fillStyle = `rgba(${ar},${ag},${ab},0.12)`;
  ctx.textBaseline = "top";
  ctx.fillText("\u201C", 60 * scale, 80 * scale);
  ctx.textBaseline = "alphabetic";

  ctx.textAlign = "right";
  ctx.fillText("\u201D", W - 60 * scale, H - 200 * scale);
  ctx.textAlign = "center";

  const isLong = cfg.quote.length > 100;
  const fontSize = (isLong ? 62 : cfg.quote.length > 60 ? 76 : 88) * scale;
  ctx.font = `500 ${fontSize}px ${cfg.fontFamily}`;
  ctx.fillStyle = cfg.template.textColor;
  ctx.textBaseline = "middle";

  const maxWidth = W - 240 * scale;
  const lines = wrapText(ctx, `\u201C${cfg.quote}\u201D`, maxWidth);
  const lineHeight = fontSize * 1.55;
  const totalH = lines.length * lineHeight;
  const startY = cy - totalH / 2;

  lines.forEach((line, i) => { ctx.fillText(line, cx, startY + i * lineHeight); });
  ctx.textBaseline = "alphabetic";

  ctx.strokeStyle = cfg.template.accentColor;
  ctx.lineWidth = 3 * scale;
  const lineY = startY + totalH + 60 * scale;
  ctx.beginPath(); ctx.moveTo(cx - 80 * scale, lineY); ctx.lineTo(cx + 80 * scale, lineY); ctx.stroke();
}

function drawAuthorScene(ctx: CanvasRenderingContext2D, cfg: VideoConfig, W: number, H: number) {
  const cx = W / 2;
  const cy = H / 2;
  const scale = W / 1080;
  const [ar, ag, ab] = hexToRgb(cfg.template.accentColor);

  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.5)`;
  ctx.lineWidth = 3 * scale;
  ctx.beginPath(); ctx.moveTo(cx, cy - 280 * scale); ctx.lineTo(cx, cy - 160 * scale); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + 160 * scale); ctx.lineTo(cx, cy + 280 * scale); ctx.stroke();

  ctx.font = `400 ${38 * scale}px "Outfit", sans-serif`;
  ctx.fillStyle = `rgba(${ar},${ag},${ab},0.8)`;
  ctx.textAlign = "center";
  ctx.fillText("— WORDS BY —", cx, cy - 100 * scale);

  const authorDisplay = cfg.author || "Unknown";
  const authorFontSize = Math.min(120, Math.floor(1200 / (authorDisplay.length * 0.55))) * scale;
  ctx.font = `700 ${authorFontSize}px ${cfg.fontFamily}`;
  ctx.fillStyle = cfg.template.textColor;
  ctx.textBaseline = "middle";
  ctx.fillText(authorDisplay, cx, cy + 20 * scale);
  ctx.textBaseline = "alphabetic";

  const badgeText = cfg.category.toUpperCase();
  ctx.font = `600 ${34 * scale}px "Outfit", sans-serif`;
  const badgeW = ctx.measureText(badgeText).width + 60 * scale;
  ctx.fillStyle = `rgba(${ar},${ag},${ab},0.15)`;
  ctx.beginPath();
  ctx.roundRect(cx - badgeW / 2, cy + 110 * scale, badgeW, 56 * scale, 28 * scale);
  ctx.fill();
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.4)`;
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  ctx.fillStyle = cfg.template.accentColor;
  ctx.fillText(badgeText, cx, cy + 148 * scale);
}

function drawBrandingScene(
  ctx: CanvasRenderingContext2D,
  cfg: VideoConfig,
  logoImg: HTMLImageElement | null,
  W: number,
  H: number
) {
  const cx = W / 2;
  const cy = H / 2;
  const scale = W / 1080;
  const [ar, ag, ab] = hexToRgb(cfg.template.accentColor);

  // Decorative circles
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.15)`;
  ctx.lineWidth = 2 * scale;
  ctx.beginPath(); ctx.arc(cx, cy, 380 * scale, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.08)`;
  ctx.lineWidth = 1 * scale;
  ctx.beginPath(); ctx.arc(cx, cy, 340 * scale, 0, Math.PI * 2); ctx.stroke();

  // Logo frame (120×120 box)
  const boxSize = 120 * scale;
  const boxX = cx - boxSize / 2;
  const boxY = cy - 220 * scale;

  if (logoImg) {
    // Draw logo image clipped to rounded square
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxSize, boxSize, 16 * scale);
    ctx.clip();
    // Cover-fit the logo
    const lr = logoImg.naturalWidth / logoImg.naturalHeight;
    let sx = 0, sy = 0, sw = logoImg.naturalWidth, sh = logoImg.naturalHeight;
    if (lr > 1) { sw = sh; sx = (logoImg.naturalWidth - sw) / 2; }
    else if (lr < 1) { sh = sw; sy = (logoImg.naturalHeight - sh) / 2; }
    ctx.drawImage(logoImg, sx, sy, sw, sh, boxX, boxY, boxSize, boxSize);
    ctx.restore();
    // Border ring
    ctx.strokeStyle = cfg.template.accentColor;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxSize, boxSize, 16 * scale);
    ctx.stroke();
  } else {
    // Default play-icon box
    ctx.fillStyle = cfg.template.accentColor;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxSize, boxSize, 16 * scale);
    ctx.fill();
    ctx.fillStyle = cfg.template.bgColor;
    ctx.beginPath();
    const px = cx - 18 * scale, py = cy - 160 * scale;
    ctx.moveTo(px, py - 22 * scale);
    ctx.lineTo(px + 46 * scale, py);
    ctx.lineTo(px, py + 22 * scale);
    ctx.closePath();
    ctx.fill();
  }

  // Brand name
  const brand = (cfg.brandName || "REEL STUDIO").toUpperCase();
  ctx.font = `900 ${90 * scale}px "Outfit", sans-serif`;
  ctx.fillStyle = cfg.template.textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(brand, cx, cy + 30 * scale);
  ctx.textBaseline = "alphabetic";

  // Tagline
  ctx.font = `300 ${38 * scale}px "Outfit", sans-serif`;
  ctx.fillStyle = `rgba(${ar},${ag},${ab},0.8)`;
  ctx.fillText("CINEMATIC QUOTE REELS", cx, cy + 120 * scale);

  // Bottom rule
  ctx.strokeStyle = cfg.template.accentColor;
  ctx.lineWidth = 3 * scale;
  const ruleY = cy + 185 * scale;
  ctx.beginPath(); ctx.moveTo(cx - 120 * scale, ruleY); ctx.lineTo(cx + 120 * scale, ruleY); ctx.stroke();
}

// ── Main frame draw ────────────────────────────────────────────────────────
function drawFrame(
  ctx: CanvasRenderingContext2D,
  ms: number,
  cfg: VideoConfig,
  bgImg: HTMLImageElement | null,
  bgVid: HTMLVideoElement | null,
  logoImg: HTMLImageElement | null,
  timings: SceneTiming[],
  transition: TransitionEffect,
  W: number,
  H: number
) {
  ctx.clearRect(0, 0, W, H);

  for (const timing of timings) {
    const alpha = getAlpha(timing, ms);
    if (alpha <= 0) continue;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.filter = "none";

    applyTransition(ctx, timing, ms, transition, alpha, W, H);
    drawBackground(ctx, cfg, bgImg, bgVid, W, H);
    ctx.filter = "none"; // reset after blur transform
    drawAccentBars(ctx, cfg, W, H);

    switch (timing.scene) {
      case "category": drawCategoryScene(ctx, cfg, W, H); break;
      case "quote":    drawQuoteScene(ctx, cfg, W, H); break;
      case "author":   drawAuthorScene(ctx, cfg, W, H); break;
      case "branding": drawBrandingScene(ctx, cfg, logoImg, W, H); break;
    }

    ctx.restore();
  }
}

// ── Audio helper ────────────────────────────────────────────────────────────
async function setupAudio(
  audioUrl: string,
  volume: number,
  loop: boolean
): Promise<{ audioCtx: AudioContext; destination: MediaStreamAudioDestinationNode; start: () => void; stop: () => void }> {
  const audioCtx = new AudioContext({ sampleRate: 44100 });
  const destination = audioCtx.createMediaStreamDestination();
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await audioCtx.decodeAudioData(arrayBuffer);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  const gain = audioCtx.createGain();
  gain.gain.value = Math.max(0, Math.min(1, volume));
  source.connect(gain);
  gain.connect(destination);
  return {
    audioCtx,
    destination,
    start: () => source.start(),
    stop: () => { try { source.stop(); } catch {} },
  };
}

// ── Public render function ──────────────────────────────────────────────────
export async function renderVideo(cfg: VideoConfig): Promise<Blob> {
  await document.fonts.ready;

  const qualityDef = QUALITY_PRESETS.find((q) => q.id === (cfg.quality ?? "1080p")) ?? QUALITY_PRESETS[1];
  const W = qualityDef.width;
  const H = qualityDef.height;
  const TOTAL_MS = cfg.duration ?? 15000;
  const transition = cfg.transition ?? "fade";

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const timings = buildTimings(TOTAL_MS);

  // Load background image
  let bgImg: HTMLImageElement | null = null;
  if (cfg.bgImageUrl) {
    bgImg = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = cfg.bgImageUrl!;
    });
  }

  // Load background video
  let bgVid: HTMLVideoElement | null = null;
  if (cfg.bgVideoUrl && !cfg.bgImageUrl) {
    bgVid = await new Promise<HTMLVideoElement>((res, rej) => {
      const v = document.createElement("video");
      v.muted = true; v.loop = true; v.playsInline = true;
      v.crossOrigin = "anonymous";
      v.oncanplaythrough = () => res(v);
      v.onerror = rej;
      v.src = cfg.bgVideoUrl!;
      v.load();
    });
    bgVid.play().catch(() => {});
  }

  // Load logo image
  let logoImg: HTMLImageElement | null = null;
  if (cfg.logoUrl) {
    logoImg = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = () => res(null as unknown as HTMLImageElement); // soft fail
      img.src = cfg.logoUrl!;
    });
  }

  // Setup audio (optional)
  let audioSetup: Awaited<ReturnType<typeof setupAudio>> | null = null;
  let videoStream = canvas.captureStream(60);

  if (cfg.audioUrl && typeof AudioContext !== "undefined") {
    try {
      audioSetup = await setupAudio(cfg.audioUrl, cfg.audioVolume ?? 0.7, true);
    } catch (err) {
      console.warn("Audio setup failed, continuing without audio:", err);
    }
  }

  // Build MediaStream (with or without audio)
  const tracks = [...videoStream.getVideoTracks()];
  if (audioSetup) {
    tracks.push(...audioSetup.destination.stream.getAudioTracks());
  }
  const combinedStream = new MediaStream(tracks);

  // Choose mime type
  const withAudio = audioSetup !== null;
  const mimeType = withAudio
    ? (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm")
    : (MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm");

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: qualityDef.bitrate,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      bgVid?.pause();
      audioSetup?.stop();
      audioSetup?.audioCtx.close();
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
    recorder.onerror = reject;

    recorder.start(100);
    audioSetup?.start();

    const startWall = performance.now();

    function tick() {
      const ms = performance.now() - startWall;
      if (ms >= TOTAL_MS) {
        drawFrame(ctx, TOTAL_MS, cfg, bgImg, bgVid, logoImg, timings, transition, W, H);
        recorder.stop();
        return;
      }
      drawFrame(ctx, ms, cfg, bgImg, bgVid, logoImg, timings, transition, W, H);
      cfg.onProgress?.(Math.min(99, Math.round((ms / TOTAL_MS) * 100)));
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

export const FONTS = [
  { id: "playfair",  name: "Playfair Display", family: '"Playfair Display", serif',    style: "Elegant Serif" },
  { id: "outfit",    name: "Outfit",            family: '"Outfit", sans-serif',         style: "Modern Sans" },
  { id: "montserrat",name: "Montserrat",        family: '"Montserrat", sans-serif',     style: "Clean Sans" },
  { id: "lora",      name: "Lora",              family: '"Lora", serif',                style: "Literary Serif" },
  { id: "oswald",    name: "Oswald",            family: '"Oswald", sans-serif',         style: "Bold Display" },
  { id: "bebas",     name: "Bebas Neue",        family: '"Bebas Neue", sans-serif',     style: "Impact Display" },
  { id: "cinzel",    name: "Cinzel",            family: '"Cinzel", serif',              style: "Classical" },
  { id: "dancing",   name: "Dancing Script",    family: '"Dancing Script", cursive',    style: "Script" },
];
