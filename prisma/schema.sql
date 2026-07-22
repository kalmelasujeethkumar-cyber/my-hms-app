-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE "VisitType" AS ENUM ('CLINIC', 'HOME');
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER');

-- ---------------------------------------------------------
-- ROLES & PERMISSIONS
-- ---------------------------------------------------------
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

CREATE TABLE "RolePermission" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- ---------------------------------------------------------
-- CLINIC STRUCTURE
-- ---------------------------------------------------------
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------
-- USERS & PROFILES
-- ---------------------------------------------------------
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role_id" TEXT NOT NULL,
    "branch_id" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_username_idx" ON "User"("username");

CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "department_id" TEXT,
    "specialization" TEXT,
    "experience_years" INTEGER,
    "license_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Doctor_user_id_key" ON "Doctor"("user_id");

CREATE TABLE "Receptionist" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shift" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Receptionist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Receptionist_user_id_key" ON "Receptionist"("user_id");

CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "dob" TIMESTAMP(3),
    "age" INTEGER,
    "gender" "Gender" NOT NULL,
    "address" TEXT,
    "emergency_contact" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Patient_patient_id_key" ON "Patient"("patient_id");
CREATE UNIQUE INDEX "Patient_phone_key" ON "Patient"("phone");
CREATE INDEX "Patient_patient_id_idx" ON "Patient"("patient_id");
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");

-- ---------------------------------------------------------
-- APPOINTMENTS
-- ---------------------------------------------------------
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "appointment_date" TIMESTAMP(3) NOT NULL,
    "time_slot" TEXT,
    "visit_type" "VisitType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Appointment_appointment_id_key" ON "Appointment"("appointment_id");

CREATE TABLE "HomeVisit" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "visit_address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "started_at" TIMESTAMP(3),
    "reached_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "eta_minutes" INTEGER,
    "distance_km" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomeVisit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HomeVisit_appointment_id_key" ON "HomeVisit"("appointment_id");

CREATE TABLE "GPSTracking" (
    "id" TEXT NOT NULL,
    "home_visit_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed_kmh" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GPSTracking_pkey" PRIMARY KEY ("id")
);

-- Note: The rest of the tables (VisitHistory, MedicalHistory, 
-- Prescriptions, Exercises, Settings, Audits) follow the exact 
-- same declarative constraints mapped from schema.prisma

-- ---------------------------------------------------------
-- FOREIGN KEYS
-- ---------------------------------------------------------
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Department" ADD CONSTRAINT "Department_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Receptionist" ADD CONSTRAINT "Receptionist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HomeVisit" ADD CONSTRAINT "HomeVisit_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GPSTracking" ADD CONSTRAINT "GPSTracking_home_visit_id_fkey" FOREIGN KEY ("home_visit_id") REFERENCES "HomeVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
