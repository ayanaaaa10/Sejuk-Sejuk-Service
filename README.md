Sejuk Sejuk Service WebApp

🧊 Overview
This React + Firebase WebApp is developed for Sejuk Sejuk Service Sdn Bhd, a fictional company offering air-conditioner installation, servicing, and repair across 5 branches nationwide with 20+ technician teams. The app streamlines order creation, technician job completion, and customer notifications — fully digital.

✅ What I Built
Module 1 – Admin Portal
Admins can:
 - Submit new orders
 - Assign technicians
 - Store customer and service details in Firestore
 - Automatically notify technicians via WhatsApp and email

Module 2 – Technician Portal
Technicians can:
 - View assigned jobs
 - Fill in work details, extra charges, remarks
 - Final price auto-calculated
 - Submit job as "Done"

Module 3 – Notification Trigger
 - When status is updated to “Job Done”:
 - Sends WhatsApp message to customer
 - Sends email to manager

🛠 Tech Used
Frontend: React.js (with Tailwind CSS)
Backend: Firebase Firestore
Storage: Firebase (for data only, no file upload)
Notifications:
 - WhatsApp via deep-link
 - Email via EmailJS
 - Deployment: GitHub + Netlify

💡 Challenges / Ideas
- Designed for both desktop (admin) and mobile (technician)
- Used phone number logic to support all country codes without +
- Integrated EmailJS smoothly with React form submission
- Ensured database updates trigger notifications correctly

🚫 Not Included 
- No image/video/PDF upload in technician module
- No KPI dashboard

📦 Live Demo
[🔗 Netlify Live Demo]- https://sejuk-web-app.netlify.app/

