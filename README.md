 Student Project Application Portal
A web application that allows students to apply for final-year academic projects offered by faculty members. The platform streamlines project assignment, application tracking, and meeting scheduling between students and faculty.

 Features
*  Live Project Listings: Students can view available projects in real-time.
*  Project Application: Students can apply to projects directly from the portal.
*  Faculty Approval: Faculty members can approve or reject student applications.
*  Meeting Scheduler: Calendar system for students and faculty to plan meetings.
*  Authentication & Authorization: Role-based login for students an faculty.

 Tech Stack
Frontend
* React.js (with Tailwind CSS or Material UI)
Backend
* Node.js + Express.js
* Prisma ORM
Database
* MongoDB
Other Tools
* JWT for secure auth
* Nodemailer for email notifications
* Google Calendar API (optional) for scheduling

 Getting Started
Prerequisites
* Node.js
* MongoDB
* Git
  
1. Clone the Repository
git clone https://github.com/Vidhita17/SE-Project-2.git
cd SE-Project-2
2. Install Dependencies
npm install
3. Setup Environment Variables
Create a .env file
4. Setup Prisma and Migrate DB
npx prisma generate
npx prisma migrate dev --name init
5. Run the App
npm start

App runs on http://localhost:3000 

