import * as tf from '@tensorflow/tfjs';

let model: tf.GraphModel | null = null;

/**
 * Load a pre-trained digit recognition model
 */
export const loadDigitModel = async (): Promise<void> => {
    if (model) return;

    console.log('[TF] Starting model load...');
    const startTime = performance.now();

    try {
        // Set backend explicitly
        await tf.setBackend('webgl');
        await tf.ready();
        console.log(`[TF] Backend: ${tf.getBackend()}`);

        // Load with timeout
        const modelPromise = tf.loadGraphModel('/models/tfjs_model/model.json');
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Model loading timeout (30s)')), 30000)
        );

        model = await Promise.race([modelPromise, timeoutPromise]) as tf.GraphModel;

        const loadTime = performance.now() - startTime;
        console.log(`[TF] Model loaded successfully in ${loadTime.toFixed(0)}ms`);
        console.log(`[TF] Model inputs:`, model.inputs.map(i => ({ name: i.name, shape: i.shape })));
        console.log(`[TF] Model outputs:`, model.outputs.map(o => ({ name: o.name, shape: o.shape })));
    } catch (error) {
        console.error('[TF] Failed to load digit model:', error);

        // Try CPU backend as fallback
        try {
            console.log('[TF] Attempting CPU backend fallback...');
            await tf.setBackend('cpu');
            await tf.ready();
            model = await tf.loadGraphModel('/models/tfjs_model/model.json');
            console.log('[TF] Model loaded with CPU backend');
        } catch (fallbackError) {
            console.error('[TF] CPU fallback also failed:', fallbackError);
            throw new Error(`Failed to load model: ${error.message}`);
        }
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

        // CRITICAL: Sudoku has BLACK digits on WHITE background
        // Training data has WHITE digits on BLACK background
        // So we MUST invert: white background -> black background
        tensor = tf.scalar(1).sub(tensor);

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

    console.log(`[TF] Processing batch of ${cellCanvases.length} cells`);
    const startTime = performance.now();

    try {
        // Process with timeout
        const predictionPromise = tf.tidy(() => {
            // Preprocess all images
            const tensors = cellCanvases.map(canvas => preprocessCellImage(canvas));

            // Concatenate into a single batch
            const batchTensor = tf.concat(tensors);

            // Run batch inference
            const predictions = model!.predict(batchTensor) as tf.Tensor;
            const probabilities = predictions.arraySync() as number[][];

            // Extract results
            return probabilities.map((probs, idx) => {
                let maxProb = -1;
                let predictedClass = 0;

                // Find class with highest probability (0-9)
                for (let i = 0; i < probs.length; i++) {
                    if (probs[i] > maxProb) {
                        maxProb = probs[i];
                        predictedClass = i;
                    }
                }

                // If predicted class is 0 or confidence is too low, treat as empty
                const digit = (predictedClass === 0 || maxProb < 0.3) ? 0 : predictedClass;

                if (idx < 5) { // Log first 5 for debugging
                    console.log(`[TF] Cell ${idx}: class=${predictedClass}, conf=${maxProb.toFixed(3)}, digit=${digit}`);
                }

                return {
                    digit,
                    confidence: maxProb
                };
            });
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Batch prediction timeout (60s)')), 60000)
        );

        const results = await Promise.race([predictionPromise, timeoutPromise]);

        const processingTime = performance.now() - startTime;
        console.log(`[TF] Batch processed in ${processingTime.toFixed(0)}ms (${(processingTime / cellCanvases.length).toFixed(1)}ms per cell)`);

        return results;
    } catch (error) {
        console.error('[TF] Batch recognition failed:', error);
        throw error;
    }
};

/**
 * Check if model is loaded
 */
export const isModelLoaded = (): boolean => {
    return model !== null;
};
