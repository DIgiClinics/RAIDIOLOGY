from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import dicom2nifti
import gzip
import shutil

app = Flask(__name__)
CORS(app, origins=["http://localhost:3005"])

DICOM_DIR = 'dicom'
NIFTY_DIR = 'nifti'

def get_first_nifti_file(folder):
    for f in os.listdir(folder):
        if f.endswith(".nii") or f.endswith(".nii.gz"):
            return f
    return None



@app.route('/generate_nifty', methods=['GET'])
def generate_nifty():
    doctor_name = request.args.get('doctorName')
    dataset_name = request.args.get('datasetName')

    dicom_path = os.path.join(DICOM_DIR, doctor_name, dataset_name)
    nifti_path = os.path.join(NIFTY_DIR, doctor_name, dataset_name)
    os.makedirs(nifti_path, exist_ok=True)

    # Look for .nii (not .nii.gz) — skip if already converted
    for file in os.listdir(nifti_path):
        if file.endswith(".nii"):
            return jsonify({"path": f"/nifti/{doctor_name}/{dataset_name}/{file}"}), 200

    try:
        # Convert to .nii.gz
        dicom2nifti.convert_directory(dicom_path, nifti_path, reorient=True)
        gz_file = get_first_nifti_file(nifti_path)
        if not gz_file or not gz_file.endswith(".nii.gz"):
            return jsonify({"error": "Conversion failed or no .nii.gz found"}), 500

        gz_path = os.path.join(nifti_path, gz_file)
        nii_file = gz_file.replace(".gz", "")
        nii_path = os.path.join(nifti_path, nii_file)

        # Decompress .nii.gz to .nii
        with gzip.open(gz_path, 'rb') as f_in:
            with open(nii_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)

        # Delete the .nii.gz file
        os.remove(gz_path)

        return jsonify({"path": f"/nifti/{doctor_name}/{dataset_name}/{nii_file}"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/nifti/<doctor>/<dataset>/<filename>')
def serve_nifti(doctor, dataset, filename):
    directory = os.path.join(NIFTY_DIR, doctor, dataset)
    return send_from_directory(directory, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5006)
