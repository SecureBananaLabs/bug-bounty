from PIL import Image, ImageDraw
import random

# Create a 128x128 pixel art canvas
WIDTH, HEIGHT = 128, 128
img = Image.new('RGB', (WIDTH, HEIGHT))
draw = ImageDraw.Draw(img)

# Color palette - retro sunset theme
SKY_TOP = (25, 25, 80)        # Dark blue night sky
SKY_MID = (80, 40, 120)       # Purple twilight
SKY_BOT = (200, 80, 60)       # Orange sunset
SUN_TOP = (255, 200, 50)      # Yellow sun
SUN_BOT = (255, 100, 30)      # Orange sun
MOUNTAIN_DARK = (30, 30, 60)  # Dark mountain
MOUNTAIN_LIGHT = (60, 40, 80) # Light mountain
GROUND = (20, 40, 20)         # Dark green ground
TREE_TRUNK = (80, 50, 30)     # Brown trunk
TREE_LEAVES = (30, 100, 40)   # Green leaves
WATER = (20, 60, 100)         # Water color
STAR = (255, 255, 200)        # Star color

# Draw gradient sky
for y in range(HEIGHT // 2):
    ratio = y / (HEIGHT // 2)
    if ratio < 0.4:
        # Top part - dark blue to purple
        r = int(SKY_TOP[0] + (SKY_MID[0] - SKY_TOP[0]) * (ratio / 0.4))
        g = int(SKY_TOP[1] + (SKY_MID[1] - SKY_TOP[1]) * (ratio / 0.4))
        b = int(SKY_TOP[2] + (SKY_MID[2] - SKY_TOP[2]) * (ratio / 0.4))
    else:
        # Bottom part - purple to orange
        r = int(SKY_MID[0] + (SKY_BOT[0] - SKY_MID[0]) * ((ratio - 0.4) / 0.6))
        g = int(SKY_MID[1] + (SKY_BOT[1] - SKY_MID[1]) * ((ratio - 0.4) / 0.6))
        b = int(SKY_MID[2] + (SKY_BOT[2] - SKY_MID[2]) * ((ratio - 0.4) / 0.6))
    for x in range(WIDTH):
        img.putpixel((x, y), (r, g, b))

# Draw ground/water
for y in range(HEIGHT // 2, HEIGHT):
    for x in range(WIDTH):
        if y < HEIGHT // 2 + 20:
            # Water area with reflection
            ratio = (y - HEIGHT // 2) / 20
            r = int(WATER[0] + (SKY_BOT[0] - WATER[0]) * (1 - ratio) * 0.3)
            g = int(WATER[1] + (SKY_BOT[1] - WATER[1]) * (1 - ratio) * 0.3)
            b = int(WATER[2] + (SKY_BOT[2] - WATER[2]) * (1 - ratio) * 0.3)
            img.putpixel((x, y), (r, g, b))
        else:
            # Ground
            if random.random() < 0.1:
                img.putpixel((x, y), (GROUND[0] + 10, GROUND[1] + 15, GROUND[2] + 10))
            else:
                img.putpixel((x, y), GROUND)

# Draw sun (circle)
sun_x, sun_y = WIDTH // 2, HEIGHT // 2 - 15
sun_radius = 15
for y in range(sun_y - sun_radius, sun_y + sun_radius):
    for x in range(sun_x - sun_radius, sun_x + sun_radius):
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            dist = ((x - sun_x) ** 2 + (y - sun_y) ** 2) ** 0.5
            if dist <= sun_radius:
                ratio = (y - (sun_y - sun_radius)) / (2 * sun_radius)
                r = int(SUN_TOP[0] + (SUN_BOT[0] - SUN_TOP[0]) * ratio)
                g = int(SUN_TOP[1] + (SUN_BOT[1] - SUN_TOP[1]) * ratio)
                b = int(SUN_TOP[2] + (SUN_BOT[2] - SUN_TOP[2]) * ratio)
                img.putpixel((x, y), (r, g, b))

# Draw sun reflection on water
for y in range(HEIGHT // 2, HEIGHT // 2 + 30):
    for x in range(sun_x - 10, sun_x + 10):
        if 0 <= x < WIDTH:
            if random.random() < 0.4:
                ratio = (y - HEIGHT // 2) / 30
                brightness = int(200 * (1 - ratio))
                img.putpixel((x, y), (brightness, brightness // 2, brightness // 4))

# Draw mountains
def draw_mountain(x_center, height, width, color):
    for y in range(HEIGHT // 2 - height, HEIGHT // 2):
        x_range = int(width * (1 - (y - (HEIGHT // 2 - height)) / height))
        for x in range(x_center - x_range, x_center + x_range):
            if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                # Add some shading
                shade = 1.0 - 0.3 * ((y - (HEIGHT // 2 - height)) / height)
                r = int(color[0] * shade)
                g = int(color[1] * shade)
                b = int(color[2] * shade)
                img.putpixel((x, y), (r, g, b))

draw_mountain(30, 40, 50, MOUNTAIN_DARK)
draw_mountain(70, 35, 45, MOUNTAIN_LIGHT)
draw_mountain(100, 45, 55, MOUNTAIN_DARK)

# Draw a pixel tree
tree_x, tree_y = 20, HEIGHT // 2 - 5
# Trunk
for y in range(tree_y, tree_y + 15):
    for x in range(tree_x - 2, tree_x + 3):
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            img.putpixel((x, y), TREE_TRUNK)

# Leaves (triangle shape)
for i in range(15):
    y = tree_y - i
    width = 8 - i // 2
    for x in range(tree_x - width, tree_x + width + 1):
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            if random.random() < 0.8:
                img.putpixel((x, y), TREE_LEAVES)
            else:
                img.putpixel((x, y), (TREE_LEAVES[0] + 20, TREE_LEAVES[1] + 30, TREE_LEAVES[2] + 20))

# Draw stars in the sky
random.seed(42)  # For reproducibility
for _ in range(50):
    x = random.randint(0, WIDTH - 1)
    y = random.randint(0, HEIGHT // 3)
    if img.getpixel((x, y))[0] < 100:  # Only in dark areas
        img.putpixel((x, y), STAR)

# Draw a small house
house_x, house_y = 95, HEIGHT // 2 - 3
# House body
for y in range(house_y, house_y + 10):
    for x in range(house_x - 6, house_x + 7):
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            img.putpixel((x, y), (120, 80, 50))

# Roof
for i in range(8):
    y = house_y - i
    width = 8 - i
    for x in range(house_x - width, house_x + width + 1):
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            img.putpixel((x, y), (150, 40, 40))

# Window (glowing)
for y in range(house_y + 2, house_y + 5):
    for x in range(house_x - 3, house_x):
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            img.putpixel((x, y), (255, 200, 100))

# Door
for y in range(house_y + 3, house_y + 10):
    for x in range(house_x + 1, house_x + 4):
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            img.putpixel((x, y), (80, 50, 30))

# Save the image
img.save('/home/ubuntu/bug-bounty/assets/pixel-art/sunset_landscape.png')
print("Pixel art generated successfully!")
print(f"Image size: {WIDTH}x{HEIGHT} pixels")
