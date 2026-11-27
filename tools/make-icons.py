"""Draws the app icon (a coral ring with "30") in every size the manifest and iOS need.

Run once after changing the design:  python3 tools/make-icons.py
Needs Pillow and the Inter ExtraBold font.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BACKGROUND = "#121317"
TRACK = "#2A2C33"
ACCENT = "#E4572E"
TEXT = "#F5F4F0"
FONT = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512]
MASTER = 1024
OUT = Path(__file__).resolve().parent.parent / "public" / "icons"


def draw_master() -> Image.Image:
    image = Image.new("RGB", (MASTER, MASTER), BACKGROUND)
    draw = ImageDraw.Draw(image)
    # The ring stays inside the middle 70%, so it survives the circle crop of "maskable" icons.
    margin, width = 230, 64
    box = (margin, margin, MASTER - margin, MASTER - margin)
    draw.arc(box, 0, 360, fill=TRACK, width=width)
    draw.arc(box, -90, 200, fill=ACCENT, width=width)  # about 80% of the way to the target
    font = ImageFont.truetype(FONT, 250)
    draw.text((MASTER / 2, MASTER / 2), "30", font=font, fill=TEXT, anchor="mm")
    return image


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    master = draw_master()
    for size in SIZES:
        master.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}x{size}.png", optimize=True)
    master.resize((48, 48), Image.LANCZOS).save(OUT.parent / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])


if __name__ == "__main__":
    main()
