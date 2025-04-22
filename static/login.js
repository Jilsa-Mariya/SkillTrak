// Switch between Login & Signup
function switchForm(formType) {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.remove('active');
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    if (formType === 'login') {
        document.getElementById('login-form').classList.add('active');
        document.querySelector('.tabs .tab:nth-child(1)').classList.add('active');
    } else {
        document.getElementById('signup-form').classList.add('active');
        document.querySelector('.tabs .tab:nth-child(2)').classList.add('active');
    }
}

// Toggle Password Visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    field.type = field.type === "password" ? "text" : "password";
}
