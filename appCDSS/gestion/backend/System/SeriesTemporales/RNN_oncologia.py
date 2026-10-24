import pandas as pd
import os
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from scipy import stats
# from VikParuchuri import functions as fn
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import random
from sklearn.model_selection import train_test_split
import pickle
import copy

import numpy as np  
import pandas as pd  
import matplotlib.pyplot as plt  
from sklearn.preprocessing import MinMaxScaler  
from sklearn.model_selection import train_test_split 
import torch  
import torch.nn as nn  
import torch.optim as optim 
from torch.nn.utils.rnn import pad_sequence, pack_padded_sequence, pad_packed_sequence

shuffle_flag = True


os.chdir(os.path.normpath(os.getcwd() + os.sep + os.pardir)) #go back to Test folder
os.chdir(os.path.normpath(os.getcwd() + os.sep + os.pardir)) ##go back to main folder

# Read in our data, and fill missing values by repeting last entry
data = pd.read_csv('Input/Oncologia/RNN/E3full.csv')

# Define predictors and target
PREDICTORS = ["Edad", "Sexo", "Plaquetas", "Neutrofilos", "Linfocitos", "PLR", "NLR"]
# PREDICTORS = ["Plaquetas"]
TARGET = "ClaseInt"

# Scale our data to have mean 0
scaler = StandardScaler()
data[PREDICTORS] = scaler.fit_transform(data[PREDICTORS])

### data split: Las secuencias se construyen desde la primer instancia disponible hasta la primer instancia faltante, evitando introducir discontinuidades temporales.
pacients = data['Hash'].unique()
max_cycle = 12
xs, ys = [], []
for current_pacient in pacients:
    current_data = data[data['Hash']==current_pacient]
    min_ciclo = current_data['Ciclo'].min()

    max_ciclo = 13
    for ciclo in range(current_data['Ciclo'].min(), max_cycle+1): 
        if len(current_data[current_data['Ciclo']==ciclo]) == 0:
            max_ciclo = ciclo
            break
    
    sequence_data = current_data[(current_data['Ciclo']>=min_ciclo)&(current_data['Ciclo']<max_ciclo)]
    x = torch.Tensor(sequence_data[PREDICTORS].values)
    y = torch.Tensor(sequence_data[TARGET].values)
    xs.append(x)  
    ys.append(y)

# compute original lengths BEFORE padding
lengths = torch.tensor([len(seq) for seq in xs], dtype=torch.long)
lengths_np = np.array(lengths)

x_padded = pad_sequence(xs, batch_first=True) # shape: (batch, seq, features) 
y_padded = pad_sequence(ys, batch_first=True) # shape: (batch, seq)

np_X_padded = np.array(x_padded)  
np_y_padded = np.array(y_padded)


# Split data into train and test sets  (also split lengths)
X_data, X_test, y_data, y_test, lengths_data, lengths_test = train_test_split(
    np_X_padded, np_y_padded, lengths_np, test_size=0.1, shuffle=shuffle_flag
)   #try with shuffle True when is ready
X_test = torch.Tensor(X_test)
y_test = torch.Tensor(y_test)
lengths_test = torch.tensor(lengths_test, dtype=torch.long)


### Step 6: Define the RNN model
class BasicRNN(nn.Module):  
    def __init__(self, input_size=7, hidden_size=64, num_layers=1, output_size=1): 
        super(BasicRNN, self).__init__() 
        self.rnn = nn.RNN(input_size, hidden_size, num_layers, batch_first=True)  
        self.fc = nn.Linear(hidden_size, output_size) 

    # return logits for every timestep (padded)
    def forward(self, x, lengths): 
        # x: (batch, seq, features)
        packed = pack_padded_sequence(x, lengths.cpu(), batch_first=True, enforce_sorted=False)
        packed_out, h_n = self.rnn(packed)                # packed_out is a PackedSequence
        out_padded, _ = pad_packed_sequence(packed_out, batch_first=True)  # (batch, seq, hidden_size)
        logits = self.fc(out_padded)                       # (batch, seq, output_size)
        return logits    
    

### Step 7: Train the model

EPOCHS = 100 

number_of_splits = X_data.shape[0]
samples_of_valid = int(len(X_data)/number_of_splits)
valid_loss_list = []
valid_acc_list = []
valid_acc_comparison_list = []

# Track best model for saving
best_model = None
best_accuracy = 0.1
best_valid_lenght = 0 # min valid len
min_valid_lenght = 6
best_accuracy_test = 0.0
best_accuracy_by_pacient = None
best_model_idx = 0

losses_for_fold = pd.DataFrame(columns = ['k-iteration', 'Epoch', 'Binary Cross-Entropy'])
final_eval_ret = pd.DataFrame(columns=['k-iteration', 'Pacient', 'Accuracy'])
for shift_idx in range(number_of_splits): 
    print(f"\n--- Training iteration {shift_idx+1}/{number_of_splits} ---")
    losses = [] 

    # Instancia el modelo con input_size=7
    model = BasicRNN(input_size=7)
    
    # criterion = nn.MSELoss() 
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01) 


    X_train, X_valid, y_train, y_valid, lengths_train, lengths_valid = train_test_split(X_data, y_data, lengths_data, test_size=1, random_state=0, shuffle = False)
    
    # Convert arrays to PyTorch tensors  
    X_train = torch.Tensor(X_train)  # shape: (batch, seq, features)
    y_train = torch.Tensor(y_train)  
    X_valid = torch.Tensor(X_valid)
    y_valid = torch.Tensor(y_valid)

    lengths_train = torch.tensor(lengths_train, dtype=torch.long)
    lengths_valid = torch.tensor(lengths_valid, dtype=torch.long)

    #shift data
    X_data = np.roll(X_data, samples_of_valid, axis=0)
    y_data = np.roll(y_data, samples_of_valid, axis=0)
    lengths_data = np.roll(lengths_data, samples_of_valid, axis=0)

    for epoch in range(EPOCHS): 
        model.train() 
        output = model(X_train, lengths_train) 
        loss = criterion(output.squeeze(), y_train)  # Compute loss 

        optimizer.zero_grad() 
        loss.backward() 
        optimizer.step() 
        
        losses.append(loss.item()) 

        if (epoch + 1) % 10 == 0: 
            print(f"Epoch [{epoch+1}/{EPOCHS}], Loss: {loss.item():.4f}") 

    # Create numpy matrix 100*3 and add to losses_for_fold
    loss_matrix = np.column_stack([
        np.array(losses)*0+(shift_idx+1),
        np.arange(EPOCHS),
        losses
    ])
    loss_df = pd.DataFrame(loss_matrix, columns=['k-iteration', 'Epoch', 'Binary Cross-Entropy'])
    losses_for_fold = pd.concat([losses_for_fold, loss_df], ignore_index=True)
    
    # Validation phase
    model.eval()
    with torch.no_grad():

        valid_output = model(X_valid, lengths_valid)
        # Fix dimension mismatch by squeezing both tensors to match shapes
        valid_output_squeezed = valid_output.squeeze()
        y_valid_squeezed = y_valid.squeeze()
        # valid_loss = criterion(valid_output_squeezed, y_valid_squeezed[:lengths_valid])
        valid_loss = criterion(valid_output_squeezed, y_valid[0][:lengths_valid].squeeze())

        # Calculate validation predictions
        valid_probs = torch.sigmoid(valid_output.squeeze()).numpy()
        valid_preds = np.round(valid_probs * 2, 0)
        # Get actual values for the valid sequence (only up to lengths_valid)
        y_valid_actual = y_valid[0][:lengths_valid].squeeze().numpy()
        if lengths_valid[0]==1: 
            valid_preds_actual = np.array([valid_preds])
        else: valid_preds_actual = valid_preds[:lengths_valid]
        # Store the boolean comparison result as 0/1 instead of True/False
        acc_comparison = (valid_preds_actual == y_valid_actual).astype(int)
        
        # Calculate accuracy
        valid_accuracy = np.mean(acc_comparison)
        print(f"\n\nValidation Accuracy: {valid_accuracy:.4f}")

    valid_loss_list.append(valid_loss.item())
    valid_acc_list.append(valid_accuracy)
    valid_acc_comparison_list.append(acc_comparison)


    ### Step 8: Final Evaluate and forecast
    model.eval()  
    with torch.no_grad():  
        # logits = model(X_test).squeeze()          # raw logits from the network

        #met 1: tengoq recortarlos en linea 231
        logits = model(X_test, lengths_test).squeeze()          # raw logits from the network

        # # meth 2: devuelve con logits de largo bien ya
        # case = 0
        # logits_cases = []
        # for X_test_case in X_test: 
        #     # Add batch dimension and convert length to 1D tensor
        #     X_test_case_batched = X_test_case.unsqueeze(0)  # (1, seq_len, features)
        #     lengths_case = lengths_test[[case]]  # (1,) - keep as 1D tensor
        #     logit_case = model(X_test_case_batched, lengths_case).squeeze()
        #     logits_cases.append(logit_case)
        #     case+=1

        predictions = torch.sigmoid(logits).numpy()  # probabilities in [0,1]
        predictions = np.round(predictions*2, 0)

        test_accuracy_by_pacient = []
        pacient_idx = 0
        for pacient_prediction in predictions: 
            pacient_actual_y = y_test[pacient_idx]
            length_test = lengths_test[pacient_idx]
            pacient_actual_y = pacient_actual_y[:length_test].squeeze().numpy()

            if length_test==1: 
                pacient_prediction_actual = np.array([pacient_prediction[0]])
            else: pacient_prediction_actual = pacient_prediction[:length_test]
            
            # acc
            test_acc_by_cycle = (pacient_prediction_actual == pacient_actual_y).astype(int)
            test_accuracy_for_pacient = np.mean(test_acc_by_cycle)
            test_accuracy_by_pacient.append(test_accuracy_for_pacient)

            final_eval_ret.loc[len(final_eval_ret.index)] = [shift_idx+1, pacient_idx+1, test_accuracy_for_pacient]
            

            pacient_idx += 1

        # mean acc for the model
        test_accuracy_model = np.mean(test_accuracy_by_pacient)
    
    print(lengths_valid)
    #store model - keep track of best model based on validation accuracy
    store_flag = False

    if valid_accuracy >= best_accuracy:
        #to avoid valid fo low len
        if lengths_valid >= min_valid_lenght:

            if valid_accuracy == best_accuracy: 
                if lengths_valid >= best_valid_lenght: 
                    store_flag = True

            else: store_flag = True

    print(store_flag)
    print('\n\n')
    # breakpoint()
    if store_flag:    
        print('entraaa')  
        print(valid_accuracy)
        print(lengths_valid)
        print('esto es lo mejor q hay')
        best_accuracy = valid_accuracy
        best_valid_lenght = lengths_valid

        #train loss
        best_model_losses = losses

        #valid acc by cycle
        acc_valid_by_cycle = acc_comparison

        #acc test    
        best_accuracy_test = test_accuracy_model
        best_accuracy_by_pacient = test_accuracy_by_pacient
        best_model_idx = shift_idx + 1
        best_predictions = predictions
        # Save a deep copy of the model state
        best_model = BasicRNN(input_size=7)
        best_model.load_state_dict(copy.deepcopy(model.state_dict()))
        best_model.eval()



X_data = torch.Tensor(X_data)
y_data = torch.Tensor(y_data)
lengths_data = torch.tensor(lengths_data, dtype=torch.long)





##### REAL FINAL EVALUATION WITH RETRAINED MODEL 
print(f"\n--- FINAL TRAINING AND EVALUATION  ---")
# RE TRAININ
losses = [] 

# Instancia el modelo con input_size=7
model = BasicRNN(input_size=7)

# criterion = nn.MSELoss() 
criterion = nn.BCEWithLogitsLoss()
optimizer = optim.Adam(model.parameters(), lr=0.01) 

for epoch in range(EPOCHS): 
    model.train() 
    output = model(X_data, lengths_data) 
    loss = criterion(output.squeeze(), y_data)  # Compute loss 

    optimizer.zero_grad() 
    loss.backward() 
    optimizer.step() 
    
    losses.append(loss.item()) 

    if (epoch + 1) % 10 == 0: 
        print(f"Epoch [{epoch+1}/{EPOCHS}], Loss: {loss.item():.4f}") 

### Step 8: Final Evaluate and forecast
model.eval()  
with torch.no_grad():  
    # logits = model(X_test).squeeze()          # raw logits from the network

    #met 1: tengoq recortarlos en linea 231
    final_logits = model(X_test, lengths_test).squeeze()          # raw logits from the network

    # # meth 2: devuelve con logits de largo bien ya
    # case = 0
    # logits_cases = []
    # for X_test_case in X_test: 
    #     # Add batch dimension and convert length to 1D tensor
    #     X_test_case_batched = X_test_case.unsqueeze(0)  # (1, seq_len, features)
    #     lengths_case = lengths_test[[case]]  # (1,) - keep as 1D tensor
    #     logit_case = model(X_test_case_batched, lengths_case).squeeze()
    #     logits_cases.append(logit_case)
    #     case+=1

    final_predictions = torch.sigmoid(final_logits).numpy()  # probabilities in [0,1]
    final_predictions = np.round(final_predictions*2, 0)

    test_accuracy_by_pacient = []
    pacient_idx = 0
    for pacient_prediction in final_predictions: 
        pacient_actual_y = y_test[pacient_idx]
        length_test = lengths_test[pacient_idx]
        pacient_actual_y = pacient_actual_y[:length_test].squeeze().numpy()

        if length_test==1: 
            pacient_prediction_actual = np.array([pacient_prediction[0]])
        else: pacient_prediction_actual = pacient_prediction[:length_test]
        
        # acc
        test_acc_by_cycle = (pacient_prediction_actual == pacient_actual_y).astype(int)
        test_accuracy_for_pacient = np.mean(test_acc_by_cycle)
        test_accuracy_by_pacient.append(test_accuracy_for_pacient)
        # final_eval_ret.loc[len(final_eval_ret.index)] = [shift_idx+1, pacient_idx+1, test_accuracy_for_pacient]
        

        pacient_idx += 1

    # mean acc for the model
    final_test_accuracy_by_pacient = test_accuracy_by_pacient
    test_accuracy_model = np.mean(test_accuracy_by_pacient)

final_model = model


    #### PLOTS ####
print('\n' + '='*60)
print('FINAL RESULTS')
print('='*60)
print(f'Best Validation Accuracy: {best_accuracy:.4f} (Iteration {best_model_idx})')
print(f'Best Test Accuracy: {best_accuracy_test:.4f}')
if best_accuracy_by_pacient is not None and len(best_accuracy_by_pacient) > 0:
    print(f'Test Accuracy by Patient:')
    print(f'  Mean: {np.mean(best_accuracy_by_pacient):.4f}')
    print(f'  Std:  {np.std(best_accuracy_by_pacient):.4f}')
    print(f'  Min:  {np.min(best_accuracy_by_pacient):.4f}')
    print(f'  Max:  {np.max(best_accuracy_by_pacient):.4f}')
    print(f'  Individual: {[f"{acc:.4f}" for acc in best_accuracy_by_pacient]}')
print('='*60 + '\n')

# Plot cycle vs accuracy
if len(valid_acc_comparison_list) > 0:
    # Find maximum cycle length
    max_cycle_length = max(len(acc_comp) for acc_comp in valid_acc_comparison_list)
    # Calculate accuracy per cycle across all folds
    cycle_acc_valid_DF = pd.DataFrame(columns = ['k-iteration', 'Cycle', 'Accuracy'])
    # cycle_accuracies_mean = []
    # cycle_accuracies_std = []
    for cycle_idx in range(max_cycle_length):
        cycle_values = []

        # acc_comp ciclo por ciclo
        fold_counter = 0
        for acc_comp in valid_acc_comparison_list:
            fold_counter += 1
            if cycle_idx < len(acc_comp):
                cycle_values.append(acc_comp[cycle_idx])
                cycle_acc_valid_DF.loc[len(cycle_acc_valid_DF.index)] = [fold_counter, cycle_idx+1, acc_comp[cycle_idx]]
    
    # Reshape DataFrame: cycles as columns, iterations as rows
    cycle_acc_pivot = cycle_acc_valid_DF.pivot(
        index='k-iteration',
        columns='Cycle',
        values='Accuracy'
    )
    # Rename columns to cycle1, cycle2, ..., cycle12
    cycle_acc_pivot.columns = [f'cycle{col}' for col in cycle_acc_pivot.columns]
    # Reset index to make k-iteration a column
    cycle_acc_pivot = cycle_acc_pivot.reset_index()
    cycle_acc_pivot = cycle_acc_pivot.drop(['k-iteration'], axis=1)


    ### grafica de la accuracy en funcion del ciclo para los datos de validacion (42 folds) (12 ciclos) -> promedio por fold
    #box y violin no tienen sentido pq son 0 y 1. Necesito la media
    # sns.violinplot(data=cycle_acc_pivot, bw_adjust=.5, cut=1, linewidth=1, palette="Set3")
    # sns.boxplot(x="Cycle", y="Accuracy", data=cycle_acc_valid_DF)
    best_model_res1 = cycle_acc_valid_DF[cycle_acc_valid_DF['k-iteration']==best_model_idx]
    plt.figure()
    sns.lineplot(x="Cycle", y="Accuracy", data=cycle_acc_valid_DF, label='Model Mean')
    # sns.lineplot(x="Cycle", y="Accuracy", data=best_model_res1, color='red', label='Best Model', marker='o')
    plt.legend()
    plt.grid()
    plt.ylim(-0.1, 1.1)
    plt.xlim(0.9, 12.1)
    

# best_model_res2 = losses_for_fold[losses_for_fold['k-iteration']==best_model_idx]
plt.figure()
sns.lineplot(x="Epoch", y="Binary Cross-Entropy", data=losses_for_fold, label='Model Mean')
# sns.lineplot(x="Epoch", y="Binary Cross-Entropy", data=best_model_res2, color='red', label='Best Model', marker='o')
plt.grid()


    ### plot accc in test by pacient
plt.figure()
pacient_acc_DF = final_eval_ret.pivot(index='k-iteration',columns='Pacient',values='Accuracy')
pacient_acc_DF = pacient_acc_DF.reset_index(drop=True)
plt.grid()
sns.violinplot(data=pacient_acc_DF, bw_adjust=.5, cut=1, linewidth=1, palette="Set3")
# Add markers for best_accuracy_by_pacient
if best_model is not None and len(final_test_accuracy_by_pacient) > 0:
    patient_indices = np.arange(len(final_test_accuracy_by_pacient))
    plt.plot(patient_indices, final_test_accuracy_by_pacient, 'ro', markersize=8, label='Best Model Accuracy', zorder=10)
    plt.legend()

plt.figure()
idx_count = 0
for len in lengths_test:
    # print(f"Length: {len}")
    # print(f"Predictions: {predictions[:len]}")
    # print(f"Ground Truth: {y_test[:len].numpy()}")
    # print("-----")

    
    plt.subplot(1, 5, idx_count + 1)
    plt.plot(y_test[idx_count][:len], label='Ground Truth', color='b')
    plt.fill_between(range(len), 0, y_test[idx_count][:len], alpha=0.3, color='b', label='_nolegend_')
    # plt.stem(best_predictions[idx_count][:len], label='Best model predictions', linefmt='r-', markerfmt='ro', basefmt=' ')
    plt.stem(final_predictions[idx_count][:len], label='Final model predictions', linefmt='r-', markerfmt='ro', basefmt=' ')
    # plt.stem(y_test[idx_count][:len], label='Ground Truth', linefmt='b-', markerfmt='ro', basefmt=' ')
    # plt.plot(predictions[idx_count][:len], label='Predictions', color='r')
    plt.grid()
    
    plt.xlim(0, max_cycle)
    plt.ylim(-0.1, 2.1)
    idx_count = idx_count + 1
plt.legend()
plt.show()


breakpoint()
    #### EXPORT ####

# Save the best model and related data
if final_model is not None:
    # Create directory for saving model
    model_dir = 'TrainedModels/RNN_oncologia'
    os.makedirs(model_dir, exist_ok=True)
    
    print(f"\n--- Saving best model (iteration {best_model_idx} with accuracy {best_accuracy:.4f}) ---")
    
    # Save model state dict
    torch.save(final_model.state_dict(), os.path.join(model_dir, 'model.pth'))
    
    # Save model architecture info (needed for loading)
    model_info = {
        'input_size': 7,
        'hidden_size': 64,
        'num_layers': 1,
        'output_size': 1,
        'best_accuracy': final_test_accuracy_by_pacient,
        'mean_accuracy': np.mean(final_test_accuracy_by_pacient),
        'std_accuracy': np.std(final_test_accuracy_by_pacient),
        'epochs': EPOCHS,
        'predictors': PREDICTORS,
        'target': TARGET
    }
    with open(os.path.join(model_dir, 'model_info.pkl'), 'wb') as f:
        pickle.dump(model_info, f)
    
    # Save scaler
    with open(os.path.join(model_dir, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)
    
    # Save test data for evaluation
    # Convert test tensors to numpy and save
    X_test_np = X_test.numpy()
    y_test_np = y_test.numpy()
    lengths_test_np = lengths_test.numpy()
    
    np.save(os.path.join(model_dir, 'X_test.npy'), X_test_np)
    np.save(os.path.join(model_dir, 'y_test.npy'), y_test_np)
    np.save(os.path.join(model_dir, 'lengths_test.npy'), lengths_test_np)
    
#     # Save validation results
#     # Ensure valid_acc_list is a Python list
#     valid_acc_list_py = list(valid_acc_list) if not isinstance(valid_acc_list, list) else valid_acc_list
#     valid_loss_list_py = list(valid_loss_list) if not isinstance(valid_loss_list, list) else valid_loss_list
#     valid_results = pd.DataFrame({
#         'iteration': range(1, len(valid_acc_list_py) + 1),
#         'validation_accuracy': valid_acc_list_py,
#         'validation_loss': valid_loss_list_py
#     })
#     valid_results.to_csv(os.path.join(model_dir, 'validation_results.csv'), index=False)
    
#     # Save loss history
#     losses_for_fold.to_csv(os.path.join(model_dir, 'training_losses.csv'), index=False)
    
#     print(f"Model saved successfully to {model_dir}/")
#     print(f"Best validation accuracy: {best_accuracy:.4f} (iteration {best_model_idx})")
#     print(f"Mean validation accuracy: {np.mean(valid_acc_list_py):.4f} ± {np.std(valid_acc_list_py):.4f}")
# else:
#     print("Warning: No model was saved. Make sure training completed successfully.")

