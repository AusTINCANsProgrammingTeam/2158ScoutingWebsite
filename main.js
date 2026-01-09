require('dotenv').config()
const express = require('express')
const cors = require('cors')
const googleSpreadSheet =  require('google-spreadsheet');
const googleAuth = require('google-auth-library');
var sheet;

// Initialize auth - see https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication
const serviceAccountAuth = new googleAuth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.split(String.raw`\n`).join('\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const spreadsheetID = "1hcPBLxfMX96H9hnk4zUM-RcUNW2Z7F41BXxGBHHbvHE";
const doc = new googleSpreadSheet.GoogleSpreadsheet(spreadsheetID, serviceAccountAuth);

async function load() {
  await doc.loadInfo();
  sheet = doc.sheetsById[1209408590]
}

load();


// const bootstrap = require('bootstrap')
const app = express()
const port = 3000

app.use(express.static('src'))
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.sendFile('src/index.html', {root: __dirname })
})

app.get('/data', (req, res) => {
    res.sendFile('src/data.html', {root: __dirname })
})

app.get('/get-data', async (req, res) => {
  try {
    await sheet.loadCells();
    const rows = await sheet.getRows();
    
    const data = rows.map(row => {
      const rowData = {};
      sheet.headerValues.forEach(header => {
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
})

app.post('/submit-form', (req, res) => {
  const formData = req.body;
  console.log('Form Data Received:', formData);
  
  sheet.addRow(formData);
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})