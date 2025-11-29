import numpy as np
# Hack to fix tensorflowjs compatibility with numpy >= 1.20
if not hasattr(np, 'object'):
    np.object = object
if not hasattr(np, 'bool'):
    np.bool = bool
if not hasattr(np, 'int'):
    np.int = int

import os
import tensorflowjs as tfjs
import tensorflow as tf

# Configuration
MODEL_PATH = 'sudoku_cnn.keras'
OUTPUT_DIR = 'public/models/sudoku_cnn_tfjs'

def main():
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model file {MODEL_PATH} not found. Please run train_model.py first.")
        return

    print(f"Loading model from {MODEL_PATH}...")
    model = tf.keras.models.load_model(MODEL_PATH)
    
    print(f"Converting model to TensorFlow.js format...")
    tfjs.converters.save_keras_model(model, OUTPUT_DIR)
    
    print(f"Model saved to {OUTPUT_DIR}")
    
    # Verify files
    if os.path.exists(os.path.join(OUTPUT_DIR, 'model.json')):
        print("Success: model.json created.")
    else:
        print("Error: model.json not found.")

if __name__ == "__main__":
    main()
