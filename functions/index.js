const { onRequest } = require("firebase-functions/v2/https");
const { getDatabase } = require("firebase-admin/database");
const admin = require("firebase-admin");
const { defineSecret } = require('firebase-functions/params');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

if (!admin.apps.length) {
  admin.initializeApp();
}

// Secrets are from google cloud secret manager
const tbaAuthKey = defineSecret('TBA_AUTH_KEY');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Get database reference
function getDbRef() {
  const db = getDatabase();
  return db.ref('s  couting-data');
}

// Routes
app.get('/get-data', async (req, res) => {
  try {
    const dbRef = getDbRef();
    const snapshot = await dbRef.once('value');
    const data = snapshot.val();

    if (!data) {
      return res.json({
        success: true,
        rows: [],
        count: 0
      });
    }

    const rows = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));

    res.json({
      success: true,
      rows: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data from database'
    });
  }
});

app.post('/submit-form', async (req, res) => {
  try {
    const formData = req.body;
    console.log('Form Data Received:', formData);

    const dbRef = getDbRef();
    
    const dataToSave = {
      ...formData,
      timestamp: admin.database.ServerValue.TIMESTAMP
    };

    const newRef = await dbRef.push(dataToSave);

    res.json({
      success: true,
      message: 'Data submitted successfully',
      id: newRef.key
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit data: ' + error
    });
  }
});

app.get('/get-api-data', async (req, res) => {
  try {
    const formData = req.get("url");
    const url = `https://www.thebluealliance.com/api/v3/${formData}`;
    
    const response = await axios.get(url, {
      headers: {
        "X-TBA-Auth-Key": tbaAuthKey.value()
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching API data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API data'
    });
  }
});

exports.api = onRequest(
  {
    secrets: [tbaAuthKey],
    cors: true
  },
  app
);