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

os.chdir(os.path.normpath(os.getcwd() + os.sep + os.pardir))
os.chdir(os.path.normpath(os.getcwd() + os.sep + os.pardir)) #go back to Test folder
os.chdir(os.path.normpath(os.getcwd() + os.sep + os.pardir)) ##go back to main folder

# Read in our data, and fill missing values by repeting last entry
data = pd.read_csv('Input/Oncologia/RNN/E2_RatioRiesgo.csv')

# Define predictors and target
PREDICTORS = ["Plaquetas"]
TARGET = "Riesgo"

# Scale our data to have mean 0
scaler = StandardScaler()
data[PREDICTORS] = scaler.fit_transform(data[PREDICTORS])
# data['Linfocitos'] = np.arange(0, len(data), 1) #just to verify the split

### data split
pacients = data['Hash'].unique()
SEQ_LENGTH = 4 # Number of cycles to look at
max_cycle = 12
xs, ys = [], []
for current_pacient in pacients:
    current_data = data[data['Hash']==current_pacient]
    print('\n\n\n\n\n current_data', current_data)
    # breakpoint()
    for sequence in range(max_cycle-SEQ_LENGTH+1):
        print('\n sequence', sequence)
        sequence_data = current_data[(current_data['Ciclo']>sequence)&(current_data['Ciclo']<=sequence+SEQ_LENGTH)]
        if len(sequence_data) == SEQ_LENGTH:
            print('\n  SIIII')
            print('sequence_data', sequence_data)
            x = sequence_data[PREDICTORS].values
            y = sequence_data[TARGET].values
            xs.append(np.squeeze(x))
            ys.append(y[0])
        else: 
            print('\n  NOOOOO')
            print('(sequence_data)', sequence_data)
            # breakpoint()
    # breakpoint()
X = np.array(xs)
y = np.array(ys)

breakpoint()

# Split data into train and test sets  
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)  

# Convert arrays to PyTorch tensors  
X_train = torch.Tensor(X_train).unsqueeze(-1) # Shape: (batch, seq, input_size)  
y_train = torch.Tensor(y_train)  
X_test = torch.Tensor(X_test).unsqueeze(-1)  
y_test = torch.Tensor(y_test) 


### Step 6: Define the RNN model

class BasicRNN(nn.Module):  
  def __init__(self, input_size=1, hidden_size=64, num_layers=1):  
    super(BasicRNN, self).__init__() 
    self.rnn = nn.RNN(input_size, hidden_size, num_layers, batch_first=True)  
    self.fc = nn.Linear(hidden_size, 1) 

  def forward(self, x): 
    out, _ = self.rnn(x)         # RNN output for all time steps 
    out = out[:, -1, :]          # Take output from the last time step 
    return self.fc(out)          # Pass through linear layer 
  
# Instantiate the model 
model = BasicRNN() 
breakpoint()


### Step 7: Train the model

criterion = nn.MSELoss() 
# criterion = nn.BCEWithLogitsLoss()
optimizer = optim.Adam(model.parameters(), lr=0.01) 
  
EPOCHS = 100 

losses = [] 
  
for epoch in range(EPOCHS): 
  model.train() 
  output = model(X_train) 
  loss = criterion(output.squeeze(), y_train)  # Compute loss 

  print('\noutput', output)
  print('y_train', y_train)

  optimizer.zero_grad() 
  loss.backward() 
  optimizer.step() 
  
  losses.append(loss.item()) 
  
  if (epoch + 1) % 10 == 0: 
    print(f"Epoch [{epoch+1}/{EPOCHS}], Loss: {loss.item():.4f}") 

breakpoint()

### Step 8: Evaluate and forecast
model.eval()  
with torch.no_grad():  
  predictions = model(X_test).squeeze().numpy() # Predict on test set  

# Inverse transform to original scale  
y_test_inv = scaler.inverse_transform(y_test.reshape(-1, 1))  
predictions_inv = scaler.inverse_transform(predictions.reshape(-1, 1))  

breakpoint()

#my figure
plt.figure()
plt.plot(predictions)
plt.plot(y_test)
plt.grid()

plt.figure()
norm = (predictions-np.min(predictions))/(np.max(predictions)-np.min(predictions))
plt.plot(norm)
plt.plot(y_test)
plt.grid()
plt.show()


# # Plot actual vs predicted  
# plt.figure(figsize=(10, 4))  
# plt.plot(y_test_inv, label='Actual')  
# plt.plot(predictions_inv, label='Predicted')  
# plt.title("RNN Prediction vs Actual")  
# plt.xlabel("Time Step")  
# plt.ylabel("Value")  
# plt.legend()  
# plt.show() 
