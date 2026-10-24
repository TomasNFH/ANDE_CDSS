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
# np.random.seed(0)


import numpy as np  
import pandas as pd  
import matplotlib.pyplot as plt  
from sklearn.preprocessing import MinMaxScaler  
from sklearn.model_selection import train_test_split 
import torch  
import torch.nn as nn  
import torch.optim as optim 
from torch.nn.utils.rnn import pad_sequence, pack_padded_sequence, pad_packed_sequence

os.chdir(os.path.normpath(os.getcwd() + os.sep + os.pardir))
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

### data split
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
    # ys.append(y)
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
    np_X_padded, np_y_padded, lengths_np, test_size=0.1, shuffle=False
)   #try with shuffle True when is ready
X_test = torch.Tensor(X_test)
y_test = torch.Tensor(y_test)
lengths_test = torch.tensor(lengths_test, dtype=torch.long)


# # Convert arrays to PyTorch tensors  
# X_train = torch.Tensor(X_train)  # shape: (batch, seq, features)
# y_train = torch.Tensor(y_train)  
# X_test = torch.Tensor(X_test)
# y_test = torch.Tensor(y_test)

# lengths_train = torch.tensor(lengths_train, dtype=torch.long)
# lengths_test = torch.tensor(lengths_test, dtype=torch.long)

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

# criterion = nn.MSELoss() 

EPOCHS = 100 

number_of_splits = X_data.shape[0]
samples_of_valid = int(len(X_data)/number_of_splits)
valid_loss_list = []

for shift_idx in range(number_of_splits): 
    print(f"\n--- Training iteration {shift_idx+1}/{number_of_splits} ---")
    losses = [] 

    # Instancia el modelo con input_size=7
    model = BasicRNN(input_size=7)
    
    # criterion = nn.MSELoss() 
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01) 
# X_data, X_test, y_data, y_test, lengths_train, lengths_test = train_test_split(
#     np_X_padded, np_y_padded, lengths_np, test_size=0.1, shuffle=False
# )   #try with shuffle True when is ready

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
        #   output = model(X_train) 
        output = model(X_train, lengths_train) 
        loss = criterion(output.squeeze(), y_train)  # Compute loss 

        # print('\noutput', output)
        # print('y_train', y_train)

        optimizer.zero_grad() 
        loss.backward() 
        optimizer.step() 
        
        losses.append(loss.item()) 

        if (epoch + 1) % 10 == 0: 
            print(f"Epoch [{epoch+1}/{EPOCHS}], Loss: {loss.item():.4f}") 


    # Validation phase
    model.eval()
    with torch.no_grad():
        # breakpoint()
        # if shift_idx == 14: breakpoint()
        # breakpoint()
        valid_output = model(X_valid, lengths_valid)
        # Fix dimension mismatch by squeezing both tensors to match shapes
        valid_output_squeezed = valid_output.squeeze()
        y_valid_squeezed = y_valid.squeeze()
        # valid_loss = criterion(valid_output_squeezed, y_valid_squeezed[:lengths_valid])
        valid_loss = criterion(valid_output_squeezed, y_valid[0][:lengths_valid].squeeze())

        
        # Calculate validation predictions
        valid_probs = torch.sigmoid(valid_output.squeeze()).numpy()
        valid_preds = np.round(valid_probs * 2, 0)

    valid_loss_list.append(valid_loss.item())



breakpoint()

#entrenar de nuevo con todo los datos menos el test
#guardar con acc, no loss
#sacar media y std desv
#hacer matriz de confusion

### Step 8: Evaluate and forecast
model.eval()  
with torch.no_grad():  
    # logits = model(X_test).squeeze()          # raw logits from the network
    logits = model(X_test, lengths_test).squeeze()          # raw logits from the network
    predictions = torch.sigmoid(logits).numpy()  # probabilities in [0,1]
    predictions = np.round(predictions*2, 0)

# # Inverse transform to original scale     
# y_test_inv = scaler.inverse_transform(y_test.reshape(-1, 1))  
# predictions_inv = scaler.inverse_transform(predictions.reshape(-1, 1))  

breakpoint()

idx_count = 0
for len in lengths_test:
    print(f"Length: {len}")
    print(f"Predictions: {predictions[:len]}")
    print(f"Ground Truth: {y_test[:len].numpy()}")
    print("-----")

    plt.subplot(2, 5, idx_count + 1)
    plt.stem(y_test[idx_count][:len], label='Ground Truth', linefmt='r-', markerfmt='ro', basefmt=' ')
    plt.plot(predictions[idx_count][:len], label='Predictions', color='b')
    plt.grid()
    plt.legend()
    plt.xlim(0, max_cycle)
    plt.ylim(-0.1, 2.1)
    idx_count = idx_count + 1

plt.show()
breakpoint()
