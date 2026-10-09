#!/usr/bin/env python3
"""UMBRAL background quality pipeline.

Inputs are the five original photographs at 1440 px, encoded years ago with
very aggressive lossy compression. They are NOT 4K master photographs.
Produce higher-density Retina variants and a quantified QA report without
changing the art direction or breaking interactive hotspot coordinates.

A learned x2 FSRCNN model is attempted if OpenCV contrib and weights are
available. It is not mandatory: Lanczos resampling + careful local sharpening
is a robust offline fallback. Neither path is described as recovering lost
photographic detail; the true future improvement is regenerating new masters.
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "escape" / "images"
DST = SRC / "retina"
DST.mkdir(parents=True, exist_ok=True)
NAMES = ["mansion", "room-0", "room-1", "room-2", "room-3"]
MODEL = ROOT / "scripts" / "models" / "FSRCNN_x2.pb"

def learned_upscale(image: Image.Image) -> Image.Image | None:
    if not MODEL.exists():
        return None
    try:
        import cv2
        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        sr.readModel(str(MODEL))
        sr.setModel("fsrcnn", 2)
        rgb = np.asarray(image.convert("RGB"))
        result = sr.upsample(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
        return Image.fromarray(cv2.cvtColor(result, cv2.COLOR_BGR2RGB))
    except (ImportError, OSError, AttributeError, RuntimeError, ValueError) as error:
        print("FSRCNN unavailable; using high-quality resample:", error)
        return None

def enhance_2x(image: Image.Image) -> tuple[Image.Image, str]:
    # Light deblocking helps the original 70-kB WebP artefacts.
    src = image.convert("RGB")
    out = learned_upscale(src)
    method = "FSRCNN x2" if out is not None else "Lanczos 2x"
    if out is None:
        out = src.resize((src.width * 2, src.height * 2), Image.Resampling.LANCZOS)
    # Deliberately conservative: local contrast and subtle optical crispness.
    out = ImageEnhance.Contrast(out).enhance(1.04)
    out = out.filter(ImageFilter.UnsharpMask(radius=1.15, percent=86, threshold=3))
    # Dither the dark gradients to prevent 8-bit/WebP banding, not to fake detail.
    rng = np.random.default_rng(1309)
    rgb = np.asarray(out, dtype=np.float32)
    noise = rng.normal(0, .43, size=rgb.shape[:2]).astype(np.float32)[...,None]
    rgb = np.uint8(np.clip(rgb + noise, 0, 255))
    return Image.fromarray(rgb), method

def sharpness(image: Image.Image) -> float:
    # Similar across runs; metric is informational, not a commercial-quality score.
    arr = np.asarray(image.convert("L").resize((620, 322)))
    try:
        import cv2
        return round(float(cv2.Laplacian(arr, cv2.CV_64F).var()), 3)
    except ImportError:
        return round(float(np.var(np.diff(arr.astype(float), axis=1))), 3)

rows = []
for name in NAMES:
    source = SRC / f"{name}.webp"
    if not source.exists():
        raise FileNotFoundError(source)
    with Image.open(source) as im:
        src = im.convert("RGB")
    if src.width < 1350 or src.height < 680:
        raise ValueError(f"{source} is unexpectedly small: {src.size}")
    retina, method = enhance_2x(src)
    target = DST / f"{name}.webp"
    retina.save(target, "WEBP", quality=91, method=6, exact=True)
    with Image.open(target) as check:
        if check.size != (src.width * 2, src.height * 2):
            raise ValueError(f"Invalid retina dimensions for {name}: {check.size}")
    row = {
        "asset": name, "source": f"{src.width}x{src.height}",
        "retina": f"{retina.width}x{retina.height}",
        "original_bytes": source.stat().st_size,
        "retina_bytes": target.stat().st_size,
        "retina_sharpness_reference": sharpness(retina),
        "method": method,
    }
    print(json.dumps(row, ensure_ascii=False))
    rows.append(row)
# The objects are mounted much closer to the eye than the room background.
# Preserve real texture on modern 2x/3x phones without changing filenames.
OBJECTS = ["portrait", "clock", "lock", "letter", "music", "doll", "circuit", "door", "signal"]
object_dst = DST / "objects"
object_dst.mkdir(parents=True, exist_ok=True)
object_rows = []
for name in OBJECTS:
    source = SRC / "objects" / f"{name}.webp"
    with Image.open(source) as im:
        orig = im.convert("RGB")
    if min(orig.size) < 700:
        raise ValueError(f"Object source unexpectedly low-res: {name} {orig.size}")
    retina, method = enhance_2x(orig)
    target = object_dst / f"{name}.webp"
    retina.save(target, "WEBP", quality=90, method=6, exact=True)
    object_rows.append({
        "asset": name, "source": f"{orig.width}x{orig.height}",
        "retina": f"{retina.width}x{retina.height}",
        "original_bytes": source.stat().st_size,
        "retina_bytes": target.stat().st_size,
        "method": method,
    })
    print("OBJECT", name, orig.size, "=>", retina.size, target.stat().st_size)
(DST / "quality-report.json").write_text(
    json.dumps({"assets": rows, "objects": object_rows, "limitations": "2x copies reduce browser interpolation; cannot restore lost source detail."}, ensure_ascii=False, indent=2),
    encoding="utf8",
)
print(f"PASS: {len(rows)} retina backgrounds generated, total bytes={sum(x['retina_bytes'] for x in rows)}")
