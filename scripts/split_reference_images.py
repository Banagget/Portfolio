from pathlib import Path

from PIL import Image


TILE_HEIGHT = 2048
SOURCES = (
    Path("public/page-assets/competitions/reference-no-buttons.png"),
    Path("public/page-assets/projects/reference-no-buttons.png"),
    Path("public/page-assets/clce/reference-no-buttons.png"),
)


for source in SOURCES:
    output_dir = source.parent / "tiles"
    output_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as image:
        for index, top in enumerate(range(0, image.height, TILE_HEIGHT), 1):
            bottom = min(top + TILE_HEIGHT, image.height)
            tile = image.crop((0, top, image.width, bottom)).convert("RGB")
            tile.save(
                output_dir / f"reference-{index:02d}.webp",
                "WEBP",
                quality=92,
                method=6,
            )
