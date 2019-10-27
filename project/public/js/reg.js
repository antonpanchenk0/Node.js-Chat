document.getElementById('btn_create_account').addEventListener('click', e =>{
    e.preventDefault();
    let data = {
        name: document.getElementById('user_name').value,
        login: document.getElementById('user_login').value,
        email: document.getElementById('user_email').value,
        password: document.getElementById('user_email').value,
        passwordConfirm: document.getElementById('user_password_confirm').value,
    };

})