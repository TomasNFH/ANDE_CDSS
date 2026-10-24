from sklearn.ensemble import RandomForestClassifier
from System.Modules import Fselection
import numpy as np
import pandas as pd
from System.Modules import DprepNcleaning
from sklearn.model_selection import train_test_split
from System.Auxiliary import auxiliary_fun
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, RocCurveDisplay, brier_score_loss
from termcolor import colored
import matplotlib.pyplot as plt 
import seaborn as sns
from sklearn.utils import resample
from alive_progress import alive_bar
import time
import math
import seaborn as sns

from skopt import BayesSearchCV
from skopt.callbacks import VerboseCallback      

from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import StandardScaler

def model_shake(data_function, x_test_function, y_test_function, target_column_function, target_type_function, sclaer_function, fast_function = True):
    """
    Comprehensive modeling pipeline that performs normalization, feature selection,
    model training, evaluation, and visualization.

    Parameters:
        X (pd.DataFrame): Feature matrix.
        y (pd.Series or pd.DataFrame): Target variable.
        N_features (int): Number of features to select during feature selection.
        fs_method (int): Feature selection method:
            0 - Random Forest feature importance
            1 - Correlation-based selection
            2 - Exhaustive Feature Selector (EFS) with Logistic Regression
        problem_type (str): Type of problem. Must be 'classification' or 'regression'.
        model_list (list, optional): List of sklearn models to evaluate. If None, uses defaults.
        normalize (bool): Whether to normalize the data before modeling. Default is True.
        verbose (bool): Whether to print detailed output during execution. Default is True.
        plot_results (bool): Whether to display evaluation plots. Default is True.

    Returns:
        results_df (pd.DataFrame): Performance metrics for each trained model.
        best_model (sklearn model): Trained model with the best performance.
        selected_features (pd.Index): Names of the selected features.
        X_selected (np.ndarray): Feature matrix after selection and normalization (if applied).
        y (pd.Series or np.ndarray): Target variable (possibly transformed if classification).
    """

    PROGRESS_BAR = True
    validation_print = False
    inner_CV_print = False

    ALL_TRAINED_MODELS = []

    start_time = time.time()
    colors_plot = ['#309284', '#337AEF']
    fig_ROC = 0
    fig_CM = 0
    # FEATURE_N = 9 #can test to change it or make it auto to find the best N
    class_weight_flag = 'balanced'
    # class_weight_flag = None
    FEATURE_N = 5
    model_return = pd.DataFrame(columns = ['Target column', 'Target type', 'Model name', 
                                           'Normalization method', 'Feature selection method', 
                                           'Features used', 'importances', 'Number of splits', 'Cross-validation ID', 
                                           'Confusion matrix', 'True Positive Rate', 'False Positive Rate', 'ROC ver','Recall', 
                                           'F1 score', 'AUC', 'Score', 'Brier score loss'])
    FS_return = pd.DataFrame(columns = ['Model name', 'Normalization method', 'Feature selection method', 'Features used', 
                                           'importances', 'Number of splits', 'Cross-validation ID', 'Score'])

    NORM_FLAGS = np.array([0,1,2]) #we aplly only to train data, why? to all data?
    FEATURE_FLAGS = np.array([0,1,2]) #dont use 2 due to time
    if fast_function:
        FEATURE_FLAGS = np.array([0,1])

    if target_type_function == 'boolean': model_stack = ['RandomForestClassifier', 'LogisticRegression', 'KNeighborsClassifier', 'SupportVectorClassification', 'GradientBoostingClassifier', 'GaussianNB']
    if target_type_function == 'classes': model_stack = ['RandomForestClassifier', 'KNeighborsClassifier', 'SupportVectorClassification']   
    if target_type_function == 'continuous': model_stack = ['LinearRegression', 'SupportVectorMachines', 'RandomForestRegressor','QuantileRegressor', 'GradientBoostingRegressor', 'PassiveAggressiveRegressor', 'LassoLars', 'KNeighborsRegressor'] 

    Feature_methods = ['Intrinsic method','Filter method','Wrapper method']
    Normalization_methods = ['No', 'Min-Max', 'Z-score']
        
    X = data_function.loc[:, data_function.columns != target_column_function]
    y = data_function[target_column_function]
    columns_X = X.columns

    LOOorBS = True #True is LOO, False is Bootstraping
    LOO_valid = False 
    number_of_splits = 5
    min_number_of_samples = 500
    number_of_samples = X.shape[0]
    
    if number_of_samples < min_number_of_samples:
        ### leave one out ###
        if LOOorBS:     
            LOO_valid = True
            number_of_splits = X.shape[0]
        ### Bootstraping ###  
        else:
            LOO_valid = False
            print('Bootstraping: number of samples is less than '+str(min_number_of_samples))
            X, y = resample(X, y, n_samples=min_number_of_samples, replace=True) 


    operation_counter = 0
    number_operations = len(FEATURE_FLAGS)*(number_of_splits)*len(model_stack)*len(NORM_FLAGS) + len(FEATURE_FLAGS)*len(model_stack)*len(NORM_FLAGS)

    ### Shuffle ###
    X_frag1, X_frag2, y_frag1, y_frag2 = train_test_split(X, y, test_size=0.3, shuffle = True)
    X = np.append(X_frag1, X_frag2, axis=0)
    y = np.append(y_frag1, y_frag2, axis=0)

    #verify split
    if validation_print: X[:,0] = np.arange(0,len(X))

    ### OUTER LOOP ###

    ### Step 2: Cross Validation (FIRST STEP)### 
    print('/n/nOUTTER LOOP')  
    if validation_print: print(X[:,0])
    samples_of_valid = int(len(X)/number_of_splits)
    for shift_idx in range(number_of_splits): 
        if validation_print: print('\nshift_idx '+str(shift_idx))

        if LOO_valid:
            X_train, X_valid, y_train, y_valid = train_test_split(X, y, test_size=1, random_state=0, shuffle = False)
        else:
            X_train, X_valid, y_train, y_valid = train_test_split(X, y, test_size=samples_of_valid, random_state=0, shuffle = False)
        if validation_print and shift_idx==0: print(X_train[:,0]), print(X_valid[:,0])

        if target_type_function == 'classes' or target_type_function == 'boolean': #quick solve for HDwithCM, solve in general!!!
            y_train = y_train.astype(int)
            y_valid = y_valid.astype(int)

        #shift data
        X = np.roll(X, samples_of_valid, axis=0)
        y = np.roll(y, samples_of_valid, axis=0)
    

        ### Step 4: NORMALIZATION ###
        for N_FLAG in NORM_FLAGS:
            # print('    normalization '+str(N_FLAG))
            X_trainN = DprepNcleaning.data_normF(X_train, FLAG=N_FLAG, scaler = sclaer_function) 
            X_validN = DprepNcleaning.data_normF(X_valid, FLAG=N_FLAG, scaler = sclaer_function) 

            ### Step 1: Feature Engeeniring ###
            for F_FLAG in FEATURE_FLAGS:
                # print('        F_flag '+str(Feature_methods[F_FLAG]))
                X_trainR, current_Features, importances, indexes4valid = Fselection.F_selector(pd.DataFrame(X_trainN, columns = columns_X), 
                                                    pd.DataFrame(y_train, columns = [target_column_function]), 
                                                    N_features=FEATURE_N, 
                                                    FLAG=F_FLAG) 
                X_validR = X_validN[:, indexes4valid]

                ### Step 3: Model selection ###
                for model_name in model_stack:
                    # print('             model '+str(model_name))

                    operation_counter = operation_counter+1
                    if PROGRESS_BAR:
                        print('Progresion in training: '+str( round((operation_counter/number_operations)*100) )+'%, the time is: ', end='')  
                        end_time = time.time()
                        total_seconds = end_time-start_time
                        minutes = int(total_seconds // 60)
                        seconds = int(total_seconds % 60)
                        print('{minutes}:{seconds}'.format(minutes=minutes, seconds=seconds)+' minutes.')

                    ### Step 5: Model Building 
                    model, _ = auxiliary_fun.model_dashboard(model_name_input = model_name, class_weight_input = class_weight_flag)
                    model.fit(X_trainR, y_train)
                    prediction = model.predict(X_validR)

                    FS_return.loc[len(FS_return.index)] = [model_name, Normalization_methods[N_FLAG], Feature_methods[F_FLAG], current_Features.values.tolist(), importances, 
                                                            number_of_splits, shift_idx, model.score(X_validR, y_valid)] 
    

    # 2 SELECT FEATURES WITH CV (for now i use the set of features with higher Accuracy)
    if LOO_valid: LOO_CV_result, LOO_CV_result2, LOO_CV_stadist  = pd.DataFrame(), pd.DataFrame(columns = ['Configuration', 'Accuracy']), pd.DataFrame(columns = ['mean', 'std'])
    Feat_best_set = pd.DataFrame(columns = ['Model', 'Normalization method', 'Feature method', 'Best set', 'Importances Custom'])
    for model_nm in model_stack:
        for feature_nm in Feature_methods[0:len(FEATURE_FLAGS)]:
            for normFlag_nm in NORM_FLAGS:
                feat_n_score = FS_return.query('`Model name` == @model_nm and `Feature selection method` == @feature_nm and `Normalization method` == @Normalization_methods[@normFlag_nm]')[['Features used', 'Normalization method','importances', 'Score']]

                #get all features to create df (feature_imp_sum) with all the unique ones 
                all_features = []
                for f_list in feat_n_score['Features used'].values:
                    all_features = all_features+f_list
                feature_imp_sum = pd.DataFrame(columns=pd.DataFrame(all_features)[0].unique())
                feature_imp_sum.loc[len(feature_imp_sum)] = np.zeros(len(feature_imp_sum.columns))
                
                
                
                #select best set by Score and importances
                for index, row in feat_n_score[['Features used', 'importances', 'Score']].iterrows():
                    # print(len(row['Features used']))
                    for idx in range(len(row['Features used'])): #number_of_splits whyyy?
                        Feat = row['Features used'][idx]
                        Imp = row['importances'][idx]
                        Scr = row['Score']
                        feature_imp_sum.loc[0, Feat] += Scr*Imp
                #return all features with their importances (not just the N best)
                best_set = feature_imp_sum.transpose().sort_values(by=0).index
                best_set_importances = feature_imp_sum.transpose().sort_values(by=0).values.transpose()[0]
                Feat_best_set.loc[len(Feat_best_set.index)] = [model_nm, Normalization_methods[normFlag_nm],feature_nm, best_set, best_set_importances] 
    
                # plot for LOO CV 
                if LOO_valid:
                    # LOO_CV_result_test = LOO_CV_result
                    conf = model_nm+', '+Normalization_methods[normFlag_nm]+', '+feature_nm
                    accuracy_for_cfg = feat_n_score['Score'].reset_index(drop=True)
                    LOO_CV_result[conf] = accuracy_for_cfg
                    for aux_value in accuracy_for_cfg: LOO_CV_result2.loc[len(LOO_CV_result2)] = [conf, aux_value]
                        # LOO_CV_result2.loc[len(LOO_CV_result2)] = [conf, ]
                    LOO_CV_stadist.loc[len(LOO_CV_stadist)] = [accuracy_for_cfg.mean(), accuracy_for_cfg.std()]



    print(Feat_best_set)
    ### INNER LOOP ### (only use train data to N variable and HP tuning)
    INNER_return = pd.DataFrame(columns = ['Model name', 'Number of splits', 'Cross-validation ID', 'Hyperparameter', 'Normalization method', 'Feature selection method', 'N used','Features used', 
                                           'importances', 'Score', 'Brier score loss', 'AUC', 'n jobs'])
    INNER_best_set = pd.DataFrame(columns = ['Model', 'Normalization method', 'Feature method', 'N used', 'set of features', 'Importances Custom', 'Hyperparameters', 'Brier score loss', 'Score'])

    plt.figure()
    sns.violinplot(data=LOO_CV_result, bw_adjust=.5, cut=1, linewidth=1, palette="Set3")
    plt.grid()

    plt.figure()
    ax = sns.violinplot(y="Configuration", x="Accuracy", data=LOO_CV_result2)

    plt.figure()
    sns.violinplot(data=LOO_CV_stadist, bw_adjust=.5, cut=1, linewidth=1, palette="Set3")
    plt.grid()
    
    plt.show()

# /n/nOUTTER LOOP
# [ 0.  1.  2.  3.  4.  5.  6.  7.  8.  9. 10. 11. 12. 13. 14. 15. 16. 17.
#  18. 19. 20. 21. 22. 23. 24. 25. 26. 27. 28. 29. 30. 31. 32. 33. 34. 35.
#  36. 37. 38. 39. 40. 41. 42. 43. 44. 45. 46. 47. 48. 49. 50. 51. 52. 53.
#  54.]

# shift_idx 0
# [ 0.  1.  2.  3.  4.  5.  6.  7.  8.  9. 10. 11. 12. 13. 14. 15. 16. 17.
#  18. 19. 20. 21. 22. 23. 24. 25. 26. 27. 28. 29. 30. 31. 32. 33. 34. 35.
#  36. 37. 38. 39. 40. 41. 42. 43. 44. 45. 46. 47. 48. 49. 50. 51. 52. 53.]
# [54.]
    if not LOO_valid:
        print('/n/nINNER LOOP')
        print(' #1st loop <outter>')
        if validation_print: print(X[:,0])

        N_count_inner = 0
        for index, row in Feat_best_set.iterrows(): N_count_inner += len(range(len(row['Best set'].values), int(len(row['Best set'].values)/2), -1))    

        inner_cv_models_results = number_of_splits*N_count_inner
        inner_counter = inner_cv_models_results

        #1st loop <outter>
        for shift_idx in range(number_of_splits): 
            if validation_print: print('\nshift_idx '+str(shift_idx))

            if LOO_valid:
                X_train, _, y_train, _ = train_test_split(X, y, test_size=1, random_state=0, shuffle = False)
            else:
                X_train, _, y_train, _ = train_test_split(X, y, test_size=samples_of_valid, random_state=0, shuffle = False)
            if validation_print: print(X_train[:,0])
            
            if target_type_function == 'classes' or target_type_function == 'boolean': #quick solve for HDwithCM, solve in general!!!
                y_train = y_train.astype(int)
                # y_valid = y_valid.astype(int)

            X_trainNvalid_inner, X_test_inner, y_trainNvalid_inner, y_test_inner = train_test_split(X_train, y_train, test_size=int(len(X_train)/4), random_state=0, shuffle = False) 

            #shift data
            X = np.roll(X, samples_of_valid, axis=0)
            y = np.roll(y, samples_of_valid, axis=0)

            #number of HP tuning iterations
            n_max_iter = 25

            ### Step 4: NORMALIZATION ###
            for N_FLAG_IL in NORM_FLAGS:
                # print('    normalization '+str(N_FLAG))

                # verificar que queda igual que en outer loop
                X_trainNvalid_inner_N = DprepNcleaning.data_normF(X_trainNvalid_inner, FLAG=N_FLAG_IL, scaler = sclaer_function) 
                X_test_inner_N = DprepNcleaning.data_normF(X_test_inner, FLAG=N_FLAG_IL, scaler = sclaer_function) 

                ### Step 1: Feature Engeeniring ###
                for F_FLAG_IL in FEATURE_FLAGS:
                    ### Step 3: Model selection ###
                    for model_name_inner in model_stack:
                        # print('Model inner loop: '+str(model_name_inner)+' with feature method '+str(Feature_methods[F_FLAG_IL])+' and normalization method '+str(Normalization_methods[N_FLAG_IL]))
                        current_Features = Feat_best_set.query('`Model` == @model_name_inner and `Feature method` == @Feature_methods[@F_FLAG_IL] and `Normalization method` == @Normalization_methods[@N_FLAG_IL]')['Best set'].values.tolist()[0]
                        importances = Feat_best_set.query('`Model` == @model_name_inner and `Feature method` == @Feature_methods[@F_FLAG_IL] and `Normalization method` == @Normalization_methods[@N_FLAG_IL]')['Importances Custom'].values[0]
                        # print(current_Features)

                        for VariableN in range(len(current_Features),int(len(current_Features)/2),-1):
                            
                            print('\n\n\n')
                            print(inner_counter)
                            print(' of ')
                            print(inner_cv_models_results)
                            inner_counter= inner_counter-1
                            print('N variables: '+str(VariableN)+'/'+str(len(current_Features))+' for model '+str(model_name_inner)+' with feature method '+str(Feature_methods[F_FLAG_IL])+' and normalization method '+str(Normalization_methods[N_FLAG_IL]))
                            subset_N_variable = current_Features[-(VariableN):]
                            importances_N_variable = importances[-(VariableN):]
                            print(subset_N_variable)

                            indexes4X = []
                            for idxCF in range(len(subset_N_variable)): indexes4X.append(data_function.loc[:, data_function.columns != target_column_function].columns.get_loc(subset_N_variable[idxCF]))
                            
                            X_trainNvalid_inner_NR = X_trainNvalid_inner_N[:, indexes4X]
                            X_test_inner_NR = X_test_inner_N[:, indexes4X]

                            
                            model, param_grid = auxiliary_fun.model_dashboard(model_name_inner, hyperparameter_tuning=True, class_weight_input=class_weight_flag )

                            opt = BayesSearchCV(
                                model,
                                param_grid,
                                n_iter=n_max_iter,
                                n_jobs=3,
                                cv=3
                            )
                            # n_job = 3

                            if inner_CV_print:
                                # Callback: built-in verbose printing
                                verbose_cb = VerboseCallback(n_total=n_max_iter)  # total iterations = 10
                                opt.fit(X_trainNvalid_inner_NR, y_trainNvalid_inner, callback=[verbose_cb])                        # Callback: built-in verbose printing
                            else: opt.fit(X_trainNvalid_inner_NR, y_trainNvalid_inner)

                            #accuracy best model
                            # acc_by_hand = accuracy_score(y_test_inner, opt.predict(X_test_inner_NR))
                            test_score = opt.score(X_test_inner_NR, y_test_inner)
                            # print("val. score: %s" % opt.best_score_)
                            # print("test score: %s" % test_score)

                            param_list = []
                            for item in opt.best_params_.items(): param_list.append(item)

                            ### AUC ###
                            # metrics_result = auxiliary_fun.computemetrics(model, X_testR, y_test_function)
                            auc_inner = auxiliary_fun.computemetrics(opt, X_test_inner_NR, y_test_inner)['roc_curve'][2]

                            ### brier score loss ###
                            prediction_proba = opt.predict_proba(X_test_inner_NR)
                            prediction_proba_positive_clase = prediction_proba[:,1] 
                            brier_score = brier_score_loss(y_test_inner, prediction_proba_positive_clase)

                            INNER_return.loc[len(INNER_return.index)] = [model_name_inner, number_of_splits, shift_idx, param_list, Normalization_methods[N_FLAG_IL], Feature_methods[F_FLAG_IL], len(subset_N_variable), subset_N_variable,
                                                                    importances_N_variable, test_score, brier_score, auc_inner, n_max_iter] 
                            
        #podria quedarme solo con los mejores modelos y testear solo con estos 
            # best_hp_and_feat = (INNER_return.sort_values(by=['Model name', 'Brier score loss', 'Score'], ascending=[True, True, False]).groupby('Model name', as_index=False).first())
        #pero tiene mas sentido testear todas las configuraciones con sus mejores parametros y conjunto de features.
        for model_nm in model_stack:
            for feature_nm in Feature_methods[0:len(FEATURE_FLAGS)]:
                for normFlag_nm in NORM_FLAGS:
                    model_cfg_return = INNER_return.query('`Model name` == @model_nm and `Feature selection method` == @feature_nm and `Normalization method` == @Normalization_methods[@normFlag_nm]')

                    #AUC is not good when not enought smaples
                    if LOO_valid: best_result_for_cfg = model_cfg_return.sort_values(by=['Brier score loss', 'Score'], ascending=[True, False]).reset_index(drop=True).iloc[0]
                    else: best_result_for_cfg = model_cfg_return.sort_values(by=['AUC', 'Brier score loss', 'Score'], ascending=[False, True, False]).reset_index(drop=True).iloc[0]
                    INNER_best_set.loc[len(INNER_best_set.index)] = [model_nm, Normalization_methods[normFlag_nm], feature_nm, best_result_for_cfg['N used'], best_result_for_cfg['Features used'], best_result_for_cfg['importances'], best_result_for_cfg['Hyperparameter'], best_result_for_cfg['Brier score loss'], best_result_for_cfg['Score']]


    breakpoint()
    #### MODELING AND VALIDATION #### RETRAINING AND FINAL EVALUATION?
    # NO CV for modeling and validation -> (we use valid and train) as train and we validate with test 
    X_train = X
    y_train = y

    if target_type_function == 'classes' or target_type_function == 'boolean': #quick solve for HDwithCM, solve in general!!!
        y_train = y_train.astype(int)
        y_test_function = y_test_function.astype(int)

    ### Step 4: NORMALIZATION ###
    for N_FLAG in NORM_FLAGS:
        # print('    normalization '+str(N_FLAG))
        X_trainN = DprepNcleaning.data_normF(X_train, FLAG=N_FLAG, scaler = sclaer_function) 
        X_testN = DprepNcleaning.data_normF(x_test_function, FLAG=N_FLAG, scaler = sclaer_function) 

        ### Step 1: Feature Engeeniring ###
        for F_FLAG in FEATURE_FLAGS:
            # print('    F_flag '+str(Feature_methods[F_FLAG]))

            ### Step 3: Model selection ###
            for model_name in model_stack:
                # print('     model '+str(model_name))

                if not LOO_valid:
                    best_model_4_cfg = INNER_best_set.query('`Model` == @model_name and `Feature method` == @Feature_methods[@F_FLAG] and `Normalization method` == @Normalization_methods[@N_FLAG]')
                    current_Features = best_model_4_cfg['set of features'].values.tolist()[0]
                    importances = best_model_4_cfg['Importances Custom'].values[0]
                    hyperparameters = best_model_4_cfg['Hyperparameters'].values[0]
                else: #LOOCV case
                    current_Features = Feat_best_set.query('`Model` == @model_name and `Feature method` == @Feature_methods[@F_FLAG] and `Normalization method` == @Normalization_methods[@N_FLAG]')['Best set'].values.tolist()[0]
                    importances = Feat_best_set.query('`Model` == @model_name and `Feature method` == @Feature_methods[@F_FLAG] and `Normalization method` == @Normalization_methods[@N_FLAG]')['Importances Custom'].values[0]
                    breakpoint()

                indexes4X = []
                for idxCF in range(len(current_Features)):
                    indexes4X.append(data_function.loc[:, data_function.columns != target_column_function].columns.get_loc(current_Features[idxCF]))
                
                X_trainR = X_trainN[:, indexes4X] 
                X_testR = X_testN[:, indexes4X]
             
                
                operation_counter = operation_counter+1
                if PROGRESS_BAR:
                    print('Progresion in training: '+str( round((operation_counter/number_operations)*100) )+'%, the time is: ', end='')  
                    end_time = time.time()
                    total_seconds = end_time-start_time
                    minutes = int(total_seconds // 60)
                    seconds = int(total_seconds % 60)
                    print('{minutes}:{seconds}'.format(minutes=minutes, seconds=seconds)+' minutes.')

                ### Step 5: Model Building 
                if not LOO_valid: model, _ = auxiliary_fun.model_dashboard(model_name, parameters=hyperparameters, class_weight_input=class_weight_flag)
                else: model, _ = auxiliary_fun.model_dashboard(model_name, class_weight_input=class_weight_flag)
                # model, _ = auxiliary_fun.model_dashboard(model_name)
                # if F_FLAG==2:


                model.fit(X_trainR, y_train)
                ALL_TRAINED_MODELS.append(model)
                prediction = model.predict(X_testR)


                # from sklearn.metrics import RocCurveDisplay
                # RocCurveDisplay.from_predictions(y_valid, model.predict_proba(X_validR)[:,1])

                # define values in case we dont estimeate them (continues case 4 example)
                accurecy = np.nan
                Specifity = np.nan
                tpr = np.nan
                fpr = np.nan
                auc = np.nan
                Recall = np.nan
                F1 = np.nan
                CoMtx = np.nan
                brier_score = np.nan
                ROC_ver = np.nan

                if target_type_function == 'boolean' or target_type_function == 'classes':
                    classes_of_target = np.unique(y)
                    CoMtx = confusion_matrix(y_test_function, prediction, labels=list(classes_of_target))  #ADD LABELS TO MATRIX (MAKE IT DF)
                    accurecy = np.sum(np.diag(CoMtx))/len(prediction)
                    accurecy = accurecy*100

                    ### BRIES SCORE MANUAL 
                    brier_score = 0
                    for N, target_value in enumerate(y_test_function):
                        prediction_proba = model.predict_proba(X_testR)
                        for C in range(np.shape(prediction_proba)[1]):
                            y_nc = 1 if C == target_value else 0
                            brier_score += (y_nc-prediction_proba[N, C])**2
                    brier_score = brier_score/len(y_test_function)


                    if target_type_function == 'boolean':
                        TP = CoMtx[0,0]
                        TP_FN = np.sum(CoMtx[0,:])
                        Recall = TP/TP_FN
                        TN = CoMtx[1,1]
                        TN_FP = CoMtx[1,:]
                        Specifity = TN/np.sum(TN_FP)
                        Specifity = (1-Specifity)*100
                        F1 = 2*(accurecy*Recall)/((accurecy+Recall))

                        metrics_result = auxiliary_fun.computemetrics(model, X_testR, y_test_function)
                        tpr = metrics_result['roc_curve'][1]
                        fpr = metrics_result['roc_curve'][0]
                        auc = metrics_result['roc_curve'][2]
                        ROC_ver = metrics_result['verification']

                        ### brier score loss ###
                        prediction_proba = model.predict_proba(X_testR)
                        prediction_proba_positive_clase = prediction_proba[:,1] 
                        brier_score = brier_score_loss(y_test_function, prediction_proba_positive_clase)

                model_return.loc[len(model_return.index)] = [target_column_function, target_type_function, model_name, 
                                                             Normalization_methods[N_FLAG], Feature_methods[F_FLAG], current_Features.values.tolist(), importances, 
                                                             number_of_splits, shift_idx, CoMtx, 
                                                             tpr, fpr, ROC_ver, Recall, F1, auc, model.score(X_testR, y_test_function), brier_score] 


    ### RESULTS AND GRAPHS ###
    fig_FEAT, fig_ROC, fig_CM, fig_score = 0, 0, 0, 0

    # best_model_res = model_return.loc[model_return.groupby('Model name')['AUC'].idxmax()]
    if LOO_valid: best_model_res = (model_return.sort_values(by=['Model name', 'Brier score loss', 'Score', 'AUC'], ascending=[True, True, False, False]).groupby('Model name', as_index=False).first())
    else: best_model_res = (model_return.sort_values(by=['Model name', 'AUC', 'Score', 'Brier score loss'], ascending=[True, False, False, True]).groupby('Model name', as_index=False).first())

    number_of_models = len(model_stack)  # or any other number
    nrows = 2 if number_of_models > 3 else 1
    ncols = math.ceil(number_of_models / nrows)

    fig_FEAT, axs = plt.subplots(nrows, ncols, figsize=(6 * ncols, 4 * nrows))
    axs = axs.flatten()  # Flatten to get a list: [ax1, ax2, ..., ax6]

    for i, ax in enumerate(axs):
        current_model = best_model_res.iloc[i]
        features = current_model['Features used']

        # Plot bar
        ax.bar(features, current_model['importances'])

        # Title 
        ax.set_title(current_model['Model name'], pad=15, fontsize=12, weight='bold')

        # Legend
        legend_text = (
            f"NM: {current_model['Normalization method']}, "
            f"FM: {current_model['Feature selection method']}"
        )
        ax.legend([legend_text], loc='upper left', fontsize=9)

        ax.set_xticks(range(len(features)))
        ax.set_xticklabels(features, rotation=25, ha='right', fontsize=10)

        # Y-axis range
        # ax.set_ylim(0, 1)
        # ax.set_ylabel("Importance", fontsize=10)

    fig_FEAT.tight_layout(pad=3.5)

##########################################################################


    if target_type_function == 'boolean' or target_type_function == 'classes':

        fig_CM, axs = plt.subplots(nrows, ncols, figsize=(6 * ncols, 4 * nrows))
        axs = axs.flatten()

        for i, ax in enumerate(axs[:number_of_models]):
            current_model = best_model_res.iloc[i]
            cm = current_model['Confusion matrix']
            
            # ConfusionMatrix plot
            disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=list(classes_of_target))
            disp.plot(ax=ax, colorbar=False) 
            # ax.set_title(current_model['Model name']) 

            # Title 
            ax.set_title(current_model['Model name'], pad=15, fontsize=12, weight='bold')

        fig_CM.tight_layout(pad=3.5)
    
        if target_type_function == 'boolean':
            print(colored('\nTable with information of scores of the models:', 'green', attrs=['bold']))
            print(colored(best_model_res[['Model name', 'Normalization method', 'Feature selection method', 'Score', 'AUC', 'Brier score loss']], 'green'))
 
            fig_ROC, axs = plt.subplots(nrows, ncols, figsize=(6 * ncols, 4 * nrows))
            axs = axs.flatten()

            for i, ax in enumerate(axs[:number_of_models]):
                current_model = best_model_res.iloc[i]
                [fpr, tpr, roc_auc] = current_model[['False Positive Rate', 'True Positive Rate', 'AUC']]
                
                # ConfusionMatrix plot
                disp = RocCurveDisplay(fpr=fpr, tpr=tpr, roc_auc=roc_auc)
                disp.plot(ax=ax) 

                # Title 
                ax.set_title(current_model['Model name'], pad=15, fontsize=12, weight='bold')

            fig_ROC.tight_layout(pad=3.5)

            fig_score = plt.figure()
            # sns.boxplot(data=model_return, x="Model name", y="AUC")
            sns.boxplot(data=model_return, y="Model name", x="AUC")

        # classes
        else:
            print(colored('\nTable with information of scores of the models:', 'green', attrs=['bold']))
            print(colored(best_model_res[['Model name', 'Normalization method', 'Feature selection method', 'True Positive Rate', 'False Positive Rate', 'Score', 'Brier score loss']], 'green'))

            fig_score = plt.figure()
            sns.boxplot(data=model_return, y="Model name", x="Score")


    #recursive
    else: 
        print(colored('\nTable with information of scores of the models:', 'green', attrs=['bold']))
        print(colored(best_model_res[['Model name', 'Normalization method', 'Feature selection method', 'True Positive Rate', 'False Positive Rate', 'Score']], 'green'))

        fig_score = plt.figure()
        sns.boxplot(data=model_return, y="Model name", x="Score")

    if not fast_function:
        sns.catplot(data=model_return[model_return['Feature selection method']=='Wrapper method'], x="Normalization method", y="AUC", col="Model name", hue="Normalization method",    col_wrap=6, palette="muted", kind="point")

        best_wrapper = model_return[model_return['Feature selection method']=='Wrapper method'].loc[model_return[model_return['Feature selection method']=='Wrapper method'].groupby('Model name')['Score'].idxmax()]

        
        number_of_models = len(model_stack)  # or any other number
        nrows = 2 if number_of_models > 3 else 1
        ncols = math.ceil(number_of_models / nrows)

        fig_FEATWRAP, axs = plt.subplots(nrows, ncols, figsize=(6 * ncols, 4 * nrows))
        axs = axs.flatten()  # Flatten to get a list: [ax1, ax2, ..., ax6]

        for i, ax in enumerate(axs):

            current_model = best_wrapper.iloc[i]
            features = current_model['Features used']
            
            # Plot bar
            ax.bar(features, current_model['importances'], label = str(current_model['AUC'])+', '+str(current_model['Normalization method']))

            # Title 
            ax.set_title(current_model['Model name'], pad=15, fontsize=12, weight='bold')

            # Legend
            legend_text = (
                f"NM: {current_model['Normalization method']}, "
                f"FM: {current_model['Feature selection method']}"
            )
            ax.legend([legend_text], loc='upper left', fontsize=9)

            ax.set_xticks(range(len(features)))
            ax.set_xticklabels(features, rotation=25, ha='right', fontsize=10)
            ax.legend(loc='upper right')
            # Y-axis range
            # ax.set_ylim(0, 1)
            # ax.set_ylabel("Importance", fontsize=10)

        fig_FEATWRAP.tight_layout(pad=3.5)

    training_report_out = {
        'OL_return': FS_return,
        'OL_best_set': Feat_best_set,
        'INNER_return': INNER_return,
        'INNER_best_set': INNER_best_set,
        'test_return': model_return,
        'test_model_res': best_model_res
    }

    return model_return, ALL_TRAINED_MODELS, fig_FEAT, fig_CM, fig_ROC, fig_score, training_report_out


def predict_fun(x_test_function, model_function, target_column_function, target_type_function, rosseta_function, y_test_function = None, cast_flag_function=False):
    
    

    if y_test_function is not None and not y_test_function.empty:
        DATA = pd.concat([x_test_function, y_test_function], axis=1)
        print('y test')
    else: DATA = x_test_function

    # data already come casted? y si
    ###casteo 
    if cast_flag_function:
        input_casted = auxiliary_fun.cast_input(DATA, rosseta_function)
        input_casted = input_casted[input_casted.columns[::-1]]
        input_casted = input_casted.to_numpy().astype(np.float64)
    else: input_casted = DATA

    if y_test_function is not None and not y_test_function.empty:
        X = input_casted.loc[:, input_casted.columns != target_column_function]
        # X = X[X.columns[::-1]]
        X = X.to_numpy().astype(np.float64)

        y = pd.DataFrame(input_casted[target_column_function])
        y_decasted = auxiliary_fun.de_cast_PREDICTION(y, [target_column_function], rosseta_function)

    else: 
        X = x_test_function.to_numpy().astype(np.float64)
        y_decasted = None

    ###formato
    predict_casted = []
    proba = []
    for idx in range(len(X)):
        predicted_val = model_function.predict(X[idx].reshape(1,-1)) 
        predict_casted.append(predicted_val.item())
        if target_type_function == 'boolean' or target_type_function == 'classes':
            predicted_val_proba = model_function.predict_proba(X[idx].reshape(1,-1))
            proba.append(predicted_val_proba[0][predicted_val.item()].item())

    predict_decasted = auxiliary_fun.de_cast_PREDICTION(pd.DataFrame(predict_casted), [target_column_function], rosseta_function)
    predict_decasted = predict_decasted.values.tolist()

    return predict_decasted, proba, y_decasted
