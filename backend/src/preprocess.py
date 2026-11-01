import numpy as np
from PIL import Image

IMAGENET_MEAN = np.array(
    [0.485, 0.456, 0.406], dtype=np.float32
).reshape(1, 1, 3)

IMAGENET_STD = np.array(
    [0.229, 0.224, 0.225], dtype=np.float32
).reshape(1, 1, 3)


def get_transform(train=False):
    def transform(image):
        image = image.convert("RGB")

        width, height = image.size
        scale = 256 / min(width, height)

        new_width = round(width * scale)
        new_height = round(height * scale)

        image = image.resize(
            (new_width, new_height),
            Image.Resampling.BILINEAR
        )

        left = (new_width - 224) // 2
        top = (new_height - 224) // 2

        image = image.crop((
            left,
            top,
            left + 224,
            top + 224
        ))

        image_array = np.asarray(
            image, dtype=np.float32
        ) / 255.0

        image_array = (
            image_array - IMAGENET_MEAN
        ) / IMAGENET_STD

        image_array = np.transpose(
            image_array, (2, 0, 1)
        )

        return np.ascontiguousarray(
            image_array[None, ...],
            dtype=np.float32
        )

    return transform