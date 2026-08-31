import os
import glob
import netCDF4
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "files for hackathon")

class IMDRainfallExtractor:
    def __init__(self, raw_dir=RAW_DIR):
        self.raw_dir = raw_dir
        self.datasets = {}
        self.lats = None
        self.lons = None
        self._init_metadata()

    def _init_metadata(self):
        sample_file = os.path.join(self.raw_dir, "RF25_ind2000_rfp25.nc")
        if os.path.exists(sample_file):
            with netCDF4.Dataset(sample_file, 'r') as ds:
                self.lats = np.array(ds.variables['LATITUDE'][:])
                self.lons = np.array(ds.variables['LONGITUDE'][:])

    def get_lat_lon_idx(self, lat, lon):
        lat_idx = np.argmin(np.abs(self.lats - lat))
        lon_idx = np.argmin(np.abs(self.lons - lon))
        return lat_idx, lon_idx

    def get_rainfall_for_date(self, lat, lon, date_str):
        """
        Query rainfall on a specific date (YYYY-MM-DD) and compute rolling sums (1d, 3d, 7d, 30d).
        """
        dt = datetime.strptime(date_str, "%Y-%m-%d") if isinstance(date_str, str) else date_str
        year = dt.year
        nc_file = os.path.join(self.raw_dir, f"RF25_ind{year}_rfp25.nc")
        if not os.path.exists(nc_file):
            return None

        lat_idx, lon_idx = self.get_lat_lon_idx(lat, lon)
        day_of_year = dt.timetuple().tm_yday - 1  # 0-indexed

        with netCDF4.Dataset(nc_file, 'r') as ds:
            rf_arr = ds.variables['RAINFALL'][:, lat_idx, lon_idx]
            # handle missing value -999.0
            rf_arr = np.where(rf_arr == -999.0, 0.0, rf_arr)
            rf_arr = np.nan_to_num(rf_arr, nan=0.0)

            # 1-day
            r_1d = float(rf_arr[day_of_year]) if day_of_year < len(rf_arr) else 0.0

            # For 3d, 7d, 30d:
            # We may need values from preceding year if day_of_year < 30
            if day_of_year >= 30:
                r_3d = float(np.sum(rf_arr[day_of_year-2 : day_of_year+1]))
                r_7d = float(np.sum(rf_arr[day_of_year-6 : day_of_year+1]))
                r_30d = float(np.sum(rf_arr[day_of_year-29 : day_of_year+1]))
            else:
                # fetch previous year tail if needed
                prev_nc = os.path.join(self.raw_dir, f"RF25_ind{year-1}_rfp25.nc")
                if os.path.exists(prev_nc):
                    with netCDF4.Dataset(prev_nc, 'r') as prev_ds:
                        prev_rf = prev_ds.variables['RAINFALL'][:, lat_idx, lon_idx]
                        prev_rf = np.where(prev_rf == -999.0, 0.0, prev_rf)
                        full_tail = np.concatenate([prev_rf, rf_arr])
                        current_idx = len(prev_rf) + day_of_year
                        r_3d = float(np.sum(full_tail[current_idx-2 : current_idx+1]))
                        r_7d = float(np.sum(full_tail[current_idx-6 : current_idx+1]))
                        r_30d = float(np.sum(full_tail[current_idx-29 : current_idx+1]))
                else:
                    start_idx = max(0, day_of_year - 2)
                    r_3d = float(np.sum(rf_arr[start_idx : day_of_year+1]))
                    start_idx = max(0, day_of_year - 6)
                    r_7d = float(np.sum(rf_arr[start_idx : day_of_year+1]))
                    start_idx = max(0, day_of_year - 29)
                    r_30d = float(np.sum(rf_arr[start_idx : day_of_year+1]))

            return {
                "rainfall_1_day": max(0.0, r_1d),
                "rainfall_3_day": max(0.0, r_3d),
                "rainfall_7_day": max(0.0, r_7d),
                "rainfall_30_day": max(0.0, r_30d)
            }

if __name__ == "__main__":
    extractor = IMDRainfallExtractor()
    test_lat, test_lon = 28.16, 95.45  # East Siang, Arunachal Pradesh
    test_date = "2020-07-15"  # Peak monsoon date
    res = extractor.get_rainfall_for_date(test_lat, test_lon, test_date)
    print(f"Test Query for ({test_lat}, {test_lon}) on {test_date}:")
    print(res)
