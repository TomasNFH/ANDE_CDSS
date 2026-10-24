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
data = pd.read_csv('Input/Oncologia/RNN/E3full.csv')

# Define predictors and target
PREDICTORS = ["Edad", "Sexo", "Plaquetas", "Neutrofilos", "Linfocitos", "PLR", "NLR"]
PREDICTORS = ["Edad"]
TARGET = "ClaseInt"

breakpoint()

#### EXTRAS

g = sns.jointplot(data=data,x='NLR',y='PLR',hue='ClaseRiesgo', palette='rocket_r')

g = sns.jointplot(data=data[data['ClaseRiesgo']=='Alto'],x='NLR',y='PLR', kind='reg', color='purple')

sns.set_theme(style="ticks")
sns.pairplot(data[['NLR','PLR','Riesgo']], hue="Riesgo")

#RiesgovsNLRvsPLR
sns.pairplot(data[['NLR','PLR','Riesgo','Ciclo']], hue="Ciclo")

#esta es la q uso
sns.set_theme(style="ticks")
sns.pairplot(data[['NLR','PLR','ClaseRiesgo','Ciclo','Edad','Sexo']], hue="ClaseRiesgo", palette='rocket_r')

sns.set_theme(style="ticks")
sns.pairplot(data[['Neutrofilos','Linfocitos', 'Plaquetas', 'ClaseRiesgo','Ciclo','Edad','Sexo']], hue="ClaseRiesgo", palette='rocket_r')

###largas
# g = sns.relplot(x="NLR", y="PLR", col='Hash', hue='Riesgo', col_wrap=5, data=data[data['Riesgo']>0], palette='coolwarm')

# g = sns.relplot(x="NLR", y="PLR", hue='Riesgo', data=data[data['Riesgo']>0], palette='coolwarm')

# g = sns.relplot(x="NLR", y="PLR", hue='Ciclo', data=data[data['Riesgo']>0], palette='coolwarm')

# g = sns.relplot(x="Ciclo", y="Plaquetas", col='Hash', hue='Riesgo', col_wrap=6, data=data, palette='coolwarm')
# for ax in g.axes.flatten(): ax.set_title("")  # Remove subplot titles
# # plt.title('Plaquetas')
# plt.show()

# g = sns.relplot(x="Ciclo", y="Neutrofilos", col='Hash', hue='Riesgo', col_wrap=6, data=data, palette='coolwarm')
# for ax in g.axes.flatten(): ax.set_title("")  # Remove subplot titles
# # plt.title('Neutrofilos')
# plt.show()

# g = sns.relplot(x="Ciclo", y="Linfocitos", col='Hash', hue='Riesgo', col_wrap=6, data=data, palette='coolwarm')
# for ax in g.axes.flatten(): ax.set_title("")  # Remove subplot titles
# # plt.title('Linfocitos')
# plt.show()

# g = sns.relplot(x="Ciclo", y="PLR", col='Hash', hue='Riesgo', col_wrap=6, data=data, palette='coolwarm')
# for ax in g.axes.flatten(): ax.set_title("")  # Remove subplot titles
# # plt.title('Plaquetas')
# plt.show()

# g = sns.relplot(x="Ciclo", y="NLR", col='Hash', hue='Riesgo', col_wrap=6, data=data, palette='coolwarm')
# for ax in g.axes.flatten(): ax.set_title("")  # Remove subplot titles
# # plt.title('Plaquetas')
# plt.show()

# g = sns.relplot(x="NLR", y="PLR", col='Hash', hue='Riesgo', col_wrap=6, data=data, palette='coolwarm')
# for ax in g.axes.flatten(): ax.set_title("")  # Remove subplot titles
# # plt.title('Plaquetas')
# plt.show()

breakpoint()
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
    # breakpoint()
    for sequence in range(max_cycle-SEQ_LENGTH+1):
        # breakpoint()
        sequence_data = current_data[(current_data['Ciclo']>sequence)&(current_data['Ciclo']<=sequence+SEQ_LENGTH)]
        if len(sequence_data) == SEQ_LENGTH:
            x = sequence_data[PREDICTORS].values  # shape: (SEQ_LENGTH, 3)
            y = sequence_data[TARGET].values
            xs.append(x)  # Do NOT squeeze, keep shape (SEQ_LENGTH, 3)
            ys.append(y[0])
        # else: 
        #     print('\n  NOOOOO')
        #     print('(sequence_data)', sequence_data)
            # breakpoint()
    # breakpoint()
X = np.array(xs)  # shape: (samples, SEQ_LENGTH, 3)
y = np.array(ys)

breakpoint()

# Split data into train and test sets  
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)  

# Convert arrays to PyTorch tensors  
X_train = torch.Tensor(X_train)  # shape: (batch, seq, features)
y_train = torch.Tensor(y_train)  
X_test = torch.Tensor(X_test)
y_test = torch.Tensor(y_test)

### Step 6: Define the RNN model

class BasicRNN(nn.Module):  
    def __init__(self, input_size=7, hidden_size=64, num_layers=1):  # <-- CAMBIA input_size a 7
        super(BasicRNN, self).__init__() 
        self.rnn = nn.RNN(input_size, hidden_size, num_layers, batch_first=True)  
        self.fc = nn.Linear(hidden_size, 1) 

    def forward(self, x): 
        out, _ = self.rnn(x)         
        out = out[:, -1, :]          
        return self.fc(out)          

# Instancia el modelo con input_size=7
model = BasicRNN(input_size=7)
breakpoint()


### Step 7: Train the model

# criterion = nn.MSELoss() 
criterion = nn.BCEWithLogitsLoss()
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

# # Inverse transform to original scale  
# y_test_inv = scaler.inverse_transform(y_test.reshape(-1, 1))  
# predictions_inv = scaler.inverse_transform(predictions.reshape(-1, 1))  

breakpoint()

#my figure
plt.figure()
plt.plot(predictions)
plt.plot(y_test)
plt.grid()

plt.figure()
norm = 2*(predictions-np.min(predictions))/(np.max(predictions)-np.min(predictions))
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
