from PIL import Image

def process_file(file_path, is_icon=False, is_splash=False):
    img = Image.open(file_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    bbox = img.getbbox()
    if not bbox:
        print(f"{file_path} is empty")
        return
    
    cropped = img.crop(bbox)
    
    if is_icon or is_splash:
        w, h = cropped.size
        # splash should be 2732x2732
        # icon could be 1024x1024
        new_size = 2732 if is_splash else 1024
        
        # for splash, logo occupies maybe 30% of width
        # for icon, logo occupies 70% of width
        target_w = int(new_size * 0.3) if is_splash else int(new_size * 0.65)
        
        # Calculate aspect ratio of cropped text
        aspect = w / h
        new_w = target_w
        new_h = int(new_w / aspect)
        
        resized_logo = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # White background is typical for Android App Icons unless transparent is wanted.
        new_img = Image.new('RGBA', (new_size, new_size), (255, 255, 255, 255))
        
        # Center coordinates
        x_offset = (new_size - new_w) // 2
        y_offset = (new_size - new_h) // 2
        
        new_img.paste(resized_logo, (x_offset, y_offset), mask=resized_logo)
        new_img.save(file_path)
        print(f"Processed {file_path} as {'Splash' if is_splash else 'App Icon'}. New size: {new_size}x{new_size}")

process_file('assets/icon.png', is_icon=True)
process_file('assets/splash.png', is_splash=True)
