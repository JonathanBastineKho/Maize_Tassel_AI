import vertexai
from vertexai.generative_models import GenerativeModel, Part
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
            "asia-southeast2",  # Jakarta, Indonesia
            "asia-east2",       # Hong Kong
            "asia-east1",       # Taiwan
            "asia-northeast1",  # Tokyo, Japan
            "asia-northeast2",  # Osaka, Japan
            "asia-northeast3",  # Seoul, South Korea
            "asia-south1",      # Mumbai, India
            "asia-south2",      # Delhi, India
            "australia-southeast1",  # Sydney, Australia
            "australia-southeast2",  # Melbourne, Australia
            "me-west1",         # Tel Aviv, Israel
            "me-central1",      # Doha, Qatar
            "europe-west4",     # Netherlands
            "europe-west2",     # London, UK
            "us-west1",         # Oregon, USA
            "us-central1",      # Iowa, USA
            "us-east1",         # South Carolina, USA
        ]
        self.current_location_index = 0
        self._init_vertexai()

    def _init_vertexai(self):
        self.location = self.locations[self.current_location_index]
        vertexai.init(project=self.project_id, location=self.location, credentials=self.credential)
        self.flash_model = GenerativeModel(model_name="gemini-1.5-flash-001")

    def filter_image(self, image_uris: List[str], search: str, max_retries: int = 5):
        for attempt in range(max_retries):
            try:
                image_parts = [Part.from_uri(uri, mime_type="image/jpeg") for uri in image_uris]
                prompt = f"""
                These are the list of images of corn field. Based on this description of search, return the images that matches the search description in a list.
                return it in the format of a list:
                
                <examples>
                [0, 1, 2, 3, 4, 9, 10, 12, 20]
                [3, 5, 10]
                []
                </examples>

                where the number indicates the index of the image
                and return an empty list if there are none that match

                Description:
                '{search}'
                """

                contents = image_parts + [prompt]
                response = self.flash_model.generate_content(contents)
                matched_indices = json.loads(response.text)
                
                if isinstance(matched_indices, list):
                    return matched_indices
                else:
                    raise ValueError("Unexpected response format from LLM")
                
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
                raise HTTPException(status_code=500, detail=str(ve))
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

    def reset_location(self):
        self.current_location_index = 0
        self._init_vertexai()
        print(f"Reset to default location: {self.location}")

    def get_current_location(self):
        return self.location