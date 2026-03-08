# SmartQ: AI-Enhanced Barber Queue Management System

**SmartQ** is a full-stack web application designed to modernize traditional barber shop operations. It addresses the common pain points of long physical waiting times and inefficient manual queue management by introducing a digital queuing system paired with an AI-driven barber assistant.

---

## Tech Stack
* **Frontend:** React.js (Vite)
* **Backend:** Node.js
* **Database:** MySQL
* **AI Engine:** Gemini AI API (for personalized hairstyle recommendations)
* **SMS Gateway:** Text.lk (for real-time appointment alerts)

---

## Key Features
* **Remote Virtual Queue:** Join the queue from anywhere, reducing physical waiting time.
* **AI-Styling Assistant:** Get personalized hairstyle suggestions based on your preferences and hair type.
* **Predictive Wait Time:** Real-time estimation of service duration.
* **Automated SMS Notifications:** Instant updates on queue position via Text.lk integration.
* **Barber Dashboard:** Centralized view for staff to manage walk-ins and digital bookings.

---

## System Design
The system architecture follows a three-tier model ensuring clear separation between the UI, business logic, and data.



* **Database Schema:** Designed to handle relational data between Users, Barbers, Appointments, and Services.
* **Workflow:** The system utilizes a sequence-based approach to ensure appointments do not conflict, providing a seamless experience for both the customer and the barber.

---

## Getting Started

### Prerequisites
* Node.js (v18+)
* MySQL Server

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/zacharcy/smartq-barber.git](https://github.com/zacharcy/smartq-barber.git)


### Backend Setup:

Navigate to /backend

Create a .env file and add your DB_PASSWORD, GEMINI_API_KEY, and TEXT_LK_API_KEY.


### Frontend Setup:

Navigate to /frontend

Run npm install and npm run dev.

### Academic Information

**Project Name:** SmartQ Barber Management System

**Student:** Zameer Ameer
