import React, { useState } from 'react';
import { getUsers, saveUser } from '../services/storageService';
import { User, UserRole } from '../types';
import { Lock, User as UserIcon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    
    // Check local storage users first (includes admin, coutinho, and created users)
    const users = getUsers();
    const foundUser = users.find(u => u.username === username);

    if (foundUser) {
        // Se for primeiro acesso
        if (foundUser.isFirstAccess) {
            if (password.length < 4) {
                setError("Para criar sua senha, use no mínimo 4 caracteres.");
                return;
            }
            
            // Salva a senha digitada pelo usuário
            foundUser.password = password;
            saveUser(foundUser);
            
            // Loga o usuário (redirecionará para cadastro)
            onLogin(foundUser);
        } else {
            // Acesso normal - verifica a senha salva
            if (foundUser.password === password) {
                onLogin(foundUser);
            } else {
                setError("Senha incorreta.");
            }
        }
    } else {
        setError("Usuário não encontrado.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Portal Corporativo</h1>
            <p className="text-gray-400 mt-2">Acesse seus documentos</p>
        </div>

        <div className="space-y-6">
            <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="CPF / Matrícula" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                    type="password" 
                    placeholder="Senha (Primeiro Acesso, Crie uma Senha)" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-400 mt-2 ml-1">
                    A senha é necessária para um login futuro
                </p>
            </div>
            
            {error && <p className="text-red-500 text-center text-sm bg-red-50 p-2 rounded-lg">{error}</p>}

            <button 
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-transform active:scale-95"
            >
                Entrar
            </button>
        </div>

        <div className="mt-8 text-center text-gray-400 text-xs">
            &copy; 2026 S.F.D. Powered by Maicon Coutinho.
        </div>
      </div>
    </div>
  );
};

export default Login;