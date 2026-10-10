Student Management System - HTML/CSS/JS UI
==========================================
Open index.html in any browser. Tabs: Students, Courses (add / edit / delete / search).

Data is stored in the browser (localStorage), so it works with no server.

Connecting to your PostgreSQL database
--------------------------------------
A browser cannot talk to PostgreSQL directly. You need a small backend
(e.g. Java Servlet / Spring Boot using your existing JDBC code) exposing:
  GET/POST/PUT/DELETE  /api/students   and   /api/courses
Then, in script.js, replace load() and save() with fetch() calls to those URLs.
