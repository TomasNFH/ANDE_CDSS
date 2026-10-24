"""
Script to load and test a saved RNN model for oncology predictions.

Usage:
    python load_RNN_model.py
"""

import os
import pickle
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.nn.utils.rnn import pad_sequence, pack_padded_sequence, pad_packed_sequence

# Import the model class (same as in training script)
class BasicRNN(nn.Module):  
    def __init__(self, input_size=7, hidden_size=64, num_layers=1, output_size=1): 
        super(BasicRNN, self).__init__() 
        self.rnn = nn.RNN(input_size, hidden_size, num_layers, batch_first=True)  
        self.fc = nn.Linear(hidden_size, output_size) 

    def forward(self, x, lengths): 
        packed = pack_padded_sequence(x, lengths.cpu(), batch_first=True, enforce_sorted=False)
        packed_out, h_n = self.rnn(packed)
        out_padded, _ = pad_packed_sequence(packed_out, batch_first=True)
        logits = self.fc(out_padded)
        return logits


def load_model(model_dir='TrainedModels/RNN_oncologia'):
    """
    Load a saved RNN model and related components.
    
    Args:
        model_dir: Path to the directory containing saved model files
        
    Returns:
        model: Loaded PyTorch model
        model_info: Dictionary with model metadata
        scaler: StandardScaler used for preprocessing
        X_test: Test features
        y_test: Test targets
        lengths_test: Sequence lengths for test data
    """
    # Change to flask-server directory
    os.chdir(os.path.normpath(os.getcwd() + os.sep + os.pardir))
    os.chdir(os.path.normpath(os.getcwd() + os.sep + os.pardir))
    
    model_path = os.path.join(model_dir, 'model.pth')
    info_path = os.path.join(model_dir, 'model_info.pkl')
    scaler_path = os.path.join(model_dir, 'scaler.pkl')
    
    # Load model info
    with open(info_path, 'rb') as f:
        model_info = pickle.load(f)
    
    print(f"Loaded model info:")
    print(f"  Best validation accuracy: {model_info['best_accuracy']:.4f}")
    print(f"  Mean validation accuracy: {model_info['mean_accuracy']:.4f} ± {model_info['std_accuracy']:.4f}")
    print(f"  Predictors: {model_info['predictors']}")
    print(f"  Target: {model_info['target']}")
    
    # Initialize model with saved architecture
    model = BasicRNN(
        input_size=model_info['input_size'],
        hidden_size=model_info['hidden_size'],
        num_layers=model_info['num_layers'],
        output_size=model_info['output_size']
    )
    
    # Load model weights
    model.load_state_dict(torch.load(model_path, map_location='cpu'))
    model.eval()
    print(f"\nModel loaded from {model_path}")
    
    # Load scaler
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)
    print(f"Scaler loaded from {scaler_path}")
    
    # Load test data if available
    X_test = None
    y_test = None
    lengths_test = None
    
    X_test_path = os.path.join(model_dir, 'X_test.npy')
    y_test_path = os.path.join(model_dir, 'y_test.npy')
    lengths_test_path = os.path.join(model_dir, 'lengths_test.npy')
    
    if os.path.exists(X_test_path):
        X_test = torch.Tensor(np.load(X_test_path))
        y_test = torch.Tensor(np.load(y_test_path))
        lengths_test = torch.tensor(np.load(lengths_test_path), dtype=torch.long)
        print(f"Test data loaded")
    
    return model, model_info, scaler, X_test, y_test, lengths_test


def evaluate_model(model, X_test, y_test, lengths_test, model_info):
    """
    Evaluate the model on test data.
    
    Args:
        model: Loaded PyTorch model
        X_test: Test features tensor
        y_test: Test targets tensor
        lengths_test: Sequence lengths tensor
        model_info: Model metadata dictionary
    """
    model.eval()
    criterion = nn.BCEWithLogitsLoss()
    
    with torch.no_grad():
        logits = model(X_test, lengths_test).squeeze()
        test_loss = criterion(logits, y_test)
        
        # Calculate predictions
        probs = torch.sigmoid(logits).numpy()
        predictions = np.round(probs * 2, 0)
        
        print(f"\n--- Test Evaluation ---")
        print(f"Test Loss: {test_loss.item():.4f}")
        
        # Calculate accuracy per sequence
        accuracies = []
        for idx, length in enumerate(lengths_test):
            y_actual = y_test[idx][:length].numpy()
            y_pred = predictions[idx][:length]
            accuracy = np.mean((y_pred == y_actual).astype(int))
            accuracies.append(accuracy)
        
        mean_accuracy = np.mean(accuracies)
        std_accuracy = np.std(accuracies)
        print(f"Mean Test Accuracy: {mean_accuracy:.4f} ± {std_accuracy:.4f}")
        
        return predictions, accuracies


def predict_single_sequence(model, scaler, sequence_data, model_info):
    """
    Make predictions on a single sequence of data.
    
    Args:
        model: Loaded PyTorch model
        scaler: StandardScaler for preprocessing
        sequence_data: pandas DataFrame with predictor columns
        model_info: Model metadata dictionary
        
    Returns:
        predictions: Array of predictions for each timestep
        probabilities: Array of probabilities for each timestep
    """
    model.eval()
    
    # Preprocess the data
    predictors = model_info['predictors']
    sequence_scaled = scaler.transform(sequence_data[predictors].values)
    
    # Convert to tensor and add batch dimension
    X = torch.Tensor(sequence_scaled).unsqueeze(0)  # (1, seq_len, features)
    length = torch.tensor([len(sequence_scaled)], dtype=torch.long)
    
    with torch.no_grad():
        logits = model(X, length).squeeze()
        probabilities = torch.sigmoid(logits).numpy()
        predictions = np.round(probabilities * 2, 0)
    
    return predictions, probabilities


if __name__ == "__main__":
    # Load the model
    model, model_info, scaler, X_test, y_test, lengths_test = load_model()
    
    # Evaluate on test data if available
    if X_test is not None and y_test is not None and lengths_test is not None:
        predictions, accuracies = evaluate_model(model, X_test, y_test, lengths_test, model_info)
        
        # Example: Predict on first test sequence
        print(f"\n--- Example Prediction ---")
        first_length = lengths_test[0].item()
        print(f"Sequence length: {first_length}")
        print(f"Predictions: {predictions[0][:first_length]}")
        print(f"Ground truth: {y_test[0][:first_length].numpy()}")
    
    print("\nModel loaded and ready for predictions!")

