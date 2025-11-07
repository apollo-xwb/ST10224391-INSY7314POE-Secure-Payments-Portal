// Employee seed script - creates static employee accounts (with no registration allowed)
require('dotenv').config();
const { connectDB, Employee } = require('../models');

// Static employee accounts - No registration allowed
const staticEmployees = [
  {
    employee_id: 'EMP001',
    full_name: 'John Admin',
    email: 'admin@securepayments.com',
    password: 'Admin@123456',  // To be hashed
    department: 'Administration'
  },
  {
    employee_id: 'EMP002',
    full_name: 'Sarah Payment',
    email: 'spayment@securepayments.com',
    password: 'Payment@123456',
    department: 'Payments'
  },
  {
    employee_id: 'EMP003',
    full_name: 'Mike Customer',
    email: 'mcustomer@securepayments.com',
    password: 'Customer@123456',
    department: 'Customer Service'
  },
  {
    employee_id: 'EMP004',
    full_name: 'Emma Finance',
    email: 'efinance@securepayments.com',
    password: 'Finance@123456',
    department: 'Finance'
  },
  {
    employee_id: 'EMP005',
    full_name: 'David IT',
    email: 'dit@securepayments.com',
    password: 'IT@123456',
    department: 'IT'
  }
];

const seedEmployees = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas');

    // Create employees
    const createdEmployees = [];
    for (const empData of staticEmployees) {
      try {
        // Check if employee already exists
        const existing = await Employee.findOne({ 
          $or: [
            { employee_id: empData.employee_id },
            { email: empData.email }
          ]
        });

        if (existing) {
          console.log(`⚠️  Employee ${empData.employee_id} (${empData.email}) already exists. Skipping...`);
          continue;
        }

        // Create employee with hashed password
        const employee = await Employee.createEmployee(empData);
        createdEmployees.push(employee);
        console.log(`✅ Created employee: ${employee.employee_id} - ${employee.full_name} (${employee.email})`);
      } catch (error) {
        console.error(`❌ Error creating employee ${empData.employee_id}:`, error.message);
      }
    }

    console.log(`\n✅ Seed completed! Created ${createdEmployees.length} employees.`);
    console.log('\n📋 Employee Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    staticEmployees.forEach(emp => {
      const created = createdEmployees.find(e => e.employee_id === emp.employee_id);
      if (created) {
        console.log(`Employee ID: ${emp.employee_id}`);
        console.log(`Email: ${emp.email}`);
        console.log(`Password: ${emp.password}`);
        console.log(`Department: ${emp.department}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedEmployees();

