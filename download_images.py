import json
import requests
import os
from urllib.parse import urlparse

def download_images():
    # Load seasons.json
    with open('src/assets/seasons.json', 'r') as f:
        data = json.load(f)
    
    # Create assets directory if it doesn't exist
    os.makedirs('src/assets', exist_ok=True)
    
    for season in data['seasons']:
        title = season['title']
        images = season['images']
        
        for i, img_url in enumerate(images):
            # Skip local files
            if img_url.startswith('./assets/'):
                continue
                
            try:
                # Get file extension from URL
                parsed_url = urlparse(img_url)
                ext = os.path.splitext(parsed_url.path)[1] or '.jpg'
                
                # Create filename
                filename = f"{title}{f'_{i+1}' if len(images) > 1 else ''}{ext}"
                filepath = f"src/assets/{filename}"
                
                # Download image
                response = requests.get(img_url, stream=True)
                response.raise_for_status()
                
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                print(f"Downloaded: {filename}")
                
            except Exception as e:
                print(f"Failed to download {img_url}: {e}")

if __name__ == "__main__":
    download_images()