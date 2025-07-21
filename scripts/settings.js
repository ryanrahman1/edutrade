const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', () => {
    if (user && user.email) {
        const emailInput = document.getElementById('emailVal');
        if (emailInput) emailInput.value = user.email;
    }
});

async function setUsername() {
    const setuser = document.getElementById('setuser');
    if (!setuser || !setuser.value.trim()) return;

    const newuser = setuser.value.trim();

    const toSend = {
        email: user.email,
        newUsername: newuser
    };

    try {
        const res = await fetch("http://localhost:3000/api/profile/username", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(toSend),
        });

        if (!res.ok) {
            console.error("Failed to update username");
        } else {
            console.log("Username updated");
            alert(`username updated to ${newuser}!`)
            
            user.username = newuser;
            localStorage.setItem('user', JSON.stringify(user));
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }

}
