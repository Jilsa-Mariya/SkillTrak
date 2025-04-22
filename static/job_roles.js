// static/job_roles.js
document.addEventListener("DOMContentLoaded", function () {
    const searchBar = document.getElementById('search-bar');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const jobRoles = document.querySelectorAll('.job-role');
    const jobDetails = document.getElementById('job-details');

    // Search functionality
    searchBar.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        jobRoles.forEach(role => {
            const roleTitle = role.textContent.trim().toLowerCase();
            const categoryId = role.dataset.categoryId;
            const categoryName = document.querySelector(`.category-btn[data-category-id="${categoryId}"]`).textContent.toLowerCase();
            role.style.display = (roleTitle.includes(query) || categoryName.includes(query)) ? 'block' : 'none';
        });
    });

    // Category filter
    categoryButtons.forEach(button => {
        button.addEventListener('click', function () {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const categoryId = this.dataset.categoryId;
            jobRoles.forEach(role => {
                role.style.display = (role.dataset.categoryId === categoryId) ? 'block' : 'none';
            });
            jobDetails.style.display = 'none'; // Hide details when switching categories
        });
    });

    // Job role details
    jobRoles.forEach(role => {
        role.addEventListener('click', function () {
            const roleId = this.dataset.roleId;
            fetch('/get_job_roles')
                .then(response => response.json())
                .then(data => {
                    const job = data.job_roles.find(j => j.role_id == roleId);
                    if (!job) throw new Error('Job role not found');

                    Promise.all([
                        fetch(`/get_skills/${roleId}`).then(res => res.json()).catch(() => []),
                        fetch(`/get_courses/${roleId}`).then(res => res.json()).catch(() => []),
                        fetch(`/get_roadmap/${roleId}`).then(res => res.json()).catch(() => [])
                    ]).then(([skills, courses, roadmap]) => {
                        jobDetails.innerHTML = `
                            <h2>${job.role_title}</h2>
                            <p><strong>Description:</strong> ${job.description || 'Not available'}</p>
                            <p><strong>Industry:</strong> ${job.industry || 'Not specified'}</p>
                            <p><strong>Average Salary:</strong> ₹${job.salary_package ? job.salary_package.toLocaleString() : 'N/A'}</p>
                            <div class="roadmap">
                                <h3>Roadmap</h3>
                                ${roadmap.length ? `
                                    <div class="roadmap-container">
                                        ${roadmap.map(step => `
                                            <div class="roadmap-step">
                                                <span class="step-number">${step.step_number}</span>
                                                <p>${step.step_description}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<p>No roadmap available</p>'}
                            </div>
                            <h3>Skills</h3>
                            <ul>${skills.length ? skills.map(skill => `<li>${skill.skill_name}</li>`).join('') : '<li>No skills listed</li>'}</ul>
                            <h3>Courses</h3>
                            <ul>${courses.length ? courses.map(course => `<li><a href="${course.course_url || '#'}" target="_blank">${course.course_name}</a></li>`).join('') : '<li>No courses available</li>'}</ul>
                        `;
                        jobDetails.style.display = 'block';
                    }).catch(err => {
                        console.error('Error loading details:', err);
                        jobDetails.innerHTML = '<p>Error loading job details. Please try again.</p>';
                        jobDetails.style.display = 'block';
                    });
                })
                .catch(err => {
                    console.error('Error fetching job roles:', err);
                    jobDetails.innerHTML = '<p>Error loading job data.</p>';
                    jobDetails.style.display = 'block';
                });
        });
    });
});
// Update the jobDetails.innerHTML section with this new structure:
jobDetails.innerHTML = `
    <h2>${job.role_title}</h2>
    <p><strong>Description:</strong> ${job.description || 'Not available'}</p>
    <p><strong>Industry:</strong> ${job.industry || 'Not specified'}</p>
    <p><strong>Average Salary:</strong> ₹${job.salary_package ? job.salary_package.toLocaleString() : 'N/A'}</p>
    
    <div class="skills-courses-container">
        <div class="skills-section">
            <h3>Essential Skills</h3>
            ${skills.length ? 
                skills.map(skill => `
                    <div class="skill-item">
                        <div class="skill-name">${skill.skill_name}</div>
                    </div>
                `).join('') 
                : '<p>No skills listed</p>'
            }
        </div>
        
        <div class="courses-section">
            <h3>Recommended Courses</h3>
            ${courses.length ? 
                courses.map(course => `
                    <div class="course-item">
                        <a href="${course.course_url || '#'}" target="_blank" class="course-link">
                            ${course.course_name}
                        </a>
                    </div>
                `).join('') 
                : '<p>No courses available</p>'
            }
        </div>
    </div>
    
    <div class="roadmap">
        <h3>Career Roadmap</h3>
        ${roadmap.length ? `
            <div class="roadmap-container">
                ${roadmap.map(step => `
                    <div class="roadmap-step">
                        <span class="step-number">${step.step_number}</span>
                        <p>${step.step_description}</p>
                    </div>
                `).join('')}
            </div>
        ` : '<p>No roadmap available</p>'}
    </div>
`;