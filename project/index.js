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

app.get('/login', (req, res) =>{
    res.render('login')
})

app.get('/registration', (req, res) =>{
    res.render('registration')
})

io.on('connection', (socket)=>{
    //Ответ сервера на запрос о создании нового пользователя
    socket.on('new_user', (data)=>{
        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            database: 'dimpola',
            password: '',
        })
        let hash = hashPassword(data.passwd);
        const user = [data.login, data.name, data.email, hash.passwd, hash.soult];
        const sql = 'INSERT INTO users(login, name, email, password, soult) VALUES(?,?,?,?,?)';
        connection.query(sql, user, function (err, res) {
            if(err) console.log(err)
            else io.sockets.sockets[data.socketID].emit('success_user_add', {res: res, err: err, userLogin: data.login})
        })
        connection.end();
    })

    //Ответ сервера на запрос всех существующих логинов
    socket.on('check_login', (data)=>{
        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            database: 'dimpola',
            password: '',
        })
        const sql = 'SELECT login from users';
        connection.query(sql, (err, res, fields)=>{
            if(err) console.log(err)
            else{
                let resault = res.filter(elem => {return elem.login == data.login});
                let userStatus = null;
                if(resault.length == 0)
                    userStatus = true;
                else
                    userStatus = false;
                io.sockets.sockets[data.socketID].emit('check_login_result', {userStatus: userStatus});
            }
        })
        connection.end();
    })
})

/**
 * Функция хеширования пароля
 * @param password
 * @returns {{passwd: (*|string[]), soult: number}}
 */
hashPassword = (password) =>{
    let soult = +new Date();
    let passwd = password.split('');
    passwd.splice(3,0,soult);
    passwd = passwd.join('');
    passwd = md5(passwd);
    return {passwd: passwd, soult: soult};
}