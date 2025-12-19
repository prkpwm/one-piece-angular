import os
import json
from PIL import Image

def convert_images_to_webp():
    assets_dir = 'src/assets'
    target_size = (512, 512)
    
    # Get all image files
    for filename in os.listdir(assets_dir):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            input_path = os.path.join(assets_dir, filename)
            output_filename = os.path.splitext(filename)[0] + '.webp'
            output_path = os.path.join(assets_dir, output_filename)
            
            try:
                # Resize and convert to WebP
                with Image.open(input_path) as img:
                    img.thumbnail(target_size, Image.Resampling.LANCZOS)
                    img.save(output_path, 'WebP', quality=85, optimize=True)
                
                print(f"Converted: {filename} -> {output_filename} (resized to {img.size})")
                
                # Delete original file if different
                if input_path != output_path:
                    os.remove(input_path)
                
            except Exception as e:
                print(f"Failed to convert {filename}: {e}")
    
    # Update seasons.json to use .webp extensions
    seasons_path = os.path.join(assets_dir, 'seasons.json')
    with open(seasons_path, 'r') as f:
        data = json.load(f)
    
    for season in data['seasons']:
        for i, image_path in enumerate(season['images']):
            if image_path.startswith('./assets/'):
                # Replace extension with .webp
                base_name = os.path.splitext(image_path)[0]
                season['images'][i] = base_name + '.webp'
    
    with open(seasons_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print("Updated seasons.json with WebP extensions")

if __name__ == "__main__":
    convert_images_to_webp()