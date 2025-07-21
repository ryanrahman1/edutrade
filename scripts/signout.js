document.addEventListener('DOMContentLoaded', async => {
    const signoutA = document.getElementById('dropdownsignout');
    signoutA.onclick = function() {
        localStorage.removeItem('user');

        window.location.href = "/web/pages/account/"
    }
});

