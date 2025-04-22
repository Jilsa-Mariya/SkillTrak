document.addEventListener("DOMContentLoaded", function () {
    const counters = document.querySelectorAll(".counter");
    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute("data-target");
            const count = +counter.innerText;
            const increment = target / 100;
            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(updateCount, 30);
            } else {
                counter.innerText = target;
            }
        };
        updateCount();
    });

    const jobroleList = document.querySelector(".jobrole-list");
    const jobRoleButtons = document.querySelectorAll(".jobrole-btn");
    const leftBtn = document.querySelector(".left-btn");
    const rightBtn = document.querySelector(".right-btn");
    const searchInput = document.querySelector("#jobrole-search");
    const buttonWidth = jobRoleButtons.length > 0 ? jobRoleButtons[0].offsetWidth + 10 : 0;
    const visibleButtons = 5;
    let currentPosition = 0;
    let maxPosition = Math.ceil(jobRoleButtons.length / visibleButtons) - 1;

    function updateArrowButtons() {
        leftBtn.disabled = currentPosition === 0;
        rightBtn.disabled = currentPosition === maxPosition;
        leftBtn.style.opacity = currentPosition === 0 ? '0.3' : '1';
        rightBtn.style.opacity = currentPosition === maxPosition ? '0.3' : '1';
    }

    updateArrowButtons();

    leftBtn?.addEventListener("click", () => {
        if (currentPosition > 0) {
            currentPosition--;
            jobroleList.scrollTo({
                left: currentPosition * buttonWidth * visibleButtons,
                behavior: "smooth"
            });
            updateArrowButtons();
        }
    });

    rightBtn?.addEventListener("click", () => {
        if (currentPosition < maxPosition) {
            currentPosition++;
            jobroleList.scrollTo({
                left: currentPosition * buttonWidth * visibleButtons,
                behavior: "smooth"
            });
            updateArrowButtons();
        }
    });

    // Search functionality for job roles
    searchInput?.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase();
        let visibleButtonCount = 0;

        jobRoleButtons.forEach(button => {
            const roleTitle = button.textContent.toLowerCase();
            if (roleTitle.includes(searchTerm)) {
                button.style.display = "block";
                visibleButtonCount++;
            } else {
                button.style.display = "none";
            }
        });

        // Update maxPosition based on visible buttons
        maxPosition = Math.ceil(visibleButtonCount / visibleButtons) - 1;
        if (currentPosition > maxPosition) {
            currentPosition = maxPosition;
            jobroleList.scrollTo({
                left: currentPosition * buttonWidth * visibleButtons,
                behavior: "smooth"
            });
        }
        updateArrowButtons();
    });

    document.querySelector(".jobrole-list").addEventListener("click", (event) => {
        const button = event.target.closest(".jobrole-btn");
        if (button) {
            const roleId = button.dataset.role;
            console.log(`Fetching skills and roadmap for roleId: ${roleId}`);
            document.querySelectorAll(".jobrole-btn").forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            showSkillsForRole(roleId);
            showRoadmapForRole(roleId);
        }
    });

    if (jobRoleButtons.length > 0) {
        const firstRoleId = jobRoleButtons[0].dataset.role;
        console.log(`Setting default roleId: ${firstRoleId}`);
        jobRoleButtons[0].classList.add("active");
        showSkillsForRole(firstRoleId);
        showRoadmapForRole(firstRoleId);
    }
});

function showSkillsForRole(roleId) {
    fetch(`/get_skills/${roleId}`)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to fetch skills: ${response.status} ${response.statusText}`);
            return response.json();
        })
        .then(skills => {
            console.log(`Skills for role ${roleId}:`, skills);
            displaySkills(skills);
        })
        .catch(error => {
            console.error("Error fetching skills for roleId", roleId, ":", error);
            document.getElementById("skills-container").innerHTML = `<p>Error loading skills: ${error.message}. Please try again later.</p>`;
        });
}

function displaySkills(skills) {
    const skillsContainer = document.getElementById("skills-container");
    skillsContainer.innerHTML = "";

    if (skills.length === 0) {
        skillsContainer.innerHTML = "<p>No skills found for this job role.</p>";
        return;
    }

    skills.forEach(skill => {
        const skillSection = document.createElement("div");
        skillSection.className = "skill-section";
        skillsContainer.appendChild(skillSection);

        fetch(`/get_courses/${skill.skill_id}`)
            .then(response => {
                console.log(`Fetching courses for skill_id: ${skill.skill_id}`);
                if (!response.ok) throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`);
                return response.json();
            })
            .then(courses => {
                console.log(`Courses for skill ${skill.skill_id}:`, courses);
                displayCourses(courses, skillSection);
            })
            .catch(error => {
                console.error(`Error fetching courses for skill ${skill.skill_id}:`, error);
                skillSection.innerHTML = `<p>Error loading courses for this skill: ${error.message}</p>`;
            });
    });
}

function displayCourses(courses, skillSection) {
    if (courses.length === 0) {
        skillSection.innerHTML = "<p>No courses available for this skill.</p>";
        return;
    }

    courses.forEach(course => {
        const courseCard = document.createElement("div");
        courseCard.className = "course-card";
        courseCard.innerHTML = `
            <div class="course-title">${course.course_name}</div>
            <div class="course-cost">Cost: $${course.cost || "N/A"}</div>
            <div class="course-description">${course.description || "No description available"}</div>
        `;
        courseCard.style.cursor = "pointer";
        courseCard.addEventListener("click", () => {
            if (course.url) {
                window.open(course.url, "_blank");
            } else {
                console.error(`No URL found for course: ${course.course_name}`);
            }
        });
        skillSection.appendChild(courseCard);
    });
}

function showRoadmapForRole(roleId) {
    fetch(`/get_roadmap/${roleId}`)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to fetch roadmap: ${response.status} ${response.statusText}`);
            return response.json();
        })
        .then(roadmap => {
            console.log(`Roadmap for role ${roleId}:`, roadmap);
            displayRoadmap(roadmap);
        })
        .catch(error => {
            console.error("Error fetching roadmap for roleId", roleId, ":", error);
            document.getElementById("roadmap-steps").innerHTML = `<p>Error loading roadmap: ${error.message}. Please try again later.</p>`;
        });
}

function displayRoadmap(roadmap) {
    const roadmapContainer = document.getElementById("roadmap-steps");
    roadmapContainer.innerHTML = "";

    if (roadmap.length === 0) {
        roadmapContainer.innerHTML = "<p>No roadmap available for this role.</p>";
        return;
    }

    // Create a wrapper for the entire roadmap
    const roadmapWrapper = document.createElement("div");
    roadmapWrapper.className = "roadmap-wrapper";

    // Create the line
    const roadmapLine = document.createElement("div");
    roadmapLine.className = "roadmap-line";

    // Create a container for the steps (markers + step boxes)
    const stepsContainer = document.createElement("div");
    stepsContainer.className = "roadmap-steps";

    roadmap.forEach(step => {
        // Create a container for each step (marker + connecting line + step box)
        const stepUnit = document.createElement("div");
        stepUnit.className = `step-unit step-${step.step_number}`;

        // Create marker
        const marker = document.createElement("div");
        marker.className = "roadmap-marker";
        marker.innerHTML = step.step_number;
        stepUnit.appendChild(marker);

        // Create step box
        const stepElement = document.createElement("div");
        stepElement.className = "roadmap-step";
        stepElement.innerHTML = `
            <div class="step-content">
                <h3>${step.step_title}</h3>
                <p>${step.step_description}</p>
            </div>
        `;
        stepUnit.appendChild(stepElement);

        stepsContainer.appendChild(stepUnit);
    });

    roadmapWrapper.appendChild(roadmapLine);
    roadmapWrapper.appendChild(stepsContainer);
    roadmapContainer.appendChild(roadmapWrapper);
}
