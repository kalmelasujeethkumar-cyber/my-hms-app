import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Head of Department / Super Admin' },
  });

  const doctorRole = await prisma.role.upsert({
    where: { name: 'DOCTOR' },
    update: {},
    create: { name: 'DOCTOR', description: 'Physiotherapist' },
  });

  const receptionRole = await prisma.role.upsert({
    where: { name: 'RECEPTION' },
    update: {},
    create: { name: 'RECEPTION', description: 'Front Desk Receptionist' },
  });

  // 2. Branch
  const mainBranch = await prisma.branch.create({
    data: {
      name: 'Main Clinic - Downtown',
      address: '123 Health Ave, Medical District',
      phone: '+1-555-0100',
      email: 'contact@physioclinic.com',
    },
  });

  // 3. Department
  const physioDept = await prisma.department.create({
    data: {
      name: 'Physiotherapy',
      branch_id: mainBranch.id,
    },
  });

  // 4. Users (Admin)
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@physioclinic.com' },
    update: {},
    create: {
      email: 'admin@physioclinic.com',
      username: 'admin',
      password_hash: adminPassword,
      role_id: adminRole.id,
      branch_id: mainBranch.id,
    },
  });

  // 5. Users (Doctor)
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);
  const doctorUser1 = await prisma.user.upsert({
    where: { email: 'dr.smith@physioclinic.com' },
    update: {},
    create: {
      email: 'dr.smith@physioclinic.com',
      username: 'drsmith',
      password_hash: doctorPassword,
      role_id: doctorRole.id,
      branch_id: mainBranch.id,
      doctor: {
        create: {
          department_id: physioDept.id,
          specialization: 'Orthopedic Physiotherapy',
          experience_years: 10,
          license_number: 'LIC-9090-XY',
        }
      }
    },
  });

  // 6. Users (Reception)
  const receptionPassword = await bcrypt.hash('Reception@123', 10);
  const receptionUser = await prisma.user.upsert({
    where: { email: 'reception@physioclinic.com' },
    update: {},
    create: {
      email: 'reception@physioclinic.com',
      username: 'reception',
      password_hash: receptionPassword,
      role_id: receptionRole.id,
      branch_id: mainBranch.id,
      receptionist: {
        create: {
          shift: 'Morning',
        }
      }
    },
  });

  // 7. Patient
  const patient1 = await prisma.patient.upsert({
    where: { phone: '+1-555-9999' },
    update: {},
    create: {
      patient_id: 'PAT-1001',
      branch_id: mainBranch.id,
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1-555-9999',
      email: 'johndoe@example.com',
      age: 45,
      gender: 'MALE',
      address: '456 Suburb Lane',
    },
  });

  // 8. Appointment
  const doctorData = await prisma.doctor.findUnique({ where: { user_id: doctorUser1.id } });
  
  if (doctorData) {
    const appointment1 = await prisma.appointment.create({
      data: {
        appointment_id: 'APP-2001',
        patient_id: patient1.id,
        doctor_id: doctorData.id,
        branch_id: mainBranch.id,
        appointment_date: new Date(),
        time_slot: '10:00 AM',
        visit_type: 'HOME',
        status: 'PENDING',
        home_visit: {
          create: {
            visit_address: '456 Suburb Lane',
            latitude: 40.7128,
            longitude: -74.0060,
          }
        }
      },
    });
    console.log(`Created appointment: ${appointment1.appointment_id}`);
  }

  // 9. Settings
  await prisma.setting.create({
    data: {
      key: 'CLINIC_NAME',
      value: 'Advanced Physiotherapy Care',
      description: 'Global clinic name',
    }
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
