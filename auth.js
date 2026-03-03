// =======================================
// REGISTER USER
// =======================================

async function registerUser() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Email and password required!");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    const { error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        alert(error.message);
        return;
    }

    alert("Registration successful! Please login.");
    window.location.href = "login.html";
}



// =======================================
// LOGIN USER
// =======================================

async function loginUser() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Email and password required!");
        return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert(error.message);
        return;
    }

    // Redirect after login
    window.location.href = "upload.html";
}



// =======================================
// LOGOUT USER
// =======================================

async function logoutUser() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
}



// =======================================
// PROTECT PAGE
// =======================================

async function protectPage() {

    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        window.location.href = "login.html";
    }
}