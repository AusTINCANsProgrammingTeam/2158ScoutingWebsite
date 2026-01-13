const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require('firebase-functions/params');
const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const axios = require('axios');

// Define secrets
const googleServiceAccountEmail = defineSecret('GOOGLE_SERVICE_ACCOUNT_EMAIL');
const googlePrivateKey = defineSecret('GOOGLE_PRIVATE_KEY');
const tbaAuthKey = defineSecret('TBA_AUTH_KEY');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Google Sheets auth (will be set up in the route handlers)
let serviceAccountAuth;
function getAuth() {
  if (!serviceAccountAuth) {
    serviceAccountAuth = new JWT({
      email: googleServiceAccountEmail.value(),
      key: googlePrivateKey.value().replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }
  return serviceAccountAuth;
}

const spreadsheetID = "1hcPBLxfMX96H9hnk4zUM-RcUNW2Z7F41BXxGBHHbvHE";
let sheet;

// Initialize sheet
async function initSheet() {
  if (!sheet) {
    const doc = new GoogleSpreadsheet(spreadsheetID, getAuth());
    await doc.loadInfo();
    sheet = doc.sheetsById[1209408590];
  }
  return sheet;
}

// Routes
app.get('/get-data', async (req, res) => {
  try {
    const currentSheet = await initSheet();
    await currentSheet.loadCells();
    const rows = await currentSheet.getRows();

    const data = rows.map(row => {
      const rowData = {};
      currentSheet.headerValues.forEach(header => {
        rowData[header] = row.get(header) || '';
      });
      return rowData;
    });

    res.json({
      success: true,
      rows: data,
      count: data.length
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data from spreadsheet'
    });
  }
});

app.post('/submit-form', async (req, res) => {
  try {
    const formData = req.body;
    console.log('Form Data Received:', formData);

    const currentSheet = await initSheet();
    await currentSheet.addRow(formData);

    res.json({
      success: true,
      message: 'Data submitted successfully'
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

// Export the Express app as a Firebase Function with secrets
exports.api = onRequest(
  {
    secrets: [googleServiceAccountEmail, googlePrivateKey, tbaAuthKey],
    cors: true
  },
  app
);