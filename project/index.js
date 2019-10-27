const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
const port = 7777;
const server = app.listen(port);

app.get('/', (req, res)=>{
    res.render('index.ejs');
})
app.get('/registration', (req, res)=>{
    res.render('registration.ejs');
})
