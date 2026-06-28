# Scentcepts 2.0 Project Setup Guide

This document details the configuration, setup, and troubleshooting steps to run the Scentcepts project (Spring Boot API + Next.js App Router + PostgreSQL database) locally on your computer.

---

## 1. Database Configuration

The backend application requires a PostgreSQL database to run. 

### Step A: Create the Database
Ensure PostgreSQL is running on your machine. Open your terminal or pgAdmin, connect to your server, and create a database named `scentcepts_db`.

Using the PostgreSQL interactive terminal (psql):
```sql
CREATE DATABASE scentcepts_db;
```

### Step B: Configure application.yaml
Open the configuration file located at:
`src/main/resources/application.yaml`

Update the database connection details to match your local installation:
```yaml
spring:
  application:
    name: scentcepts
  datasource:
    url: jdbc:postgresql://localhost:5432/scentcepts_db
    username: YOUR_POSTGRES_USERNAME (e.g. postgres)
    password: YOUR_POSTGRES_PASSWORD (e.g. 2005)
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
```

Configure your Safaricom Daraja Sandbox API credentials under `safaricom.daraja` in the same file to enable Lipa Na M-Pesa payments. (OPTIONAL)

---

## 2. How to Run the Backend

The backend is built with Spring Boot and Java.

1. Navigate to the project root directory where the Gradle build file (`build.gradle` or `gradlew`) is located.
2. Compile and run the application using Gradle:

   On Windows (PowerShell):
   ```powershell
   ./gradlew bootRun
   ```

   On Linux / macOS:
   ```bash
   ./gradlew bootRun
   ```

3. The backend server will start and listen on port `8080` (http://localhost:8080).

---

## 3. How to Run the Frontend

The frontend is built using Next.js.

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the node package dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. The frontend application will start and listen on port `3000` (http://localhost:3000).

---

## 4. Required Dependencies and Troubleshooting

To run Scentcepts 2.0 locally, the following software dependencies must be installed on your computer.

### Required Software
1. **Java Development Kit (JDK 21)**
   - The backend code uses Java 21 features. Verify your installation by running `java -version` and `javac -version`.
2. **Node.js (version 20 or higher)**
   - Required to run Next.js compilation and hot-reloading. Verify by running `node -v` and `npm -v`.
3. **PostgreSQL Database Server (version 15 or higher)**
   - Required to store user profiles, perfume catalogs, orders, and payment log data.
4. **Git**
   - Required for codebase management.

### Common Problems and Troubleshooting

#### Database Connection Fails
* **Error**: `Connection to localhost:5432 refused.`
* **Solution**: Ensure the PostgreSQL service is actively running on your machine. Check that the port number (`5432` by default) matches your database installation port, and that your database credentials in `application.yaml` are correct.

#### Java Version Compilation Errors
* **Error**: `Unsupported class file major version` or compiler syntax issues.
* **Solution**: Ensure your system's `JAVA_HOME` environment variable points to a JDK 21 installation rather than an older version (like JDK 8 or JDK 11).

#### Node Dependency Failures
* **Error**: `npm ERR! code ELIFECYCLE` or import compilation failures during `npm run dev`.
* **Solution**: Delete the `node_modules` folder and the `package-lock.json` file inside the `frontend` directory, and run `npm install` again.

#### M-Pesa Callback Webhook Failures
* **Problem**: Safaricom is unable to reach your local callback endpoint.
* **Solution**: For local testing, use a reverse proxy utility like Ngrok to generate a public HTTPS tunnel to port `8080`. Update the `safaricom.daraja.callback-url` value in `application.yaml` to point to your public tunnel domain (e.g. `https://your-ngrok-domain.ngrok-free.app/api/payments/callback`).
