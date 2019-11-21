const express = require('express')
const app = express()
app.set('view engine', 'ejs');
app.use(express.static('public'))
const port = 7777
const server = app.listen(port)
const io = require('socket.io')(server)
const md5 = require('md5')
const mysql = require('mysql2')
const dataBaseSettigns = {
    host: 'localhost',
    user: 'root',
    database: 'dimpola',
    password: '',
}
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
        const connection = mysql.createConnection(dataBaseSettigns)
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
        const connection = mysql.createConnection(dataBaseSettigns)
        const sql = 'SELECT login from users';
        connection.query(sql, (err, res, fields)=>{
            if(err) console.log(err)
            else{
                let result = res.filter(elem => {return elem.login == data.login});
                let userStatus = null;
                if(result.length == 0)
                    userStatus = true;
                else
                    userStatus = false;
                io.sockets.sockets[data.socketID].emit('check_login_result', {userStatus: userStatus});
            }
        })
        connection.end();
    })

    //Ответ сервера на запрос авторизации
    socket.on('authorization', (data)=>{
        const connection = mysql.createConnection(dataBaseSettigns)
        const sql = `SELECT * from users WHERE login = '${data.login}'`;
        connection.query(sql,(err,res,fields)=>{
            if(err) console.log(err)
            else{
                let authorizationStatus = null;
                let hashReceivedPasswd = readyHashPassword(data.password, res[0].soult);
                if(res[0].password == hashReceivedPasswd)
                    authorizationStatus = true;
                else
                    authorizationStatus = false;
                io.sockets.sockets[data.socketID].emit('authorization_response', {authorizationStatus: authorizationStatus});
                console.log('Complete');
                console.log(res);
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

/**
 * Функция хеширования пароля для проверки
 * @param password
 * @param soult
 */
readyHashPassword = (password, soult) =>{
    let passwd = password.split('');
    passwd.splice(3,0,soult);
    passwd = passwd.join('');
    passwd = md5(passwd);
    return passwd
}