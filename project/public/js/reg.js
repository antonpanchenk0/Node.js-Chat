const socket = io.connect("http://localhost:7777");

console.log(socket)
/**
 * Событие закрытия уведомления
 */
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
    name: document.getElementById('user_name'),
    login: document.getElementById('user_login'),
    email: document.getElementById('user_email'),
    passwd: document.getElementById('user_password'),
    passwdConfirm: document.getElementById('user_password_confirm')
};

/**
 * Регулярные выражения для валидации введенных данных пользователем
 * @type {{name: RegExp, login: RegExp, email: RegExp}}
 */
const regExps = {
    name: /^[a-zA-Zа-яА-ЯёЁ'][a-zA-Z-а-яА-ЯёЁ' ]+[a-zA-Zа-яА-ЯёЁ']?$/ui,
    login: /^[a-z]+([-_]?[a-z0-9]+){0,2}$/i,
    email: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
};

const send = document.getElementById('btn_create_account') //Кнопка отправки данных

/**
 * Событие зодания нового пользователя
 */
send.addEventListener('click', function (e) {
    e.preventDefault();
    //Валидация имени
    if(!userDataInputs.name.value.match(regExps.name)){
        return errorMessage('Error: Invalid Name', 'Имя не может содержать цифры, или символы. Проверьте правильность имени еще раз.')
    }
    //Валидация логина
    if(!userDataInputs.login.value.match(regExps.login)){
        return errorMessage('Error: Invalid Login', 'Не правильный формат логина либо он уже занят. Проверьте правильность имени еще раз.')
    }
    //Валидация почты
    if(!userDataInputs.email.value.match(regExps.email)){
        return errorMessage('Error: Invalid E-mail', 'Не правильный формат почты либо она уже используется. Проверьте правильность имени еще раз.')
    }
    //Проверка правильности паролей
    if(userDataInputs.passwd.value == '' || userDataInputs.passwdConfirm.value != userDataInputs.passwd.value){
        return errorMessage('Error: Invalid Password', 'Пароли не совпадают. Проверьте правильность имени еще раз.')
    }

    let staticLogin = userDataInputs.login.value; //Перменная для избежания подмены лоина во время ответа сервера

    socket.emit('check_login', {login: userDataInputs.login.value, socketID: socket.id}); //Запрос всех существубщих логинов с сервера
    //Действия в ответ сервера. Обработка логина #2
    socket.on('check_login_result', data=>{
        //Если логина не существует создаем объект пользователя и отправляем на севрер
        if(data.userStatus){
            let data = {
                socketID: socket.id,
                name: userDataInputs.name.value,
                login: userDataInputs.login.value,
                email: userDataInputs.email.value,
                passwd: userDataInputs.passwd.value,
            }
            socket.emit('new_user', data);
            userDataInputs.name.value = '';
            userDataInputs.login.value = '';
            userDataInputs.email.value = '';
            userDataInputs.passwd.value = '';
            userDataInputs.passwdConfirm.value = '';
        }
        else{
            return errorMessage('Error: Invalid Login', 'Не правильный формат логина либо он уже занят. Проверьте правильность имени еще раз.')
        }
    })
})

/**
 * Функции уведомление о ошибке либо о успешном заверщенном действии
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
successMessage = (title, message) =>{
    document.querySelector('div.notification h2').innerText = title;
    document.querySelector('div.notification p').innerText = message;
    document.querySelector('div.notification').classList.remove('red');
    document.querySelector('div.notification').classList.add('green');
    $('div.notification').fadeIn(500);
    setTimeout(()=>{$('div.notification').fadeOut(500);}, 3000);
}

socket.on('success_user_add', (data)=>{
    successMessage('Success', `Пользователь ${data.userLogin} успешно создан`)
})