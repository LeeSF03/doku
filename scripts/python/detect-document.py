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
    candidates = []

    for method_name, mask in build_detection_masks(gray):
        contours, _ = cv2.findContours(
            mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        print(
            f"[document-detection:python] {method_name} contours: {len(contours)}",
            file=sys.stderr,
        )

        for contour in contours:
            perimeter = cv2.arcLength(contour, True)

            for epsilon_ratio in (0.012, 0.016, 0.02, 0.03, 0.04, 0.06):
                approx = cv2.approxPolyDP(contour, perimeter * epsilon_ratio, True)

                if len(approx) != 4 or not cv2.isContourConvex(approx):
                    continue

                points = approx.reshape(4, 2)
                score = score_document_candidate(points, width, height)

                if score is None:
                    continue

                candidates.append(
                    {
                        "method": method_name,
                        "points": points,
                        "score": score,
                        "area": abs(cv2.contourArea(points)),
                    }
                )

    print(
        f"[document-detection:python] Candidate quadrilaterals: {len(candidates)}",
        file=sys.stderr,
    )

    if not candidates:
        return None

    candidate = max(candidates, key=lambda item: item["score"])
    points = candidate["points"]

    print(
        "[document-detection:python] Selected candidate: "
        f"method={candidate['method']} "
        f"score={candidate['score']:.4f} "
        f"area_ratio={candidate['area'] / (width * height):.4f}",
        file=sys.stderr,
    )

    ordered = order_corners(points)
    return [
        {"x": clamp(point[0] / width), "y": clamp(point[1] / height)}
        for point in ordered
    ]


def build_detection_masks(gray: np.ndarray):
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    kernel = np.ones((5, 5), np.uint8)

    canny = auto_canny(blurred)
    canny = cv2.dilate(canny, kernel, iterations=1)
    canny = cv2.morphologyEx(canny, cv2.MORPH_CLOSE, kernel)

    adaptive = cv2.adaptiveThreshold(
        blurred,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        5,
    )
    adaptive = cv2.morphologyEx(adaptive, cv2.MORPH_CLOSE, kernel, iterations=2)

    inverse_adaptive = cv2.bitwise_not(adaptive)
    inverse_adaptive = cv2.morphologyEx(
        inverse_adaptive,
        cv2.MORPH_CLOSE,
        kernel,
        iterations=2,
    )

    _, otsu = cv2.threshold(
        blurred,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU,
    )
    otsu = cv2.morphologyEx(otsu, cv2.MORPH_CLOSE, kernel, iterations=2)

    return (
        ("canny", canny),
        ("adaptive", adaptive),
        ("adaptive-inverse", inverse_adaptive),
        ("otsu", otsu),
    )


def score_document_candidate(points: np.ndarray, width: int, height: int):
    ordered = order_corners(points)
    area = abs(cv2.contourArea(np.array(ordered, dtype=np.float32)))
    image_area = width * height
    area_ratio = area / image_area

    if area_ratio < MIN_AREA_RATIO or area_ratio > MAX_AREA_RATIO:
        return None

    side_lengths = get_side_lengths(ordered)
    min_side_length = min(side_lengths)
    max_side_length = max(side_lengths)

    if min_side_length < min(width, height) * MIN_SIDE_LENGTH_RATIO:
        return None

    if max_side_length == 0:
        return None

    side_balance = min_side_length / max_side_length
    angle_score = get_right_angle_score(ordered)
    parallel_score = get_parallel_score(ordered)
    border_penalty = get_border_penalty(ordered, width, height)

    return (
        area_ratio * 2.5
        + angle_score * 1.8
        + parallel_score * 1.4
        + side_balance * 0.8
        - border_penalty * 1.5
    )


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


def get_side_lengths(points: list[np.ndarray]) -> list[float]:
    return [
        distance(points[0], points[1]),
        distance(points[1], points[2]),
        distance(points[2], points[3]),
        distance(points[3], points[0]),
    ]


def get_right_angle_score(points: list[np.ndarray]) -> float:
    scores = []

    for index, point in enumerate(points):
        previous_point = points[index - 1]
        next_point = points[(index + 1) % len(points)]
        vector_a = previous_point - point
        vector_b = next_point - point
        denominator = np.linalg.norm(vector_a) * np.linalg.norm(vector_b)

        if denominator == 0:
            return 0.0

        cosine = abs(float(np.dot(vector_a, vector_b) / denominator))
        scores.append(1.0 - min(1.0, cosine))

    return sum(scores) / len(scores)


def get_parallel_score(points: list[np.ndarray]) -> float:
    top = points[1] - points[0]
    right = points[2] - points[1]
    bottom = points[2] - points[3]
    left = points[3] - points[0]
    return (parallel_similarity(top, bottom) + parallel_similarity(left, right)) / 2


def parallel_similarity(vector_a: np.ndarray, vector_b: np.ndarray) -> float:
    denominator = np.linalg.norm(vector_a) * np.linalg.norm(vector_b)

    if denominator == 0:
        return 0.0

    cosine = abs(float(np.dot(vector_a, vector_b) / denominator))
    return min(1.0, cosine)


def get_border_penalty(points: list[np.ndarray], width: int, height: int) -> float:
    edge_margin = min(width, height) * 0.015
    penalty = 0

    for x, y in points:
        if x <= edge_margin or x >= width - edge_margin:
            penalty += 1
        if y <= edge_margin or y >= height - edge_margin:
            penalty += 1

    return penalty / 8


def distance(point_a: np.ndarray, point_b: np.ndarray) -> float:
    return float(np.linalg.norm(point_a - point_b))


def clamp(value: float) -> float:
    return min(1.0, max(0.0, value))


if __name__ == "__main__":
    raise SystemExit(main())
