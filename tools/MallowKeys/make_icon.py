#!/usr/bin/env python3
"""Create the MallowKeys tray/application icon."""
from PIL import Image, ImageDraw

SIZE = 256
image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

# soft drop shadow
draw.rounded_rectangle((25, 34, 231, 244), radius=62, fill=(92, 58, 66, 38))
# keycap body gradient
for i in range(180):
    t = i / 179.0
    r = int(242 - 18 * t)
    g = int(190 - 55 * t)
    b = int(201 - 42 * t)
    draw.rounded_rectangle(
        (20 + i // 9, 24 + i // 9, 236 - i // 9, 240 - i // 9),
        radius=56 - i // 7,
        fill=(r, g, b, 255),
    )

# top face
draw.rounded_rectangle((48, 46, 208, 214), radius=34, fill=(255, 245, 233, 245))
draw.rounded_rectangle((62, 58, 194, 202), radius=27, fill=(255, 250, 241, 255))

# little star
cx, cy = 128, 130
points = []
import math

for i in range(10):
    radius = 42 if i % 2 == 0 else 18
    angle = -math.pi / 2 + i * math.pi / 5
    points.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))
draw.polygon(points, fill=(220, 111, 134, 255))

image.save("app.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("wrote app.ico")
