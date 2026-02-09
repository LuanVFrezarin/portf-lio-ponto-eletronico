import { INITIAL_EMPLOYEES } from './initial-employees';

const STORAGE_KEY = 'ponto_employees';

export interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  dept: string;
  role: string;
  hourlyRate: number;
  avatar?: string;
  pin: string;
  address?: string;
  hoursBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

// Inicializa o localStorage com dados iniciais se estiver vazio
function initializeStorage() {
  if (typeof window === 'undefined') return;
  
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const employees = INITIAL_EMPLOYEES.map(emp => ({
      ...emp,
      createdAt: new Date(emp.createdAt),
      updatedAt: new Date(emp.updatedAt),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  }
}

export function getEmployees(): Employee[] {
  if (typeof window === 'undefined') return INITIAL_EMPLOYEES;
  
  initializeStorage();
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return INITIAL_EMPLOYEES;
  
  try {
    return JSON.parse(data).map((emp: any) => ({
      ...emp,
      createdAt: new Date(emp.createdAt),
      updatedAt: new Date(emp.updatedAt),
    }));
  } catch {
    return INITIAL_EMPLOYEES;
  }
}

export function getEmployeeById(id: string): Employee | undefined {
  return getEmployees().find(emp => emp.id === id);
}

export function getEmployeeByPin(pin: string): Employee | undefined {
  return getEmployees().find(emp => emp.pin === pin);
}

export function createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const employees = getEmployees();
  
  // Gerar ID único
  const id = 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Verificar PIN único
  if (employees.some(emp => emp.pin === data.pin)) {
    throw new Error('PIN já existe');
  }
  
  const newEmployee: Employee = {
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  employees.push(newEmployee);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  
  return newEmployee;
}

export function updateEmployee(id: string, data: Partial<Employee>): Employee {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const employees = getEmployees();
  const index = employees.findIndex(emp => emp.id === id);
  
  if (index === -1) {
    throw new Error('Funcionário não encontrado');
  }
  
  employees[index] = {
    ...employees[index],
    ...data,
    id: employees[index].id, // não mudar ID
    createdAt: employees[index].createdAt, // não mudar data criação
    updatedAt: new Date(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  
  return employees[index];
}

export function deleteEmployee(id: string): void {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const employees = getEmployees().filter(emp => emp.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

export function clearAllEmployees(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
