import dicom2nifti
import os

# Input and output directories
dicom_folder = "dicom/dcm_data/sample"
output_folder = "nifti"

# Ensure output folder exists
os.makedirs(output_folder, exist_ok=True)

# Optional: if your DICOMs are all in a flat folder (not nested series), use this
output_file = os.path.join(output_folder, "converted.nii.gz")
dicom2nifti.convert_directory(dicom_folder, output_folder, reorient=True)
print("✅ Conversion done. NIfTI saved to:", output_folder)
