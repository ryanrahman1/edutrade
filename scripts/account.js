//username filter
let bannedWords = [];

async function loadBannedWords() {
  try {
    const res = await fetch('/web/scripts/curses.txt'); // adjust path
    const text = await res.text();
    bannedWords = text.split('\n').map(w => w.trim()).filter(Boolean);
  } catch (err) {
    console.error('Failed to load banned words:', err);
    bannedWords = [];
  }
}

function containsBannedWord(username) {
  const lowerUsername = username.toLowerCase();
  return bannedWords.some(word => lowerUsername.includes(word));
}
loadBannedWords();



document.addEventListener('DOMContentLoaded', () => {
  const loggedinStylesheet = document.getElementById('loggedin-style');
  const authStylesheet = document.getElementById('auth-style');
  const accountContent = document.getElementById('account-content');

  function renderLoggedIn(user) {
    authStylesheet.disabled = true;
    loggedinStylesheet.disabled = false;
    accountContent.innerHTML = `
      <div class="loggedin-container">
        <h2>Welcome back, ${user.username}!</h2>
        <div class="user-info card">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Username:</strong> ${user.username}</p>
        </div>
        <button id="logout-btn" class="auth-form button logout-btn">Log Out</button>
      </div>
    `;
    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('user');
      loadAuthForms();
    });
  }

  function loadAuthForms() {
    loggedinStylesheet.disabled = true;
    authStylesheet.disabled = false;

    accountContent.innerHTML = `
      <div class="auth-container" id="auth-container">
        <h2 id="form-title">Sign In to EduTrade</h2>
        <form class="auth-form" id="login-form">
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
        <p class="subtle" style="text-align:center;">
          Don't have an account?
          <span id="toggle-to-signup" style="color: var(--accent); cursor: pointer; font-weight: 600;">Sign up</span>
        </p>
      </div>
    `;

    document.getElementById('toggle-to-signup').addEventListener('click', renderSignupForm);

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const email = formData.get('email');
      const plainPassword = formData.get('password');

/*    REPLACE WITH ENDPOINT  
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
*/

      
      if (error || !user) {
        alert('Login failed: user not found');
        return;
      }

      // Verify password using backend
      const res = await fetch('http://localhost:3000/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: plainPassword,
          hash: user.password_hash
        })
      });
      const result = await res.json();

      if (!result.match) {
        alert('Login failed: wrong password');
        return;
      }

      const loggedInUser = {
        email: user.email,
        username: user.username,
        created_at: user.created_at,
        bio: user.bio
      };
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      renderLoggedIn(loggedInUser);
    });
  }

  function renderSignupForm() {
    accountContent.innerHTML = `
      <div class="auth-container" id="auth-container">
        <h2 id="form-title">Create an Account</h2>
        <form class="auth-form" id="signup-form">
          <input type="text" name="username" placeholder="Username" required />
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Sign Up</button>
        </form>
        <p class="subtle" style="text-align:center;">
          Already have an account?
          <span id="toggle-to-login" style="color: var(--accent); cursor: pointer; font-weight: 600;">Log in</span>
        </p>
      </div>
    `;

    document.getElementById('toggle-to-login').addEventListener('click', loadAuthForms);

    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const username = formData.get('username');
      if (containsBannedWord(username)) {
        alert('Username contains banned words. Please choose a different username.');
        return;
      }
      const email = formData.get('email');
      const plainPassword = formData.get('password');

      // Send password to backend to get hashed
      const res = await fetch('http://localhost:3000/api/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: plainPassword })
      });
      const result = await res.json();

      if (!result.hash) {
        alert('Signup failed: hashing failed');
        return;
      }
/* REPLACE WITH ENDPOINT
      const { data, error } = await supabase
        .from('users')
        .insert([{ username, email, password_hash: result.hash }]);

      if (error) {
        alert('Signup failed: ' + error.message);
        return;
      }
*/

      const newUser = { email, username };
      localStorage.setItem('user', JSON.stringify(newUser));
      renderLoggedIn(newUser);
    });
  }

  function loadAccountPage() {
    const user = JSON.parse(localStorage.getItem('user'));
    user ? renderLoggedIn(user) : loadAuthForms();
  }

  loadAccountPage();
});