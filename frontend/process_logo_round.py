from PIL import Image, ImageDraw
import shutil
import math

def process_file(source_path, dest_path, is_icon=False, is_splash=False):
    img = Image.open(source_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    bbox = img.getbbox()
    if not bbox:
        print(f"{source_path} is empty")
        return
    
    cropped = img.crop(bbox)
    
    if is_icon or is_splash:
        w, h = cropped.size
        new_size = 2732 if is_splash else 1024
        
        target_w = int(new_size * 0.40) if is_splash else int(new_size * 0.70)
        
        aspect = w / h
        new_w = target_w
        new_h = int(new_w / aspect)
        
        resized_logo = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Transparent background
        new_img = Image.new('RGBA', (new_size, new_size), (0, 0, 0, 0))
        
        # Draw a white circle
        draw = ImageDraw.Draw(new_img)
        
        # Calculate circle diameter to comfortably fit the logo
        circle_d = int(math.sqrt(new_w**2 + new_h**2) * 1.1)
        
        circle_x = (new_size - circle_d) // 2
        circle_y = (new_size - circle_d) // 2
        draw.ellipse([circle_x, circle_y, circle_x + circle_d, circle_y + circle_d], fill=(255, 255, 255, 255))
        
        # Paste logo
        x_offset = (new_size - new_w) // 2
        y_offset = (new_size - new_h) // 2
        new_img.paste(resized_logo, (x_offset, y_offset), mask=resized_logo)
        
        new_img.save(dest_path)
        print(f"Processed {source_path} -> {dest_path} Output size: {new_size}x{new_size}")

process_file('public/logo.png', 'assets/icon.png', is_icon=True)
process_file('public/logo.png', 'assets/splash.png', is_splash=True)
