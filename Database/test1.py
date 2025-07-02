import tarfile
import os
from datetime import datetime

folder = "/home/kmit/Documents/RAIDIOLOGY/Database/dicom/dcm_data/sample"
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
output_tar_path = os.path.join(folder, f"{timestamp}.tar.gz")

with tarfile.open(output_tar_path, "w:gz") as tar:
    for file in sorted(os.listdir(folder)):
        if file.endswith(".dcm"):
            tar.add(os.path.join(folder, file), arcname=file)

print(f"Archive created at: {output_tar_path}")
