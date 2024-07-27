import vertexai
from vertexai.generative_models import GenerativeModel, Part, GenerationConfig, Content
from google.oauth2 import service_account
from google.api_core.exceptions import ResourceExhausted
from typing import List, AsyncGenerator
import json
from fastapi import HTTPException, UploadFile
from typing import Optional
import asyncio
import base64
import pickle
from googleapiclient.discovery import build

class LLMmanager:
    def __init__(self, credential_path: str, project_id: str) -> None:
        self.credential = service_account.Credentials.from_service_account_file(credential_path)
        self.youtube = build('youtube', 'v3', credentials=self.credential)
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
        self.pro_model = GenerativeModel(model_name="gemini-1.5-pro")
    
    def search_youtube(self, keyword: str, max_results: int = 3) -> List[str]:
        try:
            search_response = self.youtube.search().list(
                q=keyword,
                type='video',
                part='id,snippet',
                maxResults=max_results
            ).execute()

            video_links = []
            for search_result in search_response.get('items', []):
                video_id = search_result['id']['videoId']
                video_link = f"https://www.youtube.com/watch?v={video_id}"
                video_links.append(video_link)

            return video_links

        except Exception as e:
            print(f"An HTTP error {e}")
            return []

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
                {{"matched_indices": [0, 1, 2, 10, 17, 19]}}
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

    async def chat_disease(self, text: str, image_data: Optional[bytes] = None, image_mime_type: Optional[str] = None, chat_history: str = None, max_tries: int = 10) -> AsyncGenerator[str, None]:
        response_schema = {
            "type": "object",
            "properties": {
                "is_relevant": {"type": "boolean"},
                "description": {"type": "string"},
                "disease_detected": {"type": "boolean"},
                "disease_name": {"type": "string"},
                "confidence_level": {"type": "number", "minimum": 0, "maximum": 1},
                "symptoms": {"type": "array", "items": {"type": "string"}},
                "recommended_actions": {"type": "array", "items": {"type": "string"}},
                "additional_notes": {"type": "string"},
                "youtube_search_keyword": {"type": "string"}
            },
            "required": ["is_relevant", "response"]
        }
        for attempt in range(max_tries):
            try:
                chat_session = self.pro_model.start_chat(history=self.deserialize_chat_history(chat_history), response_validation=False)

                content_parts = []
                if image_data and image_mime_type:
                    image_part = Part.from_data(image_data, mime_type=image_mime_type)
                    content_parts.append(image_part)

                prompt = f"""
                You are an AI assistant specialized in maize diseases. Your primary task is to provide information and analysis related to maize diseases.

                User's input: {text}

                If the user's input is related to maize diseases, provide a comprehensive response. If an image is provided, analyze it for signs of maize diseases.

                If the maize plant is not healthy, you should provide the disease type or some defects to the disease_name field, such as rust, leaf blight, nutrient deficiency or a fungal disease. If so, the disease_detected field should be true.

                If the user's input is not related to maize diseases, politely inform them that you can only assist with maize disease-related queries.

                Respond in the following format:
                1. Determine if the query is relevant to maize diseases (set 'is_relevant' to true or false).
                2. Provide a description in the 'description' field.
                3. If relevant and a disease is detected, fill out the other fields (disease_detected, disease_name, etc.).
                4. If you think you have other extra information that are DIFFERENT from the 'description' field, you can add it on 'additional_notes'.
                5. If you think the plant is healthy, just tell me that it is healthy, No need to tell that you cannot provide further diagnosis, just say the plant is healthy and the reason why it's healthy.
                6. If not relevant, only fill out 'is_relevant' and 'description' fields.
                7. If a disease is detected, provide a concise and relevant search keyword for YouTube in the 'youtube_search_keyword' field. This should be a short, specific phrase that would yield informative results about the detected disease or condition when searched on YouTube.
                
                For recommended actions and symptoms fields, just provide a list of the text, no need to include the numberings
                
                For the youtube_search_keyword, use a format like "maize [disease_name] treatment" or "corn [symptom] solutions".
                """

                content_parts.append(prompt)

                generation_config = GenerationConfig(
                    temperature=0.1,
                    top_p=1,
                    top_k=1,
                    candidate_count=1,
                    response_mime_type="application/json",
                    response_schema=response_schema
                )

                responses = chat_session._send_message_streaming(
                    content_parts,
                    generation_config=generation_config
                )

                partial_response = ""
                for response in responses:
                    for chunk in response.text:
                        partial_response += chunk
                        try:
                            yield partial_response
                            partial_response = ""
                        except json.JSONDecodeError:
                            pass
                    await asyncio.sleep(0)  # Yield control to the event loop

                if partial_response:
                    yield partial_response

                # Yield the updated chat history
                yield json.dumps({"chat_history" : self.serialize_chat_history(chat_session.history)})

                return
            
            except ResourceExhausted:
                print(f"Quota exceeded for location: {self.location}. Attempt {attempt + 1} of {max_tries}")
                self.current_location_index = (self.current_location_index + 1) % len(self.locations)
                self._init_vertexai()
                
                if attempt > max_tries:
                    raise HTTPException(status_code=429, detail="All locations quota exceeded. Please try again later.")
            
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail="Failed to parse LLM response as JSON")
            
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"An unexpected error occured: {str(e)}")
        
    def serialize_chat_history(self, chat_history: list) -> str:
        """
        Serialize the chat history into a base64-encoded string.
        """
        serialized_history = []
        for content in chat_history:
            if isinstance(content, Content):
                serialized_content = {
                    'role': content.role,
                    'parts': [
                        {
                            'text': part.text if hasattr(part, 'text') else None,
                            'inline_data': {
                                'mime_type': part.inline_data.mime_type,
                                'data': base64.b64encode(part.inline_data.data).decode('utf-8')
                            } if hasattr(part, 'inline_data') else None
                        }
                        for part in content.parts
                    ]
                }
                serialized_history.append(serialized_content)
            else:
                # Handle other types if necessary
                serialized_history.append(str(content))
        serialized_bytes = pickle.dumps(serialized_history)
        return base64.b64encode(serialized_bytes).decode('utf-8')
    
    def deserialize_chat_history(self, serialized_history: str = None) -> list:
        """
        Deserialize the base64-encoded string back into a list of Content objects.
        """
        # Decode base64 and unpickle
        if not serialized_history:
            return []
        decoded_bytes = base64.b64decode(serialized_history)
        deserialized_list = pickle.loads(decoded_bytes)
        
        chat_history = []
        for item in deserialized_list:
            if isinstance(item, dict) and 'role' in item and 'parts' in item:
                parts = []
                for part in item['parts']:
                    if part['text'] is not None:
                        parts.append(Part.from_text(part['text']))
                    elif part['inline_data'] is not None:
                        inline_data = part['inline_data']
                        parts.append(
                            Part.from_data(
                                base64.b64decode(inline_data['data']),
                                mime_type=inline_data['mime_type']
                            )
                        )
                chat_history.append(Content(role=item['role'], parts=parts))
            else:
                # Handle other types if necessary
                chat_history.append(item)
        
        return chat_history

    def get_current_location(self):
        return self.location
    
    async def future_yield(self, weather_forecast: list, historical_count: list, max_retries: int = 7) -> dict:
        response_schema = {
            "type": "object",
            "properties": {
                "max_change": {"type": "number", "minimum": -1, "maximum": 1},
                "min_change": {"type": "number", "minimum": -1, "maximum": 1},
                "avg_change": {"type": "number", "minimum": -1, "maximum": 1},
                "explanation": {"type": "string"}
            },
            "required": ["max_change", "min_change", "avg_change", "explanation"]
        }
        
        prompt = f"""
        You are an expert AI assistant specializing in agricultural yield prediction, particularly for maize crops. 
        Your task is to provide an estimation of the change in tassel count 14 days from now, based on the given weather forecast and historical data.

        Weather forecast data for the next 14 days:
        {json.dumps(weather_forecast, indent=2)}

        Historical tassel count data:
        {json.dumps(historical_count, indent=2)}

        Using your expertise in maize growth patterns and the provided data, estimate the following:
        1. The maximum percentage change in tassel count (positive or negative)
        2. The minimum percentage change in tassel count (positive or negative)
        3. The average (most likely) percentage change in tassel count (positive or negative)
        
        Remember, while exact predictions are impossible, your role is to provide the best possible estimation based on the available information. Be decisive in your analysis.

        In your explanation:
        - Clearly state the key factors influencing your prediction
        - Highlight how specific weather patterns in the forecast are likely to impact tassel development
        - Draw insights from the historical data to support your estimates
        - Briefly mention any assumptions you've made
        - Focus on the most probable scenarios rather than extreme outliers
        - Make the text more readable by highlighting key points or make bullet points. and don't make it too long as I am putting it into a tool tip, but don't make it too short too.

        Provide your response in the following JSON format:
        {{
            "max_change": float,
            "min_change": float,
            "avg_change": float,
            "explanation": string
        }}

        Express all percentage changes as decimals (e.g., 0.2 for 20% increase, -0.15 for 15% decrease).
        Your explanation should be concise yet comprehensive, emphasizing the confidence in your estimation while acknowledging the complexity of the prediction.
        """

        for attempt in range(max_retries):
            try:
                generation_config = GenerationConfig(
                    temperature=0.2,
                    top_p=1,
                    top_k=1,
                    candidate_count=1,
                    max_output_tokens=1024,
                    stop_sequences=[],
                    response_mime_type="application/json",
                    response_schema=response_schema
                )

                response = self.pro_model.generate_content(
                    prompt,
                    generation_config=generation_config
                )
                
                # Parse the JSON response
                result = json.loads(response.text)
                
                # Validate the response structure
                required_keys = ["max_change", "min_change", "avg_change", "explanation"]
                if not all(key in result for key in required_keys):
                    raise ValueError("Invalid response structure")
                
                return result

            except ResourceExhausted:
                print(f"Quota exceeded for location: {self.location}. Attempt {attempt + 1} of {max_retries}")
                self.current_location_index = (self.current_location_index + 1) % len(self.locations)
                self._init_vertexai()
                
                if attempt == max_retries - 1:
                    raise HTTPException(status_code=429, detail="All locations quota exceeded. Please try again later.")
                
                print(f"Retrying with new location: {self.location}")

            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail="Failed to parse LLM response as JSON")
            except ValueError as ve:
                raise HTTPException(status_code=500, detail=str(ve))
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

        raise HTTPException(status_code=500, detail="Failed to generate prediction after maximum retries")