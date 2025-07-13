CREATE TABLE Users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  user_type VARCHAR(10) CHECK (user_type IN ('admin', 'teacher', 'student')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Admins (
  admin_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  admin_level VARCHAR(50) NOT NULL DEFAULT 'standard',
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Teachers (
  teacher_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  specialization VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Students (
  student_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  batch_year INTEGER,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Courses (
  course_id SERIAL PRIMARY KEY,
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by INTEGER NOT NULL,
  updated_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES Admins(admin_id),
  FOREIGN KEY (updated_by) REFERENCES Admins(admin_id)
);

CREATE TABLE Course_Teachers (
  course_teacher_id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  teacher_assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_id, teacher_id),
  FOREIGN KEY (course_id) REFERENCES Courses(course_id),
  FOREIGN KEY (teacher_id) REFERENCES Teachers(teacher_id)
);

CREATE TABLE Student_Enrollment (
  enrollment_id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_id, student_id),
  FOREIGN KEY (course_id) REFERENCES Courses(course_id),
  FOREIGN KEY (student_id) REFERENCES Students(student_id)
);

CREATE TABLE Files (
  file_id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  uploaded_by INTEGER NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES Users(user_id)
);

CREATE TABLE Assignments (
  assignment_id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP NOT NULL,
  max_points INTEGER NOT NULL,
  weight_percentage DECIMAL(5,2) NOT NULL DEFAULT 100,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES Courses(course_id),
  FOREIGN KEY (created_by) REFERENCES Teachers(teacher_id)
);

CREATE TABLE Assignment_Files (
  assignment_file_id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL,
  file_id INTEGER NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  UNIQUE (assignment_id, file_id),
  FOREIGN KEY (assignment_id) REFERENCES Assignments(assignment_id),
  FOREIGN KEY (file_id) REFERENCES Files(file_id)
);

CREATE TABLE Assignment_Submissions (
  submission_id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  points_earned DECIMAL(5,2),
  feedback TEXT,
  is_deleted BOOLEAN DEFAULT false,
  graded_by INTEGER,
  graded_at TIMESTAMP,
  UNIQUE (assignment_id, student_id),
  FOREIGN KEY (assignment_id) REFERENCES Assignments(assignment_id),
  FOREIGN KEY (student_id) REFERENCES Students(student_id),
  FOREIGN KEY (graded_by) REFERENCES Course_Teachers(course_teacher_id)
);

CREATE TABLE Submission_Files (
  submission_file_id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL,
  file_id INTEGER NOT NULL,
  UNIQUE (submission_id, file_id),
  FOREIGN KEY (submission_id) REFERENCES Assignment_Submissions(submission_id),
  FOREIGN KEY (file_id) REFERENCES Files(file_id)
);

CREATE TABLE Course_Results (
  result_id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  final_grade DECIMAL(5,2),
  comments TEXT,
  generated_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE (course_id, student_id),
  FOREIGN KEY (course_id) REFERENCES Courses(course_id),
  FOREIGN KEY (student_id) REFERENCES Students(student_id)
);

CREATE TABLE Student_Progress (
  progress_id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  total_assignments INTEGER NOT NULL DEFAULT 0,
  completed_assignments INTEGER NOT NULL DEFAULT 0,
  total_points_available DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_points_earned DECIMAL(8,2) NOT NULL DEFAULT 0,
  current_grade_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES Students(student_id),
  FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

CREATE TABLE Announcements (
  announcement_id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES Courses(course_id),
  FOREIGN KEY (created_by) REFERENCES Teachers(teacher_id)
);

CREATE TABLE Private_Messages (
  message_id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  subject VARCHAR(100),
  message_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_status BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (sender_id) REFERENCES Users(user_id),
  FOREIGN KEY (receiver_id) REFERENCES Users(user_id)
);

CREATE TABLE Admin_Logs (
  log_id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  affected_user_id INTEGER,
  affected_course_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES Admins(admin_id),
  FOREIGN KEY (affected_user_id) REFERENCES Users(user_id),
  FOREIGN KEY (affected_course_id) REFERENCES Courses(course_id)
);

CREATE TABLE Discussion_Threads (
  thread_id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES Courses(course_id),
  FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

CREATE TABLE Discussion_Posts (
  post_id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  reply_to_post_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES Discussion_Threads(thread_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (reply_to_post_id) REFERENCES Discussion_Posts(post_id)
);

CREATE TABLE Announcement_Views (
  view_id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (announcement_id, user_id),
  FOREIGN KEY (announcement_id) REFERENCES Announcements(announcement_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Course_Resources (
  resource_id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  file_id INTEGER,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  uploaded_by INTEGER NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES Courses(course_id),
  FOREIGN KEY (file_id) REFERENCES Files(file_id),
  FOREIGN KEY (uploaded_by) REFERENCES Teachers(teacher_id)
);

CREATE TABLE Resource_Views (
  view_id SERIAL PRIMARY KEY,
  resource_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (resource_id, user_id),
  FOREIGN KEY (resource_id) REFERENCES Course_Resources(resource_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

COMMENT ON TABLE "Admins" IS 'Only users with user_type = "admin" should be referenced here';
COMMENT ON TABLE "Teachers" IS 'Only users with user_type = "teacher" should be referenced here';
COMMENT ON TABLE "Students" IS 'Only users with user_type = "student" should be referenced here';