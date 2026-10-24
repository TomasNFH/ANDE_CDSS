from System import Workflow
import warnings
import cutie
import skops.io as sio
import pandas as pd
import os
import pickle

Fast = cutie.prompt_yes_or_no("Fast mode?")
if not Fast: warnings.filterwarnings("ignore")

model_info, ALL_TRAINED_MODELS, X_test, y_test, file_name, rosseta, scalers = Workflow.dyn_model_selection(FAST = Fast, PLOT = False, local_file=True)
# best_model_res = model_info.loc[model_info.groupby('Model name')['AUC'].idxmax()]
# best_model_res = (model_info.sort_values(by=['Model name', 'AUC', 'Brier score loss'], ascending=[True, False, True]).groupby('Model name', as_index=False).first())
best_model_res = (model_info.sort_values(by=['Model name', 'Brier score loss', 'Score', 'AUC'], ascending=[True, True, False, False]).groupby('Model name', as_index=False).first())

# breakpoint()
#EXPORT
export_info = pd.DataFrame([best_model_res.sort_values(by=['Brier score loss', 'Score', 'AUC'], ascending=[True, False, False]).iloc[0].values], columns=best_model_res.sort_values(by=['Brier score loss', 'Score', 'AUC'], ascending=[True, False, False]).iloc[0].index)
# Create directories if they don't exist
os.makedirs('TrainedModels/'+file_name[:-4], exist_ok=True)
export_info.to_csv('TrainedModels/'+file_name[:-4]+'/info.csv')

index_model = model_info.sort_values(by=['Brier score loss', 'Score', 'AUC'], ascending=[True, False, False]).index[0]
clf = ALL_TRAINED_MODELS[index_model]
breakpoint()
obj = sio.dump(clf, "TrainedModels/"+file_name[:-4]+"/model.skops")
X_test.to_csv('TrainedModels/'+file_name[:-4]+'/X_test.csv', index=False)
y_test.to_csv('TrainedModels/'+file_name[:-4]+'/y_test.csv', index=False)
with open('TrainedModels/'+file_name[:-4]+"/rosseta.pkl", "wb") as f: pickle.dump(rosseta, f)
with open('TrainedModels/'+file_name[:-4]+"/minmax.pkl", "wb") as f: pickle.dump(scalers[0], f)
with open('TrainedModels/'+file_name[:-4]+"/std.pkl", "wb") as f: pickle.dump(scalers[1], f)



