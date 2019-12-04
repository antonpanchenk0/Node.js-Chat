const socket = io.connect("http://localhost:7777");
let chats = []; //Список чатов
let openChatValue = [
    {
        type: 'recipient',
        socketID: undefined,
        nickname: undefined,
        id: undefined
    },
    {
        type: 'sender',
        socketID: undefined,
        nickname: undefined,
        id: undefined
    },
]

setTimeout(()=>{
    const Session = {
        authorized_token: sessionStorage.getItem('authorized_token'),
        refresh_token: sessionStorage.getItem('refresh_token'),
        fingerprint: navigator.userAgent + navigator.language + new Date().getTimezoneOffset() + screen.height + screen.width + screen.colorDepth,
        socketID: socket.id,
    };

    if(Session.authorized_token != null){
        socket.emit('get_data_to_user_in_chat', Session);
    }
    else{
        window.location.assign('/login');
    }
}, 500)
/**
 * Компонент "окно настроек пользователя"
 * Принимает в себя текущее имя пользователя, никнейм, почту, и аватарку
 * @userName - имя пользователя
 * @userNickname - никнейм пользователя
 * @userEmail - электронная почта пользователя
 * @userAvatar - аватарка пользователя
 */
class Settings{
    constructor(userName, userNickName, userEmail, userAvatar){
        this.userName = userName;
        this.userNickname = userNickName;
        this.userEmail = userEmail;
        this.userAvatar = userAvatar;
        this.setSettings = this.setSettings.bind(this);
        this.render = this.render.bind(this);
    }
    setSettings(e){
        console.log(e);
    }
    render(){
        let settingsWindow = document.createElement('div');
        settingsWindow.classList.add('settings');
        settingsWindow.style.display = 'none';
        settingsWindow.innerHTML =
            `
             <div class="profile_settings">
                <div class="avatar_settings">
                    <img src="${this.userAvatar}" alt="${this.userNickname + 'Avatar'}">
                    <input type="file" class="avatar_load_btn" id="avatar_load_btn">
                    <label for="avatar_load_btn"><img src="./img/uploadIcon.png" alt="AvatarUpload" class="avatar_upload_img"></label>
                </div>
                <div class="text_settings">
                    <p class="input_settings_title">Имя пользователя <span>*</span></p>
                    <input type="text" class="user_name_settings" value="${this.userName}">
                    <p class="input_settings_title">Логин пользователя <span>*</span></p>
                    <input type="text" class="user_login_settings" value="${this.userNickname}">
                    <p class="input_settings_title">E-mail<span>*</span></p>
                    <input type="email" class="user_email_settings" value="${this.userEmail}">
                    <p class="input_settings_title">Текущий пароль <span>*</span></p>
                    <input type="password" class="user_password_now_settings">
                    <p class="input_settings_title">Новый пароль <span>*</span></p>
                    <input type="password" class="user_password_new_settings">
                    <p class="input_settings_title">Подтверите пароль <span>*</span></p>
                    <input type="password" class="user_password_confirm_new_settings">
                </div>
                <a href="#" class="close_settings_btn"><img src="./img/closeIcon.png" alt="CloseSettings"></a>
                <a href="#" class="save_settings_btn">Применить</a>
            </div>
            `;
        chatWindow.appendChild(settingsWindow);

        let sendData = document.querySelector('a.save_settings_btn'); //Кнопка отправки данных о смене настроек "Применить"
        sendData.addEventListener('click', function (e) {
            e.preventDefault();
            let data = {
                id: userData.id,
                socketID: socket.id,
                name: document.querySelector('input.user_name_settings').value,
                nickname: document.querySelector('input.user_login_settings').value,
                email: document.querySelector('input.user_email_settings').value,
                passwordNow: document.querySelector('input.user_password_now_settings').value,
                passwordNew: document.querySelector('input.user_password_new_settings').value,
                passwordConfirmNew: document.querySelector('input.user_password_confirm_new_settings').value,
            };
            socket.emit('change_settings', data);
            if(user.settingsWindowStatus && closeFlag){
                closeFlag = !closeFlag
                setTimeout(()=>{
                    chatWindow.removeChild(settingsWindow);
                    closeFlag = !closeFlag;
                    user.userSettingsClass = null;
                }, 550);
                user.settingsWindowStatus = false;
                $(settingsWindow).fadeOut(500);
            }
        })

        //Флаг времени закрытия натсроек
        let closeFlag = true;

        $(settingsWindow).fadeIn(500);

        user.settingsWindowStatus = true;

        //Событие закрытия окна настроек
        document.querySelector('.settings').addEventListener('click', function (e) {
            e.preventDefault();
            let _this = e.target;
            if(_this.parentNode.matches('.close_settings_btn') || _this.matches('img[alt=CloseSettings]') || _this.matches('.settings')){
                if(user.settingsWindowStatus && closeFlag){
                    closeFlag = !closeFlag
                    setTimeout(()=>{
                        chatWindow.removeChild(settingsWindow);
                        closeFlag = !closeFlag;
                        user.userSettingsClass = null;
                    }, 550);
                    user.settingsWindowStatus = false;
                    $(settingsWindow).fadeOut(500);
                }
            }
        })
    }
}
/**
 * Компонент "Результат поиска (Класс пользователя в поиске)"
 * Принимает в себя текущее ид пользователя, никнейм, аватар. Device - устройство с которого выполняется поиск
 * @u_id - id пользователя
 * @u_nickname - nickname пользователя
 * @u_avatar - avatar пользователя
 * @device - устройство с которого пользователь выполняет запрос [true - desktop, false - mobile]. С помощью данной переменной выбирается блок в котором будет происходить рендер
 * @status - статус чата, был ли добавлен этот чат в список чатов пользователя
 */
class SearchItem{
    constructor(u_id, u_nickname, u_avatar, device){
        this.u_id = u_id;
        this.u_nickname = u_nickname;
        this.u_avatar = u_avatar;
        this.device = device;
        this.status = false;
        this.addChat = this.addChat.bind(this);
        this.render = this.render.bind(this)
    }
    addChat(){
        let chatStatus = false; //Переменная проверки существования этого чата
        chats.forEach(element=>{
            if(element.name == this.u_nickname){
                chatStatus = true;
                return chatStatus;
            }
        })
        if(this.status == false && chatStatus == false) {
            let chatBox = document.querySelector('.chat_body .chat_list .chat_list_boxes');
            let chat_box = document.createElement('div');
            chat_box.classList.add('chat_box');
            chat_box.setAttribute('data-id', this.u_id);
            chat_box.innerHTML = `
                <div class="chat_icon">
                    <img src="${this.u_avatar}" alt="${this.u_nickname}Avatar">
                </div>
                <div class="chat_name">
                    <h2>${this.u_nickname}</h2>
                    <p><span class="sender">{UserSender}:</span>{LastMessage}</p>
                </div>
            `;
            chatBox.appendChild(chat_box);
            //Объект чата
            let chatObj = {
                class: this,
                id: this.u_id,
                name: this.u_nickname,
                avatar: this.u_avatar,
                socketID: null,
                messageGet:[],
            };
            chats.push(chatObj);
            this.status = true; //Смена статуса на то, что пользователь добавлен
            chat_box.addEventListener('click', function (e) {
                e.preventDefault();
                let chats = document.querySelectorAll('.chat_box');
                chats.forEach(elem=>{elem.classList.remove('active')});
                changeOpenChat(chatObj);
                chat_box.classList.add('active');
            })
        } else{
            return false;
        }
    }
    render(){
        let addChat = this.addChat; // для того чтобы не потерять this внутри EVENT
        let _this = this; // для того чтобы не потерять this внутри EVENT
        if(this.device){
            let windowToRender = document.querySelector('div.search_result_block[data-device=desktop] div.search_result');
            let result_item = document.createElement('div');
            result_item.classList.add('result_item');
            result_item.setAttribute('data-id', this.u_id)
            result_item.innerHTML = `
                <div class="user_res_avatar">
                    <img src="${this.u_avatar}" alt="${this.u_nickname}Avatar">
                </div>
                <div class="user_res_nickName">
                    <p>${this.u_nickname}</p>
                </div>
            `;
            result_item.addEventListener('click', function (e) {
                e.preventDefault();
                addChat();
                if(_this.status){
                    $('div.search_result_block[data-device=desktop]').fadeOut(500);
                }
            })
            windowToRender.appendChild(result_item);
            $('div.search_result_block[data-device=desktop]').fadeIn(500);
        }
        else{
            let windowToRender = document.querySelector('div.search_result_block[data-device=mobile] div.search_result');
            let result_item = document.createElement('div');
            result_item.classList.add('result_item');
            result_item.setAttribute('data-id', this.u_id)
            result_item.innerHTML = `
                <div class="user_res_avatar">
                    <img src="${this.u_avatar}" alt="${this.u_nickname}Avatar">
                </div>
                <div class="user_res_nickName">
                    <p>${this.u_nickname}</p>
                </div>
            `;
            result_item.addEventListener('click', function (e) {
                e.preventDefault();
                addChat(this);
                if(_this.status){
                    $('div.search_result_block[data-device=mobile]').fadeOut(500);
                }
                chatListStatus = false;
            })
            windowToRender.appendChild(result_item);
        }
    }
}

let userData = null;//Объект "Пользователь"

//Ошибка авторизации по токену
socket.on('get_session_error', data=>{
    sessionStorage.clear();
    window.location.assign('/login');
})

//Действия на ответ от сервра и получение авторизационных данных
socket.on('post_data_to_user_in_chat', (data)=>{
    userData = data;
    $('.user_login h2').text(data.login);
    $('.user_login p').text(`#${data.id}`);
    $('.user_avatar img').attr('src', data.avatar);
    $('#preloader').fadeOut(1000);
    socket.emit('socket_online', {userID: data.id, socketID: socket.id, status: 1})
})

//Действие клиента на ответ сервера на запрос поиска пользователей по ID
socket.on('search_by_id_response', (data)=>{
    //Desktop version
    if(document.querySelector('body').getBoundingClientRect().width > 576) {
        if (data.status) {
            let windowToRender = document.querySelector('div.search_result_block[data-device=desktop] div.search_result');
            windowToRender.innerHTML = '';
            data.data.forEach(item => {
                new SearchItem(item.id, item.login, item.avatar, true).render();
            })
        } else {
            let windowToRender = document.querySelector('div.search_result_block[data-device=desktop] div.search_result');
            windowToRender.innerHTML = '<h2 style="font-size: 24px; color: #ffffff; font-weight: bold; margin-top: 74px; text-align: center;">Ничего не найдено :(</h2>';
            $('div.search_result_block[data-device=desktop]').fadeIn(500);
        }
        searchOpenBtn.addEventListener('click', function (e) {
            e.preventDefault();
            $('div.search_result_block[data-device=desktop]').fadeOut(500);
        })
    }
    //Mobile version
    else{
        if (data.status) {
            let windowToRender = document.querySelector('div.search_result_block[data-device=mobile] div.search_result');
            windowToRender.innerHTML = '';
            data.data.forEach(item => {
                new SearchItem(item.id, item.login, item.avatar, false).render();
            })
        } else {
            let windowToRender = document.querySelector('div.search_result_block[data-device=mobile] div.search_result');
            windowToRender.innerHTML = '<h2 style="font-size: 16px; color: #ffffff; font-weight: bold; margin-top: 74px; text-align: center;">Ничего не найдено :(</h2>';
            $('div.search_result_block[data-device=mobile]').fadeIn(500);
            searchBlockStatus = true;
        }
    }
})

//Действие клиента на ответ сервера на запрос поиска пользователей по Login or Name
socket.on('search_by_login_or_name_response', (data)=>{
    //Desktop version
    if(document.querySelector('body').getBoundingClientRect().width > 576) {
        if (data.status) {
            let windowToRender = document.querySelector('div.search_result_block[data-device=desktop] div.search_result');
            windowToRender.innerHTML = '';
            data.data.forEach(item => {
                new SearchItem(item.id, item.login, item.avatar, true).render();
            })
        } else {
            let windowToRender = document.querySelector('div.search_result_block[data-device=desktop] div.search_result');
            windowToRender.innerHTML = '<h2 style="font-size: 16px; color: #ffffff; font-weight: bold; margin-top: 74px; text-align: center;">Ничего не найдено :(</h2>';
            $('div.search_result_block[data-device=desktop]').fadeIn(500);
        }
        searchOpenBtn.addEventListener('click', function (e) {
            e.preventDefault();
            $('div.search_result_block[data-device=desktop]').fadeOut(500);
        })
    }
    //Mobile version
    else{
        if (data.status) {
            let windowToRender = document.querySelector('div.search_result_block[data-device=mobile] div.search_result');
            windowToRender.innerHTML = '';
            data.data.forEach(item => {
                new SearchItem(item.id, item.login, item.avatar, false).render();
            })
        } else {
            let windowToRender = document.querySelector('div.search_result_block[data-device=mobile] div.search_result');
            windowToRender.innerHTML = '<h2 style="font-size: 16px; color: #ffffff; font-weight: bold; margin-top: 74px; text-align: center;">Ничего не найдено :(</h2>';
            $('div.search_result_block[data-device=mobile]').fadeIn(500);
            searchBlockStatus = true;
        }
    }
})

//Получение сообщения с сервера
socket.on('get_message', data=>{
    const {message, senderID, senderAvatar, senderNickname} = data;
    if(openChatValue[0].id == senderID){
        createMessage('sent_message_for_me', {avatar: senderAvatar, id:senderID, nickname: senderNickname}, message)
    } else {
        chats.forEach(elem => {
            if (elem.id == senderID) {
                elem.messageGet.push({type: 'get', message:message});
                console.log(chats);
                return true;
            }
        })
        if(document.querySelector('body').getBoundingClientRect().width > 576){
            new SearchItem(senderID, senderNickname, senderAvatar, true).addChat();
            chats.forEach(elem => {
                if (elem.id == senderID) {
                    elem.messageGet.push({type: 'get', message:message});
                    console.log(chats);
                    return true;
                }
            })
        }
        else{
            new SearchItem(senderID, senderNickname, senderAvatar, false).addChat()
        }
    }
})
/**
 * Главные объект описывающий окна пользователя
 * @type {{settingsWindowStatus: boolean, userSettingsClass: Class || Null}}
 */
let user = {
    settingsWindowStatus: false,
    userSettingsClass: null,
}
let chatWindow = document.querySelector('.chat_window');
let settingsBtn = document.getElementById('user_settings');
let exitBtn = document.getElementById('user_logout');
let searchInput = document.getElementById('search'); //desktop
let searchInputMobile = document.querySelector('.search_input_in_block'); //mobile
let sendMsgBtn = document.getElementById('send_message_btn');

sendMsgBtn.addEventListener('click', function (e) {
    e.preventDefault();
    let messageInput = document.querySelector('textarea#message');
    let data = {
        message: messageInput.value,
        recipientID: openChatValue[0].id,
        recipientName: openChatValue[0].nickname,
        senderSocketID: socket.id,
        senderID: userData.id
    }
    socket.emit('post_msg', data);
    chats.forEach(elem => {
        if (elem.id == openChatValue[0].id) {
            elem.messageGet.push({type: 'post', message: messageInput.value});
            console.log(chats);
            return true;
        }
    })

    createMessage('sent_message_from_me', {avatar: userData.avatar, id: userData.id, nickname: userData.name}, messageInput.value);
    messageInput.value = '';
})

//Собитые открытия окна настроек
settingsBtn.addEventListener('click', function (e) {
    e.preventDefault();
    let _this = e.target;
    _this = _this.parentNode;
    if(_this.matches('#user_settings') || _this.matches('img[alt=Settings]')){

        user.userSettingsClass = new Settings(userData.name, userData.login, userData.email, userData.avatar);

        user.userSettingsClass.render();
    }
})
//Событие для мобильных устройств
settingsBtn.addEventListener('touch', function (e) {
    e.preventDefault();
    let _this = e.target;
    _this = _this.parentNode;
    if(_this.matches('#user_settings') || _this.matches('img[alt=Settings]')){

        user.userSettingsClass = new Settings(userData.name, userData.login, userData.email, userData.avatar);

        user.userSettingsClass.render();
    }
})

//Событие выхода пользователя из аккаунта
exitBtn.addEventListener('click', function (e) {
    e.preventDefault();
    let _this = e.target;
    _this = _this.parentNode;
    if(_this.matches('#user_logout') || _this.matches('img[alt=Logout]')){
        sessionStorage.clear();
        location.reload();
    }
})

//Событие нажатия кнопки @Enter при вводе в меню поиска (поиск по ID либо логину)
searchInput.addEventListener('keydown', function (e) {
    if(e.keyCode == 13){
        let enterData = searchInput.value;
        enterData.split('');
        if(enterData[0] == '#'){
            socket.emit('go_search_by_userID', {searchValue: searchInput.value, socketID: socket.id});
            searchInput.value = '';
        } else{
            socket.emit('go_search_by_login_or_name', {searchValue: searchInput.value, socketID: socket.id});
            searchInput.value = '';
        }
    }
})
//Событие нажатия кнопки @Ввод при вводе в меню поиска (поиск по ID либо логину) на мобильных устрйствах
searchInputMobile.addEventListener('keydown', function (e) {
    if(e.keyCode == 13){
        let enterData = searchInputMobile.value;
        enterData.split('');
        if(enterData[0] == '#'){
            socket.emit('go_search_by_userID', {searchValue: searchInputMobile.value, socketID: socket.id});
            searchInputMobile.value = '';
        } else{
            socket.emit('go_search_by_login_or_name', {searchValue: searchInputMobile.value, socketID: socket.id});
            searchInputMobile.value = '';
        }
    }
})
/***
 * chatListBtn - кнопка откртия/закрытия списка чатов
 * chatListStatus - статис стиска чатов(открыт/закрыт)
 * chatListFlag - флаг списка чатов, доступно ли закрытие/открытие списка?
 * @type {Element}
 */
let chatListMenu = document.querySelector('.chat_list');
let chatListBtn = document.querySelector('.switch_block_btn');
let chatListStatus = false;
let chatListFlag = true;

//Функция закртыия списка чатов
changeMenu = (index) =>{
    chatListFlag = !chatListFlag;
    let positionNow = 0 - chatListMenu.getBoundingClientRect().width
    let position = null
    console.log(positionNow, position)
    $('.chat_list .overflow').fadeOut(500);
    let interval = setInterval(function () {
        if(position > positionNow){
            position+=6*index;
            chatListMenu.style.left = position+'px';
        }
        if(position <= positionNow){
            chatListFlag = !chatListFlag;
            chatListStatus = !chatListStatus;
            clearInterval(interval);
        }
    }, 15)
}

//Событие на кнопке
chatListBtn.addEventListener('click', function (e) {
    e.preventDefault();
    let _this = e.target;
    if(_this.matches('.switch_block_btn') && document.querySelector('body').getBoundingClientRect().width <= 992){
        if(chatListStatus == false && chatListFlag == true){
            chatListFlag = !chatListFlag;
            let position = chatListMenu.getBoundingClientRect().left;
            $('.chat_list .overflow').fadeIn(500);
            let interval = setInterval(function () {
                if(position < 0){
                    position+=6;
                    chatListMenu.style.left = position+'px';
                }
                if(position >= 0){
                    chatListFlag = !chatListFlag;
                    chatListStatus = !chatListStatus;
                    clearInterval(interval);
                }
            }, 15)
        }
        if(chatListStatus == true && chatListFlag == true){
            changeMenu(-1);
        }
    }
});

//Событие на Overflow блоке
document.querySelector('.chat_list .overflow').addEventListener('click', function (e) {
    let _this = e.target;
    if(_this.matches('.chat_list .overflow') && document.querySelector('body').getBoundingClientRect().width <= 992) {
        if(chatListStatus == true && chatListFlag == true){
            changeMenu(-1);
        }
    }
})
document.addEventListener('click', function (e) {
    let _this = e.target;
    if((_this.matches('.chat_box') || _this.parentNode.matches('.chat_box') || _this.parentNode.parentNode.matches('.chat_box')) && document.querySelector('body').getBoundingClientRect().width <= 992){
        changeMenu(-1);
    }
})

/**
 * searchOpenBtn - кнопка открытия поиска
 * searchBoxBlock - блок поиска
 * searchBlockStatus - статус блока поиска открыт/закрыт
 * searchBlockFlag - разрешено ли изменять блок? (открывать/закрывать)
 * @type {Element}
 */
let searchOpenBtn = document.querySelector('.search_box img');
let searchBoxBlock = document.querySelector('.search_result_block');
let searchBlockStatus = false;
let searchBlockFlag = true;
searchOpenBtn.addEventListener('click', function (e) {
    e.preventDefault();
    let _this = e.target;
    if(_this.matches('.search_box img') && document.querySelector('body').getBoundingClientRect().width <= 576){
        if(!searchBlockStatus && searchBlockFlag){
            searchBlockFlag = !searchBlockFlag;
            $(searchBoxBlock).fadeIn(500);
            setTimeout(()=>{searchBlockFlag = !searchBlockFlag}, 550)
            searchBlockStatus = !searchBlockStatus
        }
        if(searchBlockStatus && searchBlockFlag){
            searchBlockFlag = !searchBlockFlag;
            $(searchBoxBlock).fadeOut(500);
            setTimeout(()=>{searchBlockFlag = !searchBlockFlag}, 550)
            searchBlockStatus = !searchBlockStatus
        }
    }
})
/**
 * Функция смены активного чата
 * @chatData type: obj объект который описывает пользователя либо чат который должен будет открытся
 */
changeOpenChat = (chatData) =>{
    document.querySelector('.select_chat_window .chat_message_box .messages').innerHTML = ''
    openChatValue[0].nickname = chatData.name;
    openChatValue[0].socketID = chatData.socketID;
    openChatValue[0].id = chatData.id;
    openChatValue[1].socketID = socket.id;
    openChatValue[1].nickname = userData.name;
    openChatValue[1].id = userData.id;
    chats.forEach(item=>{
        if(item.id == openChatValue[0].id){
            if(item.messageGet.length != 0){
                item.messageGet.forEach(elem=>{
                    if(elem.type == 'get')
                        createMessage('sent_message_for_me', {avatar: chatData.avatar, id: chatData.id, nickname: chatData.name}, elem.message);
                    else if(elem.type == 'post')
                        createMessage('sent_message_from_me', {avatar: chatData.avatar, id: chatData.id, nickname: chatData.name}, elem.message);
                })
            }
        }
    })
    $('.write_message_box').fadeIn(250);
}

/**
 * Функция создания сообщей (DOM элементов)
 * @messageType type: string - Класс для блока сообщения, определяет сообщение получено от кого-то или же отправленное
 * @user type: obj - объект описывающий пользователя, который отправил сообщение
 * @message type: string - сообщение полученнное или отправленное пользователем
 */
createMessage = (messageType, user, message) =>{
    const {avatar, id, nickname} = user;
    let messages = document.querySelector('.select_chat_window .chat_message_box .messages');
    let sent_message = document.createElement('div');
    sent_message.classList.add('sent_message');
    sent_message.classList.add(messageType);
    sent_message.innerHTML =
        `
            <div class="avatar_sender" data-id="${id}" data-name="${nickname}">
                <a href="#"><img src="${avatar}" alt="${nickname}Avatar"></a>
            </div>
        `;
    let p = document.createElement('p');
    p.classList.add('messageValue');
    p.innerHTML = message;
    sent_message.appendChild(p);
    messages.appendChild(sent_message);
}