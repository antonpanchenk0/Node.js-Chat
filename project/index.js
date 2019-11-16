const express = require('express')
const app = express()
app.set('view engine', 'ejs');
app.use(express.static('public'))
const port = 7777
const server = app.listen(port)
const io = require('socket.io')(server)
const md5 = require('md5')
const mysql = require('mysql2')

app.get('/', (req, res) =>{
    res.render('registration')
})

io.on('connection', (socket)=>{
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'dimpola',
        password: '',
    })
    socket.on('new_user', (data)=>{
        console.log('Create New User');
        let hash = hashPassword(data.passwd);
        const user = [data.login, data.name, data.email, hash.passwd, hash.soult];
        const sql = 'INSERT INTO users(login, name, email, password, soult) VALUES(?,?,?,?,?)';
        connection.query(sql, user, function (err, res) {
            if(err) console.log(err)
            else console.log('User add')
        })
    })
})

hashPassword = (password) =>{
    let soult = +new Date();
    let passwd = password.split('');
    passwd.splice(3,0,soult);
    passwd = passwd.join('');
    passwd = md5(passwd);
    return {passwd: passwd, soult: soult};
}