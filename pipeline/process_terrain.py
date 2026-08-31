import os
import zipfile
import json
import rasterio
from rasterio.transform import from_bounds
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRTM_ZIP = os.path.join(BASE_DIR, "files for hackathon", "N28E095.SRTMGL1.hgt.zip")
TERRAIN_DIR = os.path.join(BASE_DIR, "data", "processed", "terrain")
os.makedirs(TERRAIN_DIR, exist_ok=True)

print(f"Reading SRTM data from {SRTM_ZIP}...")
with zipfile.ZipFile(SRTM_ZIP, 'r') as z:
    hgt_name = z.namelist()[0]
    with z.open(hgt_name) as f:
        elev_data = np.frombuffer(f.read(), dtype='>i2').reshape((3601, 3601)).astype(np.float32)

print(f"Elevation grid shape: {elev_data.shape}")
print(f"Elevation Min: {elev_data.min()}m, Max: {elev_data.max()}m, Mean: {elev_data.mean():.2f}m")

# Bounds: 28°N - 29°N, 95°E - 96°E
west, south, east, north = 95.0, 28.0, 96.0, 29.0
transform = from_bounds(west, south, east, north, 3601, 3601)

# Save elevation.tif
elev_meta = {
    'driver': 'GTiff',
    'dtype': 'float32',
    'nodata': -32768.0,
    'width': 3601,
    'height': 3601,
    'count': 1,
    'crs': 'EPSG:4326',
    'transform': transform
}

elev_path = os.path.join(TERRAIN_DIR, "elevation.tif")
with rasterio.open(elev_path, 'w', **elev_meta) as dst:
    dst.write(elev_data, 1)
print(f"Saved elevation GeoTIFF to {elev_path}")

# Compute Slope & Aspect using spatial finite differences
# Pixel spacing in degrees: 1 / 3600 = 0.000277778°
# Metric conversion at latitude ~28.5°:
# 1 deg lat ≈ 110,850 m -> dy = 110850 / 3600 ≈ 30.79 m
# 1 deg lon ≈ 111320 * cos(28.5°) ≈ 97,830 m -> dx = 97830 / 3600 ≈ 27.175 m

dy = 30.79
dx = 27.175

print("Computing Slope and Aspect rasters...")
# 2nd-order central differences (interior pixels)
dz_dy, dz_dx = np.gradient(elev_data, dy, dx)

# Slope in degrees = arctan(sqrt(dx^2 + dy^2)) * (180 / pi)
slope_rad = np.arctan(np.sqrt(dz_dx**2 + dz_dy**2))
slope_deg = np.degrees(slope_rad).astype(np.float32)

# Aspect in degrees (azimuth: 0=North, 90=East, 180=South, 270=West)
# aspect = 180 - arctan2(dz/dy, -dz/dx) * (180 / pi)
aspect_deg = np.degrees(np.arctan2(dz_dy, -dz_dx))
aspect_deg = ((90.0 - np.degrees(np.arctan2(-dz_dy, dz_dx))) + 360.0) % 360.0
aspect_deg = aspect_deg.astype(np.float32)

print(f"Slope Range: {slope_deg.min():.2f}° to {slope_deg.max():.2f}°, Mean: {slope_deg.mean():.2f}°")
print(f"Aspect Range: {aspect_deg.min():.2f}° to {aspect_deg.max():.2f}°")

# Save slope.tif
slope_path = os.path.join(TERRAIN_DIR, "slope.tif")
with rasterio.open(slope_path, 'w', **elev_meta) as dst:
    dst.write(slope_deg, 1)
print(f"Saved slope GeoTIFF to {slope_path}")

# Save aspect.tif
aspect_path = os.path.join(TERRAIN_DIR, "aspect.tif")
with rasterio.open(aspect_path, 'w', **elev_meta) as dst:
    dst.write(aspect_deg, 1)
print(f"Saved aspect GeoTIFF to {aspect_path}")

# Export metadata json
terrain_stats = {
    'elevation': {
        'min_m': float(elev_data.min()),
        'max_m': float(elev_data.max()),
        'mean_m': float(elev_data.mean())
    },
    'slope': {
        'min_deg': float(slope_deg.min()),
        'max_deg': float(slope_deg.max()),
        'mean_deg': float(slope_deg.mean())
    },
    'aspect': {
        'min_deg': float(aspect_deg.min()),
        'max_deg': float(aspect_deg.max()),
        'mean_deg': float(aspect_deg.mean())
    },
    'crs': 'EPSG:4326',
    'bounds': [west, south, east, north]
}
with open(os.path.join(TERRAIN_DIR, "terrain_stats.json"), "w") as f:
    json.dump(terrain_stats, f, indent=2)

print("Terrain processing complete.")
