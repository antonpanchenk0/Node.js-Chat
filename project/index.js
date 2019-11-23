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
        const connection = mysql.createConnection(dataBaseSettigns);
        const sql = `SELECT * from users WHERE login = '${data.login}'`;
        connection.query(sql,(err,res,fields)=>{
            if(err) console.log(err)
            else{
                let authorizationStatus = null;
                let getSoult = (res.length != 0) ? res[0].soult : null;
                let getPassword = (res.length != 0) ? res[0].password : null;
                let hashReceivedPasswd = readyHashPassword(data.password, getSoult);
                let responseObject = null;
                if(getPassword == hashReceivedPasswd){
                    authorizationStatus = true;
                    let authorizeToken = md5(+new Date()*Math.random() + Math.random());
                    let refreshToken = md5(+new Date()*Math.random()*4 + Math.random())
                    let fingerprint = hashFingerprint(data.fingerprint);
                    responseObject = {
                        authorizationStatus: authorizationStatus,
                        refreshToken: refreshToken,
                        authorizeToken: authorizeToken,
                    }
                    writeNewSession({user_id: res[0].id, authorized_token: authorizeToken, refresh_token: refreshToken, create_time: +new Date().getTime()});
                }
                else{
                    authorizationStatus = false;
                    responseObject = {
                        authorizationStatus: authorizationStatus,
                        refreshToken: undefined,
                        authorizeToken: undefined,
                    }
                }
                io.sockets.sockets[data.socketID].emit('authorization_response', responseObject);
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
/**
 * Функция хеширования слепка браузера
 * @param fingerprint
 */
hashFingerprint = (fingerprint) =>{
    let hash = md5(md5(fingerprint));
    return hash;
}
/**
 * Функция записи данных в БД о новой сессии или обновление данных о существубщей
 * @param data
 */
writeNewSession = (data) =>{
    console.log('Write new session')
    const connection = mysql.createConnection(dataBaseSettigns); //Подключение к базе
    const {user_id, authorized_token, refresh_token, create_time} = data; //Деструктризации даты
    const putData = [user_id, authorized_token, refresh_token, create_time]; //Создание массива данных для отправки в базу
    const _sql = 'SELECT * FROM sessions'; //Запрос на вывод всех сессий в базе
    let userTokenStatus = false; //Статус существования сессии
    //Вытягиваем все сессии из базы и проверяем существует ли сессия для пользователя
    connection.query(_sql, (err, res)=>{
        if(err) console.log(err)
        else{
            res.forEach(elem=>{
                if(elem.user_id == data.user_id){
                    userTokenStatus = true;
                }
            })
        }
    })
    //Через время производим действия запили новой сессии или обновления старой
    setTimeout(()=>{
        if(userTokenStatus == false){
            const sqlAdd = `INSERT INTO sessions (user_id, authorized_token, refresh_token, create_time) VALUES (?,?,?,?);`;
            connection.query(sqlAdd, putData, (err, res)=>{
                if(err) return console.log('Error add Session', err);
                else return console.log('New Session add', res);
            })
        }
        if(userTokenStatus == true){
            const sqlUpdate = `UPDATE sessions SET authorized_token = '${authorized_token}', refresh_token = '${refresh_token}', create_time = '${+new Date().getTime()}' WHERE user_id = '${user_id}'`;
            connection.query(sqlUpdate, (err, res)=>{
                if(err) return console.log('Error update Session', err);
                else return console.log('Session Update Success', res);
            })
        }
    }, 2000)
}