from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
import mysql.connector
from mysql.connector import Error
from flask_bcrypt import Bcrypt

app = Flask(__name__)
app.secret_key = "your_secret_key"  # Replace with a secure key in production
bcrypt = Bcrypt(app)

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Jilsa@2412',
    'database': 'skilltrak_pr'
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        if conn.is_connected():
            print("Successfully connected to the database")
            return conn
        else:
            print("Failed to connect to the database")
            return None
    except Error as err:
        print(f"Error connecting to database: {err}")
        return None

# Helper function to get logged-in user data
def get_logged_in_user():
    if 'user_id' not in session:
        return None
    conn = get_db_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_id, name, email, role, profile_picture FROM users WHERE user_id = %s", (session['user_id'],))
        user = cursor.fetchone()
        return user
    except Error as err:
        print(f"Error fetching user: {err}")
        return None
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# Home Route
@app.route('/')
def home():
    conn = get_db_connection()
    if not conn:
        return "Database connection failed", 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Job_Roles")
        job_roles = cursor.fetchall()
        if job_roles:
            default_role_id = job_roles[0]['role_id']
            cursor.execute("""
                SELECT c.* FROM Courses c
                JOIN Skills s ON c.linked_skill_id = s.skill_id
                WHERE s.job_id = %s LIMIT 5
            """, (default_role_id,))
            courses = cursor.fetchall()
            cursor.execute("SELECT * FROM Roadmaps WHERE role_id = %s ORDER BY step_number", (default_role_id,))
            roadmap = cursor.fetchall()
        else:
            courses, roadmap = [], []
        user = get_logged_in_user()
        return render_template('index.html', jobroles=job_roles, courses=courses, roadmap=roadmap, current_page='home', user=user)
    except Error as err:
        print(f"Error in home route: {err}")
        return "Error fetching data", 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# Login Route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        conn = get_db_connection()
        if not conn:
            flash("Database connection failed!", "danger")
            return redirect(url_for('login'))
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if user and bcrypt.check_password_hash(user['password'], password):
                session['user_id'] = user['user_id']
                flash("Login successful!", "success")
                return redirect(url_for('profile'))
            else:
                flash("Invalid email or password!", "danger")
                return redirect(url_for('login'))
        except Error as err:
            print(f"Error during login: {err}")
            flash("Error logging in. Please try again.", "danger")
            return redirect(url_for('login'))
        finally:
            if conn.is_connected():
                cursor.close()
                conn.close()
    user = get_logged_in_user()
    return render_template('login.html', current_page='login', user=user)

# Signup Route
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        phone_no = request.form.get('phone_no', None)
        qualification = request.form.get('qualification', 'Not Specified')
        role = request.form['role']
        valid_roles = ['Job Seeker', 'Fresher', 'Employee']
        if role not in valid_roles:
            flash("Invalid role selected!", "danger")
            return redirect(url_for('signup'))
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        conn = get_db_connection()
        if not conn:
            flash("Database connection failed!", "danger")
            return redirect(url_for('signup'))
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT email FROM users WHERE email = %s", (email,))
            existing_user = cursor.fetchone()
            if existing_user:
                flash("Email already registered!", "warning")
                return redirect(url_for('signup'))
            cursor.execute("""
                INSERT INTO users (name, email, password, phone_no, qualification, role)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (name, email, hashed_password, phone_no, qualification, role))
            conn.commit()
            flash("Sign-Up successful! Please log in.", "success")
            return redirect(url_for('login'))
        except Error as err:
            print(f"Error inserting user: {err}")
            flash("Error signing up. Please try again.", "danger")
            return redirect(url_for('signup'))
        finally:
            if conn.is_connected():
                cursor.close()
                conn.close()
    user = get_logged_in_user()
    return render_template('signup.html', current_page='signup', user=user)

# Profile Route
@app.route('/profile')
def profile():
    if 'user_id' not in session:
        flash("Please log in to view your profile.", "danger")
        return redirect(url_for('login'))
    conn = get_db_connection()
    if not conn:
        flash("Database connection failed!", "danger")
        return redirect(url_for('home'))
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE user_id = %s", (session['user_id'],))
        user = cursor.fetchone()
        if user:
            return render_template('profile.html', user=user, current_page='profile')
        else:
            flash("User not found!", "danger")
            return redirect(url_for('login'))
    except Error as err:
        print(f"Error fetching user profile: {err}")
        flash("Error loading profile. Please try again.", "danger")
        return redirect(url_for('home'))
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# Job Roles Route
@app.route('/job-roles', methods=['GET'])
def job_roles():
    conn = get_db_connection()
    if not conn:
        flash("Database connection failed!", "danger")
        return redirect(url_for('home'))
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT category_id, category_name FROM Categories")
        categories = cursor.fetchall()
        cursor.execute("SELECT role_id, role_title, category_id, description, industry, salary_package FROM Job_Roles")
        job_roles = cursor.fetchall()
        user = get_logged_in_user()
        return render_template('job_roles.html', categories=categories, job_roles=job_roles, current_page='job-roles', user=user)
    except Error as err:
        print(f"Error fetching job roles: {err}")
        flash("Error loading job roles.", "danger")
        return redirect(url_for('home'))
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# My Learning Route (New)
@app.route('/my-learning')
def my_learning():
    if 'user_id' not in session:
        flash("Please log in to view your learning progress.", "danger")
        return redirect(url_for('login'))
    conn = get_db_connection()
    if not conn:
        flash("Database connection failed!", "danger")
        return redirect(url_for('home'))
    try:
        cursor = conn.cursor(dictionary=True)
        # Get user info
        cursor.execute("SELECT user_id, name, role FROM users WHERE user_id = %s", (session['user_id'],))
        user = cursor.fetchone()
        if not user:
            flash("User not found!", "danger")
            return redirect(url_for('login'))

        # Get user's progress
        cursor.execute("""
            SELECT pt.*, jr.role_title 
            FROM progress_tracking pt
            JOIN Job_Roles jr ON pt.role_id = jr.role_id
            WHERE pt.user_id = %s
            ORDER BY pt.step_number
        """, (session['user_id'],))
        progress = cursor.fetchall()

        # Get quizzes for the user's role_id (assuming one role_id per user for simplicity)
        if progress:
            role_id = progress[0]['role_id']
            cursor.execute("""
                SELECT * FROM quiz 
                WHERE role_id = %s 
                ORDER BY step_number
            """, (role_id,))
            quizzes = cursor.fetchall()
        else:
            quizzes = []

        return render_template('my_learning.html', user=user, progress=progress, quizzes=quizzes, current_page='my-learning')
    except Error as err:
        print(f"Error fetching my learning data: {err}")
        flash("Error loading your learning data.", "danger")
        return redirect(url_for('home'))
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# Other Routes (unchanged except for user addition)
@app.route('/get_job_roles')
def get_job_roles():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Job_Roles")
        job_roles = cursor.fetchall()
        return jsonify({"job_roles": job_roles})
    except Error as err:
        print(f"Error fetching job roles: {err}")
        return jsonify({"error": "Error fetching job roles"}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/get_skills/<int:job_role_id>', methods=['GET'])
def get_skills(job_role_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Skills WHERE job_id = %s", (job_role_id,))
        skills = cursor.fetchall()
        return jsonify(skills)
    except Error as err:
        print(f"Error fetching skills: {err}")
        return jsonify({"error": "Error fetching skills"}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/get_courses/<int:skill_id>', methods=['GET'])
def get_courses(skill_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Courses WHERE linked_skill_id = %s", (skill_id,))
        courses = cursor.fetchall()
        return jsonify(courses)
    except Error as err:
        print(f"Error fetching courses: {err}")
        return jsonify({"error": "Error fetching courses"}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/get_roadmap/<int:role_id>', methods=['GET'])
def get_roadmap(role_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Roadmaps WHERE role_id = %s ORDER BY step_number", (role_id,))
        roadmap = cursor.fetchall()
        return jsonify(roadmap)
    except Error as err:
        print(f"Error fetching roadmap: {err}")
        return jsonify({"error": "Error fetching roadmap"}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/resume-toolkit')
def resume_toolkit():
    user = get_logged_in_user()
    return render_template('resume_toolkit.html', current_page='resume-toolkit', user=user)

@app.route('/about')
def about():
    user = get_logged_in_user()
    return render_template('about_us.html', current_page='about', user=user)

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash("You have been logged out.", "success")
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)