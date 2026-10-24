import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, roc_auc_score, confusion_matrix, ConfusionMatrixDisplay

output_list = [
    -3.2592, 4.0338, 6.7067, 6.3258, 6.4930, 8.9448, 6.8444,
    8.6451, 8.6641, 7.2154, -6.3596, 4.7084, 6.4497
]
y_train = [0., 1., 1., 1., 1., 1., 1., 1., 1., 1., 0., 1., 1.]

# Calculate ROC curve and AUC
fpr, tpr, thresholds = roc_curve(y_train, output_list)
auc = roc_auc_score(y_train, output_list)

# Plot ROC curve
plt.figure()
lw = 2
plt.plot(
    fpr,
    tpr,
    color="darkorange",
    lw=lw,
    label="ROC curve (area = %0.2f)" % auc,
)
plt.plot([0, 1], [0, 1], color="navy", lw=lw, linestyle="--")
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("Receiver operating characteristic example")
plt.legend(loc="lower right")
plt.show()

# Choose a threshold (e.g., 0.0)
threshold = 0.0
y_pred = [1 if x > threshold else 0 for x in output_list]

# Compute confusion matrix
cm = confusion_matrix(y_train, y_pred)
print("Confusion Matrix:")
print(cm)

# Plot confusion matrix
disp = ConfusionMatrixDisplay(confusion_matrix=cm)
disp.plot(cmap=plt.cm.Blues)
plt.title("Confusion Matrix")
plt.show()

breakpoint()