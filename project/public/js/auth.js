const socket = io.connect("http://localhost:7777");

console.log(socket)

document.querySelector('a.close-notification').addEventListener('click', function (e) {
    e.preventDefault();
    let _this = e.target;
    if(_this.matches('a.close-notification')){
        $(_this.parentNode).fadeOut(500);
    }
})

/**
 * Объект который хранит в себе все поля для ввода информации пользователем
 * @type {{passwd: HTMLElement, name: HTMLElement, passwdConfirm: HTMLElement, login: HTMLElement, email: HTMLElement}}
 */
const userDataInputs = {
    login: document.getElementById('user_login'),
    password: document.getElementById('user_password'),
}

const loginBtn = document.getElementById('btn_login'); //Кнопка авторизации

//Собтие запроса авторизации
loginBtn.addEventListener('click', function (e) {
    e.preventDefault();
    let fingerprint = navigator.userAgent + navigator.language + new Date().getTimezoneOffset() + screen.height + screen.width + screen.colorDepth;
    let data = {
        socketID: socket.id,
        login: userDataInputs.login.value,
        password: userDataInputs.password.value,
        fingerprint: fingerprint,
    }
    socket.emit('authorization', data);
})

//Действия на ответ сервера об доступе авторизации
socket.on('authorization_response', (data)=>{
    if(data.authorizationStatus){
        console.log('authorize')
        console.log(data)
        if(data.authorizationStatus){
            sessionStorage.setItem('authorized_token', data.authorized_token);
            sessionStorage.setItem('refresh_token', data.refresh_token);
        }
    }
    else{
        errorMessage('Authorize Fail', 'Ошибка авторизации. Проверьте правильность введенных данных.');
    }
})
/**
 *Функции уведомление о ошибке введенных данных
 * @param title
 * @param message
 */
errorMessage = (title, message) =>{
    document.querySelector('div.notification h2').innerText = title;
    document.querySelector('div.notification p').innerText = message;
    document.querySelector('div.notification').classList.remove('green');
    document.querySelector('div.notification').classList.add('red');
    $('div.notification').fadeIn(500);
    setTimeout(()=>{$('div.notification').fadeOut(500);}, 3000);
}