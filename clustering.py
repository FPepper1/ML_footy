import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import AgglomerativeClustering
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from scipy.spatial.distance import cdist

def hierarchical_clustering_and_assign(non_prem_df, prem_df, features, k, output_filename, prefix):
    # Minimum minutes logic ONLY to remove extreme outliers for the base clusters
    non_prem_df = non_prem_df[non_prem_df['Min'] >= 450].copy()
    prem_df = prem_df.copy()
    
    # Fill NAs and Infs in Prem to avoid losing players with 0 minutes and handle div by zero
    prem_df.replace([np.inf, -np.inf], 0, inplace=True)
    prem_df[features] = prem_df[features].fillna(0)
    
    # Drop NAs only for the training set
    non_prem_df = non_prem_df.dropna(subset=features)

    # Add flags
    non_prem_df['IsPrem'] = False
    prem_df['IsPrem'] = True

    # Scale fit on non_prem
    X_train = non_prem_df[features]
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    # Agglomerative Clustering
    hc = AgglomerativeClustering(n_clusters=k, linkage='ward')
    non_prem_df['Cluster'] = hc.fit_predict(X_train_scaled)
    
    # Save the scaled features for plotting radar charts
    for i, col in enumerate(features):
        non_prem_df[f'{col}_scaled'] = X_train_scaled[:, i]

    # Calculate centroids
    centroids = []
    for c in range(k):
        centroids.append(X_train_scaled[non_prem_df['Cluster'] == c].mean(axis=0))
    centroids = np.array(centroids)

    # Process Prem dataset
    X_test = prem_df[features]
    X_test_scaled = scaler.transform(X_test)
    
    # Predict clusters by Euclidean distance to the non-prem centroids
    distances = cdist(X_test_scaled, centroids, metric='euclidean')
    prem_df['Cluster'] = np.argmin(distances, axis=1)

    for i, col in enumerate(features):
        prem_df[f'{col}_scaled'] = X_test_scaled[:, i]
    
    # ------------------ PCA Calculation ------------------
    # Fit PCA on the non-Prem data
    pca = PCA(n_components=2)
    pca_non_prem = pca.fit_transform(X_train_scaled)
    non_prem_df['PCA1'] = pca_non_prem[:, 0]
    non_prem_df['PCA2'] = pca_non_prem[:, 1]
    
    # Transform the Prem data
    pca_prem = pca.transform(X_test_scaled)
    prem_df['PCA1'] = pca_prem[:, 0]
    prem_df['PCA2'] = pca_prem[:, 1]
    # -----------------------------------------------------
    
    # Combine
    combined = pd.concat([non_prem_df, prem_df], ignore_index=True)
    combined.to_csv(output_filename, index=False)
    
    # Also save explicitly to frontend/public for React
    try:
        combined.to_csv(f'frontend/public/{output_filename}', index=False)
    except Exception as e:
        print(f"[{prefix}] Could not save to frontend/public (maybe directory doesn't exist): {e}")

    print(f"[{prefix}] Clustering complete. Non-Prem: {len(non_prem_df)} players, Prem: {len(prem_df)} players. Clusters: {k}")


def cluster_goalkeepers():
    print("Clustering Goalkeepers...")
    gk_non_prem = pd.read_csv('gk.csv')
    gk_prem = pd.read_csv('gk_prem.csv')
    
    for df in [gk_non_prem, gk_prem]:
        df['Save%'] = df['Save%'].fillna(0)
        df['CS%'] = df['CS%'].fillna(0)
        df['Saves/90'] = df['Saves'] / df['90s']
        df['SoTA/90'] = df['SoTA'] / df['90s']
    
    features = ['GA90', 'Save%', 'CS%', 'Saves/90', 'SoTA/90']
    
    hierarchical_clustering_and_assign(
        gk_non_prem, 
        gk_prem, 
        features, 
        k=3, 
        output_filename='gk_clustered.csv', 
        prefix='GK'
    )

def cluster_outfield():
    print("Clustering Outfielders...")
    out_non_prem = pd.read_csv('outfield.csv')
    out_prem = pd.read_csv('Outfield_prem.csv')
    
    for df in [out_non_prem, out_prem]:
        df['Gls/90'] = df['Gls'] / df['90s']
        df['Ast/90'] = df['Ast'] / df['90s']
        df['Sh/90'] = df['Sh'] / df['90s']
        df['SoT/90'] = df['SoT'] / df['90s']
        df['Crs/90'] = df['Crs'] / df['90s']
        df['Int/90'] = df['Int'] / df['90s']
        df['TklW/90'] = df['TklW'] / df['90s']
        df['Fls/90'] = df['Fls'] / df['90s']
        df['Fld/90'] = df['Fld'] / df['90s']

    features = ['Gls/90', 'Ast/90', 'Sh/90', 'SoT/90', 'Crs/90', 'Int/90', 'TklW/90', 'Fls/90', 'Fld/90']
    
    hierarchical_clustering_and_assign(
        out_non_prem, 
        out_prem, 
        features, 
        k=5, 
        output_filename='outfield_clustered.csv', 
        prefix='Outfield'
    )

if __name__ == '__main__':
    cluster_goalkeepers()
    cluster_outfield()
    print("Done generating combined hierarchical CSVs!")
