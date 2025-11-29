import os
import numpy as np

# Monkeypatch for tensorflowjs compatibility with newer numpy
if not hasattr(np, 'object'):
    np.object = object
if not hasattr(np, 'bool'):
    np.bool = bool

import tensorflow as tf
# Monkeypatch for tensorflow_hub compatibility
# tensorflowjs imports tensorflow_hub, which fails on newer TF versions due to missing tf.compat.v1.estimator
# We mock tensorflow_hub since we don't need it for saving keras models
import sys
import types
if 'tensorflow_hub' not in sys.modules:
    mock_hub = types.ModuleType('tensorflow_hub')
    sys.modules['tensorflow_hub'] = mock_hub
    # Also mock estimator inside hub if needed, but just mocking the module might be enough
    # if tensorflowjs imports it. 
    # However, tensorflowjs imports it as: import tensorflow_hub as hub
    # And then uses hub.load_module_spec etc.
    # We might need to add dummy functions if they are called at import time.
    # Checking the traceback, it fails AT IMPORT of tensorflow_hub.
    # So if we put it in sys.modules, the real import is skipped.

import tensorflow as tf
from tensorflow.keras import layers, models

from tensorflow.keras import layers, models
import tensorflowjs as tfjs

# Configuration
DATA_DIR = 'scripts/train/data'
MODEL_PATH = 'sudoku_cnn.keras'
BATCH_SIZE = 128
EPOCHS = 15

def load_data():
    print("Loading data...")
    x_train = np.load(os.path.join(DATA_DIR, 'x_train.npy'))
    y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
    x_test = np.load(os.path.join(DATA_DIR, 'x_test.npy'))
    y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))
    return (x_train, y_train), (x_test, y_test)

def create_model():
    model = models.Sequential([
        layers.Input(shape=(28, 28, 1)),
        
        # First Convolutional Block
        layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Second Convolutional Block
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Third Convolutional Block
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Dense Layers
        layers.Flatten(),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(10, activation='softmax') # 0-9 digits
    ])
    
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    return model

def main():
    # 1. Load Data
    (x_train, y_train), (x_test, y_test) = load_data()
    print(f"Training data shape: {x_train.shape}")
    print(f"Test data shape: {x_test.shape}")
    
    # 2. Create Model
    model = create_model()
    model.summary()
    
    # 3. Train
    print("Starting training...")
    history = model.fit(x_train, y_train, 
                        epochs=EPOCHS, 
                        batch_size=BATCH_SIZE, 
                        validation_data=(x_test, y_test))
    
    # 4. Evaluate
    print("Evaluating model...")
    test_loss, test_acc = model.evaluate(x_test, y_test, verbose=2)
    print(f'\nTest accuracy: {test_acc:.4f}')
    
    # 5. Save
    print(f"Saving model to {MODEL_PATH}...")
    model.save(MODEL_PATH) # Save as .keras (Keras 3)
    
    # Also save as SavedModel for tfjs conversion
    SAVED_MODEL_DIR = 'saved_model'
    print(f"Saving model to {SAVED_MODEL_DIR} for tfjs conversion...")
    model.export(SAVED_MODEL_DIR) # Keras 3 uses export for SavedModel
    print("Done.")
    
    print(f"Converting model to tfjs...")
    # Use convert_tf_saved_model instead of save_keras_model
    tfjs.converters.convert_tf_saved_model(SAVED_MODEL_DIR, "tfjs_model")
    print("Done.")

if __name__ == "__main__":
    main()
