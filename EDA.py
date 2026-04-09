import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

#Loading the dataset of the players from the top 5 European leagues for the season 2025-2026
dataset=pd.read_csv('players_data-2025_2026.csv')
print('Whole dataset:')
print(dataset.head(50))

# partitioning the dataset into goalkeepers and outfield players
print('GK dataset:')
gk=dataset[dataset['Pos'].isin(['GK'])]
print(gk.info())

print(gk.head(50))
Outfield=dataset[dataset['Pos'].isin(['DF', 'MF', 'FW'])]
print('Outfield dataset:')
print(Outfield.head(50))

# #checking the number of goalkeepers and outfield players in the dataset
# print("Number of Goalkeepers:", len(gk))
# print("Number of Outfield Players:", len(Outfield))

# #doing visualization of the distribution of the players by their positions
# plt.figure(figsize=(10,6))

