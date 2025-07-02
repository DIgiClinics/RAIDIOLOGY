from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import dicom2nifti
import gzip
import shutil
import json
import uuid

app = Flask(__name__)
CORS(app, origins=["http://localhost:3005"])

DICOM_DIR = 'dicom'
NIFTI_DIR = 'nifti'
META_FILE = os.path.join(NIFTI_DIR, 'meta', 'meta.json')

os.makedirs(os.path.dirname(META_FILE), exist_ok=True)
if not os.path.exists(META_FILE):
    with open(META_FILE, 'w') as f:
        json.dump([], f)

def get_first_nifti_file(folder):
    for f in os.listdir(folder):
        if f.endswith(".nii") or f.endswith(".nii.gz"):
            return f
    return None

def append_meta(doctor, dataset, filename):
    with open(META_FILE, 'r+') as f:
        data = json.load(f)
        entry = {
            "doctorName": doctor,
            "datasetName": dataset,
            "fileName": filename
        }
        if not any(e["fileName"] == filename for e in data):
            data.append(entry)
            f.seek(0)
            json.dump(data, f, indent=2)
            f.truncate()

# 🧊 UNTOUCHED ORIGINAL .nii DECOMPRESSION ROUTE — PRESERVED
# @app.route('/generate_nifty', methods=['GET'])
# def generate_nifty():
#     doctor_name = request.args.get('doctorName')
#     dataset_name = request.args.get('datasetName')
#
#     dicom_path = os.path.join(DICOM_DIR, doctor_name, dataset_name)
#     nifti_path = os.path.join(NIFTI_DIR, doctor_name, dataset_name)
#     os.makedirs(nifti_path, exist_ok=True)
#
#     # Look for .nii (not .nii.gz) — skip if already converted
#     for file in os.listdir(nifti_path):
#         if file.endswith(".nii"):
#             return jsonify({"path": f"/nifti/{doctor_name}/{dataset_name}/{file}"}), 200
#
#     try:
#         dicom2nifti.convert_directory(dicom_path, nifti_path, reorient=True)
#         gz_file = get_first_nifti_file(nifti_path)
#         if not gz_file or not gz_file.endswith(".nii.gz"):
#             return jsonify({"error": "Conversion failed or no .nii.gz found"}), 500
#
#         gz_path = os.path.join(nifti_path, gz_file)
#         nii_file = gz_file.replace(".gz", "")
#         nii_path = os.path.join(nifti_path, nii_file)
#
#         with gzip.open(gz_path, 'rb') as f_in:
#             with open(nii_path, 'wb') as f_out:
#                 shutil.copyfileobj(f_in, f_out)
#
#         os.remove(gz_path)
#
#         return jsonify({"path": f"/nifti/{doctor_name}/{dataset_name}/{nii_file}"}), 200
#
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# 🟢 ACTIVE: Flat saving for Papaya-compatible access
@app.route('/generate_nifty', methods=['GET'])
def generate_nifty_flat():
    doctor_name = request.args.get('doctorName')
    dataset_name = request.args.get('datasetName')

    # Step 1: Check meta.json
    with open(META_FILE, 'r') as f:
        meta = json.load(f)

    for entry in meta:
        if entry["doctorName"] == doctor_name and entry["datasetName"] == dataset_name:
            return jsonify({"path": f"/nifti/{entry['fileName']}"}), 200

    # Step 2: Convert if not already in meta
    dicom_path = os.path.join(DICOM_DIR, doctor_name, dataset_name)
    temp_output_path = os.path.join(NIFTI_DIR, "temp")
    os.makedirs(temp_output_path, exist_ok=True)

    try:
        dicom2nifti.convert_directory(dicom_path, temp_output_path, reorient=True)
        gz_file = get_first_nifti_file(temp_output_path)
        if not gz_file or not gz_file.endswith(".nii.gz"):
            return jsonify({"error": "Conversion failed or no .nii.gz found"}), 500

        src_path = os.path.join(temp_output_path, gz_file)
        dst_path = os.path.join(NIFTI_DIR, gz_file)

        # Move without renaming
        shutil.move(src_path, dst_path)
        shutil.rmtree(temp_output_path, ignore_errors=True)

        # Add to meta
        append_meta(doctor_name, dataset_name, gz_file)

        return jsonify({"path": f"/nifti/{gz_file}"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/get_nifti_by_doctor_dataset', methods=['GET'])
def get_nifti_by_doctor_dataset():
    doctor_name = request.args.get('doctorName')
    dataset_name = request.args.get('datasetName')

    if not doctor_name or not dataset_name:
        return jsonify({"error": "doctorName and datasetName are required"}), 400

    with open(META_FILE, 'r') as f:
        data = json.load(f)

    for entry in data:
        if entry["doctorName"] == doctor_name and entry["datasetName"] == dataset_name:
            return jsonify(entry), 200

    return jsonify({"error": "No matching file found"}), 404

    return jsonify({"error": "File not found in metadata"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5006)
