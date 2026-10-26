
import os
from huggingface_hub import InferenceClient

token = os.getenv("HF_TOKEN")

if not token:
    print("HF_TOKEN is not set in this terminal.")
    raise SystemExit(1)

print("HF_TOKEN is available.")

client = InferenceClient(
    provider="hf-inference",
    api_key=token,
    timeout=30,
)

try:
    result = client.image_classification(
        "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/cats.png",
        model="Smogy/SMOGY-Ai-images-detector",
    )
    print("Model response:", result)

except Exception as e:
    print("Inference test failed:", type(e).__name__, str(e)[:500])
