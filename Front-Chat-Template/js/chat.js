/**
 * Главные объект описывающий пользователя
 * @type {{settingsWindowStatus: boolean, userSettingsClass: Class || Null}}
 */
let user = {
    settingsWindowStatus: false,
    userSettingsClass: null,
}
let chatWindow = document.querySelector('.chat_window');
let settingsBtn = document.getElementById('user_settings');

/**
 * Компонент "окно настроек пользователя"
 * Принимает в себя текущее имя пользователя, никнейм, почту, и аватарку
 */
class Settings{
    constructor(userName, userNickName, userEmail, userAvatar){
        this.userName = userName;
        this.userNickname = userNickName;
        this.userEmail = userEmail;
        this.userAvatar = userAvatar;
        this.render = this.render.bind(this);
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

//Собитые открытия окна настроек
settingsBtn.addEventListener('click', function (e) {
    e.preventDefault();
    let _this = e.target;
    _this = _this.parentNode;
    if(_this.matches('#user_settings') || _this.matches('img[alt=Settings]')){

        user.userSettingsClass = new Settings('Anton', 'apanchenko', 'dasdsadsadsa@dsadasdas.dsadsa', './img/testIconImg.jpg');

        user.userSettingsClass.render();
    }
})
//Событие для мобильных устройств
settingsBtn.addEventListener('touch', function (e) {
    e.preventDefault();
    let _this = e.target;
    _this = _this.parentNode;
    if(_this.matches('#user_settings') || _this.matches('img[alt=Settings]')){

        user.userSettingsClass = new Settings('Anton', 'apanchenko', 'dasdsadsadsa@dsadasdas.dsadsa', './img/testIconImg.jpg');

        user.userSettingsClass.render();
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