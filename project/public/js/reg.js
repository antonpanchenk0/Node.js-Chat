const socket = io.connect("http://localhost:7777");

console.log(socket)
const userDataInputs = {
    name: document.getElementById('user_name'),
    login: document.getElementById('user_login'),
    email: document.getElementById('user_email'),
    passwd: document.getElementById('user_password'),
    passwdConfirm: document.getElementById('user_password_confirm')
};

const regExps = {
    name: /^[a-zA-Zа-яА-ЯёЁ'][a-zA-Z-а-яА-ЯёЁ' ]+[a-zA-Zа-яА-ЯёЁ']?$/ui,
    login: /^[a-z]+([-_]?[a-z0-9]+){0,2}$/i,
    email: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
};

const send = document.getElementById('btn_create_account')
const redirectToLoginPageBtn = document.getElementById('go_login')

send.addEventListener('click', function (e) {
    e.preventDefault();
    if(!userDataInputs.name.value.match(regExps.name)){
        return console.error('Invalid Name');
    }
    if(!userDataInputs.login.value.match(regExps.login)){
        return console.error('Invalid login');
    }
    if(userDataInputs.passwd.value == '' || userDataInputs.passwdConfirm.value != userDataInputs.passwd.value){
        return console.error('Invalid Password')
    }
    let data = {
        socketID: socket.id,
        name: userDataInputs.name.value,
        login: userDataInputs.login.value,
        email: userDataInputs.email.value,
        passwd: userDataInputs.passwd.value,
    }
    socket.emit('new_user', data);
})