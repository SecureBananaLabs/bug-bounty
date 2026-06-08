def generate_poem():
    """
    Returns an original poem with three stanzas.
    Theme: the quiet rhythm of coding mirrored in nature.
    Form: free verse with stanza breaks.
    Tone: reflective and hopeful.
    """
    poem = (
        "In the hush before dawn, the silicon valley breathes,\n"
        "light spills over keyboards like soft gold over hills,\n"
        "each keystroke a step on a dewy path.\n\n"
        "Loops wind like rivers, recursive calls echo canyon walls,\n"
        "variables hold the scent of pine, functions bloom like wildflowers,\n"
        "the algorithm unfolds, patient as seasons turning.\n\n"
        "When night deepens and bugs glow like fireflies,\n"
        "we trace their flicker, patient, until insight ignites—\n"
        "a steady lantern guiding the code back to sunrise."
    )
    return poem


def write_poem_to_file(filename="POEM.md"):
    """Writes the generated poem to the specified file."""
    poem_content = generate_poem()
    with open(filename, "w", encoding="utf-8") as f:
        f.write(poem_content)
    print(f"Poem written to {filename}")


if __name__ == "__main__":
    # Example usage: generate and save the poem
    write_poem_to_file()
    # Optional: display the poem to verify
    print("\n--- Poem Preview ---\n")
    print(generate_poem())