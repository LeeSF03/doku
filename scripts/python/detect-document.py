import json
import sys

import cv2
import numpy as np


MAX_DETECTION_SIZE = 1000
MIN_AREA_RATIO = 0.05
MAX_AREA_RATIO = 0.95
MIN_SIDE_LENGTH_RATIO = 0.12


def main() -> int:
    if len(sys.argv) != 2:
        print(json.dumps({"corners": None, "error": "Missing image path."}))
        return 1

    image = cv2.imread(sys.argv[1])

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
    edged = build_edge_mask(image)
    contours, _ = cv2.findContours(
        edged,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE,
    )
    candidates = []

    print(
        f"[document-detection:python] Contours: {len(contours)}",
        file=sys.stderr,
    )

    for contour in contours:
        perimeter = cv2.arcLength(contour, True)

        if perimeter == 0:
            continue

        approx = cv2.approxPolyDP(contour, perimeter * 0.02, True)

        if len(approx) != 4 or not cv2.isContourConvex(approx):
            continue

        points = approx.reshape(4, 2).astype(np.float32)

        if not is_valid_document_candidate(points, width, height):
            continue

        candidates.append(points)

    print(
        f"[document-detection:python] Candidate quadrilaterals: {len(candidates)}",
        file=sys.stderr,
    )

    if not candidates:
        return None

    corners = max(candidates, key=lambda points: abs(cv2.contourArea(points)))
    ordered = order_corners(corners)

    return [
        {"x": float(clamp(point[0] / width)), "y": float(clamp(point[1] / height))}
        for point in ordered
    ]


def build_edge_mask(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = auto_canny(blurred)
    kernel = np.ones((5, 5), np.uint8)
    edged = cv2.dilate(edged, kernel, iterations=1)
    return cv2.morphologyEx(edged, cv2.MORPH_CLOSE, kernel)


def is_valid_document_candidate(
    points: np.ndarray,
    width: int,
    height: int,
) -> bool:
    area = abs(cv2.contourArea(points))
    image_area = width * height
    area_ratio = area / image_area

    if area_ratio < MIN_AREA_RATIO or area_ratio > MAX_AREA_RATIO:
        return False

    side_lengths = get_side_lengths(order_corners(points))

    if min(side_lengths) < min(width, height) * MIN_SIDE_LENGTH_RATIO:
        return False

    return True


def auto_canny(image: np.ndarray) -> np.ndarray:
    median = float(np.median(image))
    lower = int(max(0, (1.0 - 0.33) * median))
    upper = int(min(255, (1.0 + 0.33) * median))
    return cv2.Canny(image, lower, upper)


def order_corners(points: np.ndarray) -> list[np.ndarray]:
    point_list = list(points.astype(np.float32))
    top_left = min(point_list, key=lambda point: point[0] + point[1])
    bottom_right = max(point_list, key=lambda point: point[0] + point[1])
    top_right = max(point_list, key=lambda point: point[0] - point[1])
    bottom_left = min(point_list, key=lambda point: point[0] - point[1])

    return [top_left, top_right, bottom_right, bottom_left]


def get_side_lengths(points: list[np.ndarray]) -> list[float]:
    return [
        distance(points[0], points[1]),
        distance(points[1], points[2]),
        distance(points[2], points[3]),
        distance(points[3], points[0]),
    ]


def distance(point_a: np.ndarray, point_b: np.ndarray) -> float:
    return float(np.linalg.norm(point_a - point_b))


def clamp(value: float) -> float:
    return min(1.0, max(0.0, value))


if __name__ == "__main__":
    raise SystemExit(main())
