#!/usr/bin/env python3
"""Generate PWA icons for QBIT Hub Engineer Portal."""

import os
from PIL import Image, ImageDraw, ImageFont

ICON_DIR = "/home/z/my-project/public/icons"
os.makedirs(ICON_DIR, exist_ok=True)

# Brand colors
PRIMARY = (0, 99, 155)      # #00639B
WHITE = (255, 255, 255)
SURFACE = (252, 251, 255)   # #FCFBFF

def make_icon(size: int, maskable: bool = False, filename: str = ""):
    """Create a branded icon at the given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        # Maskable icons need full-bleed background (no transparency in safe zone)
        draw.rectangle([0, 0, size, size], fill=PRIMARY)
        # Safe zone is inner 80% — put the "Q" mark there
        margin = int(size * 0.15)
    else:
        # Regular icon — rounded rect background
        margin = 0
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=size // 8, fill=PRIMARY)

    # Draw a "Q" letter in the center (QBIT branding)
    try:
        font_size = int(size * 0.55)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    # Calculate center position
    text = "Q"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2 - bbox[0]
    y = (size - text_h) // 2 - bbox[1]

    # Draw a subtle circle behind the Q for visual interest
    circle_margin = int(size * 0.18)
    draw.ellipse(
        [circle_margin, circle_margin, size - circle_margin, size - circle_margin],
        outline=WHITE,
        width=max(2, size // 64),
    )

    # Draw the Q
    draw.text((x, y), text, fill=WHITE, font=font)

    # Draw a small "tail" for the Q (diagonal line)
    tail_start = (int(size * 0.6), int(size * 0.6))
    tail_end = (int(size * 0.78), int(size * 0.78))
    draw.line([tail_start, tail_end], fill=WHITE, width=max(2, size // 48))

    output_path = os.path.join(ICON_DIR, filename)
    img.save(output_path, "PNG")
    print(f"  ✓ {filename} ({size}x{size})")
    return output_path


def make_shortcut_icon(name: str, symbol: str, bg_color: tuple, filename: str):
    """Create a 96x96 shortcut icon."""
    size = 96
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=size // 6, fill=bg_color)

    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
    except Exception:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), symbol, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2 - bbox[0]
    y = (size - text_h) // 2 - bbox[1]
    draw.text((x, y), symbol, fill=WHITE, font=font)

    output_path = os.path.join(ICON_DIR, filename)
    img.save(output_path, "PNG")
    print(f"  ✓ {filename} (shortcut)")


def make_apple_touch_icon():
    """Create 180x180 apple-touch-icon.png (no transparency, square)."""
    size = 180
    img = Image.new("RGB", (size, size), PRIMARY)
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 100)
    except Exception:
        font = ImageFont.load_default()

    text = "Q"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2 - bbox[0]
    y = (size - text_h) // 2 - bbox[1]
    draw.text((x, y), text, fill=WHITE, font=font)

    output_path = "/home/z/my-project/public/apple-touch-icon.png"
    img.save(output_path, "PNG")
    print(f"  ✓ apple-touch-icon.png ({size}x{size})")


def make_favicon():
    """Create a 32x32 favicon."""
    size = 32
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=4, fill=PRIMARY)

    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    except Exception:
        font = ImageFont.load_default()

    text = "Q"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2 - bbox[0]
    y = (size - text_h) // 2 - bbox[1]
    draw.text((x, y), text, fill=WHITE, font=font)

    output_path = "/home/z/my-project/public/favicon-32.png"
    img.save(output_path, "PNG")
    print(f"  ✓ favicon-32.png ({size}x{size})")


def make_screenshot():
    """Create a placeholder mobile screenshot (1080x1920)."""
    width, height = 1080, 1920
    img = Image.new("RGB", (width, height), SURFACE)
    draw = ImageDraw.Draw(img)

    # Top bar (primary)
    draw.rectangle([0, 0, width, 200], fill=PRIMARY)

    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
        body_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except Exception:
        title_font = body_font = small_font = ImageFont.load_default()

    # Title
    draw.text((60, 70), "QBIT Engineer", fill=WHITE, font=title_font)

    # Job cards (placeholder)
    card_y = 280
    for i, label in enumerate(["WO-94281 — Installation", "WO-94282 — Firmware Update", "WO-94283 — Relocation"]):
        y = card_y + i * 200
        draw.rounded_rectangle([60, y, width - 60, y + 170], radius=20, fill=WHITE, outline=(200, 200, 200))
        draw.text((100, y + 30), label, fill=(27, 27, 31), font=body_font)
        draw.text((100, y + 90), "Vikram Patel · RetailX Mart", fill=(73, 69, 79), font=small_font)
        draw.rounded_rectangle([100, y + 130, 300, y + 160], radius=15, fill=PRIMARY)
        draw.text((120, y + 135), "Today 10:30", fill=WHITE, font=small_font)

    output_path = os.path.join(ICON_DIR, "screenshot-mobile.png")
    img.save(output_path, "PNG")
    print(f"  ✓ screenshot-mobile.png (1080x1920)")


def main():
    print("Generating PWA icons for QBIT Hub Engineer Portal...")

    # Standard icons
    make_icon(192, maskable=False, filename="icon-192.png")
    make_icon(512, maskable=False, filename="icon-512.png")

    # Maskable icons (full-bleed for Android adaptive icons)
    make_icon(192, maskable=True, filename="icon-maskable-192.png")
    make_icon(512, maskable=True, filename="icon-maskable-512.png")

    # Apple touch icon
    make_apple_touch_icon()

    # Favicon
    make_favicon()

    # Shortcut icons
    make_shortcut_icon("today", "T", PRIMARY, "shortcut-today.png")
    make_shortcut_icon("drqbit", "D", (107, 91, 121), "shortcut-drqbit.png")  # QBIT tertiary
    make_shortcut_icon("notifications", "N", (225, 122, 122), "shortcut-notifications.png")

    # Screenshot
    make_screenshot()

    print(f"\n✓ All PWA icons generated in {ICON_DIR}")


if __name__ == "__main__":
    main()
