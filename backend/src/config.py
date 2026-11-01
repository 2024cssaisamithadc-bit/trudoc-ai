import os
import onnxruntime as ort
import numpy as np
from PIL import Image

from .preprocess import get_transform


MODEL_CONFIG = {
    "name": "imager-1-tiny",
    "threshold": 0.385,
}


def load_model(weights_path=None, device="cpu"):
    if weights_path is None:
        weights_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "model",
            "imager-1-tiny.onnx",
        )

    session = ort.InferenceSession(
        weights_path,
        providers=["CPUExecutionProvider"],
    )

    return session


def predict(image, model=None, device="cpu"):
    if model is None:
        model = load_model()

    if isinstance(image, str):
        image = Image.open(image)

    elif hasattr(image, "read"):
        image = Image.open(image)

    image = image.convert("RGB")

    transform = get_transform(train=False)
    input_data = transform(image)

    input_name = model.get_inputs()[0].name
    output_name = model.get_outputs()[0].name

    output = model.run(
        [output_name],
        {input_name: input_data},
    )[0]

    exp_output = np.exp(
        output - np.max(output, axis=1, keepdims=True)
    )

    probabilities = exp_output / np.sum(
        exp_output, axis=1, keepdims=True
    )

    probability = float(probabilities[0][1])

    label = (
        "AI-Generated"
        if probability > MODEL_CONFIG["threshold"]
        else "Real"
    )

    confidence = (
        probability
        if label == "AI-Generated"
        else 1 - probability
    )

    return {
        "probability": round(probability, 4),
        "label": label,
        "confidence": round(confidence, 4),
    }