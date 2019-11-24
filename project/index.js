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
            if(err) console.log('Server: User add error (new_user)\n', err);
            else {
                console.log('Server: User add success\n', res);
                io.sockets.sockets[data.socketID].emit('success_user_add', {res: res, err: err, userLogin: data.login})
            }
        })
        connection.end();
    })

    //Ответ сервера на запрос всех существующих логинов
    socket.on('check_login', (data)=>{
        const connection = mysql.createConnection(dataBaseSettigns)
        const sql = 'SELECT login from users';
        connection.query(sql, (err, res, fields)=>{
            if(err) console.log('Server: Check login fail\n', err);
            else{
                let result = res.filter(elem => {return elem.login == data.login});
                let userStatus = null;
                if(result.length == 0)
                    userStatus = true;
                else
                    userStatus = false;
                console.log('Server: Check login success\n', res);
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
            if(err) console.log('Server: Authorization error', err)
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
                    writeNewSession({user_id: res[0].id, authorized_token: authorizeToken, refresh_token: refreshToken, fingerprint: fingerprint, create_time: +new Date().getTime()});
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
    //Ответ сервера на запрос авторизации по токену
    socket.on('authorization_with_token', (data)=>{
        const {fingerprint, authorized_token, refresh_token, socketID} = data; //Деструктуризации даты
        const connection = mysql.createConnection(dataBaseSettigns); // Создание соеденения с базой
        const getUserSQL = `SELECT * from sessions WHERE authorized_token = '${authorized_token}';`;
        connection.query(getUserSQL, (err, res)=>{
            if(err) console.log('Server: Error get user with authorize token:' + authorized_token + '\n', err);
            else{
                console.log('Server: Success get user with authorize token:' + authorized_token + '\n', res);
                //Если сушествует пользователь с таким токеном
                if(res.length != 0){
                    //Если отпечатки совпадают
                    if(hashFingerprint(fingerprint) === res[0].fingerprint){
                       const getUserDataSQL = `SELECT * from users WHERE id = '${res[0].user_id}'`; //Получаем информацию о пользователе с полученым ИД
                       connection.query(getUserDataSQL, (err, res)=>{
                           if(err) console.log('Server: Error get userData after check token and fingerprint\n', err);
                           else{
                               console.log('Server: Success get userData after check token and fingerprint\n', res);
                               let successAuthorizationWithTokenData = { //Объект для отправки клиенту который запросил авторизацию по токену
                                   login: res[0].login,
                                   name: res[0].name,
                                   email: res[0].email,
                                   avatar: res[0].avatar,
                               };
                                io.sockets.sockets[data.socketID].emit('success_authorization_with_token', successAuthorizationWithTokenData);
                           }
                       })
                    }

                    /*тут должна быть авторизация если токен просрочен, но ее пока нет :(*/

                    //Если отпечатки не совпали
                    else{
                        console.log('Server: fingerprints false! Token are remove now!');
                        let id = res[0].id;
                        const removeTokensSQL = `UPDATE sessions SET authorized_token = 'null', refresh_token = 'null',fingerprint = 'null' create_time = '${+new Date().getTime()}' WHERE id = '${id}`;
                        connection.query(removeTokensSQL, (err, res)=>{
                            if(err) console.log('Server: Token remove Error', err);
                            else{
                                console.log('Server: Token remove success', res);
                                io.sockets.sockets[data.socketID].emit('error_authorization_with_token', {authorize: false});
                            }
                        })
                    }
                }
            }
        })
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
    console.log('Server: Session write/update')
    const connection = mysql.createConnection(dataBaseSettigns); //Подключение к базе
    const {user_id, authorized_token, refresh_token, fingerprint, create_time} = data; //Деструктризации даты
    const putData = [user_id, authorized_token, refresh_token, fingerprint, create_time]; //Создание массива данных для отправки в базу
    const _sql = 'SELECT * FROM sessions'; //Запрос на вывод всех сессий в базе
    let userTokenStatus = false; //Статус существования сессии
    //Вытягиваем все сессии из базы и проверяем существует ли сессия для пользователя
    connection.query(_sql, (err, res)=>{
        if(err) console.log('Server: SELECT * FROM sessions ERROR', err);
        else{
            res.forEach(elem=>{
                if(elem.user_id == user_id){
                    userTokenStatus = true;
                }
            })
        }
    })
    //Через время производим действия запили новой сессии или обновления старой
    setTimeout(()=>{
        if(userTokenStatus == false){
            const sqlAdd = `INSERT INTO sessions (user_id, authorized_token, refresh_token, fingerprint, create_time) VALUES (?,?,?,?,?);`;
            connection.query(sqlAdd, putData, (err, res)=>{
                if(err) return console.log('Server: Error add Session', err);
                else return console.log('Server: New Session add', res);
            })
        }
        if(userTokenStatus == true){
            const sqlUpdate = `UPDATE sessions SET authorized_token = '${authorized_token}', refresh_token = '${refresh_token}',fingerprint = '${fingerprint}' create_time = '${+new Date().getTime()}' WHERE user_id = '${user_id}'`;
            connection.query(sqlUpdate, (err, res)=>{
                if(err) return console.log(' Server:Error update Session', err);
                else return console.log('Server: Session update Success', res);
            })
        }
    }, 2000)
}