#!/usr/bin/env python3
"""Convert a PNG to black-and-white using a darkness threshold."""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

DESPECKLE_SIZE = 3  # odd integer >= 3; controls default median filter kernel


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Convert a PNG to black and white based on a darkness threshold. "
            "Outputs three variants: plain BW, BW with white transparent, "
            "and inverted BW with black transparent (white only on clear)."
        )
    )
    parser.add_argument("input", help="Input PNG file path")
    parser.add_argument(
        "threshold",
        type=float,
        help=(
            "Darkness threshold as a percentage (0–100). "
            "Pixels with darkness above this become black, the rest white."
        ),
    )
    parser.add_argument(
        "-o", "--output-dir",
        help="Directory for output files (default: same directory as input)",
    )
    parser.add_argument(
        "--no-despeckle",
        action="store_true",
        help="Disable the default median-filter despeckling step.",
    )
    args = parser.parse_args()

    if not 0.0 <= args.threshold <= 100.0:
        parser.error("Threshold must be between 0 and 100.")

    input_path = Path(args.input)
    if not input_path.exists():
        parser.error(f"File not found: {args.input}")

    out_dir = Path(args.output_dir) if args.output_dir else input_path.parent
    stem = input_path.stem

    # Load image; composite transparent inputs onto white before grayscaling
    img = Image.open(input_path)
    if img.mode == "RGBA":
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        gray = bg.convert("L")
    else:
        gray = img.convert("L")

    cutoff = 255.0 * (1.0 - args.threshold / 100.0)
    arr = np.array(gray, dtype=np.float32)
    bw = Image.fromarray(
        np.where(arr < cutoff, np.uint8(0), np.uint8(255)).astype(np.uint8), "L"
    )

    if not args.no_despeckle:
        bw = bw.filter(ImageFilter.MedianFilter(size=DESPECKLE_SIZE))

    # 1. Plain BW
    path_bw = out_dir / f"{stem}_bw.png"
    bw.convert("RGB").save(path_bw, format="PNG")
    print(f"Saved: {path_bw}")

    # 2. BW with white transparent (black visible on clear)
    path_transparent = out_dir / f"{stem}_bw_transparent.png"
    a = np.array(bw.convert("RGBA"))
    a[a[:, :, 0] == 255, 3] = 0
    Image.fromarray(a, "RGBA").save(path_transparent, format="PNG")
    print(f"Saved: {path_transparent}")

    # 3. Inverted BW with black transparent (white visible on clear)
    path_inverted = out_dir / f"{stem}_bw_inverted.png"
    inverted = Image.fromarray(255 - np.array(bw), "L")
    a_inv = np.array(inverted.convert("RGBA"))
    a_inv[a_inv[:, :, 0] == 0, 3] = 0
    Image.fromarray(a_inv, "RGBA").save(path_inverted, format="PNG")
    print(f"Saved: {path_inverted}")


if __name__ == "__main__":
    main()
