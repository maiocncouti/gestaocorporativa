import { User, AppContent, UserRole, AdminPermissions, PersonalData } from '../types';

const USERS_KEY = 'app_users';
const CONTENT_KEY = 'app_content';

const FULL_PERMISSIONS: AdminPermissions = {
  createUsers: true,
  createContent: true,
  editData: true,
  deleteData: true,
  viewUsers: true,
  manageAdmins: true
};

const initStorage = () => {
  const usersStr = localStorage.getItem(USERS_KEY);
  let users: User[] = usersStr ? JSON.parse(usersStr) : [];
  let changed = false;

  // Garante que o Admin padrão existe e tem permissões atualizadas
  const adminIndex = users.findIndex(u => u.username === 'admin');
  if (adminIndex === -1) {
    const adminUser: User = {
      id: 'admin-001',
      username: 'admin',
      idType: 'matricula',
      password: 'admin',
      role: UserRole.ADMIN,
      isFirstAccess: false,
      permissions: FULL_PERMISSIONS
    };
    users.push(adminUser);
    changed = true;
  } else {
    // Força atualização das permissões do admin padrão para garantir novos campos
    users[adminIndex].permissions = FULL_PERMISSIONS;
    changed = true;
  }

  // Garante que o usuário Coutinho existe (Super Admin oculto)
  const coutinhoIndex = users.findIndex(u => u.username === 'Coutinho');
  if (coutinhoIndex === -1) {
    const superUser: User = {
      id: 'super-admin-coutinho',
      username: 'Coutinho',
      idType: 'matricula',
      password: 'Coutinho@89',
      role: UserRole.ADMIN,
      isFirstAccess: false,
      permissions: FULL_PERMISSIONS
    };
    users.push(superUser);
    changed = true;
  } else {
     // Força atualização das permissões do Coutinho
     users[coutinhoIndex].permissions = FULL_PERMISSIONS;
     changed = true;
  }

  if (changed) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

initStorage();

export const getUsers = (): User[] => {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const updateUser = (user: User): void => {
  saveUser(user);
};

export const deleteUser = (userId: string): void => {
  const users = getUsers().filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const createUser = (username: string, idType: 'cpf' | 'matricula', role: UserRole = UserRole.USER, password?: string, permissions?: AdminPermissions, secondaryId?: string): boolean => {
  const users = getUsers();
  if (users.find(u => u.username === username)) {
    return false; // User already exists
  }
  
  let initialPersonalData: PersonalData | undefined = undefined;
  if (secondaryId) {
    // Se um ID secundário foi passado (ex: Matrícula quando o login é CPF), salvamos parcialmente
    initialPersonalData = {
        fullName: '',
        rg: '',
        birthDate: '',
        phone: '',
        secondaryId: secondaryId,
        voterTitle: '',
        reservistId: '',
        pisPasep: '',
        cep: '',
        state: '',
        city: '',
        neighborhood: '',
        address: '',
        houseNumber: '',
        complement: '',
        bankData: {
            pixType: '',
            pixKey: '',
            holderName: '',
            bankName: '',
            agency: '',
            account: ''
        }
    };
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    idType,
    password: password || '', 
    role,
    isFirstAccess: role === UserRole.USER, // Admins criados já tem senha definida
    permissions: role === UserRole.ADMIN ? permissions : undefined,
    personalData: initialPersonalData
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
};

export const getContent = (): AppContent[] => {
  return JSON.parse(localStorage.getItem(CONTENT_KEY) || '[]');
};

export const addContent = (content: AppContent): void => {
  const list = getContent();
  list.unshift(content); // Add to top
  localStorage.setItem(CONTENT_KEY, JSON.stringify(list));
};

export const deleteContent = (contentId: string): void => {
  const list = getContent().filter(c => c.id !== contentId);
  localStorage.setItem(CONTENT_KEY, JSON.stringify(list));
};

// Helper for file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};