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
app.get('/chat', (req, res) =>{
    res.render('chat')
})
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
                try {
                    io.sockets.sockets[data.socketID].emit('success_user_add', {res: res, err: err, userLogin: data.login})
                } catch (err) {
                    console.log('Server: Error send @success_user_add EVENT to socket with ID = ', data.socketID, '\nError: ', err)
                }
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
                try {
                    io.sockets.sockets[data.socketID].emit('check_login_result', {userStatus: userStatus});
                } catch (err) {
                    console.log('Server: Error send @check_login_result EVENT to socket with ID = ', data.socketID, '\nError: ', err)
                }
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
                try {
                    io.sockets.sockets[data.socketID].emit('authorization_response', responseObject);
                } catch (err) {
                    console.log('Server: Error send @authorization_response EVENT to socket with ID = ', data.socketID, '\nError: ', err)
                }
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
                                   postAuthorization: true,
                               };
                               try {
                                   io.sockets.sockets[data.socketID].emit('success_authorization_with_token', successAuthorizationWithTokenData);
                               } catch (err) {
                                   console.log('Server: Error send @success_authorization_with_token EVENT to socket with ID = ', data.socketID, '\nError: ', err);
                               }
                           }
                       })
                    }

                    /*тут должна быть авторизация если токен просрочен, но ее пока нет :(*/

                    //Если отпечатки не совпали
                    else{
                        console.log('Server: fingerprints false! Token are remove now!');
                        let id = res[0].id;
                        const removeTokensSQL = `UPDATE sessions SET authorized_token = 'null', refresh_token = 'null', fingerprint = 'null', create_time = '${+new Date().getTime()}' WHERE id = '${id}`;
                        connection.query(removeTokensSQL, (err, res)=>{
                            if(err) console.log('Server: Token remove Error', err);
                            else{
                                console.log('Server: Token remove success', res);
                                try {
                                    io.sockets.sockets[data.socketID].emit('error_authorization_with_token', {authorize: false});
                                } catch (err) {
                                    console.log('Server: Error send @error_authorization_with_token EVENT to socket with ID = ', data.socketID, '\nError: ', err)
                                }
                            }
                        })
                    }
                }
            }
        })
    })

    //Ответ сервер на запрос данных от клиента которому разрешен доступ в чат
    socket.on('get_data_to_user_in_chat', (data)=>{
        const connection = mysql.createConnection(dataBaseSettigns);
        const {authorized_token, refresh_token, fingerprint, socketID} = data;
        const getSessionSQL = `SELECT * FROM sessions WHERE authorized_token = '${authorized_token}' AND fingerprint = '${hashFingerprint(fingerprint)}'`;
        //Таймаут для того чтобы БД успела обновить данные
        setTimeout(()=>{
        connection.query(getSessionSQL, (err, res) =>{
            if(err) console.log('Server: User with authorized_token = ', authorized_token, 'and fingerprint = ', fingerprint, '. \nError:', err);
            else{
                if(res.length == 1){
                       let userID = res[0].user_id;
                       const getUserData = `SELECT * FROM users WHERE id = '${userID}'`;
                       connection.query(getUserData, (err, res)=>{
                           if(err) console.log(`Server: Error found user (SELECT * FROM users WHERE id = '${userID}'). Error:`, err);
                           else{
                                if(res.length == 1){
                                    let userData = {
                                        id: res[0].id,
                                        login: res[0].login,
                                        name: res[0].name,
                                        email: res[0].email,
                                        avatar: res[0].avatar,
                                    };
                                    try{
                                        io.sockets.sockets[socketID].emit('post_data_to_user_in_chat', userData);
                                    }catch (err) {
                                        console.log('Server: Error Send data to user with socketID = ', socketID);
                                    }
                                }
                                else{
                                    console.log('Server: UserData no found or More than one user was found. Error. Result = ', res);
                                    //Если серверу не удалось найти такого пользователя отправляем ошибку клиенту
                                    try {
                                        io.sockets.sockets[socketID].emit('get_data_error', {error: err, result: res});
                                    } catch (err) {
                                        console.log('Server: Error send @get_data_error EVENT to socket with ID = ', socketID,'\nError: ', err);
                                    }
                                }
                           }
                       })
                }
                else{
                    console.log('Server: UserSession no found or More than one user was found. Result = ', res);
                    //Если серверу не удалось найти такого пользователя отправляем ошибку клиенту
                    try {
                        io.sockets.sockets[socketID].emit('get_session_error', {error: err, result: res});
                    } catch (err) {
                        console.log('Server: Error send @get_session_error EVENT to socket with ID = ', socketID,'\nError: ', err);
                    }
                }
            }
        });
        },2000);
    })

    //Ответ сервера на запрос поиска пользователей по ID
    socket.on('go_search_by_userID', (data)=>{
        const {searchValue,socketID} = data;
        let id = searchValue.split('#');
        const sqlGetUserByID = `SELECT * FROM users WHERE id = '${id[1]}';`;
        const connection = mysql.createConnection(dataBaseSettigns);
        connection.query(sqlGetUserByID, (err, res)=>{
            if(err) console.log('Server: Error get user with id = ', searchValue, ' - ', id, 'in DataBase. ErrorLog: ', err);
            else{
                if(res.length == 1){
                    let dataToSend = {
                        status: true,
                        data: [
                            {
                                id: res[0].id,
                                login: res[0].login,
                                avatar: res[0].avatar
                            }
                        ]
                    }
                    try{
                        io.sockets.sockets[socketID].emit('search_by_id_response', dataToSend);
                    } catch (err) {
                        console.log('Server: Error send @search_by_id_response EVENT to client with socket = ', socketID, '! Error log: ', err);
                    }
                }
                else if(res.length == 0){
                    try{
                        io.sockets.sockets[socketID].emit('search_by_id_response', {status: false, data: null});
                    } catch (err) {
                        console.log('Server: Error send @search_by_id_response EVENT to client with socket = ', socketID, '!! Error log: ', err);
                    }
                }
                else{
                    console.log('Server: Error more than one user was found. Cancel send data to client!', res);
                }
            }
        })
    })

    //Ответ сервера на запрос поиска пользователей по login или name
    socket.on('go_search_by_login_or_name', data=>{
        const {searchValue,socketID} = data;
        const sqlGetUserByLogin = `SELECT * FROM users WHERE login = '${searchValue}' OR name = '${searchValue}';`;
        const connection = mysql.createConnection(dataBaseSettigns);
        connection.query(sqlGetUserByLogin, (err,res)=>{
            if(err) console.log('Server: Error get with login or name = ', searchValue, '. ErrorLog: ', err);
            else{
                if(res.length > 0){
                    let data = [];
                    res.forEach(elem=>{
                        data.push({id: elem.id, login: elem.login, avatar: elem.avatar})
                    })
                    let dataToSend = {
                        status: true,
                        data: data
                    }
                    try{
                        io.sockets.sockets[socketID].emit('search_by_login_or_name_response', dataToSend);
                    } catch (err) {
                        console.log('Server: Error send @search_by_login_or_name_response EVENT to client with socket = ', socketID, '! Error log: ', err);
                    }
                }
                else if(res.length == 0){
                    try{
                        io.sockets.sockets[socketID].emit('search_by_login_or_name_response', {status: false, data: null});
                    } catch (err) {
                        console.log('Server: Error send @search_by_login_or_name_response EVENT to client with socket = ', socketID, '!! Error log: ', err);
                    }
                }
                else{
                    console.log('Server: Search error. Cancel send data to client!', res);
                }
            }
        })
    })

    //Запись пользователя (что он онлайн)
    socket.on('socket_online', data=>{
        const connection = mysql.createConnection(dataBaseSettigns);
        const sqlSearchUser = `SELECT * FROM active_users WHERE user_id = '${data.userID}';`;
        connection.query(sqlSearchUser, (err,res)=>{
            if(err) console.log('Server: Error get user from active_users table where user_id = ', data.userID, '. ErrorLog: ', err);
            else{
                if(res.length == 1){
                    const sqlUpdateStatus = `UPDATE active_users SET user_socket_id = '${data.socketID}', status = '${data.status}' WHERE user_id = '${data.userID}';`
                    connection.query(sqlUpdateStatus, (err,res)=>{
                        if(err) console.log('Server: Error update user status with user_id = ', data.userID, '. ErrorLog: ', err);
                        else{
                            console.log('Server: Success update user status with user_id = ', data.userID, '. Result: ', res)
                        }
                    })
                }
                else if(res.length == 0){
                    let inputData = [data.userID, data.socketID, data.status]
                    const sqlWriteStatus = `INSERT INTO active_users(user_id, user_socket_id, status) VALUES (?,?,?);`;
                    connection.query(sqlWriteStatus, inputData, (err,res)=>{
                        if(err) console.log('Server: Error insert user status with user_id = ', data.userID, '. ErrorLog: ', err);
                        else{
                            console.log('Server: Success insert user status with user_id = ', data.userID, '. Result: ', res)
                        }
                    })
                }
            }
        })
    })

    //Обработка disconnect socket
    socket.on('disconnect', data=>{
        const connection = mysql.createConnection(dataBaseSettigns);
        const sql = `UPDATE active_users SET status = '0' WHERE user_socket_id = '${socket.id}';`;
        connection.query(sql, (err,res)=>{
            if(err) console.log('Server: Error update user status with user_socket_id = ', socket.id, '. ErrorLog: ', err);
            else{
                console.log('Server: Success update user status with user_socket_id = ', socket.id, '. Result: ', res)
            }
        })
    })

    //Обработка отправленных сообщений
    socket.on('post_msg', data=>{
        const {message, recipientID, recipientName, senderSocketID, senderID} = data;
        const connection = mysql.createConnection(dataBaseSettigns);
        let getSender = null;
        const sqlGetSender = `SELECT * FROM users WHERE id = '${senderID}';`;
        connection.query(sqlGetSender, (err,res)=>{
            if(err) console.log('Server: Error get senderData with id = ', senderID, '. ErrorLog: ', err);
            else{
                getSender = res;
                console.log('Server: Success get senderData with id = ', senderID, '. Result: ', res);
            }
        })
        const sql = `SELECT * FROM active_users WHERE user_id = '${recipientID}';`;
        connection.query(sql, (err, res)=>{
            if(err) console.log('Server: Error get recipient with user_id = ', recipientID, '. ErrorLog: ', err);
            else{
                if(res.length == 0){
                    //Если пользователь зарегистрирован но ни разу не был онлайн. Реализации в данных момент нет.
                    console.log('Server: Send message to offline people. No realize now. Result: ', res);
                }
                else if(res.length == 1){
                    let recipitentSocketID = res[0].user_socket_id;
                    let _data = {
                        message: message,
                        senderID: senderID,
                        senderAvatar: getSender[0].avatar,
                        senderNickname: getSender[0].login,
                    }
                    if(getSender != null){
                        try{
                            io.sockets.sockets[recipitentSocketID].emit('get_message', _data);
                        } catch (error) {
                            console.log('Server: Error send message to socket with id = ', recipitentSocketID, '. Error: ', error);
                        }
                    }
                }
                else{
                    //Если найдено более одного юзера(не возможно)
                    console.log('Server: Error more than one user was found. Message not send! Result: ', res);
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
            connection.end();
        }
        if(userTokenStatus == true){
            const sqlUpdate = `UPDATE sessions SET authorized_token = '${authorized_token}', refresh_token = '${refresh_token}', fingerprint = '${fingerprint}', create_time = '${+new Date().getTime()}' WHERE user_id = '${user_id}'`;
            connection.query(sqlUpdate, (err, res)=>{
                if(err) return console.log(' Server:Error update Session', err);
                else return console.log('Server: Session update Success', res);
            })
            connection.end();
        }
    }, 2000)
}