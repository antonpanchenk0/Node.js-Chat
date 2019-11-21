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