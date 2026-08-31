import os
import re
import json
import pypdf
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_PDF = os.path.join(BASE_DIR, "files for hackathon", "landslide_report.pdf")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed", "gsi_landslides")
os.makedirs(PROCESSED_DIR, exist_ok=True)

print(f"Reading {RAW_PDF}...")
reader = pypdf.PdfReader(RAW_PDF)
total_pages = len(reader.pages)
print(f"Total pages to parse: {total_pages}")

known_states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal", "Jammu & Kashmir", "Jammu and Kashmir", "Ladakh"
]
state_pattern = r'(' + '|'.join([re.escape(s) for s in sorted(known_states, key=len, reverse=True)]) + r')'

parsed_blocks = []
buffer = ""

for page_idx in range(total_pages):
    text = reader.pages[page_idx].extract_text()
    if not text:
        continue
    lines = text.split("\n")
    for line in lines:
        l = line.strip()
        if not l:
            continue
        if "Sl.No." in l or "Slide_No" in l or l == "Type" or l == "History" or "Material Involved" in l:
            continue
        
        m = re.match(r'^(\d+)\s+([A-Za-z0-9\.\/\-_]+)\s+(.*)$', l)
        if m:
            if buffer:
                parsed_blocks.append((page_idx + 1, buffer))
            buffer = l
        else:
            if buffer:
                buffer += " " + l

if buffer:
    parsed_blocks.append((total_pages, buffer))

print(f"Total structured landslide blocks parsed: {len(parsed_blocks)}")

records = []
for page_num, block in parsed_blocks:
    m_lead = re.match(r'^(\d+)\s+([A-Za-z0-9\.\/\-_]+)\s+(.*)$', block)
    if not m_lead:
        continue
    sl_no = int(m_lead.group(1))
    slide_no = m_lead.group(2)
    rest = m_lead.group(3).strip()
    
    # Extract State
    m_state = re.match(r'^' + state_pattern + r'\s+(.*)$', rest, re.IGNORECASE)
    state = "Unknown"
    if m_state:
        state = m_state.group(1).title()
        rest = m_state.group(2).strip()
    
    # Extract Lat Lon
    coord_matches = list(re.finditer(r'\b([1-3]\d(?:\.\d+)?)\s+([6-9]\d(?:\.\d+)?)\b', rest))
    lat, lon = np.nan, np.nan
    location_str = rest
    after_coords = ""
    if coord_matches:
        cm = coord_matches[0]
        try:
            val_lat = float(cm.group(1))
            val_lon = float(cm.group(2))
            if 6.0 <= val_lat <= 38.0 and 68.0 <= val_lon <= 98.0:
                lat, lon = val_lat, val_lon
                location_str = rest[:cm.start()].strip()
                after_coords = rest[cm.end():].strip()
        except:
            pass
            
    # Extract Material & Movement from after_coords
    # Pattern: [Material] [Movement] [History]
    material = "Unknown"
    movement = "Slide"
    history = "NA"
    
    if after_coords:
        hist_match = re.search(r'\b(NA|\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{4}|Active)\b.*$', after_coords)
        if hist_match:
            history = hist_match.group(0).strip()
            mat_mov = after_coords[:hist_match.start()].strip()
        else:
            mat_mov = after_coords
            
        for mat in ["Debris cum earth", "Rock cum debris", "Rock cum Debris", "Debris", "Rock", "Earth", "Soil", "Debris/unconsolidated material"]:
            if mat.lower() in mat_mov.lower():
                material = mat
                break
        for mov in ["Slide and topple", "Debris slide and subsidence", "Slide", "Fall", "Topple", "Flow", "Subsidence"]:
            if mov.lower() in mat_mov.lower():
                movement = mov
                break

    # Extract Year from history
    year_match = re.search(r'\b(19\d\d|20\d\d)\b', history)
    year = int(year_match.group(1)) if year_match else None
    has_date = (history != "NA" and history != "")
    
    records.append({
        'sl_no': sl_no,
        'slide_no': slide_no,
        'state': state,
        'location_info': location_str,
        'latitude': lat,
        'longitude': lon,
        'material_involved': material,
        'movement_type': movement,
        'history_raw': history,
        'has_date': has_date,
        'year': year,
        'source_page': page_num
    })

df = pd.DataFrame(records)
print(f"Parsed DataFrame: {df.shape}")
print(f"Valid Coordinates: {df['latitude'].notna().sum()}")

# Clean CSV export
clean_csv_path = os.path.join(PROCESSED_DIR, "gsi_landslides_clean.csv")
df.to_csv(clean_csv_path, index=False)
print(f"Saved clean national inventory to {clean_csv_path}")

# Arunachal Pradesh Subset
df_ap = df[df['state'].str.lower() == 'arunachal pradesh'].copy()
ap_csv_path = os.path.join(PROCESSED_DIR, "arunachal_pradesh_landslides.csv")
df_ap.to_csv(ap_csv_path, index=False)
print(f"Saved {len(df_ap)} Arunachal Pradesh records to {ap_csv_path}")

# Export GeoJSON for GIS mapping
ap_valid = df_ap[df_ap['latitude'].notna() & df_ap['longitude'].notna()]
geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(row['longitude']), float(row['latitude'])]
            },
            "properties": {
                "sl_no": int(row['sl_no']),
                "slide_no": str(row['slide_no']),
                "state": str(row['state']),
                "location": str(row['location_info']),
                "material": str(row['material_involved']),
                "movement": str(row['movement_type']),
                "history": str(row['history_raw']),
                "year": int(row['year']) if pd.notna(row['year']) else None
            }
        }
        for _, row in ap_valid.iterrows()
    ]
}
geojson_path = os.path.join(PROCESSED_DIR, "arunachal_pradesh_landslides.geojson")
with open(geojson_path, "w", encoding="utf-8") as f:
    json.dump(geojson, f, indent=2)
print(f"Saved GeoJSON to {geojson_path}")
