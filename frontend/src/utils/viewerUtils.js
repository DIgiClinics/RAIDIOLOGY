// File: src/utils/viewerUtils.js
import axios from 'axios';

const BASE = process.env.REACT_APP_DataServer;

export async function fetchDatasetImages(doctorName, datasetName) {
  try {
    const res = await axios.get(`${BASE}/getFolderContents`, {
      params: { doctorName, datasetName },
    });

    return res.data
      .filter((f) => f.name.toLowerCase().endsWith(".dcm"))
      .map((f) => ({
        name: f.name,
        url: `${BASE}/getFile?doctorName=${doctorName}&datasetName=${datasetName}&fileName=${f.name}`,
      }));
  } catch (err) {
    console.error("Error fetching dataset images:", err?.response?.data || err.message);
    return [];
  }
}

export function saveAnnotations(datasetId, data) {
  localStorage.setItem(`annotations_${datasetId}`, JSON.stringify(data));
}

export function loadAnnotations(datasetId) {
  try {
    const item = localStorage.getItem(`annotations_${datasetId}`);
    return item ? JSON.parse(item) : [];
  } catch (err) {
    console.error("Failed to load annotations:", err);
    return [];
  }
}
