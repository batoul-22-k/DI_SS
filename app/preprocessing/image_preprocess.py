"""Image preprocessing to improve OCR quality."""
from __future__ import annotations

from typing import Tuple

import cv2
import numpy as np


def preprocess_image(image_bgr: np.ndarray, deskew: bool = True) -> np.ndarray:
    """Apply grayscale, denoise, contrast enhancement, and optional deskew.

    Returns a single-channel image suitable for OCR.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # Reduce salt-and-pepper noise while preserving edges.
    denoised = cv2.medianBlur(gray, 3)

    # Improve local contrast for faint text.
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    if not deskew:
        return enhanced

    angle = _estimate_skew_angle(enhanced)
    if abs(angle) < 0.5:
        return enhanced

    return _rotate_image(enhanced, angle)


def _estimate_skew_angle(gray: np.ndarray) -> float:
    """Estimate skew angle in degrees using text contours."""
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    coords = np.column_stack(np.where(thresh > 0))
    if coords.size == 0:
        return 0.0

    rect = cv2.minAreaRect(coords)
    angle = rect[-1]

    # Convert OpenCV angle to a more intuitive deskew angle.
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    return float(angle)


def _rotate_image(gray: np.ndarray, angle: float) -> np.ndarray:
    """Rotate image around its center, preserving size."""
    (h, w) = gray.shape[:2]
    center = (w // 2, h // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(
        gray,
        matrix,
        (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )


def load_image(path: str) -> np.ndarray:
    image = cv2.imread(path)
    if image is None:
        raise FileNotFoundError(f"Could not read image at {path}")
    return image


def save_image(path: str, image: np.ndarray) -> None:
    cv2.imwrite(path, image)
