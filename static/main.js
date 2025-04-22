// static/main.js
function toggleTheme() {
    document.body.classList.toggle("light-mode");
    const themeIcon = document.getElementById("theme-icon");
    themeIcon.textContent = document.body.classList.contains("light-mode") ? "🌙" : "☀️";
}

let lastScrollTop = 0;
const navbar = document.querySelector("header");

window.addEventListener("scroll", () => {
    let scrollTop = window.scrollY;
    // Only hide navbar if scrolling down significantly and not near top
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        navbar.classList.add("hidden");
    } else {
        navbar.classList.remove("hidden");
    }
    lastScrollTop = scrollTop;
});

document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.querySelector(".btn.login");
    const signupBtn = document.querySelector(".btn.signup");

    if (loginBtn) {
        loginBtn.addEventListener("click", function () {
            window.location.href = "/login";
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener("click", function () {
            window.location.href = "/signup";
        });
    }

    // Update UI based on Flask session (passed via template)
    updateUI();
});

// Update UI based on Flask session data
function updateUI() {
    const userDataElement = document.getElementById("user-data");
    if (userDataElement) {
        const username = userDataElement.dataset.username;
        const jobRole = userDataElement.dataset.jobrole;

        if (username) {
            const navbarUser = document.getElementById("navbar-user");
            if (navbarUser) {
                navbarUser.innerHTML = `Welcome, ${username}`;
            }
            const loginSignup = document.getElementById("login-signup");
            const profileLogout = document.getElementById("profile-logout");
            if (loginSignup) loginSignup.style.display = "none";
            if (profileLogout) profileLogout.style.display = "flex";

            // Update job role display (if element exists)
            const selectedRole = document.getElementById("selected-role");
            if (selectedRole) selectedRole.innerText = jobRole || "Not specified";

            // Load personalized courses if on a page with courses
            if (jobRole && document.getElementById("courses-section")) {
                loadPersonalizedCourses(jobRole);
            }
        }
    }
}

// Load personalized courses (adjusted for existing endpoints)
function loadPersonalizedCourses(jobRole) {
    // Fetch role_id first, then skills, then courses
    fetch('/get_job_roles')
        .then(response => response.json())
        .then(data => {
            const role = data.job_roles.find(r => r.role_title === jobRole);
            if (role) {
                fetch(`/get_skills/${role.role_id}`)
                    .then(response => response.json())
                    .then(skills => {
                        if (skills.length > 0) {
                            fetch(`/get_courses/${skills[0].skill_id}`)
                                .then(response => response.json())
                                .then(courses => {
                                    let courseSection = document.getElementById("courses-section");
                                    if (courseSection) {
                                        courseSection.innerHTML = "";
                                        courses.forEach(course => {
                                            courseSection.innerHTML += `<div class="course-card">${course.course_name}</div>`;
                                        });
                                    }
                                });
                        }
                    });
            }
        })
        .catch(err => console.error("Error loading courses:", err));
}