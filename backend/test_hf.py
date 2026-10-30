

import os
from huggingface_hub import InferenceClient

print("Starting Hugging Face test...", flush=True)

token = os.getenv("HF_TOKEN")
print("Token available:", bool(token), flush=True)

try:
    client = InferenceClient(
        provider="hf-inference",
        api_key=token,
        timeout=45,
    )

    print("Calling model...", flush=True)

    result = client.image_classification(
        "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/cats.png",
        model="umm-maybe/AI-image-detector",
    )

    print("SUCCESS:", result, flush=True)

except Exception as exc:
    print("ERROR TYPE:", type(exc).__name__, flush=True)
    print("ERROR DETAILS:", str(exc)[:1000], flush=True)

