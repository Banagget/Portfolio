import argparse
import math
from pathlib import Path

from PIL import Image


MAX_TILE_HEIGHT = 2048
DEFAULT_SOURCES = (
    Path("public/page-assets/competitions/reference-no-buttons.png"),
    Path("public/page-assets/projects/reference-no-buttonsV3.png"),
    Path("public/page-assets/clce/reference-no-buttons.png"),
)


parser = argparse.ArgumentParser(description="Split tall reference images into balanced WebP tiles.")
parser.add_argument("sources", nargs="*", type=Path, help="Optional source images to process.")
args = parser.parse_args()


for source in args.sources or DEFAULT_SOURCES:
    output_dir = source.parent / ("tiles-v3" if source.stem.endswith("V3") else "tiles")
    output_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as image:
        tile_count = math.ceil(image.height / MAX_TILE_HEIGHT)
        tile_height = math.ceil(image.height / tile_count)

        for index, top in enumerate(range(0, image.height, tile_height), 1):
            bottom = min(top + tile_height, image.height)
            tile = image.crop((0, top, image.width, bottom)).convert("RGB")
            tile.save(
                output_dir / f"reference-{index:02d}.webp",
                "WEBP",
                quality=92,
                method=6,
            )
