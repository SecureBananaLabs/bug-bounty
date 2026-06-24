const ui = await import("@freelanceflow/ui");

if (typeof ui.Button !== "function" || typeof ui.Card !== "function") {
  throw new Error("Expected @freelanceflow/ui to export Button and Card");
}

console.log(Object.keys(ui).sort().join(","));
