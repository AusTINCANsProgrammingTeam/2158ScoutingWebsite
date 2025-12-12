require('dotenv').config()
const express = require('express')
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

app.get('/', (req, res) => {
    res.sendFile('src/index.html', {root: __dirname })
})

app.listen(port, () => {
    console.log("webber")
})

app.post('/submit-form', (req, res) => {
  const formData = req.body;
  console.log('Form Data Received:', formData);
  res.send(`Registration successful for ${formData.name}!`);
  
  sheet.addRow(formData);
})