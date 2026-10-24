from System.Auxiliary import auxiliary_fun
from System.Modules import Dacquisition
from System.Modules import DprepNcleaning
from System.Modules import eda
from System.Modules import Mbuilding
import dtale
from termcolor import colored
import seaborn as sns
import matplotlib.pyplot as plt 
import pandas as pd
from sklearn.model_selection import train_test_split

from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import StandardScaler


def dyn_model_selection(data = pd.DataFrame(), file_selected=-1, column_selected=-1, FAST = True, PLOT = True, local_file = False):
    
    itcn = True #true menu/ false digit

    Server = False
    if Server:
        itcn = False
        local_file = False

        ### Step 1: Data acquisition ###
    if len(data)==0:
        data, file_name = Dacquisition.d_acquisition(file_selected, itcn)

    data, target_column, target_type, scewed_target_col = Dacquisition.var_acquisition(data, column_selected, CHECK=True, interaction=itcn) #tema de dataNaN y dataCLEAN juntar

        ### Step 3: Data Cleaning ### 
    #min_porcentage_col if missing>10 for a column, we drop it
    data_cleaned, drop_col, drop_row = DprepNcleaning.data_cleaning(data, min_porcentage_col = 10, min_porcentage_row = 0)
    print(colored('\nThe result of the number of patients is: '+str(len(data)), 'red', attrs=['bold']))

        ### Step 4: Data cast ###  
    data_casted, rosseta = auxiliary_fun.data_cast(data_cleaned, target_column)

    #define a DF with the cleaned and casted data
    data_proccesed = data_casted.copy()

        ### Step 5: Exploratory Data Analyzis (MANUAL)###
    manualEDA, missing4rows = eda.ManualEDAfun(data) #data no tiene a predicted column
    print(colored('\nTable with information of the variables:', 'red', attrs=['bold']))
    print(colored(manualEDA, 'red'))
    print(colored('\nTable with information of the rows:', 'red', attrs=['bold']))
    print(colored(missing4rows, 'red'))
    
        ### Step 5: Exploratory Data Analyzis (AUTO)###
    # data_decasted_aux = auxiliary_fun.de_cast_PREDICTION(data, data.columns, rosseta)  
    # dtale.show(data_decasted_aux) #hacerle decast !!!!!
    # dtale.show(open_browser=True)

        ### Step 6: Model Building  

    #test data extraction
    X = data_proccesed.loc[:, data_proccesed.columns != target_column]
    y = data_proccesed[target_column]

    #set the norm methos before spliting the data
    scalers = []
    minmax = MinMaxScaler()

    # use X.to_numpy() because the data to transform doesnt have labels
    minmax.fit(X.to_numpy()) #fit whit column names
    std = StandardScaler()
    std.fit(X.to_numpy())
    scalers.append(minmax)
    scalers.append(std)

    X_data, X_test, y_data, y_test = train_test_split(X, y, test_size=0.1, shuffle = True)
    data_train_N_valid = pd.concat([y_data, X_data], axis=1)
    model_info, ALL_TRAINED_MODELS, fig_feat, fig_cm, fig_roc, fig_score = Mbuilding.model_shake(data_function=data_train_N_valid, x_test_function=X_test.to_numpy(),  y_test_function=y_test.to_numpy(), target_column_function=target_column, target_type_function=target_type, sclaer_function=scalers, fast_function = FAST)
    
    if local_file: 
        # plt.savefig('Output/accuracy.png')
        fig_feat.savefig('Output/features.png')
        if fig_cm!=0: fig_cm.savefig('Output/CM.png')
        if fig_roc!=0: fig_roc.savefig('Output/ROC.png')
        if fig_score!=0: fig_score.savefig('Output/Score.png', bbox_inches='tight')
        # plt.savefig('my_plot.png', bbox_inches='tight')
    if PLOT: plt.show()


    return model_info, ALL_TRAINED_MODELS, X_test, y_test, file_name, rosseta, scalers


