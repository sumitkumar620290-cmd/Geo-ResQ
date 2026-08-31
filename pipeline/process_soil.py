import os
import json
import rasterio
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "files for hackathon")
SOIL_DIR = os.path.join(BASE_DIR, "data", "processed", "soil")
os.makedirs(SOIL_DIR, exist_ok=True)

SOIL_MAPPING = {
    "clay": {
        "raw_file": "out (1).tif",
        "description": "Clay content in soil (0-30 cm)",
        "scale_factor_to_standard": 0.1,  # g/kg -> percentage (%)
        "unit": "%",
        "unit_raw": "g/kg"
    },
    "sand": {
        "raw_file": "out (2).tif",
        "description": "Sand content in soil (0-30 cm)",
        "scale_factor_to_standard": 0.1,  # g/kg -> percentage (%)
        "unit": "%",
        "unit_raw": "g/kg"
    },
    "silt": {
        "raw_file": "out (3).tif",
        "description": "Silt content in soil (0-30 cm)",
        "scale_factor_to_standard": 0.1,  # g/kg -> percentage (%)
        "unit": "%",
        "unit_raw": "g/kg"
    },
    "bulk_density": {
        "raw_file": "out (4).tif",
        "description": "Bulk density of fine earth fraction (0-30 cm)",
        "scale_factor_to_standard": 0.01,  # cg/cm3 -> g/cm3
        "unit": "g/cm³",
        "unit_raw": "cg/cm³"
    },
    "organic_carbon": {
        "raw_file": "out (5).tif",
        "description": "Soil organic carbon content (0-30 cm)",
        "scale_factor_to_standard": 0.1,  # dg/kg -> g/kg
        "unit": "g/kg",
        "unit_raw": "dg/kg"
    },
    "ph_h2o": {
        "raw_file": "out (6).tif",
        "description": "Soil pH in H2O solution (0-30 cm)",
        "scale_factor_to_standard": 0.1,  # pH*10 -> pH
        "unit": "pH",
        "unit_raw": "pH*10"
    },
    "nitrogen": {
        "raw_file": "out.tif",
        "description": "Total nitrogen in soil (0-30 cm)",
        "scale_factor_to_standard": 0.01,  # cg/kg -> g/kg
        "unit": "g/kg",
        "unit_raw": "cg/kg"
    }
}

catalog = {}

for prop_name, prop_info in SOIL_MAPPING.items():
    raw_path = os.path.join(RAW_DIR, prop_info["raw_file"])
    with rasterio.open(raw_path) as src:
        raw_arr = src.read(1).astype(np.float32)
        scaled_arr = raw_arr * prop_info["scale_factor_to_standard"]
        
        meta = src.meta.copy()
        meta.update({
            'driver': 'GTiff',
            'dtype': 'float32',
            'nodata': -9999.0
        })
        
        out_path = os.path.join(SOIL_DIR, f"{prop_name}.tif")
        with rasterio.open(out_path, 'w', **meta) as dst:
            dst.write(scaled_arr, 1)
            dst.update_tags(
                PROPERTY=prop_name,
                DESCRIPTION=prop_info["description"],
                UNIT=prop_info["unit"],
                DEPTH="0-30cm",
                SOURCE="ISRIC SoilGrids 250m"
            )
            
        print(f"Processed {prop_name}: Min={scaled_arr.min():.2f}, Max={scaled_arr.max():.2f}, Mean={scaled_arr.mean():.2f} {prop_info['unit']} -> {out_path}")
        
        catalog[prop_name] = {
            "file": f"{prop_name}.tif",
            "description": prop_info["description"],
            "unit": prop_info["unit"],
            "min": float(scaled_arr.min()),
            "max": float(scaled_arr.max()),
            "mean": float(scaled_arr.mean()),
            "bounds": [src.bounds.left, src.bounds.bottom, src.bounds.right, src.bounds.top],
            "resolution_deg": [src.res[0], src.res[1]]
        }

catalog_path = os.path.join(SOIL_DIR, "soil_catalog.json")
with open(catalog_path, "w") as f:
    json.dump(catalog, f, indent=2)

print("Soil processing complete.")
