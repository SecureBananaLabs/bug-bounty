import { Router } from "express";

export const pixelRoutes = Router();

const pixelArt = [
  "....................",
  "......########......",
  "....##..####..##....",
  "...#..########..#...",
  "..#..##########..#..",
  "..#.############.#..",
  "..#.############.#..",
  "..#..##########..#..",
  "...#..########..#...",
  "....##..####..##....",
  "......########......",
  ".......######.......",
  "........####........",
  ".........####.......",
  "........######......",
  ".......##..##.......",
  "......##....##......",
  "...................."
];

// Represent the pixel art as an ASCII grid
pixelRoutes.get("/", (req, res) => {
  const ascii = pixelArt.join("\n");
  res.set("Content-Type", "text/plain");
  res.send(ascii);
});

pixelRoutes.get("/json", (req, res) => {
  res.json({
    success: true,
    data: {
      title: "Secure Banana Labs Pixel Art",
      width: 20,
      height: 18,
      grid: pixelArt,
      description: "ASCII pixel art representing the Secure Banana Labs logo"
    }
  });
});
