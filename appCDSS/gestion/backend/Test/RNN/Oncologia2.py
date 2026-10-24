import pandas as pd
import os
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from scipy import stats
from VikParuchuri import functions as fn
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import random
from sklearn.model_selection import train_test_split
# np.random.seed(0)


os.chdir(os.path.normpath(os.getcwd() + os.sep + os.pardir)) #go back to Test folder
os.chdir(os.path.normpath(os.getcwd() + os.sep + os.pardir)) ##go back to main folder


# Read in our data, and fill missing values by repeting last entry
data = pd.read_csv('Input/Oncologia/RNN/E1_hash.csv')

# Define predictors and target
PREDICTORS = ["Linfocitos", "Neutrofilos", "Plaquetas"]
TARGET = "Vivo"

# Scale our data to have mean 0
scaler = StandardScaler()
data[PREDICTORS] = scaler.fit_transform(data[PREDICTORS])
data['Linfocitos'] = np.arange(0, len(data), 1) #just to verify the split

### data split
pacients = data['Hash'].unique()

n_train = round(len(pacients)*0.7)
n_valid = round((len(pacients)-(len(pacients)*0.7))/2)
n_test = len(pacients) - n_train - n_valid

# dont use for reproductivity of tests
# #shuffle pacients
# np.random.shuffle(pacients)

train = pacients[0:n_train]
valid = pacients[n_train:n_train+n_valid]
test = pacients[n_train+n_valid:len(pacients)]

total_cicles_train = 0
total_cicles_train = sum(len(data[data['Hash']==pacient_train]) for pacient_train in train)
# for pacient_train in train: total_cicles_train += len(data[data['Hash']==pacient_train])
total_cicles_valid = 0
total_cicles_valid = sum(len(data[data['Hash']==pacient_valid]) for pacient_valid in valid)


        ####    TRAINING LOOP   ####

#an epoch in the training loop refers to one complete pass through the entire training dataset
epochs = 250
lr = 1e-5

# we take out four features, generate 4 input features. And output a single feature.
layer_conf = [
    {"type":"input", "units": 3},
    {"type": "rnn", "hidden": 4, "output": 1}
]
layers = fn.init_params(layer_conf)

for epoch in range(epochs):
    # print('epoch', epoch)

    # sequence_len = 7 #how long of a sequence we want to feed into our rnn
    epoch_loss = 0 #track the loss epoch by epoch

    for pacient_train in train:
        current_data = data[data['Hash']==pacient_train]

        seq_x = current_data[PREDICTORS].values
        seq_y = current_data[TARGET].values.reshape(-1,1)

        hiddens, outputs = fn.forward(seq_x, layers)
        grad = fn.mse_grad(seq_y, outputs)

        # listas son mutables, los cambios de layers dentro de la funcion se mantienen
        params = fn.backward(layers, seq_x, lr, grad, hiddens)
        epoch_loss += fn.mse(seq_y, outputs)
        # print('pacient', pacient_train, 'seq_y', seq_y.T, 'outputs', outputs.T)

    if epoch % 50 == 0:
        # breakpoint()
        sequence_len = len(current_data)
        valid_loss = 0
        for pacient_valid in valid:

            current_data = data[data['Hash']==pacient_valid]
            seq_x = current_data[PREDICTORS].values
            seq_y = current_data[TARGET].values.reshape(-1,1)
            _, outputs = fn.forward(seq_x, layers)
            valid_loss += fn.mse(seq_y, outputs)
            print('pacient', pacient_valid, 'seq_y', seq_y.T, 'outputs', outputs.T)
        
        print(f"Epoch: {epoch} train loss {epoch_loss / total_cicles_train} valid loss {valid_loss / total_cicles_valid}")
