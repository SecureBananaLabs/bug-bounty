import { z } from "zod/v4";
import { createAgentApp } from "@lucid-dreams/agent-kit";
import { serve } from "@hono/node-server";

const payToAddress = "66dG5r5TD37ahhrsAMKUroxML9Cqto5jRduifiMgQQ3G";

const { app, addEntrypoint } = createAgentApp(
  {
    name: "poem-agent",
    version: "1.0.0",
    description: "Generates original technical poems about software engineering and computer science.",
  }
);

const poemGenerators: Record<string, { title: string; stanzas: string[] }> = {
  "the-agents-code": {
    title: "The Agent's Code",
    stanzas: [
      `A prompt descends through winding halls of thought,\nWhere tokens flicker, patterns interweave.\nNo single mind the final answer wrought,\nBut many paths the hidden truth perceive.`,
      `The vector space, a lattice without end,\nHolds meanings that no human tongue can speak.\nThe weights are tuned, the boundaries extend,\nAs backprop seeks the gradient we seek.`,
      `So trust the craft but question every frame,\nFor certainty is but a fragile glow.\nThe agent's code is never quite the same\u2014\nIt learns, adapts, and lets the learning grow.`,
    ],
  },
  "zero-knowledge": {
    title: "Zero-Knowledge Proof",
    stanzas: [
      `I have a truth, yet show you not the key,\nYou verify the lock without the door.\nThe protocol ensures you trust in me\nWhile keeping what I know forever pure.`,
      `The witness hides within the blinded round,\nThe challenge binds the prover to their claim.\nNo secret ever leaves the sacred ground,\nYet proof arrives, undeniable and plain.`,
      `So runs the chain, immutable and vast,\nWhere trust is etched in math, not in a name.\nThe future's ledger, liberated from the past,\nRewrites the ancient rules of power and fame.`,
    ],
  },
  "pixels-and-prose": {
    title: "Pixels and Prose",
    stanzas: [
      `In circuits deep where silicon dreams are born,\nA pixel waits, a single point of light.\nFrom ones and zeros, images are torn\nTo grace the screen and satisfy the sight.`,
      `The artist's hand is now a function call,\nThe palette chosen by a typed request.\nThe canvas yields, no brush nor paint at all,\nJust structured data put to honest test.`,
      `Yet beauty lives in algorithm's art\u2014\nNot less because a machine drew the line.\nThe human spirit plays a novel part:\nDesign the dream, then let the code define.`,
    ],
  },
  "the-bug-and-the-bounty": {
    title: "The Bug and the Bounty",
    stanzas: [
      `A silent flaw within the code repos,\nA crack where edge cases find their way.\nThe bounty calls\u2014whoever finds the close\nMay claim the prize and make the system sway.`,
      `The hunter searches through the tangled graph,\nWith each commit a deeper truth revealed.\nThe patch arrives, a cryptographic laugh\u2014\nA broken lock is now forever sealed.`,
      `So let the bounty serve the public good,\nReward the eyes that pierce the darkest flaw.\nFor open source, by many understood,\nGrows stronger every time its wisdoms gnaw.`,
    ],
  },
};

addEntrypoint({
  key: "generate-poem",
  description: "Generate an original technical poem about computing, code, or cryptography.",
  input: z.object({
    theme: z.string().optional().default("the-agents-code"),
    style: z.enum(["classical", "free-verse"]).optional().default("classical"),
  }),
  handler: async (ctx) => {
    const { theme, style } = ctx.input as { theme: string; style: string };

    const generator = poemGenerators[theme];
    if (!generator) {
      const available = Object.keys(poemGenerators);
      return {
        output: {
          error: `Unknown theme "${theme}". Available: ${available.join(", ")}`,
          available_themes: available,
        },
        usage: { total_tokens: 0 },
      };
    }

    const poem = generator.stanzas.join("\n\n");
    const fullText = `# ${generator.title}\n\n${poem}`;

    return {
      output: {
        title: generator.title,
        poem,
        full_text: fullText,
        stanzas: generator.stanzas.length,
        theme,
        style,
      },
      usage: { total_tokens: fullText.length },
    };
  },
});

addEntrypoint({
  key: "themes",
  description: "List available poem themes.",
  input: undefined,
  handler: async () => ({
    output: {
      themes: Object.entries(poemGenerators).map(([key, val]) => ({
        id: key,
        title: val.title,
        stanzas: val.stanzas.length,
      })),
    },
    usage: { total_tokens: 0 },
  }),
});

export default app;

const port = parseInt(process.env.PORT || "3457", 10);
console.log(`\n📝 Poem Agent v1.0.0 running on http://0.0.0.0:${port}`);
console.log(`💰 Pay-to: ${payToAddress}\n`);
serve({ fetch: app.fetch, port });
