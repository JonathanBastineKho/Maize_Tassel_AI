import vertexai
from vertexai.generative_models import GenerativeModel, Part, GenerationConfig
from google.oauth2 import service_account
from google.api_core.exceptions import ResourceExhausted
from typing import List
import json
from fastapi import HTTPException

class LLMmanager:
    def __init__(self, credential_path: str, project_id: str) -> None:
        self.credential = service_account.Credentials.from_service_account_file(credential_path)
        self.project_id = project_id
        self.locations = [
            "asia-southeast1",  # Singapore
            "asia-east2",       # Hong Kong
            "asia-east1",       # Taiwan
            "asia-northeast1",  # Tokyo, Japan
            "asia-northeast3",  # Seoul, South Korea
            "asia-south1",      # Mumbai, India
            "asia-south2",      # Delhi, India
        ]
        self.current_location_index = 0
        self._init_vertexai()

    def _init_vertexai(self):
        self.location = self.locations[self.current_location_index]
        vertexai.init(project=self.project_id, location=self.location, credentials=self.credential)
        self.flash_model = GenerativeModel(model_name="gemini-1.5-flash")

    def filter_image(self, image_uris: List[str], search: str, max_retries: int = 7):
        for attempt in range(max_retries):
            try:
                image_parts = []
                for uri in image_uris:
                    if uri.lower().endswith('.jpg') or uri.lower().endswith('.jpeg'):
                        image_parts.append(Part.from_uri(uri, mime_type="image/jpeg"))
                    else:
                        image_parts.append(Part.from_uri(uri, mime_type="image/png"))
                prompt = f"""
                You are an AI assistant tasked with analyzing images of corn fields.
                Analyze the provided images of corn fields and identify those that match the following search description:

                Search Description: '{search}'

                Return your response as a JSON object with a single key-value pair. The key should be "matched_indices" and the value should be a list of integers representing the indices of the matching images.

                Example response formats:
                {{"matched_indices": [0, 1, 2, 3, 17, 19]}}
                {{"matched_indices": [0, 8, 5, 3, 17, 19]}}
                {{"matched_indices": [5, 10]}}
                {{"matched_indices": []}}

                If no images match, return an empty list for matched_indices.
                Ensure your response is a valid JSON object and nothing else.
                """

                contents = image_parts + [prompt]

                generation_config = GenerationConfig(
                    temperature=0.03,
                    top_p=1,
                    top_k=1,
                    candidate_count=1,
                    response_mime_type="application/json",
                )
                response = self.flash_model.generate_content(
                    contents,
                    generation_config=generation_config
                )
                
                try:
                    print(response.text)
                    result = json.loads(response.text).get("matched_indices")
                    if isinstance(result, list):
                        self.current_location_index = (self.current_location_index + 1) % len(self.locations)
                        return result
                    else:
                        raise json.JSONDecodeError("Unexpected format in 'matched_indices'")
                except json.JSONDecodeError:
                    raise ValueError("Failed to parse LLM response as JSON")
                
            except ResourceExhausted:
                print(f"Quota exceeded for location: {self.location}")
                self.current_location_index = (self.current_location_index + 1) % len(self.locations)
                if attempt == max_retries - 1:
                    raise HTTPException(status_code=429, detail="All locations quota exceeded. Please try again later.")
                self._init_vertexai()  # Reinitialize with new location
                print(f"Retrying with new location: {self.location}")
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail="Failed to parse LLM response as JSON")
            except ValueError as ve:
                print(f"Failed to parse, retrying, {attempt + 1}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

    def reset_location(self):
        self.current_location_index = 0
        self._init_vertexai()
        print(f"Reset to default location: {self.location}")

    def get_current_location(self):
        return self.location