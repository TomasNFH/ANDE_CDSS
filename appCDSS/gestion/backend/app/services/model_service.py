

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