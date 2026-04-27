import json
import sys

import cv2
import numpy as np


def main() -> int:
    if len(sys.argv) != 4:
        print(json.dumps({"error": "Expected input path, output path, and corners."}))
        return 1

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    try:
        corners = json.loads(sys.argv[3])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Corners must be valid JSON."}))
        return 1

    image = cv2.imread(input_path)

    if image is None:
        print(json.dumps({"error": "Could not read image."}))
        return 1

    try:
        warped = transform_document(image, corners)
    except ValueError as error:
        print(json.dumps({"error": str(error)}))
        return 1

    if not cv2.imwrite(output_path, warped, [int(cv2.IMWRITE_JPEG_QUALITY), 92]):
        print(json.dumps({"error": "Could not write transformed image."}))
        return 1

    height, width = warped.shape[:2]
    print(json.dumps({"width": width, "height": height}))
    return 0


def transform_document(image: np.ndarray, corners: list[dict[str, float]]) -> np.ndarray:
    if len(corners) != 4:
        raise ValueError("Exactly four corners are required.")

    height, width = image.shape[:2]
    source = np.array(
        [
            [
                clamp(float(corner["x"])) * width,
                clamp(float(corner["y"])) * height,
            ]
            for corner in corners
        ],
        dtype=np.float32,
    )

    source = order_corners(source)
    output_width = max(
        distance(source[0], source[1]),
        distance(source[2], source[3]),
    )
    output_height = max(
        distance(source[1], source[2]),
        distance(source[3], source[0]),
    )

    if output_width < 2 or output_height < 2:
        raise ValueError("Selected document area is too small.")

    target_width = int(round(output_width))
    target_height = int(round(output_height))
    destination = np.array(
        [
            [0, 0],
            [target_width - 1, 0],
            [target_width - 1, target_height - 1],
            [0, target_height - 1],
        ],
        dtype=np.float32,
    )

    matrix = cv2.getPerspectiveTransform(source, destination)
    return cv2.warpPerspective(
        image,
        matrix,
        (target_width, target_height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )


def order_corners(points: np.ndarray) -> np.ndarray:
    point_list = list(points.astype(np.float32))
    top_left = min(point_list, key=lambda point: point[0] + point[1])
    bottom_right = max(point_list, key=lambda point: point[0] + point[1])
    top_right = max(point_list, key=lambda point: point[0] - point[1])
    bottom_left = min(point_list, key=lambda point: point[0] - point[1])
    return np.array([top_left, top_right, bottom_right, bottom_left], dtype=np.float32)


def distance(point_a: np.ndarray, point_b: np.ndarray) -> float:
    return float(np.linalg.norm(point_a - point_b))


def clamp(value: float) -> float:
    return min(1.0, max(0.0, value))


if __name__ == "__main__":
    raise SystemExit(main())
