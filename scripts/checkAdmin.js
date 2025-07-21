window.addEventListener('DOMContentLoaded', async () => {
    async function checkAdmin() {
        try {
            const user = localStorage.getItem('user');
            const email = user ? JSON.parse(user).username : null;
            if (!email) return false;

            const res = await fetch(`http://localhost:3000/api/profile?username=${encodeURIComponent(email)}`);
            if (!res.ok) throw new Error('Failed to fetch profile');
            const data = await res.json();
            return data.profile.is_admin;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    const adminBtn = document.querySelector('.admin-btn');
    const isAdmin = await checkAdmin();

    if (isAdmin) {
        adminBtn.classList.remove('hidden');
        //set display as blcok
        adminBtn.style.display = 'block';
        adminBtn.addEventListener('click', () => {
            window.location.href = '/web/admin/';
        });
    } else {
        // set display as none
        adminBtn.style.display = 'none';
        adminBtn.classList.add('hidden');
    }
});