import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
ratio = pd.read_csv('RatioPlot2.csv', sep=',') 

# plt.figure()
sns.relplot(data=ratio,x="Ciclo", y="Linfocitos",hue="Status", kind="line")
# plt.figure()
sns.relplot(data=ratio,x="Ciclo", y="Neu",hue="Status", kind="line")
# plt.figure()
sns.relplot(data=ratio,x="Ciclo", y="RATIO NLR",hue="Status", kind="line")
# plt.figure()
sns.relplot(data=ratio,x="Ciclo", y="Plaquetas",hue="Status", kind="line")
# plt.figure()
sns.relplot(data=ratio,x="Ciclo", y="RATIO PLR",hue="Status", kind="line")


breakpoint()
sns.relplot(data=ratio,x="RATIO NLR", y="RATIO PLR",hue="Paciente", kind="line")
plt.savefig('test.png')
breakpoint()