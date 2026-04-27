import json
import sys

import cv2
import numpy as np


MAX_DETECTION_SIZE = 1000
MIN_AREA_RATIO = 0.05
MAX_AREA_RATIO = 0.95


def main() -> int:
    if len(sys.argv) != 2:
        print(json.dumps({"corners": None, "error": "Missing image path."}))
        return 1

    image_path = sys.argv[1]
    image = cv2.imread(image_path)

    if image is None:
        print(json.dumps({"corners": None, "error": "Could not read image."}))
        return 1

    resized = resize_for_detection(image)
    corners = detect_document_corners(resized)

    print(json.dumps({"corners": corners}))
    return 0


def resize_for_detection(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]
    scale = MAX_DETECTION_SIZE / max(width, height)

    if scale >= 1:
        return image

    return cv2.resize(
        image,
        (round(width * scale), round(height * scale)),
        interpolation=cv2.INTER_AREA,
    )


def detect_document_corners(image: np.ndarray):
    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = auto_canny(blurred)
    kernel = np.ones((5, 5), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    print(
        f"[document-detection:python] Found contours: {len(contours)}",
        file=sys.stderr,
    )

    candidates = []

    for contour in contours:
        perimeter = cv2.arcLength(contour, True)

        for epsilon_ratio in (0.015, 0.02, 0.03, 0.04, 0.06):
            approx = cv2.approxPolyDP(contour, perimeter * epsilon_ratio, True)

            if len(approx) != 4 or not cv2.isContourConvex(approx):
                continue

            area = abs(cv2.contourArea(approx))
            area_ratio = area / (width * height)

            if area_ratio < MIN_AREA_RATIO or area_ratio > MAX_AREA_RATIO:
                continue

            candidates.append((area, approx.reshape(4, 2)))

    if not candidates:
        return None

    area, points = max(candidates, key=lambda candidate: candidate[0])
    print(
        f"[document-detection:python] Selected contour area ratio: {area / (width * height):.4f}",
        file=sys.stderr,
    )

    ordered = order_corners(points)
    return [
        {"x": clamp(point[0] / width), "y": clamp(point[1] / height)}
        for point in ordered
    ]


def auto_canny(image: np.ndarray) -> np.ndarray:
    median = float(np.median(image))
    lower = int(max(0, (1.0 - 0.33) * median))
    upper = int(min(255, (1.0 + 0.33) * median))
    return cv2.Canny(image, lower, upper)


def order_corners(points: np.ndarray) -> list[np.ndarray]:
    point_list = list(points.astype(float))
    top_left = min(point_list, key=lambda point: point[0] + point[1])
    bottom_right = max(point_list, key=lambda point: point[0] + point[1])
    top_right = max(point_list, key=lambda point: point[0] - point[1])
    bottom_left = min(point_list, key=lambda point: point[0] - point[1])

    return [top_left, top_right, bottom_right, bottom_left]


def clamp(value: float) -> float:
    return min(1.0, max(0.0, value))


if __name__ == "__main__":
    raise SystemExit(main())
