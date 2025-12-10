const express = require('express')
// const bootstrap = require('bootstrap')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.sendFile('src/index.html', {root: __dirname })
})

app.listen(port, () => {
    console.log("webber")
})