from pathlib import Path
from PIL import Image

def create_pixel_art_artifact():
    # 1. Define the submission path per acceptance criteria
    # Using Path for robust handling of /assets/pixel-art/
    output_directory = Path("/assets/pixel-art")
    output_filename = "pixel_art_submission.png"
    target_path = output_directory / output_filename

    # 2. Ensure the directory structure exists without error
    output_directory.mkdir(parents=True, exist_ok=True)

    # 3. Create the canvas: Min size 64x64
    # Using 'RGBA' mode for superior color manipulation on low-res pixels
    width, height = 64, 64
    # Starting with a 'soft' background color
    canvas = Image.new("RGBA", (width, height), color="#F5F5F5")

    # 4. High Creative Thinking Implementation:
    # Instead of a flat fill, use a radial distance logic to simulate 
    # a 'blob' or 'orb' which translates well to 64x64 pixel constraints.
    pixels = canvas.load()
    
    # Color palette for a retro, digital feel
    colors = {
        "core":      (240, 190, 50, 255),  # Golden Yellow
        "mid":       (180, 140, 40, 255),  # Deeper Gold
        "outline":   (100, 80, 30, 255),   # Darker Gold
        "background": (255, 255, 255, 255)  # Pure White
    }

    # 5. Draw the shape logic across the grid
    center_x, center_y = 32, 32
    max_radius = 30 # Ensures the shape fills the 64x64 nicely

    for y in range(height):
        for x in range(width):
            # Calculate Euclidean distance from center
            # Using a slightly non-linear distance for "pixelated" softness
            dist = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
            
            # Assign colors based on proximity to center
            if dist < 16:
                pixels[x, y] = colors["core"]
            elif dist < 24:
                pixels[x, y] = colors["mid"]
            elif dist < 32:
                pixels[x, y] = colors["outline"]
            # Default background is already set, so logic covers most of it
            else:
                pixels[x, y] = colors["background"]

    # 6. Save the file in the specific directory
    canvas.save(str(target_path))
    return target_path

# Entry point to run the generation script
if __name__ == "__main__":
    file_located = create_pixel_art_artifact()
    print(f"Art generated at: {file_located}")