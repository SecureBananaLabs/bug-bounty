from pathlib import Path
from dataclasses import dataclass
from typing import List

@dataclass
class Stanza:
    lines: List[str]

    @property
    def block(self) -> str:
        return "\n".join(self.lines)

@dataclass
class TechnicalPoem:
    title: str
    stanzas: List[Stanza]

    @property
    def body(self) -> str:
        return "\n\n".join(s.block for s in self.stanzas)

    def rendered(self) -> str:
        return f"{self.title}\n\n{self.body}"

    def save_to_md(self, path: Path = None) -> None:
        if path is None:
            path = Path("POEM.md")
        path.write_text(self.rendered())

# Instantiate the specific poem object for the project
poem = TechnicalPoem(
    title="The Secure Banana's Lament",
    stanzas=[
        Stanza(lines=[
            "In silicon veins the data flows,",
            "Through logic streams and code-based rows,",
            "A rhythm strict, a beat machine,",
            "To fix the bug I've named this scene."
        ]),
        Stanza(lines=[
            "The syntax clean, the logic true,",
            "But Python code was calling you,",
            "Now markdown files must hold the grace,",
            "Of code that turns this text to space."
        ]),
        Stanza(lines=[
            "So here we write, in text and form,",
            "The script of lines, the Python storm,",
            "Three stanzas deep, the code is set,",
            "To make the repository complete."
        ])
    ]
)

if __name__ == "__main__":
    # Print to verify structure
    print(poem.rendered())
    # Save to disk to satisfy POEM.md criteria
    poem.save_to_md()