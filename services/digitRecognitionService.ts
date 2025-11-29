import * as tf from '@tensorflow/tfjs';

let model: tf.GraphModel | null = null;

/**
 * Load a pre-trained digit recognition model
 */
export const loadDigitModel = async (): Promise<void> => {
    if (model) return;

    try {
        // Load the trained model from public/models/tfjs_model/
        model = await tf.loadGraphModel('/models/tfjs_model/model.json');
        console.log('Digit recognition model loaded');
    } catch (error) {
        console.error('Failed to load digit model:', error);
        throw error;
    }
};

/**
 * Preprocess a cell image for digit recognition
 */
function preprocessCellImage(canvas: HTMLCanvasElement): tf.Tensor {
    return tf.tidy(() => {
        // Convert canvas to tensor
        let tensor = tf.browser.fromPixels(canvas, 1); // grayscale

        // Resize to 28x28 (standard for digit recognition)
        tensor = tf.image.resizeBilinear(tensor, [28, 28]);

        // Normalize to [0, 1]
        tensor = tensor.div(255.0);

        // Invert if needed (model expects white digits on black background)
        // Check if image is mostly white (Sudoku has black digits on white)
        const mean = tensor.mean().dataSync()[0];
        if (mean > 0.5) {
            // Invert: white background -> black background
            tensor = tf.scalar(1).sub(tensor);
        }

        // Add batch dimension
        tensor = tensor.expandDims(0);

        return tensor;
    });
}

/**
 * Recognize a digit from a cell image
 * Returns the predicted digit (1-9) and confidence score
 */
export const recognizeDigit = async (cellCanvas: HTMLCanvasElement): Promise<{ digit: number, confidence: number }> => {
    if (!model) {
        await loadDigitModel();
    }

    return tf.tidy(() => {
        const inputTensor = preprocessCellImage(cellCanvas);

        // Run inference
        const predictions = model!.predict(inputTensor) as tf.Tensor;
        const probabilities = predictions.dataSync();

        // Find the digit with highest probability (excluding 0)
        let maxProb = 0;
        let predictedDigit = 0;

        for (let i = 1; i <= 9; i++) {
            if (probabilities[i] > maxProb) {
                maxProb = probabilities[i];
                predictedDigit = i;
            }
        }

        return {
            digit: predictedDigit,
            confidence: maxProb
        };
    });
};

/**
 * Batch recognize digits from multiple cell images
 * More efficient than recognizing one at a time
 */
export const recognizeDigitsBatch = async (cellCanvases: HTMLCanvasElement[]): Promise<Array<{ digit: number, confidence: number }>> => {
    if (!model) {
        await loadDigitModel();
    }

    if (cellCanvases.length === 0) return [];

    return tf.tidy(() => {
        // Preprocess all images
        const tensors = cellCanvases.map(canvas => preprocessCellImage(canvas));

        // Concatenate into a single batch
        const batchTensor = tf.concat(tensors);

        // Run batch inference
        const predictions = model!.predict(batchTensor) as tf.Tensor;
        const probabilities = predictions.arraySync() as number[][];

        // Extract results
        return probabilities.map(probs => {
            let maxProb = 0;
            let predictedDigit = 0;

            for (let i = 1; i <= 9; i++) {
                if (probs[i] > maxProb) {
                    maxProb = probs[i];
                    predictedDigit = i;
                }
            }

            return {
                digit: predictedDigit,
                confidence: maxProb
            };
        });
    });
};

/**
 * Check if model is loaded
 */
export const isModelLoaded = (): boolean => {
    return model !== null;
};
