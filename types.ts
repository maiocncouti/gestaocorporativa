export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface AdminPermissions {
  createUsers: boolean;
  createContent: boolean;
  editData: boolean;
  deleteData: boolean;
  viewUsers: boolean;    // Permissão para ver a lista de usuários comuns
  manageAdmins: boolean; // Permissão para ver a lista de administradores
}

export interface BankData {
  pixType: string;
  pixKey: string;
  holderName: string; // Nome do titular da conta
  bankName: string;
  agency: string;
  account: string;
}

export interface PersonalData {
  fullName: string;
  rg: string;
  birthDate: string;
  phone: string;
  voterTitle: string;
  reservistId?: string;
  pisPasep: string;
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  address: string;
  houseNumber: string;
  complement?: string;
  bankData: BankData;
  secondaryId?: string;
}

export interface User {
  id: string;
  username: string;
  idType: 'cpf' | 'matricula';
  password?: string;
  role: UserRole;
  isFirstAccess: boolean;
  personalData?: PersonalData;
  permissions?: AdminPermissions; // Permissões granulares para admins
}

export interface AppContent {
  id: string;
  title: string;
  date: string;
  description: string;
  contentType: 'file' | 'link';
  targetUserIds: string[];
  linkUrl?: string;
  fileType?: 'pdf' | 'jpg' | 'png' | 'doc' | 'ppt' | 'other';
  fileData?: string;
  fileName?: string;
}