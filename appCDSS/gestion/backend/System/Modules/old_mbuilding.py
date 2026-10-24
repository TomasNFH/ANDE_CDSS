from System.Modules import Fselection
import numpy as np
import pandas as pd
from System.Modules import DprepNcleaning
from sklearn.model_selection import train_test_split
from System.Auxiliary import auxiliary_fun
from System.Auxiliary import old_auxiliary_fun
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, RocCurveDisplay, brier_score_loss
from termcolor import colored
import matplotlib.pyplot as plt 
import seaborn as sns
from sklearn.utils import resample
from alive_progress import alive_bar
import time
import math
import seaborn as sns

from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import StandardScaler

def model_shake(DATA, X_TEST, Y_TEST, TARGET_COLUMN, TARGET_TY, SCALER, Fast = True):
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
    ALL_TRAINED_MODELS = []

    start_time = time.time()
    colors_plot = ['#309284', '#337AEF']
    fig_ROC = 0
    fig_CM = 0
    FEATURE_N = 5 #can test to change it or make it auto to find the best N
    model_return = pd.DataFrame(columns = ['Target column', 'Target type', 'Model name', 
                                           'Normalization method', 'Feature selection method', 
                                           'Features used', 'importances', 'Number of splits', 'Cross-validation ID', 
                                           'Confusion matrix', 'True Positive Rate', 'False Positive Rate', 'ROC ver','Recall', 
                                           'F1 score', 'AUC', 'Score', 'Brier score loss'])
    FS_return = pd.DataFrame(columns = ['Model name', 'Normalization method', 'Feature selection method', 'Features used', 
                                           'importances', 'Number of splits', 'Cross-validation ID', 'Score'])

    NORM_FLAGS = np.array([0,1,2]) #we aplly only to train data, why? to all data?
    FEATURE_FLAGS = np.array([0,1,2]) #dont use 2 due to time
    if Fast:
        FEATURE_FLAGS = np.array([0,1])

    if TARGET_TY == 'boolean': model_stack = ['RandomForestClassifier', 'LogisticRegression', 'KNeighborsClassifier', 'SupportVectorClassification', 'GradientBoostingClassifier', 'GaussianNB']
    if TARGET_TY == 'classes': model_stack = ['RandomForestClassifier', 'KNeighborsClassifier', 'SupportVectorClassification']   
    if TARGET_TY == 'continuous': model_stack = ['LinearRegression', 'SupportVectorMachines', 'RandomForestRegressor','QuantileRegressor', 'GradientBoostingRegressor', 'PassiveAggressiveRegressor', 'LassoLars', 'KNeighborsRegressor'] 

    Feature_methods = ['Intrinsic method','Filter method','Wrapper method']
    Normalization_methods = ['No', 'Min-Max', 'Z-score']
    
    number_of_splits = 5
    
    X = DATA.loc[:, DATA.columns != TARGET_COLUMN]
    y = DATA[TARGET_COLUMN]
    columns_X = X.columns

    LOOorBS = True #True is LOO, False is Bootstraping
    LOO_valid = False
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

    ### Step 2: Cross Validation (FIRST STEP)###   
    samples_of_valid = int(len(X)/number_of_splits)
    for shift_idx in range(number_of_splits): 
        # print('\nshift_idx '+str(shift_idx))


        # REPENSAR
        # balance_training = True # if false balance data
        # if not balance_training: 

        #     if LOO_valid:
        #         X_train, X_valid, y_train, y_valid = train_test_split(X, y, test_size=1, random_state=0, shuffle = False)
        #     else:
        #         X_train, X_valid, y_train, y_valid = train_test_split(X, y, test_size=samples_of_valid, random_state=0, shuffle = False)
                 
        # else:

        #     unique_classes = pd.DataFrame(y).nunique().values[0]
        #     while balance_training:

        #         if LOO_valid: X_train, X_valid, y_train, y_valid = train_test_split(X, y, test_size=1, random_state=0, shuffle = False)
        #         else: X_train, X_valid, y_train, y_valid = train_test_split(X, y, test_size=samples_of_valid, random_state=0, shuffle = False)
                    
        #         n_per_class = int(len(y_valid)/unique_classes)
        #         error10 = int(n_per_class/10)
                
        #         flags = []
        #         dif_lst = []
        #         for i in pd.DataFrame(y_valid).value_counts():
        #             dif = abs(n_per_class - i)
        #             dif_lst.append(dif)

        #             if dif <= error10: flags.append(True)
        #             else: flags.append(False)

        #         print(dif_lst)
        #         if all(flags): balance_training = False
        #         breakpoint()
        #     breakpoint()


        if LOO_valid:
            X_train, X_valid, y_train, y_valid = train_test_split(X, y, test_size=1, random_state=0, shuffle = False)
        else:
            X_train, X_valid, y_train, y_valid = train_test_split(X, y, test_size=samples_of_valid, random_state=0, shuffle = False)
        
        if TARGET_TY == 'classes' or TARGET_TY == 'boolean': #quick solve for HDwithCM, solve in general!!!
            y_train = y_train.astype(int)
            y_valid = y_valid.astype(int)

        #shift data
        X = np.roll(X, samples_of_valid, axis=0)
        y = np.roll(y, samples_of_valid, axis=0)

        ### Step 4: NORMALIZATION ###
        for N_FLAG in NORM_FLAGS:
            # print('    normalization '+str(N_FLAG))
            X_trainN = DprepNcleaning.data_normF(X_train, FLAG=N_FLAG, scaler = SCALER) 
            X_validN = DprepNcleaning.data_normF(X_valid, FLAG=N_FLAG, scaler = SCALER) 

            ### Step 1: Feature Engeeniring ###
            for F_FLAG in FEATURE_FLAGS:
                # print('        F_flag '+str(Feature_methods[F_FLAG]))
                X_trainR, current_Features, importances, indexes4valid = Fselection.F_selector(pd.DataFrame(X_trainN, columns = columns_X), 
                                                    pd.DataFrame(y_train, columns = [TARGET_COLUMN]), 
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
                    model = old_auxiliary_fun.model_dashboard(model_name)

                    model.fit(X_trainR, y_train)
                    prediction = model.predict(X_validR)

                    FS_return.loc[len(FS_return.index)] = [model_name, Normalization_methods[N_FLAG], Feature_methods[F_FLAG], current_Features.values.tolist(), importances, 
                                                            number_of_splits, shift_idx, model.score(X_validR, y_valid)] 
    

    # # 1 SELECT FEATURES WITH CV (for now i use the set of features with higher Accuracy)
    # Feat_best_set = pd.DataFrame(columns = ['Model', 'Normalization method', 'Feature method', 'Best set', 'Importances Custom', 'Score' ])

    # for model_nm in model_stack:
    #     for feature_nm in Feature_methods[0:len(FEATURE_FLAGS)]:
    #         for normFlag_nm in NORM_FLAGS:
    #             feat_n_score = FS_return.query('`Model name` == @model_nm and `Feature selection method` == @feature_nm and `Normalization method` == @Normalization_methods[@normFlag_nm]')[['Features used', 'Normalization method','importances', 'Score']]
    #             best_set = feat_n_score.sort_values(by='Score').iloc[-1]['Features used']
    #             best_set_score = feat_n_score.sort_values(by='Score').iloc[-1]['Score']
    #             best_set_importances = feat_n_score.sort_values(by='Score').iloc[-1]['importances']

    #             Feat_best_set.loc[len(Feat_best_set.index)] = [model_nm, Normalization_methods[normFlag_nm],feature_nm, best_set, best_set_importances, best_set_score] 


    # 2 SELECT FEATURES WITH CV (for now i use the set of features with higher Accuracy)
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
                    print(len(row['Features used']))
                    for idx in range(len(row['Features used'])): #number_of_splits whyyy?
                        Feat = row['Features used'][idx]
                        Imp = row['importances'][idx]
                        Scr = row['Score']
                        feature_imp_sum.loc[0, Feat] += Scr*Imp
                # breakpoint()
                best_set = feature_imp_sum.transpose().sort_values(by=0).iloc[-FEATURE_N:].index
                best_set_importances = feature_imp_sum.transpose().sort_values(by=0).iloc[-FEATURE_N:].values.transpose()[0]
                Feat_best_set.loc[len(Feat_best_set.index)] = [model_nm, Normalization_methods[normFlag_nm],feature_nm, best_set, best_set_importances] 

    #### MODELING AND VALIDATION ####
    # NO CV for modeling and validation -> (we use valid and train) as train and we validate with test 
    X_train = X
    y_train = y

    if TARGET_TY == 'classes' or TARGET_TY == 'boolean': #quick solve for HDwithCM, solve in general!!!
        y_train = y_train.astype(int)
        Y_TEST = Y_TEST.astype(int)

    ### Step 4: NORMALIZATION ###
    for N_FLAG in NORM_FLAGS:
        # print('    normalization '+str(N_FLAG))
        X_trainN = DprepNcleaning.data_normF(X_train, FLAG=N_FLAG, scaler = SCALER) 
        X_testN = DprepNcleaning.data_normF(X_TEST, FLAG=N_FLAG, scaler = SCALER) 

        ### Step 1: Feature Engeeniring ###
        for F_FLAG in FEATURE_FLAGS:
            # print('    F_flag '+str(Feature_methods[F_FLAG]))

            ### Step 3: Model selection ###
            for model_name in model_stack:
                # print('     model '+str(model_name))
                current_Features = Feat_best_set.query('`Model` == @model_name and `Feature method` == @Feature_methods[@F_FLAG] and `Normalization method` == @Normalization_methods[@N_FLAG]')['Best set'].values.tolist()[0]
                importances = Feat_best_set.query('`Model` == @model_name and `Feature method` == @Feature_methods[@F_FLAG] and `Normalization method` == @Normalization_methods[@N_FLAG]')['Importances Custom'].values[0]
                indexes4X = []
                for idxCF in range(len(current_Features)):
                    indexes4X.append(DATA.loc[:, DATA.columns != TARGET_COLUMN].columns.get_loc(current_Features[idxCF]))
                
                X_trainR = X_train[:, indexes4X]
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
                model = old_auxiliary_fun.model_dashboard(model_name)
                # if F_FLAG==2:
                    # breakpoint()
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

                if TARGET_TY == 'boolean' or TARGET_TY == 'classes':
                    classes_of_target = np.unique(y)
                    CoMtx = confusion_matrix(Y_TEST, prediction, labels=list(classes_of_target))  #ADD LABELS TO MATRIX (MAKE IT DF)
                    accurecy = np.sum(np.diag(CoMtx))/len(prediction)
                    accurecy = accurecy*100
                    # breakpoint()
                    ### BRIES SCORE MANUAL 
                    brier_score = 0
                    for N, target_value in enumerate(Y_TEST):
                        prediction_proba = model.predict_proba(X_testR)
                        for C in range(np.shape(prediction_proba)[1]):
                            y_nc = 1 if C == target_value else 0
                            brier_score += (y_nc-prediction_proba[N, C])**2
                            # breakpoint()
                    brier_score = brier_score/len(Y_TEST)
                    # breakpoint()


                    if TARGET_TY == 'boolean':
                        TP = CoMtx[0,0]
                        TP_FN = np.sum(CoMtx[0,:])
                        Recall = TP/TP_FN
                        TN = CoMtx[1,1]
                        TN_FP = CoMtx[1,:]
                        Specifity = TN/np.sum(TN_FP)
                        Specifity = (1-Specifity)*100
                        F1 = 2*(accurecy*Recall)/((accurecy+Recall))

                        metrics_result = old_auxiliary_fun.computemetrics(model, X_testR, Y_TEST)
                        tpr = metrics_result['roc_curve'][1]
                        fpr = metrics_result['roc_curve'][0]
                        auc = metrics_result['roc_curve'][2]
                        ROC_ver = metrics_result['verification']

                        ### brier score loss ###
                        prediction_proba = model.predict_proba(X_testR)
                        prediction_proba_positive_clase = prediction_proba[:,1] 
                        brier_score = brier_score_loss(Y_TEST, prediction_proba_positive_clase)
                model_return.loc[len(model_return.index)] = [TARGET_COLUMN, TARGET_TY, model_name, 
                                                             Normalization_methods[N_FLAG], Feature_methods[F_FLAG], current_Features.values.tolist(), importances, 
                                                             number_of_splits, shift_idx, CoMtx, 
                                                             tpr, fpr, ROC_ver, Recall, F1, auc, model.score(X_testR, Y_TEST), brier_score] 



    ### RESULTS AND GRAPHS ###
    fig_FEAT, fig_ROC, fig_CM, fig_score = 0, 0, 0, 0

    # best_model_res = model_return.loc[model_return.groupby('Model name')['AUC'].idxmax()]
    best_model_res = (model_return.sort_values(by=['Model name', 'Brier score loss', 'Score', 'AUC'], ascending=[True, True, False, False]).groupby('Model name', as_index=False).first())
    # breakpoint()
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


    if TARGET_TY == 'boolean' or TARGET_TY == 'classes':

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
    
        if TARGET_TY == 'boolean':
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

    if not Fast:
        sns.catplot(data=model_return[model_return['Feature selection method']=='Wrapper method'], x="Normalization method", y="AUC", col="Model name", hue="Normalization method",    col_wrap=6, palette="muted", kind="point")

        best_wrapper = model_return[model_return['Feature selection method']=='Wrapper method'].loc[model_return[model_return['Feature selection method']=='Wrapper method'].groupby('Model name')['Score'].idxmax()]

        
        number_of_models = len(model_stack)  # or any other number
        nrows = 2 if number_of_models > 3 else 1
        ncols = math.ceil(number_of_models / nrows)

        fig_FEATWRAP, axs = plt.subplots(nrows, ncols, figsize=(6 * ncols, 4 * nrows))
        axs = axs.flatten()  # Flatten to get a list: [ax1, ax2, ..., ax6]

        # breakpoint()
        for i, ax in enumerate(axs):
            # breakpoint()
            current_model = best_wrapper.iloc[i]
            features = current_model['Features used']
            
            # breakpoint()
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



    # breakpoint()
    return model_return, ALL_TRAINED_MODELS, fig_FEAT, fig_CM, fig_ROC, fig_score


def predict_fun(X_TEST, MODEL, TARGET_COLUMN, TARGET_TYPE, ROSSETA, Y_TEST = None, CAST=False):
    
    

    if Y_TEST is not None and not Y_TEST.empty:
        DATA = pd.concat([X_TEST, Y_TEST], axis=1)
        print('y test')
    else: DATA = X_TEST

    # data already come casted? y si
    ###casteo 
    if CAST:
        input_casted = old_auxiliary_fun.cast_input(DATA, ROSSETA)
        input_casted = input_casted[input_casted.columns[::-1]]
        input_casted = input_casted.to_numpy().astype(np.float64)
    else: input_casted = DATA

    if Y_TEST is not None and not Y_TEST.empty:
        # breakpoint()
        X = input_casted.loc[:, input_casted.columns != TARGET_COLUMN]
        # X = X[X.columns[::-1]]
        X = X.to_numpy().astype(np.float64)

        y = pd.DataFrame(input_casted[TARGET_COLUMN])
        y_decasted = auxiliary_fun.de_cast_PREDICTION(y, [TARGET_COLUMN], ROSSETA)

    else: 
        X = X_TEST.to_numpy().astype(np.float64)
        y_decasted = None
    # breakpoint()
    ###formato
    predict_casted = []
    proba = []
    for idx in range(len(X)):
        # breakpoint()
        predicted_val = MODEL.predict(X[idx].reshape(1,-1)) 
        predict_casted.append(predicted_val.item())
        if TARGET_TYPE == 'boolean' or TARGET_TYPE == 'classes':
            predicted_val_proba = MODEL.predict_proba(X[idx].reshape(1,-1))
            proba.append(predicted_val_proba[0][predicted_val.item()].item())
    # breakpoint()
    predict_decasted = auxiliary_fun.de_cast_PREDICTION(pd.DataFrame(predict_casted), [TARGET_COLUMN], ROSSETA)
    predict_decasted = predict_decasted.values.tolist()

    return predict_decasted, proba, y_decasted
