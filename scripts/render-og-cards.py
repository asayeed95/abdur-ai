#!/usr/bin/env python3
"""Render the three committed OG share cards (1200×630 PNG).

Dark clay editorial. Flat geometry only — no photoreal people, no third-party
logos, no price, no closer, no northsun.ai, no invented outage or customer.

Fonts: Noto Serif (display), Inter (UI), JetBrains Mono (meta). Playfair is
the live site display face; this machine ships Noto Serif in the same role.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og"

W, H = 1200, 630
BG = (11, 10, 8)  # #0B0A08
SURFACE = (22, 19, 16)  # #161310
BORDER = (44, 38, 32)  # #2C2620
TEXT = (242, 237, 230)  # #F2EDE6
TEXT_SOFT = (201, 192, 178)  # #C9C0B2
MUTED = (148, 139, 125)  # #948B7D
MUTED3 = (122, 114, 100)  # #7A7264
CLAY = (217, 119, 87)  # #D97757

FONT_DIR_NOTO = Path("/usr/share/fonts/truetype/noto")
FONT_DIR_INTER = Path("/usr/share/fonts/truetype/macos")
FONT_DIR_MONO = Path("/usr/share/fonts/truetype/jetbrains-mono")


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def display(size: int, italic: bool = False, bold: bool = True) -> ImageFont.FreeTypeFont:
    name = "NotoSerif-"
    name += "Bold" if bold else ""
    name += "Italic" if italic else ""
    if name.endswith("-"):
        name += "Regular"
    return font(FONT_DIR_NOTO / f"{name}.ttf", size)


def ui(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "Inter-Bold.ttf" if bold else "Inter-Regular.ttf"
    return font(FONT_DIR_INTER / name, size)


def mono(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "JetBrainsMono-Bold.ttf" if bold else "JetBrainsMono-Regular.ttf"
    # macos copies exist; prefer jetbrains-mono dir
    candidate = FONT_DIR_MONO / name
    if not candidate.exists():
        candidate = FONT_DIR_INTER / name
    return font(candidate, size)


def new_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    # inset frame
    draw.rectangle([24, 24, W - 25, H - 25], outline=BORDER, width=1)
    # clay spine
    draw.rectangle([24, 24, 32, H - 25], fill=CLAY)
    return img, draw


def footer(draw: ImageDraw.ImageDraw, right: str) -> None:
    draw.text((72, 568), "abdur.ai", font=mono(20), fill=MUTED3)
    bbox = draw.textbbox((0, 0), right, font=mono(18))
    rw = bbox[2] - bbox[0]
    draw.text((W - 72 - rw, 570), right, font=mono(18), fill=MUTED3)


def save(img: Image.Image, name: str) -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    img.save(path, "PNG", optimize=True)
    return path


def render_home() -> Path:
    img, draw = new_canvas()
    draw.text((72, 72), "ABDUR.AI", font=mono(18), fill=CLAY)

    draw.text((72, 148), "The logbook", font=display(84), fill=TEXT)
    draw.rectangle([72, 268, 132, 271], fill=CLAY)
    draw.text(
        (72, 300),
        "What shipped. What broke. What I learned.",
        font=ui(28),
        fill=TEXT_SOFT,
    )

    rows = [
        ("SHIPPED", 420),
        ("BROKE", 300),
        ("LEARNED", 500),
    ]
    y = 390
    for i, (label, length) in enumerate(rows, start=1):
        draw.text((72, y), f"{i:02d}", font=mono(18), fill=CLAY)
        draw.text((120, y), label, font=mono(18), fill=MUTED)
        draw.rectangle((220, y + 10, 220 + length, y + 14), fill=BORDER)
        y += 48

    footer(draw, "LOGBOOK  ·  NOT A TOUR")
    return save(img, "home.png")


def _state_card(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    w: int,
    h: int,
    num: str,
    title: str,
    dek: str,
) -> None:
    draw.rounded_rectangle([x, y, x + w, y + h], radius=8, outline=BORDER, width=1, fill=SURFACE)
    draw.text((x + 20, y + 18), num, font=mono(18, bold=True), fill=CLAY)
    draw.text((x + 52, y + 16), title, font=mono(20, bold=True), fill=TEXT)
    draw.text((x + 20, y + 54), dek, font=ui(16), fill=MUTED)


def render_pager() -> Path:
    img, draw = new_canvas()
    draw.text((72, 64), "TLDR", font=mono(18), fill=CLAY)
    draw.text((72, 108), "Your pager is not", font=display(56), fill=TEXT)
    draw.text((72, 176), "your customer", font=display(56, italic=True), fill=TEXT)
    draw.rectangle([72, 256, 132, 259], fill=CLAY)

    cards = [
        ("1", "SIGNAL", "Detector. Time. Identity."),
        ("2", "DIAGNOSIS", "A story that can be wrong."),
        ("3", "MITIGATION", "Less harm. Not recovery."),
        ("4", "RECOVERY", "A later independent probe."),
    ]
    gap, cw, ch = 16, 268, 96
    x0, y0 = 72, 292
    for i, (num, title, dek) in enumerate(cards):
        col, row = i % 2, i // 2
        _state_card(draw, x0 + col * (cw + gap), y0 + row * (ch + gap), cw, ch, num, title, dek)

    # pager ≠ customer
    draw.text((680, 340), "PAGER", font=mono(28, bold=True), fill=MUTED)
    draw.text((680, 390), "≠", font=display(56), fill=CLAY)
    draw.text((680, 470), "CUSTOMER", font=mono(28, bold=True), fill=TEXT)

    footer(draw, "FOUR EVIDENCE STATES")
    return save(img, "your-pager-is-not-your-customer.png")


def render_number() -> Path:
    img, draw = new_canvas()
    draw.text((72, 64), "TLDR", font=mono(18), fill=CLAY)
    draw.text((72, 108), "The number is not", font=display(56), fill=TEXT)
    draw.text((72, 176), "the person", font=display(56, italic=True), fill=TEXT)
    draw.rectangle([72, 256, 132, 259], fill=CLAY)
    draw.text((72, 292), "phone-key persist", font=mono(22), fill=CLAY)
    draw.text((72, 340), "A channel is not a principal.", font=ui(26), fill=TEXT_SOFT)

    draw.text((72, 420), "NUMBER", font=mono(28, bold=True), fill=MUTED)
    draw.text((72, 462), "≠", font=display(48), fill=CLAY)
    draw.text((130, 468), "PERSON", font=mono(28, bold=True), fill=TEXT)

    # abstract keypad — no digits that look like a real ANI
    keys = 12
    cols, rows = 3, 4
    x0, y0 = 820, 120
    kw, kh, gap = 72, 72, 14
    for i in range(keys):
        col, row = i % cols, i // cols
        x = x0 + col * (kw + gap)
        y = y0 + row * (kh + gap)
        fill = CLAY if i == 4 else SURFACE
        outline = CLAY if i == 4 else BORDER
        draw.rounded_rectangle([x, y, x + kw, y + kh], radius=10, outline=outline, width=2, fill=fill)
        # flat hash marks, not photoreal keys / not a phone number
        mark = BORDER if i != 4 else (11, 10, 8)
        draw.rectangle([x + 24, y + 34, x + kw - 24, y + 38], fill=mark)

    draw.text((820, 500), "KEY  =  CHANNEL", font=mono(16), fill=MUTED3)

    footer(draw, "NUMBER  ≠  PERSON")
    return save(img, "the-number-is-not-the-person.png")


def main() -> None:
    paths = [render_home(), render_pager(), render_number()]
    for p in paths:
        with Image.open(p) as im:
            print(f"{p.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {p.stat().st_size} bytes")


if __name__ == "__main__":
    main()
