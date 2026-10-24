import numpy as np
import pandas as pd
# from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn import linear_model, svm #?
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
# from sklearn import svm/
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.metrics import accuracy_score
from sklearn.metrics import classification_report
from sklearn import metrics
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay 
import matplotlib.pyplot as plt
# from sklearn import  ensemble
from lifelines import KaplanMeierFitter
from sklearn.naive_bayes import GaussianNB
import time


#function to cast data before cleaning
def data_cast(data_in, target_column_in):

    print_flag = True

    data_out = data_in.copy()
    rosseta_out = {}
    start_time = time.time()

    for current_column in data_out:  
        if print_flag: print('\ncurrent column '+str(current_column))

        # a flag to tell when to write
        cast_flag = False

        #if there is only one unique, we save the KEY and drop the column
        if len(data_out[current_column].unique()) == 1:
            if print_flag: print('Drop column because there is only one value')
            cast_flag = True
            uniqueVAL = data_out[current_column].unique()[0] #preparar para recuperar para el final del modelado (guardar en un df)
            id_unique = 0
            data_out = data_out.drop(current_column, axis=1)
            a,b = -99, -99

        else: #if we drop we cant acces the colum type 
            column_type = data_out[current_column].dtype

            #if the column contain string we cast it to int
            if column_type == 'object':
                if print_flag: print('Cast strings')
                cast_flag = True
                data_out, uniqueVAL, id_unique = unique_to_int(data_out, current_column) #guardar todo esto en un DF para recuperar
                a,b = -99, -99
            #if the column contain string we cast it to int
            elif column_type == 'bool' or len(data_out[current_column].unique())==2:
                if print_flag: print('Cast boolean')
                cast_flag = True
                # breakpoint() 
                data_out, uniqueVAL, id_unique = unique_to_int(data_out, current_column) #guardar todo esto en un DF para recuperar
                # uniqueVAL = np.array(['False', 'True'])
                uniqueVAL = np.array([False, True]) 
                a,b = -99, -99          
            else:
                if current_column == target_column_in:
                    breakpoint()
                    if print_flag: print('if we didnt cast already, we cast the target')
                    cast_flag = True
                    data_out, uniqueVAL, id_unique = unique_to_int(data_out, target_column_in) #with perturbado it breaks
                    model = linear_model.LinearRegression()
                    model.fit(uniqueVAL.reshape(-1, 1), id_unique.reshape(-1, 1))
                    a = model.coef_      
                    b = model.intercept_ 
        if cast_flag:
            column_update = {current_column : [uniqueVAL, id_unique, a, b]} 
            rosseta_out.update(column_update)
            
        end_time = time.time()
        total_seconds = end_time-start_time
        minutes = int(total_seconds // 60)
        seconds = int(total_seconds % 60)
        if print_flag: print('{minutes}:{seconds}'.format(minutes=minutes, seconds=seconds)+' minutes.')

    return data_out, rosseta_out



def unique_to_int(data_in, column_cast_in):

    data_out = data_in.copy()
    unique_values = data_in[column_cast_in].unique()
    unique_values_NaN_drop = unique_values[~pd.isnull(unique_values)] #drop uniques nan
    unique_values_sorted = np.sort(unique_values_NaN_drop)
    id_unique = np.arange(len(unique_values))

    identifiers = id_unique.tolist()
    original = unique_values_sorted.tolist()
    variable_change = dict(zip(original,identifiers))

    pd.set_option('future.no_silent_downcasting', True) #https://stackoverflow.com/questions/79226735/pandas-replace-and-downcasting-deprecation-since-version-2-2-0
    data_out[column_cast_in] = data_in.replace(variable_change)[column_cast_in].astype('int32')

    return data_out, unique_values_sorted, id_unique


def model_dashboard(model_name_input, hyperparameter_tuning=False, parameters=None, class_weight_input=None):

    # hyperparameter_tuning: is used to send the params_grid to BayesSearchCV
    # params is used to used a set of params in a model    


    if model_name_input=='RandomForestClassifier':
        model = RandomForestClassifier(class_weight = class_weight_input, n_estimators=100, max_depth=5, random_state=1) # probar sacar max_depth en version no fast y ver el timepo q lleva #random_stateint, RandomState instance or None, default=None 
        param_grid = {
            'bootstrap': [True, False],
            'max_depth': [10, 50, None],
            'max_features': ['sqrt', 'log2'],
            'min_samples_leaf': [1, 2, 4],
            'min_samples_split': [2, 5, 10],
            'n_estimators': [200, 1200, 2000],
            'class_weight': [class_weight_input],
        }
        if hyperparameter_tuning!=0: 
            model = RandomForestClassifier()
        if parameters is not None:
            model = RandomForestClassifier(**dict(parameters))

    if model_name_input=='RandomForestRegressor':
        # model = RandomForestRegressor(max_depth=2, random_state=0)
        model = RandomForestRegressor(min_samples_split=10, random_state=0)        
    if model_name_input=='LinearRegression':
        model = linear_model.LinearRegression()
    if model_name_input=='QuantileRegressor':
        model = linear_model.QuantileRegressor(quantile=0.5, alpha=0, solver="highs")
    if model_name_input=='LogisticRegression':
        model = linear_model.LogisticRegression(class_weight= class_weight_input, max_iter=1000) 
        param_grid = {
            'C': [0.01, 0.1, 1, 10, 100],
            'penalty': ['l2'],
            'solver': ['lbfgs', 'saga'],
            'max_iter' : [100, 1000,2500, 5000],
            'class_weight': [class_weight_input],
        }
        if hyperparameter_tuning!=0: model = linear_model.LogisticRegression() #False == 0
        if parameters is not None:
            model = linear_model.LogisticRegression(**dict(parameters))

    if model_name_input=='KNeighborsClassifier':
        model = KNeighborsClassifier() #n_jobs try using it to more efficient
        param_grid = {
                'n_neighbors' : [5,7,9,11,13,15],
                'weights' : ['uniform','distance'],
                'metric' : ['minkowski','euclidean','manhattan'],
        }
        if parameters is not None:
            model = KNeighborsClassifier(**dict(parameters))

    if model_name_input=='KNeighborsRegressor':
        model = KNeighborsRegressor()
    if model_name_input=='SupportVectorMachines': #y esto?
        model = svm.SVC()

    if model_name_input=='SupportVectorClassification':
        model = SVC(class_weight= class_weight_input, probability=True)
        param_grid = {
            'C': [0.1, 1, 10],
            'kernel': ['linear', 'rbf', 'sigmoid'],
            'gamma': [0.1, 1, 'scale', 'auto'],
            'max_iter': [100],
            'probability': [True],
            'class_weight': [class_weight_input],
        }
        if hyperparameter_tuning!=0: model = SVC()
        if parameters is not None:
            model = SVC(**dict(parameters))

    if model_name_input=='GradientBoostingRegressor':
        params = {
            "n_estimators": 500,
            "max_depth": 4,
            "min_samples_split": 5,
            "learning_rate": 0.01,
            "loss": "squared_error",
        }
        model = GradientBoostingRegressor(**params)

    if model_name_input=='GradientBoostingClassifier':
        model = GradientBoostingClassifier()
        param_grid = {
            'n_estimators': [50, 100, 200],
            'learning_rate': [0.01, 0.1, 0.2],
            'max_depth': [3, 5, 7],
        }
        if parameters is not None:
            model = GradientBoostingClassifier(**dict(parameters))

    if model_name_input=='PassiveAggressiveRegressor':
        model = linear_model.PassiveAggressiveRegressor()
    if model_name_input=='LassoLars':
        model = linear_model.LassoLars()
    #VER BIEN COMO IMPLEMENTAR
    if model_name_input=='CoxRegression': 
        model = KaplanMeierFitter()

    if model_name_input=='GaussianNB': 
        model = GaussianNB()
        param_grid = {
            'var_smoothing': [1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8, 1e-9, 1e-10, 1e-11, 1e-12, 1e-13, 1e-14, 1e-15],
        }
        if parameters is not None:
            model = GaussianNB(**dict(parameters))

    return model, param_grid if 'param_grid' in locals() else None




def de_cast_PREDICTION(casted_data, columns, rosseta):

    decasted_data = casted_data.copy().astype(object)
    for idx_column, column in enumerate(columns):
        #case we need to decast
        if column in rosseta.keys():
            # y=ax+b
            a_val = rosseta[column][2] 
            b_val = rosseta[column][3] 
            uniqueVAL = rosseta[column][0]
            id_unique = rosseta[column][1]
            
            
            for idx_row, y_hat in enumerate(casted_data.iloc[:,idx_column].to_numpy()):
                #identity finding
                if y_hat in id_unique:
                    idx_cast = np.where(id_unique == y_hat) 
                    # cast_input[idx] = uniqueVAL[idx_cast[0][0]] 
                    decasted_data.iloc[idx_row,idx_column] = uniqueVAL[idx_cast[0][0]] 
                #identity not found
                else:
                    if y_hat>id_unique[-1] or y_hat<0:
                        x_hat = (y_hat-b_val)/a_val 
                        aux = 2
                    else:
                        idx_search = np.searchsorted(id_unique, y_hat, side='left')
                        
                        y_1, y_2 = id_unique[idx_search-1], id_unique[idx_search]
                        x_1, x_2 = uniqueVAL[idx_search-1], uniqueVAL[idx_search]
                        t_hat = (y_hat-y_1)/(y_2-y_1)
                        x_hat = x_2*t_hat + x_1*(1-t_hat) 

                    decasted_data.iloc[idx_row,idx_column] = x_hat

    return decasted_data


#not only used for predictions
def de_cast_PREDICTION_print(casted_data, columns, rosseta):

    decasted_data = casted_data
    for idx_column, column in enumerate(columns):
        #case we need to decast
        if column in rosseta.keys():
            # y=ax+b
            a = rosseta[column][2] 
            b = rosseta[column][3] 
            uniqueVAL = rosseta[column][0]
            id_unique = rosseta[column][1]
            
            
            for idx_row, y_hat in enumerate(casted_data.iloc[:,idx_column].to_numpy()):
                #identity finding
                if y_hat in id_unique:

                    idx_cast = np.where(id_unique == y_hat) 
                    # cast_input[idx] = uniqueVAL[idx_cast[0][0]] 
                    decasted_data.iloc[idx_row,idx_column] = uniqueVAL[idx_cast[0][0]] 
                #identity not found
                else:
                    if y_hat>id_unique[-1] or y_hat<0:
                        x_hat = (y_hat-b)/a 

                        aux = 2
                    else:
                        idx_search = np.searchsorted(id_unique, y_hat, side='left')
                        
                        y_1, y_2 = id_unique[idx_search-1], id_unique[idx_search]
                        x_1, x_2 = uniqueVAL[idx_search-1], uniqueVAL[idx_search]
                        t_hat = (y_hat-y_1)/(y_2-y_1)
                        x_hat = x_2*t_hat + x_1*(1-t_hat) 

                    # prediction_decasted[idx] = x_hat
                    decasted_data.iloc[idx_row,idx_column] = x_hat

    return decasted_data

#usarlo para castear las entradas
def cast_input(data_input, rosseta):

    print('/n CAST INPUT')
    columns = data_input.columns
    casted_input = data_input
    idx_row = 0
    for idx_column, column in enumerate(columns):

        current_value = data_input.iloc[idx_row, idx_column]
        
        #verify if is needed to cast <if column is in rosseta.keys()>
        if column in rosseta.keys():
            print(column)
            a = rosseta[column][2] 
            b = rosseta[column][3] 
            uniqueVAL = rosseta[column][0]
            id_unique = rosseta[column][1]
            
            #search if the value exist has already an ID
            if current_value in uniqueVAL:

                idx_cast = np.where(uniqueVAL == current_value) 
                casted_input.iloc[idx_row, idx_column] = id_unique[idx_cast[0][0]] 
            else:
                print('no existe en la id (cast input)')
    print('END CAST INPUT /n')
    return casted_input


def unique_to_int_reverse(data_in, column_name, uniqueVAL, id_unique):
    dataF2 = pd.DataFrame(data_in, columns=data_in.columns)
    for idU, val_to_cast in enumerate(id_unique):
        val_to_replace = uniqueVAL[idU]
        dataF2[column_name] = dataF2[column_name].apply(lambda x: val_to_replace if x == val_to_cast else x)
        
    return dataF2


def computemetrics(model, X_test, y_test):
    # breakpoint()
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    #report fow each unique class (+ avg)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0) 
    cm = confusion_matrix(y_test, y_pred)

    # #Compute ROC curve and AUC
    # if hasattr(model, 'decision_function'):
    #     y_score = model.decision_function(X_test)
    # else:
    #     y_score = model.predict_proba(X_test)[:, 1]
    y_score = model.predict_proba(X_test)[:, 1]
    # breakpoint()
    fpr, tpr, thr  = metrics.roc_curve(y_test, y_score)
    roc_auc = metrics.auc(fpr, tpr)

    #Handle missing class '1' in classification_report
    if '1' in report:
        precision = report['1']['precision']
        recall = report['1']['recall']
        f1 = report['1']['f1-score']
    else:
        precision = recall = f1 = None

    # print('/n')
    # print(fpr)
    # print(tpr)
    # print(thr)
    # print(roc_auc)
    # from sklearn.metrics import RocCurveDisplay
    # RocCurveDisplay.from_estimator(model, X_test, y_test)
    # plt.show()
    # breakpoint()
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'confusion_matrix': cm,
        'roc_curve': (fpr, tpr, roc_auc),
        'verification': (y_test, y_score, thr)
    }
