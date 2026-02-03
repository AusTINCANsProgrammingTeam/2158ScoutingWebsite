const { onRequest } = require("firebase-functions/v2/https");
const { getDatabase, getDatabaseWithUrl } = require("firebase-admin/database");
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
const databaseURL = defineSecret('DATABASE_URL');


const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.get('/get-data', async (req, res) => {
  try {
    const dbRef = getDatabaseWithUrl(databaseURL.value());
    const ref = req.get("ref");
    dbRef.ref(ref).get().then((snapshot) => {
      if (snapshot.exists()) {
        return res.json({
          success: true,
          data: snapshot.val()
        });
      } else {
        console.log("No data available");
        return res.json({
          success: false,
          error: 'No data available'
        });
      }
    })
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
    const ref = req.get("ref");
    console.log('Form Data Received:', formData);

    const dataToSave = {
      ...formData,
      timestamp: admin.database.ServerValue.TIMESTAMP
    };

    const newRef = await getDatabaseWithUrl(databaseURL.value()).ref(ref).push(dataToSave);

    res.json({
      success: true,
      message: 'Data submitted successfully',
      id: newRef.key
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit data'
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
    secrets: [tbaAuthKey, databaseURL],
    cors: true
  },
  app
);