#!/usr/bin/env python3
"""
Technical Poem Generator for Bounty Reports

Generates technical poems from code/security topics using simple templates.
Can be used to create engaging documentation, README headers, or bounty submissions.

Usage:
    python3 poem_generator.py --topic "buffer overflow" --style sonnet
    python3 poem_generator.py --topic "smart contract reentrancy" --output reentrancy.md
    python3 poem_generator.py --topic "fuzzing ethereum" --count 3
"""

import argparse, random

TEMPLATES = {
    "sonnet": [
        "In {topic} we find the flaw,",
        "Where {adj1} code and {adj2} logic meet,",
        "The hunter's eye, with {adj3} awe,",
        "Doth find the bug that makes the system {verb}.",
        "",
        "Through {noun1} and {noun2} we trace,",
        "The {adj4} path to {noun3} and back,",
        "Each {noun4} a clue, each test a {noun5},",
        "To find the {adj5} flaw, the {adj6} track.",
        "",
        "So here's to those who hunt and find,",
        "Who secure the code that runs behind."
    ],
    "ode": [
        "O {topic}! Thy {adj1} presence haunts the code,",
        "Where {noun1} and {noun2} intertwine,",
        "The {adj2} hunter, with {adj3} probe,",
        "Doth seek the bug that makes the system {verb}.",
        "",
        "Through {noun3} deep and {noun4} wide,",
        "We trace the {adj4} path to {noun5},",
        "Each {noun6} a step, each test a {noun7},",
        "To find the {adj5} flaw, the {adj6} {noun8}.",
        "",
        "Thy beauty lies in {noun9} and {adj7} {noun10},",
        "O {topic}, we hail thy {adj8} name!"
    ],
    "haiku": [
        "{topic} in the code",
        "{adj1} {noun1} reveals the way",
        "Bug found, system {verb}"
    ]
}

WORDS = {
    "adj1": ["silent", "deadly", "hidden", "subtle", "clever", "deep", "dark", "bright"],
    "adj2": ["complex", "twisted", "elegant", "broken", "ancient", "modern", "fast", "slow"],
    "adj3": ["keen", "sharp", "patient", "wild", "calm", "fierce", "brave", "bold"],
    "adj4": ["long", "winding", "short", "steep", "shallow", "deep", "dark", "bright"],
    "adj5": ["hidden", "deadly", "silent", "loud", "clear", "dark", "bright", "faint"],
    "adj6": ["dangerous", "safe", "unknown", "known", "lost", "found", "broken", "whole"],
    "adj7": ["strange", "beautiful", "terrible", "wonderful", "quick", "slow", "bright", "dark"],
    "adj8": ["glorious", "terrible", "mighty", "humble", "bright", "dark", "wise", "foolish"],
    "noun1": ["memory", "buffer", "stack", "heap", "function", "variable", "loop", "thread"],
    "noun2": ["pointer", "array", "struct", "class", "object", "interface", "protocol", "algorithm"],
    "noun3": ["root", "core", "heart", "soul", "mind", "body", "spirit", "essence"],
    "noun4": ["path", "road", "way", "track", "trail", "journey", "voyage", "quest"],
    "noun5": ["truth", "beauty", "wisdom", "power", "grace", "love", "hate", "fate"],
    "noun6": ["step", "move", "turn", "leap", "fall", "rise", "break", "mend"],
    "noun7": ["gift", "curse", "blessing", "burden", "hope", "fear", "joy", "pain"],
    "noun8": ["path", "way", "road", "track", "trail", "journey", "voyage", "quest"],
    "noun9": ["mystery", "wonder", "terror", "beauty", "chaos", "order", "light", "dark"],
    "noun10": ["name", "face", "voice", "touch", "smell", "taste", "sight", "sound"],
    "verb": ["crash", "burn", "fall", "rise", "break", "mend", "live", "die", "sing", "weep"]
}

def generate_poem(topic, style="sonnet"):
    """Generate a poem based on topic and style."""
    template = TEMPLATES.get(style, TEMPLATES["sonnet"])
    random.seed(hash(topic) % (2**32))
    
    poem = []
    for line in template:
        # Replace placeholders
        for key in WORDS:
            placeholder = "{" + key + "}"
            if placeholder in line:
                val = random.choice(WORDS[key])
                line = line.replace(placeholder, val)
        line = line.replace("{topic}", topic)
        poem.append(line)
    
    return "\n".join(poem)

def main():
    parser = argparse.ArgumentParser(description="Generate technical poems")
    parser.add_argument("--topic", required=True, help="Technical topic")
    parser.add_argument("--style", default="sonnet", choices=["sonnet", "ode", "haiku"])
    parser.add_argument("--count", type=int, default=1, help="Number of poems to generate")
    parser.add_argument("--output", help="Output file (Markdown)")
    
    args = parser.parse_args()
    
    poems = []
    for i in range(args.count):
        poem = generate_poem(args.topic, args.style)
        poems.append(f"## Poem {i+1}: {args.topic} ({args.style})\n\n```\n{poem}\n```\n")
    
    output = "# Technical Poems\n\n" + "\n---\n\n".join(poems)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"✅ Saved {args.count} poem(s) to {args.output}")
    else:
        print(output)

if __name__ == "__main__":
    main()
