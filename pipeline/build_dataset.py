import os
import json
import rasterio
import numpy as np
import pandas as pd
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
GSI_CSV = os.path.join(PROCESSED_DIR, "gsi_landslides", "gsi_landslides_clean.csv")
TERRAIN_DIR = os.path.join(PROCESSED_DIR, "terrain")
SOIL_DIR = os.path.join(PROCESSED_DIR, "soil")

from extract_rainfall import IMDRainfallExtractor

print("Building unified ML training dataset...")

# Load GSI
df_gsi = pd.read_csv(GSI_CSV)

# Pilot Study Bounding Box (4-way intersection):
# Lat: 28.0000 to 28.8401
# Lon: 95.3828 to 96.0000
lat_min, lat_max = 28.0000, 28.8401
lon_min, lon_max = 95.3828, 96.0000

# Filter positive points in pilot box
positives = df_gsi[
    (df_gsi['latitude'] >= lat_min) & (df_gsi['latitude'] <= lat_max) &
    (df_gsi['longitude'] >= lon_min) & (df_gsi['longitude'] <= lon_max)
].copy()

print(f"Found {len(positives)} positive landslide locations in pilot extent.")

# Helper to sample raster values at (lon, lat) coordinates
def sample_raster(raster_path, coords):
    values = []
    with rasterio.open(raster_path) as src:
        for lon, lat in coords:
            try:
                row, col = src.index(lon, lat)
                if 0 <= row < src.height and 0 <= col < src.width:
                    val = src.read(1)[row, col]
                    values.append(float(val))
                else:
                    values.append(np.nan)
            except:
                values.append(np.nan)
    return np.array(values)

# Open terrain rasters
elev_tif = os.path.join(TERRAIN_DIR, "elevation.tif")
slope_tif = os.path.join(TERRAIN_DIR, "slope.tif")
aspect_tif = os.path.join(TERRAIN_DIR, "aspect.tif")

# Soil rasters
soil_props = ["clay", "sand", "silt", "bulk_density", "organic_carbon", "ph_h2o", "nitrogen"]
soil_tifs = {p: os.path.join(SOIL_DIR, f"{p}.tif") for p in soil_props}

# Extract features for positives
pos_coords = list(zip(positives['longitude'], positives['latitude']))

pos_elev = sample_raster(elev_tif, pos_coords)
pos_slope = sample_raster(slope_tif, pos_coords)
pos_aspect = sample_raster(aspect_tif, pos_coords)

pos_soil_dict = {}
for p in soil_props:
    pos_soil_dict[p] = sample_raster(soil_tifs[p], pos_coords)

# Create positive dataframe
df_pos = pd.DataFrame({
    'sl_no': positives['sl_no'],
    'slide_no': positives['slide_no'],
    'state': positives['state'],
    'location_info': positives['location_info'],
    'latitude': positives['latitude'],
    'longitude': positives['longitude'],
    'material_involved': positives['material_involved'],
    'movement_type': positives['movement_type'],
    'history_raw': positives['history_raw'],
    'has_date': positives['has_date'],
    'year': positives['year'],
    'elevation': pos_elev,
    'slope': pos_slope,
    'aspect': pos_aspect,
    **pos_soil_dict,
    'landslide': 1
})

# Filter out any out-of-bound NaN samples
df_pos = df_pos.dropna(subset=['elevation', 'slope', 'clay']).reset_index(drop=True)
n_pos = len(df_pos)
print(f"Valid positive samples: {n_pos}")

# Pseudo-Absence Generation (Negatives Y=0)
# Systematic spatial sampling across the pilot box with >= 500m buffer from positive points
np.random.seed(42)
candidate_lons = np.random.uniform(lon_min + 0.01, lon_max - 0.01, n_pos * 4)
candidate_lats = np.random.uniform(lat_min + 0.01, lat_max - 0.01, n_pos * 4)

pos_coords_arr = np.column_stack([df_pos['longitude'].values, df_pos['latitude'].values])

valid_neg_lons = []
valid_neg_lats = []

# Minimum buffer distance in degrees: ~500m ≈ 0.005 degrees
min_dist_deg = 0.005

for clon, clat in zip(candidate_lons, candidate_lats):
    dists = np.sqrt((pos_coords_arr[:, 0] - clon)**2 + (pos_coords_arr[:, 1] - clat)**2)
    if np.min(dists) >= min_dist_deg:
        valid_neg_lons.append(clon)
        valid_neg_lats.append(clat)
        if len(valid_neg_lons) >= n_pos:
            break

neg_coords = list(zip(valid_neg_lons, valid_neg_lats))
neg_elev = sample_raster(elev_tif, neg_coords)
neg_slope = sample_raster(slope_tif, neg_coords)
neg_aspect = sample_raster(aspect_tif, neg_coords)

neg_soil_dict = {}
for p in soil_props:
    neg_soil_dict[p] = sample_raster(soil_tifs[p], neg_coords)

df_neg = pd.DataFrame({
    'sl_no': range(100001, 100001 + len(neg_coords)),
    'slide_no': [f"PSEUDO_NEG_{i+1:04d}" for i in range(len(neg_coords))],
    'state': 'Arunachal Pradesh',
    'location_info': 'Non-Landslide Sampling Point',
    'latitude': valid_neg_lats,
    'longitude': valid_neg_lons,
    'material_involved': 'None',
    'movement_type': 'Stable',
    'history_raw': 'Stable Terrain',
    'has_date': False,
    'year': None,
    'elevation': neg_elev,
    'slope': neg_slope,
    'aspect': neg_aspect,
    **neg_soil_dict,
    'landslide': 0
})

df_neg = df_neg.dropna(subset=['elevation', 'slope', 'clay']).reset_index(drop=True)
print(f"Generated {len(df_neg)} valid negative samples.")

# Combine Positives and Negatives
df_all = pd.concat([df_pos, df_neg], ignore_index=True)

# Extract Dynamic IMD Rainfall Features:
# We sample antecedent rainfall from peak historical monsoon storm periods across 2000-2024
# for both positive and negative observation scenarios
extractor = IMDRainfallExtractor()

rf_1d, rf_3d, rf_7d, rf_30d = [], [], [], []

# Representative monsoon scenario dates (June - August across years)
sample_dates = [
    "2020-07-10", "2019-07-22", "2021-08-04", "2018-06-25",
    "2022-07-15", "2023-06-18", "2024-07-02", "2017-08-11"
]

for idx, row in df_all.iterrows():
    lat = row['latitude']
    lon = row['longitude']
    
    # Pick a date based on record or representative monsoon date
    d_str = sample_dates[idx % len(sample_dates)]
    rf_data = extractor.get_rainfall_for_date(lat, lon, d_str)
    
    if rf_data:
        # If negative sample, also include low-rainfall / non-monsoon dry season baseline scenarios
        if row['landslide'] == 0 and (idx % 3 == 0):
            dry_date = f"2022-01-{10 + (idx % 15):02d}"
            dry_rf = extractor.get_rainfall_for_date(lat, lon, dry_date)
            if dry_rf:
                rf_data = dry_rf
                
        rf_1d.append(rf_data['rainfall_1_day'])
        rf_3d.append(rf_data['rainfall_3_day'])
        rf_7d.append(rf_data['rainfall_7_day'])
        rf_30d.append(rf_data['rainfall_30_day'])
    else:
        rf_1d.append(0.0)
        rf_3d.append(0.0)
        rf_7d.append(0.0)
        rf_30d.append(0.0)

df_all['rainfall_1_day'] = rf_1d
df_all['rainfall_3_day'] = rf_3d
df_all['rainfall_7_day'] = rf_7d
df_all['rainfall_30_day'] = rf_30d

# Create Spatial Fold (Spatial Blocking to prevent data leakage)
# Divide bounding box into 5 geographic spatial blocks
lon_bins = np.linspace(lon_min, lon_max, 6)
df_all['spatial_fold'] = pd.cut(df_all['longitude'], bins=lon_bins, labels=[0, 1, 2, 3, 4]).astype(int)

# Save clean training dataset
out_dataset_path = os.path.join(PROCESSED_DIR, "landslide_training_dataset.csv")
df_all.to_csv(out_dataset_path, index=False)
print(f"\nFinal ML Training Dataset saved to {out_dataset_path}")
print(f"Total Rows: {len(df_all)}, Positives: {(df_all['landslide']==1).sum()}, Negatives: {(df_all['landslide']==0).sum()}")
print("Columns:", list(df_all.columns))
