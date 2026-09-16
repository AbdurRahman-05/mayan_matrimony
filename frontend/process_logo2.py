from PIL import Image
import shutil

def process_file(source_path, dest_path, is_icon=False, is_splash=False):
    img = Image.open(source_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # public/logo.png has transparent background, so getbbox() finds the actual logo
    bbox = img.getbbox()
    if not bbox:
        print(f"{source_path} is empty")
        return
    
    cropped = img.crop(bbox)
    
    if is_icon or is_splash:
        w, h = cropped.size
        # splash should be 2732x2732
        # icon could be 1024x1024
        new_size = 2732 if is_splash else 1024
        
        # INCREASE the target width to make it much bigger.
        # For app icons on newer androids, maximizing size avoids it becoming tiny inside standard system padding.
        # Let's make target width 95% of icon, and maybe 40% of splash.
        target_w = int(new_size * 0.40) if is_splash else int(new_size * 0.95)
        
        # Calculate aspect ratio of cropped text
        aspect = w / h
        new_w = target_w
        new_h = int(new_w / aspect)
        
        resized_logo = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # White background
        new_img = Image.new('RGBA', (new_size, new_size), (255, 255, 255, 255))
        
        # Center coordinates
        x_offset = (new_size - new_w) // 2
        y_offset = (new_size - new_h) // 2
        
        new_img.paste(resized_logo, (x_offset, y_offset), mask=resized_logo)
        new_img.save(dest_path)
        print(f"Processed {source_path} -> {dest_path} Output size: {new_size}x{new_size}")

process_file('public/logo.png', 'assets/icon.png', is_icon=True)
process_file('public/logo.png', 'assets/splash.png', is_splash=True)
