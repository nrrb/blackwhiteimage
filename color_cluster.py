#!/usr/bin/env python3
"""
Finds dominant colors in an image using k-means clustering, or masks all but
one color cluster to transparent.
Usage:
  python color_cluster.py <image_path> [--colors N] [--saturation F] [--contrast F]
  python color_cluster.py <image_path> --keep <HEX> [--fuzz F]
"""

import sys
import json
import argparse
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance
from sklearn.cluster import KMeans


_COLORNAMES_URL = "https://api.color.pizza/v1/"
_COLORNAMES_CACHE = Path(__file__).parent / "colornames.json"

_db_rgb: np.ndarray | None = None
_db_names: list[str] | None = None


def _load_color_db() -> tuple[np.ndarray, list[str]]:
    global _db_rgb, _db_names
    if _db_rgb is not None:
        return _db_rgb, _db_names

    if not _COLORNAMES_CACHE.exists():
        print("Downloading meodai/color-names database...", file=sys.stderr)
        req = urllib.request.Request(_COLORNAMES_URL, headers={"User-Agent": "color-cluster/1.0"})
        with urllib.request.urlopen(req) as resp:
            _COLORNAMES_CACHE.write_bytes(resp.read())

    with open(_COLORNAMES_CACHE) as f:
        payload = json.load(f)

    entries = payload["colors"]
    names: list[str] = []
    rgb_list: list[list[int]] = []
    for entry in entries:
        c = entry["rgb"]
        rgb_list.append([c["r"], c["g"], c["b"]])
        names.append(entry["name"])

    _db_rgb = np.array(rgb_list, dtype=np.float32)
    _db_names = names
    return _db_rgb, _db_names


def nearest_color_name(rgb: tuple[int, int, int]) -> str:
    db_rgb, db_names = _load_color_db()
    q = np.array(rgb, dtype=np.float32)
    dists = ((db_rgb - q) ** 2).sum(axis=1)
    return db_names[int(np.argmin(dists))]


def find_dominant_colors(
    image_path: str,
    n_colors: int = 2,
    saturation: float = 3.0,
    contrast: float = 1.5,
) -> list[tuple[tuple[int, int, int], int]]:
    img = Image.open(image_path).convert("RGB")
    img = ImageEnhance.Color(img).enhance(saturation)
    img = ImageEnhance.Contrast(img).enhance(contrast)
    pixels = np.array(img).reshape(-1, 3).astype(float)

    kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
    kmeans.fit(pixels)

    centers = kmeans.cluster_centers_
    labels = kmeans.labels_

    counts = np.bincount(labels)
    sorted_indices = np.argsort(-counts)  # descending by cluster size

    return [
        (tuple(int(round(c)) for c in centers[i]), int(counts[i]))
        for i in sorted_indices
    ]


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def keep_color(
    image_path: str,
    keep_hex: str,
    fuzz: float,
    saturation: float = 3.0,
    contrast: float = 1.5,
) -> None:
    keep_rgb = hex_to_rgb(keep_hex)
    color_name = nearest_color_name(keep_rgb)
    safe_name = color_name.lower().replace(" ", "-")

    p = Path(image_path)
    out_path = p.parent / f"{p.stem}_{safe_name}_{int(fuzz)}.png"

    img = Image.open(image_path).convert("RGB")
    enhanced = ImageEnhance.Color(img).enhance(saturation)
    enhanced = ImageEnhance.Contrast(enhanced).enhance(contrast)

    pixels = np.array(enhanced.convert("RGBA"))
    rgb = pixels[:, :, :3].astype(float)
    dist = np.sqrt(((rgb - np.array(keep_rgb, dtype=float)) ** 2).sum(axis=2))
    pixels[dist > fuzz, 3] = 0

    Image.fromarray(pixels, "RGBA").save(out_path)
    print(f"Saved: {out_path}")


def lightness(rgb: tuple[int, int, int]) -> float:
    r, g, b = rgb
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return (luminance / 255.0) * 100.0


def main():
    parser = argparse.ArgumentParser(
        description="Find dominant colors in an image using k-means clustering."
    )
    parser.add_argument("image_path")
    parser.add_argument("--colors", type=int, default=2, metavar="N")
    parser.add_argument("--saturation", type=float, default=3.0, metavar="F",
                        help="saturation boost factor (default 3.0)")
    parser.add_argument("--contrast", type=float, default=1.5, metavar="F",
                        help="contrast boost factor (default 1.5)")
    parser.add_argument("--keep", metavar="HEX",
                        help="hex color to keep (e.g. #A3B2C1); all other colors become transparent")
    parser.add_argument("--fuzz", type=float, default=30.0, metavar="F",
                        help="max Euclidean RGB distance from --keep color to treat as a match (default 30)")
    args = parser.parse_args()

    image_path = args.image_path

    if args.keep:
        try:
            keep_color(image_path, args.keep, args.fuzz, args.saturation, args.contrast)
        except FileNotFoundError:
            print(f"Error: file not found: {image_path}")
            sys.exit(1)
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)
        return

    try:
        colors = find_dominant_colors(
            image_path,
            n_colors=args.colors,
            saturation=args.saturation,
            contrast=args.contrast,
        )
    except FileNotFoundError:
        print(f"Error: file not found: {image_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    total_pixels = sum(count for _, count in colors)
    print(f"Top {len(colors)} dominant colors in '{image_path}' (sat×{args.saturation}, contrast×{args.contrast}):\n")
    for i, (rgb, count) in enumerate(colors, start=1):
        pct = 100 * count / total_pixels
        name = nearest_color_name(rgb)
        light = lightness(rgb)
        print(f"  {i:>2}. {name:<28}  RGB{rgb}  {rgb_to_hex(rgb)}  lightness={light:.0f}%  ({count:,} px, {pct:.1f}%)")


if __name__ == "__main__":
    main()
