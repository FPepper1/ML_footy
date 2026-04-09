#imports
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np


#Loading the dataset of the players from the top 5 European leagues for the season 2025-2026
dataset=pd.read_csv('players_data-2025_2026.csv')
print('Whole dataset:')
dataset.set_index('Rk', inplace=True)
print(dataset.head())


# partitioning the dataset into goalkeepers and outfield players
gk=dataset[dataset['Pos'].isin(['GK'])]


gk.isna().sum().sort_values(ascending=False).head(20)


keeper_columns = [
    'Rk_stats_keeper', 'Nation_stats_keeper', 'Pos_stats_keeper', 
    'Comp_stats_keeper', 'Age_stats_keeper', 'Born_stats_keeper', 
    'MP_stats_keeper', 'Starts_stats_keeper', 'Min_stats_keeper', 
    '90s_stats_keeper', 'GA', 'GA90', 'SoTA', 'Saves', 'Save%', 
    'W', 'D', 'L', 'CS', 'CS%', 'PKatt_stats_keeper', 
    'PKA', 'PKsv', 'PKm']


Outfield=dataset[dataset['Pos'].isin(['DF', 'MF', 'FW'])]
Outfield.drop(columns=keeper_columns, inplace=True)
print('Outfield dataset:')
print(Outfield.head())


gk_prem=gk[gk['Comp']=='eng Premier League']
print(gk_prem.head())
gk_prem.to_csv('gk_prem.csv', index=False)


gk=gk[gk['Comp']!='eng Premier League']
print(gk.head())
gk.to_csv('gk.csv', index=False)


Outfield_prem=Outfield[Outfield['Comp']=='eng Premier League']
print(Outfield_prem.head())
Outfield_prem.to_csv('Outfield_prem.csv', index=False)


Outfield=Outfield[Outfield['Comp']!='eng Premier League']
print(Outfield.head())
Outfield.to_csv('Outfield.csv', index=False)
