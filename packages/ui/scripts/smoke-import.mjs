const ui = await import("@freelanceflow/ui");

for (const exportName of ["Button", "Card"]) {
  if (typeof ui[exportName] !== "function") {
    throw new Error(`Expected @freelanceflow/ui to export ${exportName}`);
  }
}

console.log("@freelanceflow/ui import smoke test passed");
