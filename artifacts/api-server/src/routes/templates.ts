import { Router } from "express";

const router = Router();

const TEMPLATES = [
  {
    id: "dark-gold",
    name: "Dark Gold",
    description: "Deep black with warm gold accents — timeless luxury",
    bgColor: "#0a0a0a",
    textColor: "#f5e6c8",
    accentColor: "#c9a84c",
    fontStyle: "serif",
  },
  {
    id: "midnight-purple",
    name: "Midnight Purple",
    description: "Deep indigo gradients with violet highlights",
    bgColor: "#0d0618",
    textColor: "#e8d5f5",
    accentColor: "#9b59b6",
    fontStyle: "sans-serif",
  },
  {
    id: "crimson-dark",
    name: "Crimson Night",
    description: "Rich dark red with white text — bold and passionate",
    bgColor: "#1a0505",
    textColor: "#fff5f5",
    accentColor: "#c0392b",
    fontStyle: "serif",
  },
  {
    id: "ocean-deep",
    name: "Ocean Deep",
    description: "Dark teal gradients with aqua accents",
    bgColor: "#020c12",
    textColor: "#d0f0f5",
    accentColor: "#1abc9c",
    fontStyle: "sans-serif",
  },
  {
    id: "rose-minimal",
    name: "Rose Minimal",
    description: "Soft blush white with dusty rose accents",
    bgColor: "#fdf6f0",
    textColor: "#2c1a1a",
    accentColor: "#c0736a",
    fontStyle: "serif",
  },
  {
    id: "forest-sage",
    name: "Forest Sage",
    description: "Muted sage greens with warm earthy tones",
    bgColor: "#0f1a0f",
    textColor: "#d8e8d0",
    accentColor: "#7ab87a",
    fontStyle: "sans-serif",
  },
  {
    id: "silver-slate",
    name: "Silver Slate",
    description: "Cool charcoal with silver chrome highlights",
    bgColor: "#111418",
    textColor: "#dde3ea",
    accentColor: "#8a9bb0",
    fontStyle: "sans-serif",
  },
  {
    id: "amber-warm",
    name: "Amber Warm",
    description: "Warm amber tones on deep brown — nostalgic and inviting",
    bgColor: "#120a00",
    textColor: "#f0d9a0",
    accentColor: "#e67e22",
    fontStyle: "serif",
  },
];

router.get("/templates", (req, res) => {
  res.json(TEMPLATES);
});

export default router;
