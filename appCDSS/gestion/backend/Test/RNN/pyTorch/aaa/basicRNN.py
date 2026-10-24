# from: https://www.codecademy.com/article/rnn-py-torch-time-series-tutorial-complete-guide-to-implementation

import numpy as np  
import pandas as pd  
import matplotlib.pyplot as plt  
from sklearn.preprocessing import MinMaxScaler  
from sklearn.model_selection import train_test_split 
import torch  
import torch.nn as nn  
import torch.optim as optim 

# Generate a sine wave  
time_steps = np.linspace(0, 100, 500)   # 500 points between 0 and 100  
data = np.sin(time_steps) # Create a sine wave  
 
# Convert to DataFrame  
df = pd.DataFrame(data, columns=['value']) 

plt.figure(figsize=(10, 4)) 
plt.plot(df['value']) 
plt.title("Sine Wave") 
plt.xlabel("Time Step") 
plt.ylabel("Value") 
# plt.show() 


### Step 4: Preprocess the data

scaler = MinMaxScaler() 

df['value'] = scaler.fit_transform(df[['value']])  # Normalize values 
  
data = df['value'].values  # Convert to numpy array for sequence creation 


### Step 5: Create sequence and labels

def create_sequences(data, seq_length):  
  xs, ys = [], []  
  for i in range(len(data) - seq_length):  
    x = data[i:i+seq_length] # Sequence of length `seq_length`  
    y = data[i+seq_length] # Label is the next value  
    xs.append(x)  
    ys.append(y)  
  return np.array(xs), np.array(ys)  
 
SEQ_LENGTH = 20 # Number of past time steps to look at  

X, y = create_sequences(data, SEQ_LENGTH)  

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
    super(BasicRNN, self).init() 
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
optimizer = optim.Adam(model.parameters(), lr=0.01) 
  
EPOCHS = 100 

losses = [] 
  
for epoch in range(EPOCHS): 
  model.train() 
  output = model(X_train) 
  loss = criterion(output.squeeze(), y_train)  # Compute loss 

  optimizer.zero_grad() 
  loss.backward() 
  optimizer.step() 
  
  losses.append(loss.item()) 
  
  if (epoch + 1) % 10 == 0: 
    print(f"Epoch [{epoch+1}/{EPOCHS}], Loss: {loss.item():.4f}") 
