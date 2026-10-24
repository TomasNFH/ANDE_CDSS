from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
from werkzeug.utils import secure_filename

from System.Auxiliary import auxiliary_fun
from System.Modules import DprepNcleaning
from System.Modules import eda
from System.Modules import Mbuilding
from System.Modules import old_mbuilding


from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import StandardScaler

import skops.io as sio

import ast
import re
import pickle 

import os
import shutil

from flask import send_file
from io import BytesIO
from zipfile import ZipFile
import os

import warnings
# import cutie
import skops.io as sio
import pandas as pd
import os
import pickle

from datetime import datetime, timezone



app = Flask(__name__)
CORS(app)


# STORE GLOBALLY THE USER INPUT AND RESPECTIVE PREDICTIONS
global USER_PREDICTIONS
USER_PREDICTIONS: dict[str, dict] = {}


        ### 1 Data Acquisition ####

# imported datasets
global DATASETS
DATASETS: dict[str, dict] = {}

# loaded datasets
global LOADED_DATASETS
LOADED_DATASETS: dict[str, dict] = {}

HADS = pd.read_csv('LoadedDatasets/HeartAttackDataSet.csv')
LOADED_DATASETS['HeartAttackDataSet'] = {
    "data": HADS.copy(),
    "metadata": {
        "shape": HADS.shape,
        "columns": HADS.columns.tolist(),
        "n_variables": HADS.shape[1],
        "n_entries": HADS.shape[0],
        "completion": round(100 * (1 - HADS.isna().sum().sum() / (HADS.size or 1)), 2),
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
}
Iris = pd.read_csv('LoadedDatasets/Iris.csv')
LOADED_DATASETS['Iris'] = {
    "data": Iris.copy(),
    "metadata": {
        "shape": Iris.shape,
        "columns": Iris.columns.tolist(),
        "n_variables": Iris.shape[1],
        "n_entries": Iris.shape[0],
        "completion": round(100 * (1 - Iris.isna().sum().sum() / (Iris.size or 1)), 2),
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
}
Boston = pd.read_csv('LoadedDatasets/BostonHousePricing.csv')
LOADED_DATASETS['BostonHousePricing'] = {
    "data": Boston.copy(),
    "metadata": {
        "shape": Boston.shape,
        "columns": Boston.columns.tolist(),
        "n_variables": Boston.shape[1],
        "n_entries": Boston.shape[0],
        "completion": round(100 * (1 - Boston.isna().sum().sum() / (Boston.size or 1)), 2),
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
}
Titanic = pd.read_csv('LoadedDatasets/Titanic.csv')
LOADED_DATASETS['Titanic'] = {
    "data": Titanic.copy(),
    "metadata": {
        "shape": Titanic.shape,
        "columns": Titanic.columns.tolist(),
        "n_variables": Titanic.shape[1],
        "n_entries": Titanic.shape[0],
        "completion": round(100 * (1 - Titanic.isna().sum().sum() / (Titanic.size or 1)), 2),
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
}


@app.route('/upload_csv', methods=['POST'])
def upload_csv():

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    data_imported = pd.read_csv(file)

    VARIABLES_OF_DATA = data_imported.columns.tolist()
    data_to_store = data_imported.copy()  
    data_imported = data_imported.replace({np.nan: 'Empty'}) #to convert to list of lists
    NAME_DATASET = file.filename

    # Convert DataFrame to list of lists (including header)
    data_list = [data_imported.columns.tolist()] + data_imported.values.tolist()

    DATASETS[NAME_DATASET] = {
        "data": data_to_store.copy(),
        "metadata": {
            "shape": data_to_store.shape,
            "columns": data_to_store.columns.tolist(),
            "n_variables": data_to_store.shape[1],
            "n_entries": data_to_store.shape[0],
            "completion": round(100 * (1 - data_to_store.isna().sum().sum() / (data_to_store.size or 1)), 2),
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
    }

    print([*DATASETS])
    return jsonify({'data': data_list})

#these only define the new upload dataset metadata in 'Imported Datasets' table
@app.route('/imported_table_metadata_upload', methods=['GET'])
def get_variables_of_data():
    last_upload_dataset = DATASETS[[*DATASETS][-1]]
    return jsonify({
        "NAME_DATASET": [*DATASETS][-1],
        "N_VARIABLE": last_upload_dataset['metadata']['n_variables'],
        "N_ENTRIES": last_upload_dataset['metadata']['n_entries'],
        "COMP": last_upload_dataset['metadata']['completion'],
        "variables": last_upload_dataset['metadata']['columns']
    })



        ### 2 Target Selection ####

@app.route('/get_variables_of_selected_dataset', methods=['POST'])
def select_dataset():
    global ACTIVE_TAB

    received = request.get_json()
    ACTIVE_TAB = received.get('active_tab')
    selected_dataset_id = int(received.get('selected_dataset_id'))

    if ACTIVE_TAB == 'loaded_datasets':
        datasets_name = [*LOADED_DATASETS]
        current_dataset_name = datasets_name[selected_dataset_id-1]
        VARIABLES_OF_DATA = LOADED_DATASETS[current_dataset_name]['metadata']['columns']

    else:
        datasets_name = [*DATASETS]
        current_dataset_name = datasets_name[selected_dataset_id-1]
        VARIABLES_OF_DATA = DATASETS[current_dataset_name]['metadata']['columns']

    return jsonify({"status": "OK", "selected_dataset_id": selected_dataset_id, "dataset_name": current_dataset_name, "variables": VARIABLES_OF_DATA})

@app.route('/var_acquisition_backend', methods=['POST'])
def var_acquisition_backend():
    global DATA
    global ACTIVE_DATASET_NAME #used in data function /export_model in line ~ 1450 
    global TARGET_COLUMN
    global TARGET_TYPE
    global ROSSETA
    global SCEWED_TARGET_COL
    global DATA_CASTED
    global DATA_CLEANED
    global DATA_PROCCESED  

    received = request.get_json()
    TARGET_COLUMN = received.get('target_variable')
    selected_dataset_id = int(received.get('selected_dataset_id'))

    if ACTIVE_TAB == 'loaded_datasets':
        datasets_name = [*LOADED_DATASETS]
        ACTIVE_DATASET_NAME = datasets_name[selected_dataset_id-1]
        DATA = LOADED_DATASETS[ACTIVE_DATASET_NAME]['data']
        VARIABLES_OF_DATA = LOADED_DATASETS[ACTIVE_DATASET_NAME]['metadata']['columns']

    else:
        datasets_name = [*DATASETS]
        ACTIVE_DATASET_NAME = datasets_name[selected_dataset_id-1]
        DATA = DATASETS[ACTIVE_DATASET_NAME]['data']
        VARIABLES_OF_DATA = DATASETS[ACTIVE_DATASET_NAME]['metadata']['columns']

    ### 1 drop rows from data by NaN in predict column
    idx_drop_from_predict = DATA.index[DATA[TARGET_COLUMN].isna() == True].tolist()
    DATA = DATA.drop(idx_drop_from_predict)

    ### 3 chech predicted column type
    TARGET_TYPE = 'Not identify'
    unique_values = DATA[TARGET_COLUMN].unique()

    SCEWED_TARGET_COL = pd.DataFrame(columns = ['Value id', 'Value', 'Count', 'Occurences (%)'])
    len_target_col = len(DATA[TARGET_COLUMN])
    for k,unique_val in enumerate(unique_values):
        unique_count = len(DATA[TARGET_COLUMN][DATA[TARGET_COLUMN]==unique_val]) 
        SCEWED_TARGET_COL.loc[len(SCEWED_TARGET_COL.index)] = [k, unique_val, unique_count, (unique_count/len_target_col)*100]
    drop_target_col_values = SCEWED_TARGET_COL[SCEWED_TARGET_COL['Occurences (%)']<10]['Value'] 
    target_col_values = SCEWED_TARGET_COL[SCEWED_TARGET_COL['Occurences (%)']>=10]['Value'] 

    if len(unique_values) == 2: #if we have only two type of values it means is boolean
        TARGET_TYPE = 'boolean'
        status = 'OK'

    else:
        ### 3.1 verify scewed predict data (to cast to boolean)

        ###In the case that values concentrate in only two values and we have something to drop <unque!=2>, ask if the user want to drop the columns that dont have much samples (making it a boolean) 
        if len(target_col_values) == 2 and len(unique_values)!=2:
            print(SCEWED_TARGET_COL) ### we could add a graph instead of a table ##
            status = 'Scewed_target_column'

        else:
            ### 3.2 Coff of unique check
            R = len(unique_values)/len_target_col #coeficient of number of unique in relation to number of rows
            number_of_classes = 10
            #if we have to many classes in relation of samples, ask to group the classes 
            #sceewed check is added becouse we dont want to over write what we done
            if R>(number_of_classes/100):    
                TARGET_TYPE = 'continuous' 
                status = 'OK'  
            if R<=(number_of_classes/100): 
                TARGET_TYPE = 'classes' 
                status = 'OK'         

    scw_data = [SCEWED_TARGET_COL.columns.tolist()] + SCEWED_TARGET_COL.values.tolist()

    message1 = ''
    message2 = ''

    #if status == 'Scewed_target_column': these is done later in the yes/ no respective functions
    if status == 'OK':

        ### 3 Data Cleaning ####
        DATA_CLEANED, drop_col, drop_row = DprepNcleaning.data_cleaning(DATA, min_porcentage_col = 10, min_porcentage_row = 0)
        message1 = '    Number of deleted columns: ' + str(len(drop_col)) + ' of ' + str(len(DATA.columns)) + ' (' + str(round(len(drop_col)/len(DATA.columns)*100, 2)) + '%)'
        message2 = '    Number of deleted rows: '+str(len(drop_row))+' of '+str(len(DATA))+' ('+str( round(len(drop_row)/len(DATA)*100, 2) )+'%)'

        ### 4 Data Casting ####
        DATA_CASTED, ROSSETA = auxiliary_fun.data_cast(DATA_CLEANED, TARGET_COLUMN)

        #define a DF with the cleaned and casted data
        DATA_PROCCESED = DATA_CASTED.copy()


        SCEWED_TARGET_COL = pd.DataFrame(columns = ['Value id', 'Value', 'Count', 'Occurences (%)'])
        len_target_col = len(DATA_CLEANED[TARGET_COLUMN])
        for k,unique_val in enumerate(unique_values):
            unique_count = len(DATA_CLEANED[TARGET_COLUMN][DATA_CLEANED[TARGET_COLUMN]==unique_val]) 
            SCEWED_TARGET_COL.loc[len(SCEWED_TARGET_COL.index)] = [k, unique_val, unique_count, (unique_count/len_target_col)*100]
        scw_data = [SCEWED_TARGET_COL.columns.tolist()] + SCEWED_TARGET_COL.values.tolist()


    return jsonify({'target_variable': TARGET_COLUMN, 'target_type': TARGET_TYPE, 'status': status, 'SCEWED_TARGET_COL': scw_data, 'message1': message1, 'message2': message2})



@app.route('/var_acquisition_scewed_yes', methods=['POST'])
def var_acquisition_scewed_yes():
    global TARGET_COLUMN
    global DATA
    global DATA_CASTED
    global DATA_CLEANED
    global DATA_PROCCESED  
    global TARGET_TYPE
    global ROSSETA
    global SCEWED_TARGET_COL

    TARGET_TYPE = 'boolean'
    status = 'OK'

    drop_target_col_values = SCEWED_TARGET_COL[SCEWED_TARGET_COL['Occurences (%)']<10]['Value']
    for drop_val in drop_target_col_values:
        drop_row = DATA[TARGET_COLUMN][DATA[TARGET_COLUMN]==drop_val].index 
        DATA = DATA.drop(drop_row)

    unique_values = DATA[TARGET_COLUMN].unique()
    updated_scewed_target_col = pd.DataFrame(columns = ['Value id', 'Value', 'Count', 'Occurences (%)'])
    len_target_col = len(DATA[TARGET_COLUMN])
    for k,unique_val in enumerate(unique_values):
        unique_count = len(DATA[TARGET_COLUMN][DATA[TARGET_COLUMN]==unique_val]) 
        updated_scewed_target_col.loc[len(updated_scewed_target_col.index)] = [k, unique_val, unique_count, (unique_count/len_target_col)*100]

    scw_data_updated = [updated_scewed_target_col.columns.tolist()] + updated_scewed_target_col.values.tolist()

    ### 3 Data Cleaning ####
    DATA_CLEANED, drop_col, drop_row = DprepNcleaning.data_cleaning(DATA, min_porcentage_col = 10, min_porcentage_row = 0)
    message1 = '    Number of deleted columns: ' + str(len(drop_col)) + ' of ' + str(len(DATA.columns)) + ' (' + str(round(len(drop_col)/len(DATA.columns)*100, 2)) + '%)'
    message2 = '    Number of deleted rows: '+str(len(drop_row))+' of '+str(len(DATA))+' ('+str( round(len(drop_row)/len(DATA)*100, 2) )+'%)'

    ### 4 Data Casting ####
    DATA_CASTED, ROSSETA = auxiliary_fun.data_cast(DATA_CLEANED, TARGET_COLUMN)

    #define a DF with the cleaned and casted data
    DATA_PROCCESED = DATA_CASTED.copy()

    return jsonify({'target_variable': TARGET_COLUMN, 'target_type': TARGET_TYPE, 'status': status, 'SCEWED_TARGET_COL': scw_data_updated})


@app.route('/var_acquisition_scewed_no', methods=['POST'])
def var_acquisition_scewed_no():
    global TARGET_COLUMN
    global DATA
    global DATA_CASTED
    global DATA_CLEANED
    global DATA_PROCCESED   
    global TARGET_TYPE
    global ROSSETA
    global SCEWED_TARGET_COL
    # TARGET_TYPE = 'classes'
    # status = 'OK'
    unique_values = DATA[TARGET_COLUMN].unique()
    len_target_col = len(DATA[TARGET_COLUMN])

    ### 3.2 Coff of unique check     
    R = len(unique_values)/len_target_col #coeficient of number of unique in relation to number of rows
    number_of_classes = 10
    #if we have to many classes in relation of samples, ask to group the classes 
     #sceewed check is added becouse we dont want to over write what we done
    if R>(number_of_classes/100):    
        if len(unique_values)!=2: #dont enter if we already classify as boolean
            TARGET_TYPE = 'continuous'  
            status = 'OK' 
    if R<=(number_of_classes/100): 
        if len(unique_values)!=2: #dont enter if we already classify as boolean
            TARGET_TYPE = 'classes'    
            status = 'OK'


    ### 3 Data Cleaning ####
    DATA_CLEANED, drop_col, drop_row = DprepNcleaning.data_cleaning(DATA, min_porcentage_col = 10, min_porcentage_row = 0)
    message1 = '    Number of deleted columns: ' + str(len(drop_col)) + ' of ' + str(len(DATA.columns)) + ' (' + str(round(len(drop_col)/len(DATA.columns)*100, 2)) + '%)'
    message2 = '    Number of deleted rows: '+str(len(drop_row))+' of '+str(len(DATA))+' ('+str( round(len(drop_row)/len(DATA)*100, 2) )+'%)'

    ### 4 Data Casting ####
    DATA_CASTED, ROSSETA = auxiliary_fun.data_cast(DATA_CLEANED, TARGET_COLUMN)

    #define a DF with the cleaned and casted data
    DATA_PROCCESED = DATA_CASTED.copy()

    scw_data = [SCEWED_TARGET_COL.columns.tolist()] + SCEWED_TARGET_COL.values.tolist()

    return jsonify({'target_variable': TARGET_COLUMN, 'target_type': TARGET_TYPE, 'status': status, 'SCEWED_TARGET_COL': scw_data})














@app.route('/eda')
def eda_route():

    manualEDA, missing4rows = eda.ManualEDAfun(DATA)

    # Convert DataFrames to list of lists (including headers)
    manualEDA_list = [manualEDA.columns.tolist()] + manualEDA.round(2).values.tolist()
    missing4rows_list = [missing4rows.columns.tolist()] + missing4rows.values.tolist()
    # breakpoint
    return jsonify({
        'manualEDA': manualEDA_list,
        'missing4rows': missing4rows_list
    })

def _dtale_kwargs():
    # En Docker: escuchar en todas las interfaces y en un puerto publicado
    if os.environ.get('DTALE_HOST'):
        return {'host': os.environ['DTALE_HOST'], 'port': int(os.environ.get('DTALE_PORT', 40000))}
    return {}

def _dtale_url(url):
    # En Docker la URL de dtale apunta al hostname del contenedor; el navegador la abre en localhost
    public = os.environ.get('DTALE_PUBLIC_HOST')
    if public:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        url = parsed._replace(netloc=f"{public}:{parsed.port}").geturl()
    return url

@app.route('/dtale', methods=['POST'])
def run_dtale():
    import dtale

    print('DTALe')
    print(DATA)
    instance = dtale.show(DATA, open_browser=False, **_dtale_kwargs())
    url = _dtale_url(instance._main_url)

    return jsonify({"message": "Dtale started!", "url": url})

@app.route('/dtale_casted', methods=['POST'])
def run_dtale_casted():
    import dtale

    print('DTALE CASTED')
    print(DATA_CASTED)
    instance = dtale.show(DATA_CASTED, open_browser=False, **_dtale_kwargs())
    url = _dtale_url(instance._main_url)

    return jsonify({"message": "Dtale started!", "url": url})


@app.route('/modeling', methods=['POST'])
def modeling():
    # global DATA_PROCCESED
    global TARGET_COLUMN
    global TARGET_TYPE
    global ALL_TRAINED_MODELS

    global model_info
    global best_model_res
    global X_test
    global y_test
    global scalers


    data = request.get_json()
    mode = data.get('mode')
    print(f"Received AutoML flag: {mode}")

    FAST = True if mode == 'fast' else False

        ### Step 5: Model Building  

    #test data extraction
    X = DATA_PROCCESED.loc[:, DATA_PROCCESED.columns != TARGET_COLUMN]
    y = DATA_PROCCESED[TARGET_COLUMN]

    #set the norm methos before spliting the data
    scalers = []
    minmax = MinMaxScaler()
    # breakpoint()
    # use X.to_numpy() because the data to transform doesnt have labels
    minmax.fit(X.to_numpy()) #fit whit column names
    std = StandardScaler()
    std.fit(X.to_numpy())
    scalers.append(minmax)
    scalers.append(std)

    # condition = True
    # while condition:
    #     # X_data, X_test, y_data, y_test = train_test_split(X, y, test_size=0.1, shuffle = True) # puedo tomar test bien distribuido
    #     X_data, X_test, y_data, y_test = train_test_split(X, y, test_size=0.12, shuffle = True) #para agro
    #     # if y_test.sum() == 3: 
    #         # print('equal')
    #         # condition = False
    #     if y_test.nunique() == 3: 
    #         if y_test.value_counts()[0] == y_test.value_counts()[1] == y_test.value_counts()[2]: condition = False
    # breakpoint()
    # data = pd.concat([y_data, X_data], axis=1)


    X_data, X_test, y_data, y_test = train_test_split(X, y, test_size=0.1, shuffle = True)
    data = pd.concat([y_data, X_data], axis=1)

    # breakpoint()
    model_info, ALL_TRAINED_MODELS, fig_feat, fig_cm, fig_roc, fig_score, training_report = Mbuilding.model_shake(data_function=data, x_test_function=X_test.to_numpy(),  y_test_function=y_test.to_numpy(), target_column_function=TARGET_COLUMN, target_type_function=TARGET_TYPE, sclaer_function=scalers, fast_function = FAST)
    
    #export training info
    os.makedirs('TrainedModels/'+ACTIVE_DATASET_NAME[:-4]+'_EXPORT', exist_ok=True)
    for key in [*training_report]: training_report[key].to_csv('TrainedModels/'+ACTIVE_DATASET_NAME[:-4]+'_EXPORT'+'/'+key+'.csv')

    # model_info, ALL_TRAINED_MODELS, fig_feat, fig_cm, fig_roc, fig_score = old_mbuilding.model_shake(DATA=data, X_TEST=X_test.to_numpy(),  Y_TEST=y_test.to_numpy(), TARGET_COLUMN=TARGET_COLUMN, TARGET_TY=TARGET_TYPE, SCALER=scalers, Fast = FAST)

    # (DATA, X_TEST, Y_TEST, TARGET_COLUMN, TARGET_TY, SCALER, Fast = True):
    # breakpoint()

    # best_model_res = model_info.loc[model_info.groupby('Model name')['Score'].idxmax()]
    best_model_res = (model_info.sort_values(by=['Model name', 'Brier score loss', 'Score', 'AUC'], ascending=[True, True, False, False]).groupby('Model name', as_index=False).first())
    # best_model_res = best_model_res[['Model name', 'Normalization method', 'Feature selection method', 'Features used', 'importances', 'Confusion matrix','False Positive Rate', 'True Positive Rate', 'AUC']]
    # breakpoint()
    
    number_of_models = len(best_model_res)
    classes = len(ROSSETA[TARGET_COLUMN][0])
    # Model names
    model_names = best_model_res['Model name']
    mod_name_list = model_names.values.tolist()

    # Features used
    L = len(best_model_res.iloc[0]['Features used'])
    feat0 = pd.DataFrame(best_model_res.iloc[0]['importances'].round(2).reshape(1, L),columns= best_model_res.iloc[0]['Features used'])
    feat0_list = [feat0.columns.tolist()] + feat0.values.tolist()

    L = len(best_model_res.iloc[1]['Features used'])
    feat1 = pd.DataFrame(best_model_res.iloc[1]['importances'].round(2).reshape(1, L),columns= best_model_res.iloc[1]['Features used'])
    feat1_list = [feat1.columns.tolist()] + feat1.values.tolist()

    L = len(best_model_res.iloc[2]['Features used'])
    feat2 = pd.DataFrame(best_model_res.iloc[2]['importances'].round(2).reshape(1, L),columns= best_model_res.iloc[2]['Features used'])
    feat2_list = [feat2.columns.tolist()] + feat2.values.tolist()

    feat3_list = []
    feat4_list = []
    feat5_list = []

    if number_of_models==6:
        L = len(best_model_res.iloc[3]['Features used'])
        feat3 = pd.DataFrame(best_model_res.iloc[3]['importances'].round(2).reshape(1, L),columns= best_model_res.iloc[3]['Features used'])
        feat3_list = [feat3.columns.tolist()] + feat3.values.tolist()

        L = len(best_model_res.iloc[4]['Features used'])
        feat4 = pd.DataFrame(best_model_res.iloc[4]['importances'].round(2).reshape(1, L),columns= best_model_res.iloc[4]['Features used'])
        feat4_list = [feat4.columns.tolist()] + feat4.values.tolist()

        L = len(best_model_res.iloc[5]['Features used'])
        feat5 = pd.DataFrame(best_model_res.iloc[5]['importances'].round(2).reshape(1, L),columns= best_model_res.iloc[5]['Features used'])
        feat5_list = [feat5.columns.tolist()] + feat5.values.tolist()

    # else:
    #     feat3_list = []
    #     feat4_list = []
    #     feat5_list = []
    # breakpoint()

    roc_curves = []
    AUC_list = []
    #CM, ROC and AUC
    CM_list = []
    # roc_curves = []
    # AUC_list = []
    AUC_df = pd.DataFrame()

    best_model_resRI = best_model_res.reset_index(drop=True)
    for i in range(len(model_names)):

        if TARGET_TYPE=='classes' or TARGET_TYPE=='boolean':
            ### CM
            for j in range(classes):
                CM_list = CM_list + best_model_resRI['Confusion matrix'][i][j].tolist()
                # CM_list.append(best_model_res['Confusion matrix'][i][j][0])
            # CM_list = CM_list + best_model_res['Confusion matrix'][i][0].tolist()+best_model_res['Confusion matrix'][i][1].tolist()
            # breakpoint()

        if TARGET_TYPE=='boolean':
            ### ROC
            tpr = best_model_resRI['True Positive Rate'][i].tolist()
            fpr = best_model_resRI['False Positive Rate'][i].tolist()
            roc_points = list(zip(fpr, tpr))  # Each point is (FPR, TPR)
            roc_curves.append(roc_points)

            ### AUC
            AUC_df[mod_name_list[i]] = model_info[model_info['Model name']==mod_name_list[i]]['AUC'].reset_index(drop=True)

    feat_sel_method = best_model_resRI['Feature selection method'].tolist()
    if TARGET_TYPE=='classes' or TARGET_TYPE=='boolean': CM_list = [CM_list]
    if TARGET_TYPE=='boolean': AUC_list = [AUC_df.columns.tolist()] + AUC_df.values.tolist()    # AUC_list = [AUC_list]
    
    # print('cm list server')
    # print(CM_list)
    # breakpoint()
    return jsonify({'model_names': mod_name_list, 'feat0': feat0_list, 'feat1': feat1_list, 'feat2': feat2_list, 'feat3': feat3_list, 'feat4': feat4_list, 'feat5': feat5_list, 'CM': CM_list, 'roc_curves': roc_curves, 'AUC': AUC_list, 'target_type': TARGET_TYPE, 'NumbClasses': classes, 'FeatueMethod': feat_sel_method})



###PREDICTION PAGE
@app.route('/PredictionModel', methods=['GET'])
def prediction_model():
    global X_test
    global y_test
    global minmax
    global std
    # global rosseta
    global clf
    global MODEL_INFO

    global CURRENT_MODEL
    global MODEL_INFO
    global NORM_F
    global scalers
    global all_features
    global features_list

    CURRENT_MODEL = clf
    model_name = MODEL_INFO['Model name'].values[0]
    Features = MODEL_INFO['Features used'].values[0][1:-1]
    Importances = MODEL_INFO['importances'].values[0][1:-1]
    target_column = MODEL_INFO['Target column'].values[0]
    target_type = MODEL_INFO['Target type'].values[0]
    scalers = []
    scalers.append(minmax)
    scalers.append(std)
    all_features = X_test.columns

    Normalization_methods = ['No', 'Min-Max', 'Z-score']
    NORM_METHOD = MODEL_INFO['Normalization method'].values[0]
    NORM_F = [i for i, j in enumerate(Normalization_methods) if j == NORM_METHOD][0]

    features_list = []
    features_list = [item.strip() for item in Features.split(',')]
    features_list = [item.strip() for item in Features.split(',')]
    features_list = [f.strip("'") for f in features_list]
    features_list = [f for f in features_list if f]

    importances_list = []
    importances_list = [item.strip() for item in Importances.split(' ')]
    importances_list = [f for f in importances_list if f]
    imp_array = [float(string) for string in importances_list]
    Nimp_array = (imp_array)/(np.max(imp_array))
    importances_list = Nimp_array.tolist()

    # Create DataFrame with proper shape - reshape to (1, n_features) for single row
    if len(importances_list) == len(features_list):
        feat = pd.DataFrame([importances_list], columns=features_list)
    else:
        # If lengths don't match, create empty DataFrame
        feat = pd.DataFrame(columns=features_list)
    feat_list = [feat.columns.tolist()] + feat.values.tolist()

    classes = len(rosseta[target_column][0])
    cm_list = [0, 0, 0, 0]
    cm_string = MODEL_INFO['Confusion matrix'].values[0]
    numbers = re.findall(r'\d+', cm_string)
    if target_type == 'boolean':
        # Convert to integers and create flat list
        if len(numbers) >= 4:
            cm_list = [int(numbers[0]), int(numbers[1]), int(numbers[2]), int(numbers[3])]
        else:
            cm_list = [0, 0, 0, 0]  # Default fallback
        cm_list = [cm_list]
    if target_type == 'classes':
        cm_list = []
        for val_numb in numbers: 
            cm_list.append(int(val_numb))
        cm_list = [cm_list]


    tpr_list = []
    fpr_list = []
    roc_curves = []
    AUC = []
    if target_type == 'boolean':
        AUC = MODEL_INFO['AUC'].values[0].tolist()

        tpr_string = MODEL_INFO['True Positive Rate'].values[0]
        tpr_numbers = re.findall(r'\d+\.?\d*', tpr_string)
        if tpr_numbers:
            tpr_list = [float(num) for num in tpr_numbers]
        else:
            tpr_list = []  # Default fallback

        # MODEL_INFO['False Positive Rate']
        fpr_string = MODEL_INFO['False Positive Rate'].values[0]
        fpr_numbers = re.findall(r'\d+\.?\d*', fpr_string)
        if fpr_numbers:
            fpr_list = [float(num) for num in fpr_numbers]
        else:
            fpr_list = []  # Default fallback

        # Create ROC curve from TPR and FPR lists
        roc_curves = []
        if len(tpr_list) == len(fpr_list) and len(tpr_list) > 0:
            roc_points = list(zip(fpr_list, tpr_list))  # Each point is (FPR, TPR)
            roc_curves.append(roc_points)
        else:
            roc_curves = []  # Default fallback

    # breakpoint()
    X_testN = DprepNcleaning.data_normF(X_test.to_numpy(), FLAG=NORM_F, scaler=scalers) 
    X_testN=pd.DataFrame(X_testN, columns=X_test.columns)
    PREDICTION, PROBA, Y_DECASTED = Mbuilding.predict_fun(x_test_function=X_test[features_list], model_function = clf, y_test_function = y_test, target_column_function = target_column, target_type_function = target_type, rosseta_function = rosseta, cast_flag_function = False)
    

    # Flatten the PREDICTION list if it's a list of lists
    flat_predictions = [item[0] if isinstance(item, list) else item for item in PREDICTION]
    X_test = X_test[features_list]
    X_test[target_column] = Y_DECASTED
    X_test['PREDICTION'] = flat_predictions
    X_test['CONFIDENCE'] = PROBA

    # breakpoint()
    if target_column == 'CAUSA_BAJA': 
        X_test = X_test.head(8)  # Limit to 10 rows for display
        ExamplePrediction = [X_test.columns.tolist()] + X_test.values.tolist()
    else: ExamplePrediction = [X_test.columns.tolist()] + X_test.values.astype(float).tolist() #esto es para oncologia

    
    bool_labels=[]
    if target_type == 'boolean': 
        # bool_labels.append(rosseta[target_column][0][0])
        # bool_labels.append(rosseta[target_column][0][1])
        bool_labels.append('Toxicidad presente')
        bool_labels.append('Toxicidad ausente')
        bool_labels.append(rosseta[target_column][1][0].item())
        bool_labels.append(rosseta[target_column][1][1].item())    
    if target_type == 'classes':
        for outer in range(2): 
            for inner in range(classes):
                bool_labels.append(rosseta[target_column][outer][inner].item())

    
    # breakpoint()
    # ExamplePrediction = []
    tree1 = []
    tree2 = []
    if model_name == 'RandomForestClassifier':
        from sklearn.tree import export_text
        tree1 = export_text(clf.estimators_[0], feature_names=features_list)
        tree2 = export_text(clf.estimators_[-1], feature_names=features_list)
        # breakpoint()

    print('es este si')

    return jsonify({
        'model_name': model_name, 
        'features': features_list, 
        'feat': feat_list,
        'CM': cm_list,
        'roc_curves': roc_curves,
        'auc': AUC,
        'example_prediction': ExamplePrediction,
        'bool_labels': bool_labels,
        'target_type': target_type,
        'NumbClasses': classes,
        'FirstTree': tree1,
        'LastTree': tree2
    })

@app.route('/Hemodialisis', methods=['GET'])
def hemodialisis_model():
    global CURRENT_MODEL
    global MODEL_INFO

    MODEL_INFO = pd.read_csv("TrainedModels/ModelosEstudio/hemodialysis_FM/info.csv")
    clf = sio.load("TrainedModels/ModelosEstudio/hemodialysis_FM/model.skops", trusted=['sklearn._loss.link.Interval', 'sklearn._loss.loss.HalfBinomialLoss', 'sklearn._loss.link.LogitLink', 'sklearn.metrics._dist_metrics.EuclideanDistance64', 'sklearn.neighbors._kd_tree.KDTree', 'sklearn._loss._loss.CyHalfBinomialLoss'])
    X_test, y_test = pd.read_csv("TrainedModels/ModelosEstudio/hemodialysis_FM/X_test.csv"), pd.read_csv("TrainedModels/ModelosEstudio/hemodialysis_FM/y_test.csv")
    with open("TrainedModels/ModelosEstudio/hemodialysis_FM/rosseta.pkl", "rb") as f: rosseta = pickle.load(f)
    with open("TrainedModels/ModelosEstudio/hemodialysis_FM/minmax.pkl", "rb") as f: minmax = pickle.load(f)
    with open("TrainedModels/ModelosEstudio/hemodialysis_FM/std.pkl", "rb") as f: std = pickle.load(f)

    CURRENT_MODEL = clf
    model_name = MODEL_INFO['Model name'].values[0]
    Features = MODEL_INFO['Features used'].values[0][1:-1]
    Importances = MODEL_INFO['importances'].values[0][1:-1]
    target_column = MODEL_INFO['Target column'].values[0]
    target_type = MODEL_INFO['Target type'].values[0]
    AUC = MODEL_INFO['AUC'].values[0].tolist()
    scalers = []
    scalers.append(minmax)
    scalers.append(std)
    all_features = X_test.columns

    Normalization_methods = ['No', 'Min-Max', 'Z-score']
    NORM_METHOD = MODEL_INFO['Normalization method'].values[0]
    NORM_F = [i for i, j in enumerate(Normalization_methods) if j == NORM_METHOD][0]

    features_list = []
    features_list = [item.strip() for item in Features.split(',')]
    features_list = [item.strip() for item in Features.split(',')]
    features_list = [f.strip("'") for f in features_list]
    features_list = [f for f in features_list if f]

    importances_list = []
    importances_list = [item.strip() for item in Importances.split(' ')]
    importances_list = [f for f in importances_list if f]
    imp_array = [float(string) for string in importances_list]
    Nimp_array = (imp_array)/(np.max(imp_array))
    importances_list = Nimp_array.tolist()

    # Create DataFrame with proper shape - reshape to (1, n_features) for single row
    if len(importances_list) == len(features_list):
        feat = pd.DataFrame([importances_list], columns=features_list)
    else:
        # If lengths don't match, create empty DataFrame
        feat = pd.DataFrame(columns=features_list)
    feat_list = [feat.columns.tolist()] + feat.values.tolist()

    cm_string = MODEL_INFO['Confusion matrix'].values[0]
    numbers = re.findall(r'\d+', cm_string)
    # Convert to integers and create flat list
    if len(numbers) >= 4:
        cm_list = [int(numbers[0]), int(numbers[1]), int(numbers[2]), int(numbers[3])]
    else:
        cm_list = [0, 0, 0, 0]  # Default fallback
    cm_list = [cm_list]
    
    tpr_string = MODEL_INFO['True Positive Rate'].values[0]
    tpr_numbers = re.findall(r'\d+\.?\d*', tpr_string)
    if tpr_numbers:
        tpr_list = [float(num) for num in tpr_numbers]
    else:
        tpr_list = []  # Default fallback

    # MODEL_INFO['False Positive Rate']
    fpr_string = MODEL_INFO['False Positive Rate'].values[0]
    fpr_numbers = re.findall(r'\d+\.?\d*', fpr_string)
    if fpr_numbers:
        fpr_list = [float(num) for num in fpr_numbers]
    else:
        fpr_list = []  # Default fallback

    # Create ROC curve from TPR and FPR lists
    roc_curves = []
    if len(tpr_list) == len(fpr_list) and len(tpr_list) > 0:
        roc_points = list(zip(fpr_list, tpr_list))  # Each point is (FPR, TPR)
        roc_curves.append(roc_points)
    else:
        roc_curves = []  # Default fallback

    # breakpoint()
    X_testN = DprepNcleaning.data_normF(X_test, FLAG=NORM_F, scaler=scalers) 
    X_testN=pd.DataFrame(X_testN, columns=X_test.columns)
    PREDICTION, PROBA, Y_DECASTED = Mbuilding.predict_fun(x_test_function=X_test[features_list], model_function = clf, y_test_function = y_test, target_column_function = target_column, target_type_function = target_type, rosseta_function = rosseta, cast_flag_function = False)
    

    # Flatten the PREDICTION list if it's a list of lists
    flat_predictions = [item[0] if isinstance(item, list) else item for item in PREDICTION]
    X_test[target_column] = Y_DECASTED
    X_test['PREDICTION'] = flat_predictions
    X_test['CONFIDENCE'] = PROBA
    X_test = X_test.head(8)
    # breakpoint()
    ExamplePrediction = [X_test.columns.tolist()] + X_test.values.tolist()
    
    # breakpoint()
    bool_labels=[]
    if target_type == 'boolean': 
        # bool_labels.append(rosseta[target_column][0][0])
        # bool_labels.append(rosseta[target_column][0][1])
        bool_labels.append('Toxicidad presente')
        bool_labels.append('Toxicidad ausente')
        bool_labels.append(rosseta[target_column][1][0].item())
        bool_labels.append(rosseta[target_column][1][1].item())    

    # breakpoint()
    # cm_list = [[2,1,0,3]]
    return jsonify({
        'model_name': model_name, 
        'features': features_list, 
        'feat': feat_list,
        'CM': cm_list,
        'roc_curves': roc_curves,
        'auc': AUC,
        'example_prediction': ExamplePrediction,
        'bool_labels': bool_labels,
        'target_type': target_type
    })


@app.route('/Status', methods=['GET'])
def StatusFUN():
    global CURRENT_MODEL
    global MODEL_INFO
    global NORM_F
    global scalers
    global all_features
    global features_list
    global target_column
    global target_type
    global rosseta
    global problem

    # MODEL_INFO = pd.read_csv("TrainedModels/StatusCompleto/info.csv")
    # clf = sio.load("TrainedModels/StatusCompleto/model.skops", trusted=['sklearn._loss.link.Interval', 'sklearn._loss.loss.HalfBinomialLoss', 'sklearn._loss.link.LogitLink', 'sklearn.metrics._dist_metrics.EuclideanDistance64', 'sklearn.neighbors._kd_tree.KDTree', 'sklearn._loss._loss.CyHalfBinomialLoss'])
    # X_test, y_test = pd.read_csv("TrainedModels/StatusCompleto/X_test.csv"), pd.read_csv("TrainedModels/StatusCompleto/y_test.csv")
    # with open("TrainedModels/StatusCompleto/rosseta.pkl", "rb") as f: rosseta = pickle.load(f)
    # with open("TrainedModels/StatusCompleto/minmax.pkl", "rb") as f: minmax = pickle.load(f)
    # with open("TrainedModels/StatusCompleto/std.pkl", "rb") as f: std = pickle.load(f)


    MODEL_INFO = pd.read_csv("TrainedModels/StatusCompletoCicada/info.csv")
    clf = sio.load("TrainedModels/StatusCompletoCicada/model.skops", trusted=['sklearn._loss.link.Interval', 'sklearn._loss.loss.HalfBinomialLoss', 'sklearn._loss.link.LogitLink', 'sklearn.metrics._dist_metrics.EuclideanDistance64', 'sklearn.neighbors._kd_tree.KDTree', 'sklearn._loss._loss.CyHalfBinomialLoss'])
    X_test, y_test = pd.read_csv("TrainedModels/StatusCompletoCicada/X_test.csv"), pd.read_csv("TrainedModels/StatusCompletoCicada/y_test.csv")
    with open("TrainedModels/StatusCompletoCicada/rosseta.pkl", "rb") as f: rosseta = pickle.load(f)
    with open("TrainedModels/StatusCompletoCicada/minmax.pkl", "rb") as f: minmax = pickle.load(f)
    with open("TrainedModels/StatusCompletoCicada/std.pkl", "rb") as f: std = pickle.load(f)

    CURRENT_MODEL = clf
    model_name = MODEL_INFO['Model name'].values[0]
    Features = MODEL_INFO['Features used'].values[0][1:-1]
    Importances = MODEL_INFO['importances'].values[0][1:-1]
    target_column = MODEL_INFO['Target column'].values[0]
    target_type = MODEL_INFO['Target type'].values[0]
    AUC = MODEL_INFO['AUC'].values[0].tolist()
    scalers = []
    scalers.append(minmax)
    scalers.append(std)
    all_features = X_test.columns
    problem = 'Status'

    Normalization_methods = ['No', 'Min-Max', 'Z-score']
    NORM_METHOD = MODEL_INFO['Normalization method'].values[0]
    NORM_F = [i for i, j in enumerate(Normalization_methods) if j == NORM_METHOD][0]

    features_list = []
    features_list = [item.strip() for item in Features.split(',')]
    features_list = [item.strip() for item in Features.split(',')]
    features_list = [f.strip("'") for f in features_list]
    features_list = [f for f in features_list if f]

    importances_list = []
    importances_list = [item.strip() for item in Importances.split(' ')]
    importances_list = [f for f in importances_list if f]
    imp_array = [float(string) for string in importances_list]
    Nimp_array = (imp_array)/(np.max(imp_array))
    importances_list = Nimp_array.tolist()
    
    # Create DataFrame with proper shape - reshape to (1, n_features) for single row
    if len(importances_list) == len(features_list):
        feat = pd.DataFrame([importances_list], columns=features_list)
    else:
        # If lengths don't match, create empty DataFrame
        feat = pd.DataFrame(columns=features_list)
    feat_list = [feat.columns.tolist()] + feat.values.tolist()

    # Parse the confusion matrix string
    cm_string = MODEL_INFO['Confusion matrix'].values[0]
    
    # Extract numbers from the string using regex
    import re
    numbers = re.findall(r'\d+', cm_string)
    
    # Convert to integers and create flat list
    if len(numbers) >= 4:
        cm_list = [int(numbers[0]), int(numbers[1]), int(numbers[2]), int(numbers[3])]
    else:
        cm_list = [0, 0, 0, 0]  # Default fallback
    cm_list = [cm_list]
    

    tpr_string = MODEL_INFO['True Positive Rate'].values[0]
    tpr_numbers = re.findall(r'\d+\.?\d*', tpr_string)
    if tpr_numbers:
        tpr_list = [float(num) for num in tpr_numbers]
    else:
        tpr_list = [] 

    fpr_string = MODEL_INFO['False Positive Rate'].values[0]
    fpr_numbers = re.findall(r'\d+\.?\d*', fpr_string)
    if fpr_numbers:
        fpr_list = [float(num) for num in fpr_numbers]
    else:
        fpr_list = []  

    # Create ROC curve from TPR and FPR lists
    roc_curves = []
    if len(tpr_list) == len(fpr_list) and len(tpr_list) > 0:
        roc_points = list(zip(fpr_list, tpr_list))  # Each point is (FPR, TPR)
        roc_curves.append(roc_points)
    else:
        roc_curves = []  # Default fallback

    X_testN = DprepNcleaning.data_normF(X_test, FLAG=NORM_F, scaler=scalers) 
    X_testN=pd.DataFrame(X_testN, columns=X_test.columns)
    # breakpoint()
    PREDICTION, PROBA, Y_DECASTED = Mbuilding.predict_fun(x_test_function=X_testN[features_list], model_function = clf, y_test_function = y_test, target_column_function = target_column, target_type_function = target_type, rosseta_function = rosseta, cast_flag_function = False)

    # Flatten the PREDICTION list if it's a list of lists
    flat_predictions = [item[0] if isinstance(item, list) else item for item in PREDICTION]
    X_test = X_test[features_list]
    X_test['STATUS'] = Y_DECASTED
    X_test['PREDICTION'] = flat_predictions
    X_test['CONFIDENCE'] = PROBA

    ExamplePrediction = [X_test.columns.tolist()] + X_test.values.tolist()

    bool_labels=[]
    if target_type == 'boolean': 
        bool_labels.append(rosseta[target_column][0][0])
        bool_labels.append(rosseta[target_column][0][1])
        bool_labels.append(rosseta[target_column][1][0].item())
        bool_labels.append(rosseta[target_column][1][1].item())    

    return jsonify({
        'model_name': model_name, 
        'features': features_list, 
        'feat': feat_list,
        'CM': cm_list,
        'roc_curves': roc_curves,
        'auc': AUC,
        'example_prediction': ExamplePrediction,
        'bool_labels': bool_labels,
        'target_type': target_type
    })


@app.route('/Toxicidad', methods=['GET'])
def Toxicidad():
    global CURRENT_MODEL
    global MODEL_INFO
    global NORM_F
    global scalers
    global all_features
    global features_list

    #Cicada
    # breakpoint()
    MODEL_INFO = pd.read_csv("TrainedModels/ToxicidadCompleto1_CICADA/info.csv")
    clf = sio.load("TrainedModels/ToxicidadCompleto1_CICADA/model.skops", trusted=['sklearn._loss.link.Interval', 'sklearn._loss.loss.HalfBinomialLoss', 'sklearn._loss.link.LogitLink', 'sklearn.metrics._dist_metrics.EuclideanDistance64', 'sklearn.neighbors._kd_tree.KDTree', 'sklearn._loss._loss.CyHalfBinomialLoss'])
    X_test, y_test = pd.read_csv("TrainedModels/ToxicidadCompleto1_CICADA/X_test.csv"), pd.read_csv("TrainedModels/ToxicidadCompleto1_CICADA/y_test.csv")
    with open("TrainedModels/ToxicidadCompleto1_CICADA/rosseta.pkl", "rb") as f: rosseta = pickle.load(f)
    with open("TrainedModels/ToxicidadCompleto1_CICADA/minmax.pkl", "rb") as f: minmax = pickle.load(f)
    with open("TrainedModels/ToxicidadCompleto1_CICADA/std.pkl", "rb") as f: std = pickle.load(f)


    #congreso Belen alemanaia
    # MODEL_INFO = pd.read_csv("TrainedModels/toxicidad2/info.csv")
    # clf = sio.load("TrainedModels/toxicidad2/model.skops", trusted=['sklearn._loss.link.Interval', 'sklearn._loss.loss.HalfBinomialLoss', 'sklearn._loss.link.LogitLink', 'sklearn.metrics._dist_metrics.EuclideanDistance64', 'sklearn.neighbors._kd_tree.KDTree', 'sklearn._loss._loss.CyHalfBinomialLoss'])
    # X_test, y_test = pd.read_csv("TrainedModels/toxicidad2/X_test.csv"), pd.read_csv("TrainedModels/toxicidad2/y_test.csv")
    # with open("TrainedModels/toxicidad2/rosseta.pkl", "rb") as f: rosseta = pickle.load(f)
    # with open("TrainedModels/toxicidad2/minmax.pkl", "rb") as f: minmax = pickle.load(f)
    # with open("TrainedModels/toxicidad2/std.pkl", "rb") as f: std = pickle.load(f)

    # breakpoint()
    CURRENT_MODEL = clf
    model_name = MODEL_INFO['Model name'].values[0]
    Features = MODEL_INFO['Features used'].values[0][1:-1]
    Importances = MODEL_INFO['importances'].values[0][1:-1]
    target_column = MODEL_INFO['Target column'].values[0]
    target_type = MODEL_INFO['Target type'].values[0]
    AUC = MODEL_INFO['AUC'].values[0].tolist()
    scalers = []
    scalers.append(minmax)
    scalers.append(std)
    all_features = X_test.columns

    Normalization_methods = ['No', 'Min-Max', 'Z-score']
    NORM_METHOD = MODEL_INFO['Normalization method'].values[0]
    NORM_F = [i for i, j in enumerate(Normalization_methods) if j == NORM_METHOD][0]

    features_list = []
    features_list = [item.strip() for item in Features.split(',')]
    features_list = [item.strip() for item in Features.split(',')]
    features_list = [f.strip("'") for f in features_list]
    features_list = [f for f in features_list if f]
    # breakpoint()
    importances_list = []
    importances_list = [item.strip() for item in Importances.split(' ')]
    importances_list = [f for f in importances_list if f]
    imp_array = [float(string) for string in importances_list]
    Nimp_array = (imp_array)/(np.max(imp_array))
    importances_list = Nimp_array.tolist()

    # Create DataFrame with proper shape - reshape to (1, n_features) for single row
    if len(importances_list) == len(features_list):
        feat = pd.DataFrame([importances_list], columns=features_list)
    else:
        # If lengths don't match, create empty DataFrame
        feat = pd.DataFrame(columns=features_list)
    feat_list = [feat.columns.tolist()] + feat.values.tolist()

    cm_string = MODEL_INFO['Confusion matrix'].values[0]
    numbers = re.findall(r'\d+', cm_string)
    # Convert to integers and create flat list
    if len(numbers) >= 4:
        cm_list = [int(numbers[0]), int(numbers[1]), int(numbers[2]), int(numbers[3])]
    else:
        cm_list = [0, 0, 0, 0]  # Default fallback
    cm_list = [cm_list]
    
    tpr_string = MODEL_INFO['True Positive Rate'].values[0]
    tpr_numbers = re.findall(r'\d+\.?\d*', tpr_string)
    if tpr_numbers:
        tpr_list = [float(num) for num in tpr_numbers]
    else:
        tpr_list = []  # Default fallback

    # MODEL_INFO['False Positive Rate']
    fpr_string = MODEL_INFO['False Positive Rate'].values[0]
    fpr_numbers = re.findall(r'\d+\.?\d*', fpr_string)
    if fpr_numbers:
        fpr_list = [float(num) for num in fpr_numbers]
    else:
        fpr_list = []  # Default fallback

    # Create ROC curve from TPR and FPR lists
    roc_curves = []
    if len(tpr_list) == len(fpr_list) and len(tpr_list) > 0:
        roc_points = list(zip(fpr_list, tpr_list))  # Each point is (FPR, TPR)
        roc_curves.append(roc_points)
    else:
        roc_curves = []  # Default fallback

    # breakpoint()
    X_testN = DprepNcleaning.data_normF(X_test, FLAG=NORM_F, scaler=scalers) 
    X_testN=pd.DataFrame(X_testN, columns=X_test.columns)
    PREDICTION, PROBA, Y_DECASTED = Mbuilding.predict_fun(x_test_function=X_testN[features_list], model_function = clf, y_test_function = y_test, target_column_function = target_column, target_type_function = target_type, rosseta_function = rosseta, cast_flag_function = False)
    

    # Flatten the PREDICTION list if it's a list of lists
    flat_predictions = [item[0] if isinstance(item, list) else item for item in PREDICTION]
    X_test = X_test[features_list]
    X_test['TOXICIDAD'] = Y_DECASTED
    X_test['PREDICTION'] = flat_predictions
    X_test['CONFIDENCE'] = PROBA

    ExamplePrediction = [X_test.columns.tolist()] + X_test.values.tolist()
    
    # breakpoint()
    bool_labels=[]
    if target_type == 'boolean': 
        # bool_labels.append(rosseta[target_column][0][0])
        # bool_labels.append(rosseta[target_column][0][1])
        bool_labels.append('Toxicidad presente')
        bool_labels.append('Toxicidad ausente')
        bool_labels.append(rosseta[target_column][1][0].item())
        bool_labels.append(rosseta[target_column][1][1].item())    

    # breakpoint()
    # cm_list = [[2,1,0,3]]
    return jsonify({
        'model_name': model_name, 
        'features': features_list, 
        'feat': feat_list,
        'CM': cm_list,
        'roc_curves': roc_curves,
        'auc': AUC,
        'example_prediction': ExamplePrediction,
        'bool_labels': bool_labels,
        'target_type': target_type
    })


@app.route('/RNNStatus', methods=['GET'])
def RNN():
    from Test.RNN.VikParuchuri import functions as fn
    with open('TrainedModels/StatusRNN/layers.pkl', 'rb') as f: layers = pickle.load(f)
    X_test, y_test = pd.read_csv("TrainedModels/StatusRNN/X_test.csv").to_numpy(), pd.read_csv("TrainedModels/StatusRNN/y_test.csv").to_numpy()


    PREDICTORS = ["Linfocitos", "Neutrofilos", "Plaquetas"]
    TARGET = "Vivo"
    # breakpoint()

    sequence_len = 4
    for j in range(X_test.shape[0] - sequence_len):
        breakpoint()
        seq_x = valid_x[j:(j+sequence_len),]
        seq_y = valid_y[j:(j+sequence_len),]
        _, outputs = fn.forward(seq_x, layers)
        valid_loss += fn.mse(seq_y, outputs)


    model_name = 'RNN'
    features_list = ["Linfocitos", "Neutrofilos", "Plaquetas"]
    cm_list = []
    roc_curves = []
    AUC = 0


    breakpoint()
    return jsonify({
        'model_name': model_name, 
        'features': features_list, 
        'feat': feat_list,
        'CM': cm_list,
        'roc_curves': roc_curves,
        'auc': AUC,
        'example_prediction': ExamplePrediction
    })


@app.route('/upload_model', methods=['POST'])
def upload_model():
    global X_test
    global y_test
    global minmax
    global std
    global rosseta
    global clf
    global MODEL_INFO
    

    ### Load the model files ###
    try:
        if 'files' not in request.files:
            return jsonify({'success': False, 'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        if not files or all(file.filename == '' for file in files):
            return jsonify({'success': False, 'error': 'No files selected'}), 400
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(os.getcwd(), 'TrainedModels', 'UploadedModels')
        os.makedirs(upload_dir, exist_ok=True)
        
        uploaded_files = []
        for file in files:
            if file and file.filename:
                filename = secure_filename(file.filename)
                file_path = os.path.join(upload_dir, filename)
                file.save(file_path)
                uploaded_files.append(filename)
                print(f"Uploaded file: {filename}")
        
        # Process uploaded files - look for y_test.csv
        test_df = None
        for filename in uploaded_files:
            # breakpoint()
            if filename == 'y_test.csv':
                y_test_path = os.path.join(upload_dir, filename)
                try:
                    y_test = pd.read_csv(y_test_path)
                    print(f"Successfully loaded y_test.csv with shape: {y_test.shape}")
                    print(f"Columns: {y_test.columns.tolist()}")
                    print(f"First few rows:\n{y_test.head()}")
                except Exception as e:
                    print(f"Error reading y_test.csv: {str(e)}")
                    return jsonify({'success': False, 'error': f'Error reading y_test.csv: {str(e)}'}), 500
            if filename == 'X_test.csv':
                X_test_path = os.path.join(upload_dir, filename)
                try:
                    X_test = pd.read_csv(X_test_path)
                    print(f"Successfully loaded y_test.csv with shape: {X_test.shape}")
                    print(f"Columns: {X_test.columns.tolist()}")
                    print(f"First few rows:\n{X_test.head()}")
                except Exception as e:
                    print(f"Error reading X_test.csv: {str(e)}")
                    return jsonify({'success': False, 'error': f'Error reading X_test.csv: {str(e)}'}), 500
            if filename == 'info.csv':
                info_path = os.path.join(upload_dir, filename)
                try:
                    MODEL_INFO = pd.read_csv(info_path)
                    print(f"Successfully loaded y_test.csv with shape: {MODEL_INFO.shape}")
                    print(f"Columns: {MODEL_INFO.columns.tolist()}")
                    print(f"First few rows:\n{MODEL_INFO.head()}")
                except Exception as e:
                    print(f"Error reading info.csv: {str(e)}")
                    return jsonify({'success': False, 'error': f'Error reading info.csv: {str(e)}'}), 500
            if filename == 'model.skops':
                model_path = os.path.join(upload_dir, filename)
                try:
                    clf = sio.load(model_path, trusted=['sklearn._loss.link.Interval', 'sklearn._loss.loss.HalfBinomialLoss', 'sklearn._loss.link.LogitLink', 'sklearn.metrics._dist_metrics.EuclideanDistance64', 'sklearn.neighbors._kd_tree.KDTree', 'sklearn._loss._loss.CyHalfBinomialLoss'])
                    print("Successfully loaded model")
                except Exception as e:
                    print("Error reading model")
                    return jsonify({'success': False, 'error': f'Error reading model: {str(e)}'}), 500
            if filename == 'rosseta.pkl':
                rosseta_path = os.path.join(upload_dir, filename)
                try:
                    with open(rosseta_path, "rb") as f: rosseta = pickle.load(f)
                    print("Successfully loaded rosseta")
                except Exception as e:
                    print("Error reading rosseta")
                    return jsonify({'success': False, 'error': f'Error reading rosseta: {str(e)}'}), 500
            if filename == 'minmax.pkl':
                minmax_path = os.path.join(upload_dir, filename)
                try:
                    with open(minmax_path, "rb") as f: minmax = pickle.load(f)
                    print("Successfully loaded minmax")
                except Exception as e:
                    print("Error reading minmax")
                    return jsonify({'success': False, 'error': f'Error reading minmax: {str(e)}'}), 500
            if filename == 'std.pkl':
                std_path = os.path.join(upload_dir, filename)
                try:
                    with open(std_path, "rb") as f: std = pickle.load(f)
                    print("Successfully loaded std")
                except Exception as e:
                    print("Error reading std")
                    return jsonify({'success': False, 'error': f'Error reading std: {str(e)}'}), 500
        if y_test is None:
            print("Warning: No y_test.csv file found in uploaded files")
        if X_test is None:
            print("Warning: No X_test.csv file found in uploaded files")   
  
        return jsonify({
            'success': True,
            'message': f'Successfully uploaded {len(uploaded_files)} files',
            'files': uploaded_files,
            'test_df_shape': test_df.shape if test_df is not None else None,
            'test_df_columns': test_df.columns.tolist() if test_df is not None else None
        })
    
    except Exception as e:
        print(f"Error uploading model files: {str(e)}")
        return jsonify({'success': False, 'error': f'Error uploading files: {str(e)}'}), 500


@app.route('/predictGENERAL', methods=['POST'])
def predictGENERAL():
    global CURRENT_MODEL
    global MODEL_INFO
    global NORM_F
    global MODEL_INFO

    global features_list
    global all_features
    global scalers
    # global target_column
    # global target_type
    global rosseta




    try:
        target_column = MODEL_INFO['Target column'].values[0]
        target_type = MODEL_INFO['Target type'].values[0]

        data = request.get_json()
        print('Received input for prediction:', data)

        INPUT = pd.DataFrame([data['features']])

        #add all the feat to normalization
        for feat in all_features:
            if not feat in INPUT.columns: INPUT[feat] = 0

        InputN = DprepNcleaning.data_normF(INPUT[all_features].to_numpy(), FLAG=NORM_F, scaler=scalers) 
        InputN = pd.DataFrame(InputN, columns=all_features)
        # InputN = pd.DataFrame(InputN, columns=INPUT.columns)

        PREDICTION, PROBA, Y_DECASTED = Mbuilding.predict_fun(x_test_function=InputN[features_list], model_function = CURRENT_MODEL, target_column_function = target_column, target_type_function = target_type, rosseta_function = rosseta, cast_flag_function = False)


        # Flatten the PREDICTION list if it's a list of lists
        flat_predictions = [item[0] if isinstance(item, list) else item for item in PREDICTION]
        OUTPUT = INPUT[features_list]
        # if Y_DECASTED == None: OUTPUT[target_column] = Y_DECASTED
        OUTPUT['PREDICTION'] = flat_predictions
        OUTPUT['CONFIDENCE'] = PROBA

        InputPrediction = [OUTPUT.columns.tolist()] + OUTPUT.values.astype(float).tolist()
        # breakpoint()

        #fix in predict fun
        pred_send = ['Class: '+str(PREDICTION[0][0].item())+', probability:'+str(PROBA[0]*100)]

        return jsonify({
            'status': 'received',
            'prediction': pred_send,
            'InputPrediction': InputPrediction,
        })


        # return jsonify({'status': 'received'})
    except Exception as e:
        return jsonify({'error': f'Error receiving input: {str(e)}'}), 500

@app.route('/predict', methods=['POST'])
def predict():
    global CURRENT_MODEL
    global MODEL_INFO
    global NORM_F
    global USER_PREDICTIONS


    try:
        data = request.get_json()
        print('Received input for prediction edited:', data)

        INPUT = pd.DataFrame([data['features']])

        # breakpoint()
        if MODEL_INFO['Target column'].values[0]=='ToxicidadB':
            NLR = INPUT['Neutrofilos'].astype('float').values/INPUT['Linfocitos'].astype('float').values
            PLR = INPUT['Plaquetas'].astype('float').values/INPUT['Linfocitos'].astype('float').values
            INPUT['NLR'] = NLR
            INPUT['PLR'] = PLR
            INPUT = INPUT[features_list]
        # breakpoint()
        #add all the feat to normalization
        for feat in all_features:
            if not feat in INPUT.columns: INPUT[feat] = 0
        # breakpoint()
        if MODEL_INFO['Target column'].values[0]=='ToxicidadB':  InputN = DprepNcleaning.data_normF(INPUT[all_features].to_numpy(), FLAG=0, scaler=scalers) 
        else: InputN = DprepNcleaning.data_normF(INPUT[all_features].to_numpy(), FLAG=0, scaler=scalers) 
        # breakpoint()
        InputN = pd.DataFrame(InputN, columns=INPUT[all_features].columns)
        print(InputN)
        # breakpoint()
        PREDICTION, PROBA, Y_DECASTED = Mbuilding.predict_fun(x_test_function=InputN[features_list], model_function = CURRENT_MODEL, target_column_function = target_column, target_type_function = target_type, rosseta_function = rosseta, cast_flag_function = False)
        # PREDICTION, PROBA, Y_DECASTED = Mbuilding.predict_fun(x_test_function=InputN[features_list], model_function = clf, y_test_function = y_test, target_column_function = target_column, target_type_function = target_type, rosseta_function = rosseta, cast_flag_function = False)
        print('/n prediction')
        print(pd.DataFrame([data['features']]))
        print(PREDICTION)
        print(PROBA)
        # INPUT = INPUT.loc[:, ['Linfocitos', 'Neutrofilos', 'NLR', 'Plaquetas', 'PLR']]
        # INPUT_N = DprepNcleaning.data_normF(INPUT, FLAG=NORM_F) 
        # INPUT_N=pd.DataFrame(INPUT_N, columns=INPUT.columns)
        # PREDICTION, PROBA, Y_DECASTED = Mbuilding.predict_fun(x_test_function=X_testN, model_function = clf, y_test_function = y_test, target_column_function = target_column, target_type_function = target_type, ROSSETA = rosseta, cast_flag_function = False)
        # breakpoint()


        user_input_df = pd.DataFrame([data['features']])
        user_input_list = [user_input_df.columns.tolist()] + user_input_df.values.astype(float).tolist() #el astype float es necesario?




        current_user = 'Generic'
        dataset = 'Unkownk yet' # add in AutoML
        # CURRENT_MODEL
        user_input_df[['Prediction', 'Confidence']] = [PREDICTION[0][0], round(PROBA[0]*100)]
        # breakpoint()

        if dataset in [*USER_PREDICTIONS]:
            USER_PREDICTIONS[dataset] = {
                "inputs":  pd.concat([USER_PREDICTIONS[dataset]['inputs'] , user_input_df]).reset_index(drop=True).copy(),
                "metadata": {
                    "Model used info": MODEL_INFO,
                    "user": current_user,
                    "uploaded_at": datetime.now(timezone.utc).isoformat()
                }
            }
        #create one prediction dict
        else:
            USER_PREDICTIONS[dataset] = {
                "inputs": user_input_df.copy(),
                "metadata": {
                    "Model used info": MODEL_INFO,
                    "user": current_user,
                    "uploaded_at": datetime.now(timezone.utc).isoformat()
                }
            }
        all_inputs_list = [USER_PREDICTIONS[dataset]['inputs'].columns.tolist()] + USER_PREDICTIONS[dataset]['inputs'].values.tolist()
        # breakpoint()

        user_input_list = [user_input_df.columns.tolist()] + user_input_df.values.tolist()
        
        # breakpoint()

        return jsonify({'status': 'received','prediciton_output': PREDICTION[0][0], 'Probability': str(round(PROBA[0]*100)), 'UserInput': user_input_list, 'all_predictions': all_inputs_list})
    except Exception as e:
        return jsonify({'error': f'Error receiving input: {str(e)}'}), 500

@app.route('/export_model', methods=['POST'])
def export_model_fun():
    #from: modeling
    global model_info
    global best_model_res
    global X_test
    global y_test
    global scalers
    #from: var_acquisition_backend
    # global rosseta


    global DATA_PROCCESED
    global TARGET_COLUMN
    global TARGET_TYPE
    global ALL_TRAINED_MODELS

    #from: d adquisition
    # global ACTIVE_DATASET_NAME

    # global best_model_res
    # global X_test
    # global y_test
    # global scalers


    breakpoint()
    data = request.get_json()
    MODEL_SELECTED = data.get('model_selected')
    print(f"Received model selection: {MODEL_SELECTED}")

    status = 'success'
    index_model = model_info[model_info.sort_values(by=['Brier score loss', 'Score', 'AUC'], ascending=[True, False, False])['Model name']==data['model_selected']].index[0]
    
    export_info = best_model_res[best_model_res['Model name']==data['model_selected']]
    clf = ALL_TRAINED_MODELS[index_model]
    # breakpoint()
    
    os.makedirs('TrainedModels/'+ACTIVE_DATASET_NAME[:-4]+'_EXPORT', exist_ok=True)
    export_info.to_csv('TrainedModels/'+ACTIVE_DATASET_NAME[:-4]+'_EXPORT'+'/info.csv')
    sio.dump(clf, "TrainedModels/"+ACTIVE_DATASET_NAME[:-4]+'_EXPORT'+"/model.skops")
    X_test.to_csv('TrainedModels/'+ACTIVE_DATASET_NAME[:-4]+'_EXPORT'+'/X_test.csv', index=False)
    y_test.to_csv('TrainedModels/'+ACTIVE_DATASET_NAME[:-4]+'_EXPORT'+'/y_test.csv', index=False)
    with open('TrainedModels/'+ACTIVE_DATASET_NAME[:-4]+'_EXPORT'+"/rosseta.pkl", "wb") as f: pickle.dump(ROSSETA, f)
    with open('TrainedModels/'+ACTIVE_DATASET_NAME[:-4]+'_EXPORT'+"/minmax.pkl", "wb") as f: pickle.dump(scalers[0], f)
    with open('TrainedModels/'+ACTIVE_DATASET_NAME[:-4]+'_EXPORT'+"/std.pkl", "wb") as f: pickle.dump(scalers[1], f)


    # Path to Dir: 
    target_dir = os.path.join('TrainedModels', ACTIVE_DATASET_NAME[:-4]+'_EXPORT')
    file_names = [
        "info.csv", "model.skops", "X_test.csv", "y_test.csv",
        "rosseta.pkl", "minmax.pkl", "std.pkl"
    ]  

    memory_file = BytesIO()
    with ZipFile(memory_file, 'w') as zf:
        for fname in file_names:
            fpath = os.path.join(target_dir, fname)
            if os.path.exists(fpath):
                print(f"Adding {fpath} to zip")
                zf.write(fpath, os.path.basename(fpath))
    memory_file.seek(0)

    return send_file(
        memory_file,
        as_attachment=True,
        download_name=f"{ACTIVE_DATASET_NAME[:-4]+'_EXPORT'}_export.zip"
    )

    # return jsonify({'status': status, 'message': 'Model exported successfully'})




# if __name__ == '__main__':
#     app.run(debug=True)
if __name__ == '__main__':
    app.run(host=os.environ.get('FLASK_HOST', '127.0.0.1'), port=5000)