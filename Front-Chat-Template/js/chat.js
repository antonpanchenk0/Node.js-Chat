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