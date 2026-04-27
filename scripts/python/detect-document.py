import json
import sys

import cv2
import numpy as np


MAX_DETECTION_SIZE = 1000
MIN_AREA_RATIO = 0.05
MAX_AREA_RATIO = 0.95
MIN_SIDE_LENGTH_RATIO = 0.12
SIDE_REFINEMENT_BAND_RATIO = 0.025
LINE_REFINEMENT_OUTER_BAND_RATIO = 0.08
LINE_REFINEMENT_INNER_BAND_RATIO = 0.015


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

    ordered = refine_corners(gray, order_corners(points))

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


def refine_corners(gray: np.ndarray, corners: list[np.ndarray]) -> list[np.ndarray]:
    height, width = gray.shape[:2]
    band_width = max(6.0, min(width, height) * SIDE_REFINEMENT_BAND_RATIO)
    outer_band_width = max(12.0, min(width, height) * LINE_REFINEMENT_OUTER_BAND_RATIO)
    inner_band_width = max(4.0, min(width, height) * LINE_REFINEMENT_INNER_BAND_RATIO)
    line_segments = detect_line_segments(gray)
    lines = []

    print(
        f"[document-detection:python] Line segments: {len(line_segments)}",
        file=sys.stderr,
    )

    center = np.mean(np.array(corners), axis=0)

    for index in range(len(corners)):
        start = corners[index]
        end = corners[(index + 1) % len(corners)]
        line = fit_line_segment_near_side(
            line_segments,
            start,
            end,
            center,
            inner_band_width,
            outer_band_width,
        )

        if line is None:
            line = fit_brightness_transition_line_near_side(
                gray,
                start,
                end,
                center,
                band_width,
            )

        lines.append(line if line is not None else line_from_points(start, end))

    refined = []

    for index in range(len(lines)):
        previous_line = lines[index - 1]
        current_line = lines[index]
        intersection = intersect_lines(previous_line, current_line)

        if intersection is None:
            return corners

        x, y = intersection

        if x < -band_width or x > width + band_width:
            return corners

        if y < -band_width or y > height + band_width:
            return corners

        refined.append(np.array([clamp(x / width) * width, clamp(y / height) * height]))

    if not is_refinement_reasonable(corners, refined, width, height):
        print(
            "[document-detection:python] Side refinement rejected.",
            file=sys.stderr,
        )
        return corners

    print(
        "[document-detection:python] Side refinement applied.",
        file=sys.stderr,
    )
    return refined


def detect_line_segments(gray: np.ndarray) -> list[tuple[np.ndarray, np.ndarray]]:
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    detector = cv2.createLineSegmentDetector()
    detected = detector.detect(blurred)[0]

    if detected is None:
        return []

    return [
        (np.array([x1, y1], dtype=float), np.array([x2, y2], dtype=float))
        for x1, y1, x2, y2 in detected.reshape(-1, 4)
    ]


def fit_line_segment_near_side(
    line_segments: list[tuple[np.ndarray, np.ndarray]],
    start: np.ndarray,
    end: np.ndarray,
    center: np.ndarray,
    inner_band_width: float,
    outer_band_width: float,
):
    side_vector = end - start
    side_length = np.linalg.norm(side_vector)

    if side_length == 0:
        return None

    unit_side = side_vector / side_length
    normal = np.array([-unit_side[1], unit_side[0]])

    if np.dot(center - start, normal) > 0:
        normal = -normal

    candidates = []

    for point_a, point_b in line_segments:
        segment_vector = point_b - point_a
        segment_length = np.linalg.norm(segment_vector)

        if segment_length < max(16.0, side_length * 0.12):
            continue

        unit_segment = segment_vector / segment_length
        parallel_score = abs(float(np.dot(unit_segment, unit_side)))

        if parallel_score < 0.92:
            continue

        midpoint = (point_a + point_b) / 2
        midpoint_relative = midpoint - start
        midpoint_projection = float(midpoint_relative @ unit_side)
        signed_distance = float(midpoint_relative @ normal)

        if midpoint_projection < -side_length * 0.2:
            continue

        if midpoint_projection > side_length * 1.2:
            continue

        if signed_distance < -inner_band_width:
            continue

        if signed_distance > outer_band_width:
            continue

        endpoint_projections = np.array(
            [
                float((point_a - start) @ unit_side),
                float((point_b - start) @ unit_side),
            ]
        )
        overlap_start = max(0.0, float(np.min(endpoint_projections)))
        overlap_end = min(side_length, float(np.max(endpoint_projections)))
        overlap = max(0.0, overlap_end - overlap_start)
        overlap_ratio = overlap / side_length

        if overlap_ratio < 0.08:
            continue

        outward_score = max(0.0, signed_distance / outer_band_width)
        length_score = min(1.0, segment_length / side_length)
        score = (
            outward_score * 2.5
            + length_score * 1.4
            + overlap_ratio * 1.2
            + parallel_score
        )

        candidates.append(
            {
                "points": (point_a, point_b),
                "distance": signed_distance,
                "score": score,
            }
        )

    if not candidates:
        return None

    best = max(candidates, key=lambda candidate: candidate["score"])
    selected_points = []

    for candidate in candidates:
        if candidate["distance"] < best["distance"] - outer_band_width * 0.25:
            continue

        point_a, point_b = candidate["points"]
        selected_points.extend((point_a, point_b))

    if len(selected_points) < 2:
        return None

    line = cv2.fitLine(
        np.array(selected_points, dtype=np.float32),
        cv2.DIST_L2,
        0,
        0.01,
        0.01,
    )
    vx, vy, x, y = [float(value) for value in line.flatten()]
    return standard_line_from_point_vector(np.array([x, y]), np.array([vx, vy]))


def fit_brightness_transition_line_near_side(
    gray: np.ndarray,
    start: np.ndarray,
    end: np.ndarray,
    center: np.ndarray,
    band_width: float,
):
    height, width = gray.shape[:2]
    side_vector = end - start
    side_length = np.linalg.norm(side_vector)

    if side_length == 0:
        return None

    unit_side = side_vector / side_length
    normal = np.array([-unit_side[1], unit_side[0]])

    if np.dot(center - start, normal) > 0:
        normal = -normal

    offsets = np.linspace(-band_width * 0.25, band_width * 1.75, 48)
    transition_points = []

    for side_position in np.linspace(0.08, 0.92, 28):
        base_point = start + unit_side * side_length * side_position
        samples = []
        sample_offsets = []

        for offset in offsets:
            sample_point = base_point + normal * offset
            sample_x = int(round(sample_point[0]))
            sample_y = int(round(sample_point[1]))

            if sample_x < 0 or sample_x >= width or sample_y < 0 or sample_y >= height:
                continue

            samples.append(float(gray[sample_y, sample_x]))
            sample_offsets.append(offset)

        if len(samples) < 8:
            continue

        samples_array = np.array(samples)
        offsets_array = np.array(sample_offsets)
        inside_mean = float(np.mean(samples_array[: max(2, len(samples_array) // 5)]))
        outside_mean = float(np.mean(samples_array[-max(2, len(samples_array) // 5) :]))

        if inside_mean >= outside_mean:
            gradients = samples_array[:-1] - samples_array[1:]
        else:
            gradients = samples_array[1:] - samples_array[:-1]

        strongest_index = int(np.argmax(gradients))
        strongest_gradient = gradients[strongest_index]

        if strongest_gradient < 5:
            continue

        edge_offset = (
            offsets_array[strongest_index] + offsets_array[strongest_index + 1]
        ) / 2
        transition_points.append(base_point + normal * edge_offset)

    if len(transition_points) < 8:
        return None

    line = cv2.fitLine(
        np.array(transition_points, dtype=np.float32),
        cv2.DIST_L2,
        0,
        0.01,
        0.01,
    )
    vx, vy, x, y = [float(value) for value in line.flatten()]
    return standard_line_from_point_vector(np.array([x, y]), np.array([vx, vy]))


def line_from_points(start: np.ndarray, end: np.ndarray):
    return standard_line_from_point_vector(start, end - start)


def standard_line_from_point_vector(point: np.ndarray, vector: np.ndarray):
    a = float(vector[1])
    b = float(-vector[0])
    c = float(-(a * point[0] + b * point[1]))
    norm = np.hypot(a, b)

    if norm == 0:
        return None

    return (a / norm, b / norm, c / norm)


def intersect_lines(line_a, line_b):
    if line_a is None or line_b is None:
        return None

    a1, b1, c1 = line_a
    a2, b2, c2 = line_b
    denominator = a1 * b2 - a2 * b1

    if abs(denominator) < 1e-6:
        return None

    x = (b1 * c2 - b2 * c1) / denominator
    y = (c1 * a2 - c2 * a1) / denominator
    return (x, y)


def is_refinement_reasonable(
    original: list[np.ndarray],
    refined: list[np.ndarray],
    width: int,
    height: int,
) -> bool:
    original_area = abs(cv2.contourArea(np.array(original, dtype=np.float32)))
    refined_area = abs(cv2.contourArea(np.array(refined, dtype=np.float32)))

    if original_area == 0:
        return False

    area_ratio = refined_area / original_area

    if area_ratio < 0.8 or area_ratio > 1.25:
        return False

    max_shift = min(width, height) * 0.08

    for original_point, refined_point in zip(original, refined):
        if distance(original_point, refined_point) > max_shift:
            return False

    return True


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
