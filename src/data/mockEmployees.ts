import type { Employee, EmployeeStatus } from '@/types/employee'

/**
 * MOCK / TEST DATA ONLY.
 * Every person below is fictional and does not represent an actual Eljin employee.
 * Replaced by `GET /api/employees` once the Laravel backend exists.
 */

type Row = [
  first: string,
  last: string,
  department: string,
  position: string,
  location: string,
  status: EmployeeStatus,
  phone?: string,
]

const rows: Row[] = [
  ['Arvin', 'Leano', 'MIS', 'IT Technician', 'Head Office', 'active', '+63 2 8000 0101'],
  ['Maria', 'Santos', 'Human Resources', 'HR Officer', 'Head Office', 'active', '+63 2 8000 0102'],
  ['Juan', 'Dela Cruz', 'Finance', 'Accountant', 'Head Office', 'active', '+63 2 8000 0103'],
  ['Angela', 'Reyes', 'Operations', 'Purchasing Officer', 'Head Office', 'active', '+63 2 8000 0104'],
  ['Pedro', 'Garcia', 'Operations', 'Operations Supervisor', 'Warehouse', 'active', '+63 2 8000 0105'],
  ['Carlo', 'Mendoza', 'MIS', 'Systems Administrator', 'Head Office', 'active', '+63 2 8000 0106'],
  ['Katrina', 'Villanueva', 'MIS', 'Network Engineer', 'Head Office', 'on-leave'],
  ['Joshua', 'Bautista', 'MIS', 'Software Developer', 'Head Office', 'active', '+63 2 8000 0108'],
  ['Liza', 'Fernandez', 'MIS', 'IT Technician', 'Branch', 'active'],
  ['Ramon', 'Aquino', 'MIS', 'MIS Manager', 'Head Office', 'active', '+63 2 8000 0110'],
  ['Grace', 'Ramos', 'Human Resources', 'HR Manager', 'Head Office', 'active', '+63 2 8000 0111'],
  ['Joanna', 'Castillo', 'Human Resources', 'Recruitment Specialist', 'Head Office', 'active', '+63 2 8000 0112'],
  ['Mark', 'Domingo', 'Human Resources', 'Payroll Officer', 'Head Office', 'on-leave', '+63 2 8000 0113'],
  ['Cristina', 'Navarro', 'Human Resources', 'HR Assistant', 'Branch', 'active'],
  ['Eduardo', 'Pascual', 'Finance', 'Finance Manager', 'Head Office', 'active', '+63 2 8000 0115'],
  ['Rosario', 'Manalo', 'Finance', 'Senior Accountant', 'Head Office', 'active', '+63 2 8000 0116'],
  ['Jerome', 'Salazar', 'Finance', 'Accounts Payable Clerk', 'Head Office', 'active', '+63 2 8000 0117'],
  ['Patricia', 'Cabrera', 'Finance', 'Billing Specialist', 'Branch', 'active'],
  ['Michael', 'Tolentino', 'Finance', 'Cashier', 'Branch', 'on-leave'],
  ['Leonora', 'Magsaysay', 'Operations', 'Operations Manager', 'Head Office', 'active', '+63 2 8000 0120'],
  ['Rodrigo', 'Esguerra', 'Operations', 'Warehouse Supervisor', 'Warehouse', 'active', '+63 2 8000 0121'],
  ['Teresita', 'Lacson', 'Operations', 'Logistics Coordinator', 'Warehouse', 'active', '+63 2 8000 0122'],
  ['Benjamin', 'Soriano', 'Operations', 'Inventory Clerk', 'Warehouse', 'active'],
  ['Marites', 'Dizon', 'Operations', 'Dispatcher', 'Warehouse', 'on-leave'],
  ['Alfredo', 'Valdez', 'Operations', 'Driver', 'Warehouse', 'active'],
  ['Cecilia', 'Ocampo', 'Operations', 'Quality Assurance Officer', 'Head Office', 'active', '+63 2 8000 0126'],
  ['Danilo', 'Gonzales', 'Operations', 'Branch Operations Lead', 'Branch', 'active', '+63 2 8000 0127'],
  ['Hannah', 'Pineda', 'Sales', 'Sales Manager', 'Head Office', 'active', '+63 2 8000 0128'],
  ['Vincent', 'Alcantara', 'Sales', 'Account Executive', 'Head Office', 'active', '+63 2 8000 0129'],
  ['Shiela', 'Marquez', 'Sales', 'Sales Representative', 'Branch', 'active', '+63 2 8000 0130'],
  ['Renato', 'Abad', 'Sales', 'Sales Representative', 'Branch', 'active'],
  ['Mylene', 'Cortez', 'Sales', 'Sales Coordinator', 'Head Office', 'on-leave', '+63 2 8000 0132'],
  ['Noel', 'Velasco', 'Sales', 'Account Executive', 'Other', 'active'],
  ['Andrea', 'Lim', 'Marketing', 'Marketing Manager', 'Head Office', 'active', '+63 2 8000 0134'],
  ['Francis', 'Tan', 'Marketing', 'Graphic Designer', 'Head Office', 'active', '+63 2 8000 0135'],
  ['Bernadette', 'Uy', 'Marketing', 'Corporate Communications Officer', 'Head Office', 'active', '+63 2 8000 0136'],
  ['Kenneth', 'Chua', 'Marketing', 'Digital Marketing Specialist', 'Head Office', 'active'],
  ['Imelda', 'Panganiban', 'Administration', 'Administrative Manager', 'Head Office', 'active', '+63 2 8000 0138'],
  ['Roberto', 'Hernandez', 'Administration', 'Facilities Officer', 'Head Office', 'active', '+63 2 8000 0139'],
  ['Lorna', 'Evangelista', 'Administration', 'Executive Assistant', 'Head Office', 'active', '+63 2 8000 0140'],
  ['Gilbert', 'Macaraeg', 'Administration', 'Records Custodian', 'Head Office', 'active'],
  ['Josefina', 'Robles', 'Administration', 'Receptionist', 'Head Office', 'active', '+63 2 8000 0142'],
  ['Arnel', 'Dimaculangan', 'Administration', 'Security Supervisor', 'Other', 'active'],
  ['Nenita', 'Cruz', 'Administration', 'Office Clerk', 'Branch', 'on-leave'],
  ['Ferdinand', 'Rivera', 'Operations', 'Maintenance Technician', 'Warehouse', 'active'],
  ['Lourdes', 'Agustin', 'Finance', 'Credit and Collections Officer', 'Head Office', 'active', '+63 2 8000 0146'],
  ['Emmanuel', 'Padilla', 'Sales', 'Regional Sales Lead', 'Other', 'active', '+63 2 8000 0147'],
  ['Divina', 'Salvador', 'Marketing', 'Marketing Assistant', 'Branch', 'active'],
  ['Wilfredo', 'Mercado', 'MIS', 'Help Desk Support', 'Branch', 'active', '+63 2 8000 0149'],
]

const slug = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '')

export const mockEmployees: Employee[] = rows.map(([firstName, lastName, department, position, location, status, phone], index) => {
  const number = String(index + 1).padStart(3, '0')
  return {
    id: String(index + 1),
    employeeId: `EMP-${number}`,
    firstName,
    lastName,
    department,
    position,
    email: `${slug(firstName)}.${slug(lastName)}@eljin.example`,
    phone,
    location,
    status,
  }
})
