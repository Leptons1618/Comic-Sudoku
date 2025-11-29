import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.datasets import mnist
from PIL import Image, ImageDraw, ImageFont
import random

# Configuration
OUTPUT_DIR = 'scripts/train/data'
IMG_SIZE = 28
NUM_SAMPLES_PER_FONT = 2000  # Number of samples per digit per font
FONTS = [
    "arial.ttf",
    "times.ttf",
    "cour.ttf",
    "calibri.ttf",
    "verdana.ttf",
    "consola.ttf",  # Good for fixed width
]

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def load_mnist():
    print("Loading MNIST dataset...")
    (x_train, y_train), (x_test, y_test) = mnist.load_data()
    
    # Normalize and reshape
    x_train = x_train.astype('float32') / 255.0
    x_test = x_test.astype('float32') / 255.0
    
    x_train = np.expand_dims(x_train, -1)
    x_test = np.expand_dims(x_test, -1)
    
    return (x_train, y_train), (x_test, y_test)

def generate_digit_image(digit, font_path, size=28):
    # Create a blank image
    image = Image.new('L', (size, size), color=0) # Black background
    draw = ImageDraw.Draw(image)
    
    try:
        font = ImageFont.truetype(font_path, int(size * 0.8))
    except IOError:
        # Fallback to default if font not found
        print(f"Warning: Font {font_path} not found. Using default.")
        font = ImageFont.load_default()

    # Get bounding box to center the text
    bbox = draw.textbbox((0, 0), str(digit), font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) / 2
    y = (size - text_height) / 2 - bbox[1] # Adjust for vertical alignment
    
    draw.text((x, y), str(digit), fill=255, font=font)
    
    return np.array(image)

def augment_image(image):
    # Random rotation
    angle = random.uniform(-15, 15)
    M = cv2.getRotationMatrix2D((IMG_SIZE/2, IMG_SIZE/2), angle, 1)
    image = cv2.warpAffine(image, M, (IMG_SIZE, IMG_SIZE))
    
    # Random noise
    if random.random() > 0.5:
        noise = np.random.normal(0, 0.05, image.shape)
        image = image + noise
        image = np.clip(image, 0, 1)
        
    # Random blur
    if random.random() > 0.7:
        ksize = random.choice([3]) # Keep it subtle for 28x28
        image = cv2.GaussianBlur(image, (ksize, ksize), 0)
        
    return image

def generate_synthetic_data():
    print("Generating synthetic data...")
    x_data = []
    y_data = []
    
    # Check for fonts in Windows font directory
    font_dir = "C:/Windows/Fonts/"
    available_fonts = []
    for font in FONTS:
        if os.path.exists(os.path.join(font_dir, font)):
            available_fonts.append(os.path.join(font_dir, font))
        else:
            # Try looking for bold/italic versions or just skip
            print(f"Font {font} not found in {font_dir}")

    if not available_fonts:
        print("No custom fonts found. Using default PIL font.")
        available_fonts = [None] # None triggers default in generate_digit_image logic (needs tweak)

    for font_path in available_fonts:
        print(f"Generating for font: {font_path}")
        for digit in range(1, 10): # Sudoku digits 1-9. 0 is empty usually, but we can train 0 if needed. 
                                   # Actually Sudoku is 1-9. Empty cells are 0.
                                   # Let's include 0 as 'empty' or just train 1-9 and handle empty separately?
                                   # Usually empty cells are detected by lack of contours. 
                                   # But having a '0' class for noise/empty might be good.
                                   # For now let's stick to 1-9 as per standard Sudoku.
            for _ in range(NUM_SAMPLES_PER_FONT):
                img = generate_digit_image(digit, font_path if font_path else "arial.ttf", IMG_SIZE)
                img = img.astype('float32') / 255.0
                img = augment_image(img)
                img = np.expand_dims(img, -1)
                
                x_data.append(img)
                y_data.append(digit)
                
    return np.array(x_data), np.array(y_data)

def main():
    ensure_dir(OUTPUT_DIR)
    
    # 1. Load MNIST (Handwritten)
    (x_mnist_train, y_mnist_train), (x_mnist_test, y_mnist_test) = load_mnist()
    
    # Filter MNIST to only keep 1-9 if we want strict Sudoku (0 is usually background)
    # But MNIST 0 looks like a zero. Sudoku empty is blank.
    # Let's keep 0-9 for robustness, maybe map 0 to something else or just keep it.
    # Standard Sudoku solvers often treat 0 as empty. 
    # Let's train on 0-9 to be safe, so if a user writes a 0 it's detected as 0.
    
    # 2. Generate Synthetic (Printed)
    x_synth, y_synth = generate_synthetic_data()
    
    # 3. Combine
    print("Combining datasets...")
    x_train = np.concatenate((x_mnist_train, x_synth), axis=0)
    y_train = np.concatenate((y_mnist_train, y_synth), axis=0)
    
    # Shuffle
    indices = np.arange(len(x_train))
    np.random.shuffle(indices)
    x_train = x_train[indices]
    y_train = y_train[indices]
    
    print(f"Total training samples: {len(x_train)}")
    
    # Save
    np.save(os.path.join(OUTPUT_DIR, 'x_train.npy'), x_train)
    np.save(os.path.join(OUTPUT_DIR, 'y_train.npy'), y_train)
    np.save(os.path.join(OUTPUT_DIR, 'x_test.npy'), x_mnist_test) # Keep MNIST test for benchmark
    np.save(os.path.join(OUTPUT_DIR, 'y_test.npy'), y_mnist_test)
    
    print("Data generation complete.")

if __name__ == "__main__":
    main()
