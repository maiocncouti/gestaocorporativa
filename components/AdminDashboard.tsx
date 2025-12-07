import React, { useState, useEffect } from 'react';
import { UserPlus, Upload, FileText, CheckCircle, Loader2, LogOut, Link as LinkIcon, Users, CreditCard, Hash, Settings, Shield, Trash2, Edit, ChevronLeft, LayoutDashboard, Eye, UserCog, Download, Copy, QrCode, ExternalLink, MapPin, File } from 'lucide-react';
import { createUser, addContent, fileToBase64, getUsers, deleteUser, getContent, deleteContent } from '../services/storageService';
import { generateSummary } from '../services/geminiService';
import { AppContent, User, UserRole, AdminPermissions } from '../types';

interface AdminDashboardProps {
  user: User; // Admin logado para checar permissões
  onLogout: () => void;
}

type ViewState = 'dashboard' | 'admins' | 'users' | 'user-details';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user: currentUser, onLogout }) => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [showMenu, setShowMenu] = useState(false);
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'create' | 'upload'>('create');
  
  // Data Lists
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [userContentHistory, setUserContentHistory] = useState<AppContent[]>([]);
  const [showPixQr, setShowPixQr] = useState(false);

  // Create User State
  const [newUser, setNewUser] = useState(''); // Matrícula or CPF principal
  const [newUserCpf, setNewUserCpf] = useState(''); // CPF secundário (opcional na tela de matrícula)
  const [newUserIdType, setNewUserIdType] = useState<'matricula' | 'cpf'>('matricula');
  const [userMsg, setUserMsg] = useState('');
  const [userMsgType, setUserMsgType] = useState<'success' | 'error' | 'info'>('info');

  // Create Admin State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newAdminPerms, setNewAdminPerms] = useState<AdminPermissions>({
    createUsers: false,
    createContent: false,
    editData: false,
    deleteData: false,
    viewUsers: false,
    manageAdmins: false
  });
  const [adminMsg, setAdminMsg] = useState('');

  // Upload State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [contentType, setContentType] = useState<'file' | 'link'>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(['all']);

  useEffect(() => {
    refreshData();
  }, [currentView, activeTab]);

  const refreshData = () => {
    const users = getUsers();
    setAllUsers(users);
  };

  const handleCreateUser = () => {
    if (!currentUser.permissions?.createUsers && currentUser.username !== 'Coutinho') {
        setUserMsg('Sem permissão para criar usuários.');
        setUserMsgType('error');
        return;
    }
    if (!newUser) return;

    let finalUsername = newUser;
    let finalIdType = newUserIdType;
    let secondaryId: string | undefined = undefined;
    let successMsg = '';

    // Lógica para tratar CPF inserido na tela de Matrícula
    if (newUserIdType === 'matricula') {
        if (newUserCpf) {
            // Se informou CPF, o login será o CPF
            finalUsername = newUserCpf;
            finalIdType = 'cpf';
            secondaryId = newUser; // A matrícula vira dado secundário
            successMsg = `Usuário criado! Login será pelo CPF (${newUserCpf}). Matrícula ${newUser} vinculada.`;
        } else {
            // Apenas matrícula
            successMsg = `Usuário criado! INFORME AO FUNCIONÁRIO: Login via Matrícula (${newUser}).`;
        }
    } else {
        // Tela CPF Direto
        successMsg = `Usuário criado! Login via CPF (${newUser}).`;
    }

    const success = createUser(finalUsername, finalIdType, UserRole.USER, undefined, undefined, secondaryId);
    
    if (success) {
      setUserMsg(successMsg);
      setUserMsgType('success');
      setNewUser('');
      setNewUserCpf('');
      refreshData();
    } else {
      setUserMsg('Erro: Usuário já existe.');
      setUserMsgType('error');
    }
    setTimeout(() => setUserMsg(''), 6000);
  };

  const handleCreateAdmin = () => {
    if (!newAdminName || !newAdminPass) return;
    
    // Cria admin (CPF como padrão para ID type, mas não relevante para admin)
    const success = createUser(newAdminName, 'matricula', UserRole.ADMIN, newAdminPass, newAdminPerms);
    
    if (success) {
        setAdminMsg('Administrador criado com sucesso!');
        setNewAdminName('');
        setNewAdminPass('');
        setNewAdminPerms({ 
            createUsers: false, 
            createContent: false, 
            editData: false, 
            deleteData: false,
            viewUsers: false,
            manageAdmins: false
        });
        refreshData();
    } else {
        setAdminMsg('Erro: Usuário já existe.');
    }
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
        deleteUser(id);
        refreshData();
        if (currentView === 'user-details') setCurrentView('users');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      setIsAnalyzing(true);
      const summary = await generateSummary(selectedFile.name, selectedFile.type);
      setDescription(summary);
      setIsAnalyzing(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (userId === 'all') {
        setSelectedUserIds(['all']);
        return;
    }

    let newSelection = [...selectedUserIds];
    if (newSelection.includes('all')) newSelection = [];

    if (newSelection.includes(userId)) {
        newSelection = newSelection.filter(id => id !== userId);
    } else {
        newSelection.push(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const handleUpload = async () => {
    if (!currentUser.permissions?.createContent && currentUser.username !== 'Coutinho') {
        setUploadMsg("Sem permissão para publicar conteúdo.");
        return;
    }
    if (!title || !date) {
        setUploadMsg("Preencha título e data.");
        return;
    }
    if (contentType === 'file' && !file) {
        setUploadMsg("Selecione um arquivo.");
        return;
    }
    if (contentType === 'link' && !linkUrl) {
        setUploadMsg("Insira o link.");
        return;
    }
    if (selectedUserIds.length === 0) {
        setUploadMsg("Selecione pelo menos um usuário.");
        return;
    }

    try {
        let newContent: AppContent = {
            id: crypto.randomUUID(),
            title,
            date,
            description,
            contentType,
            targetUserIds: selectedUserIds,
        };

        if (contentType === 'file' && file) {
             const base64 = await fileToBase64(file);
             const typeMap: Record<string, any> = {
                'application/pdf': 'pdf',
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'application/msword': 'doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
                'application/vnd.ms-powerpoint': 'ppt',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt'
            };
            newContent.fileData = base64;
            newContent.fileName = file.name;
            newContent.fileType = typeMap[file.type] || 'other';
        } else if (contentType === 'link') {
            newContent.linkUrl = linkUrl;
            newContent.fileName = 'Link Externo';
            newContent.fileType = 'other';
        }

        addContent(newContent);
        setUploadMsg("Conteúdo publicado com sucesso!");
        
        setTitle('');
        setDate('');
        setFile(null);
        setLinkUrl('');
        setDescription('');
        setSelectedUserIds(['all']);

    } catch (error) {
        setUploadMsg("Erro ao processar.");
        console.error(error);
    }
    setTimeout(() => setUploadMsg(''), 3000);
  };

  const openUserDetails = (user: User) => {
    setSelectedUserForDetails(user);
    setShowPixQr(false);
    const content = getContent().filter(c => c.targetUserIds.includes('all') || c.targetUserIds.includes(user.id));
    setUserContentHistory(content);
    setCurrentView('user-details');
    setShowMenu(false);
  };

  const handleDeleteContent = (id: string) => {
    if (window.confirm("Excluir este conteúdo?")) {
        deleteContent(id);
        if (selectedUserForDetails) {
             const content = getContent().filter(c => c.targetUserIds.includes('all') || c.targetUserIds.includes(selectedUserForDetails.id));
             setUserContentHistory(content);
        }
    }
  };

  const handleDownloadContent = (content: AppContent) => {
    if (content.contentType === 'file' && content.fileData) {
        const link = document.createElement('a');
        link.href = content.fileData;
        link.download = content.fileName || 'arquivo';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (content.contentType === 'link' && content.linkUrl) {
        window.open(content.linkUrl, '_blank');
    }
  };

  const handleCopyPix = (key: string) => {
      navigator.clipboard.writeText(key);
      alert("Chave Pix copiada para a área de transferência!");
  };

  // Logic for Super Users (Coutinho and default admin)
  const isSuperUser = currentUser.username === 'Coutinho' || currentUser.username === 'admin';

  // Permission Checks
  const canEdit = currentUser.permissions?.editData || isSuperUser;
  const canDelete = currentUser.permissions?.deleteData || isSuperUser;
  const canViewUsers = currentUser.permissions?.viewUsers || isSuperUser;
  const canManageAdmins = currentUser.permissions?.manageAdmins || isSuperUser;
  
  // Filter lists
  const adminList = allUsers.filter(u => u.role === UserRole.ADMIN && u.username !== 'Coutinho');
  const userList = allUsers.filter(u => u.role === UserRole.USER);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <header className="bg-blue-900 text-white p-6 shadow-lg rounded-b-3xl relative z-20">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">Painel Admin</h1>
                <p className="text-blue-200 text-sm">
                    {currentView === 'dashboard' && 'Gestão de Colaboradores'}
                    {currentView === 'admins' && 'Gestão de Administradores'}
                    {currentView === 'users' && 'Lista de Usuários'}
                    {currentView === 'user-details' && 'Detalhes do Usuário'}
                </p>
            </div>
            <div>
                <button 
                    onClick={() => setShowMenu(!showMenu)} 
                    className="p-2 bg-blue-800 rounded-full hover:bg-blue-700 transition-colors"
                >
                    <Settings size={20} />
                </button>
            </div>
        </div>
      </header>

      {/* DASHBOARD VIEW */}
      {currentView === 'dashboard' && (
        <>
            <div className="px-4 -mt-6 relative z-30">
                <div className="bg-white rounded-xl shadow-md p-2 flex justify-around">
                    <button 
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'create' ? 'bg-blue-100 text-blue-800' : 'text-gray-500'}`}
                    >
                        Criar Usuário
                    </button>
                    <button 
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'upload' ? 'bg-blue-100 text-blue-800' : 'text-gray-500'}`}
                    >
                        Novo Conteúdo
                    </button>
                </div>
            </div>

            <div className="p-6">
                {activeTab === 'create' ? (
                     <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            {!currentUser.permissions?.createUsers && !isSuperUser ? (
                                <div className="text-center text-gray-500 py-8">Você não tem permissão para criar usuários.</div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-green-100 rounded-full text-green-600">
                                            <UserPlus size={24} />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-800">Cadastrar Funcionário</h2>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cadastro</label>
                                            <div className="flex gap-4">
                                                <label className={`flex-1 p-3 rounded-xl border cursor-pointer flex items-center justify-center gap-2 transition-all ${newUserIdType === 'matricula' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                                                    <input 
                                                        type="radio" 
                                                        name="idType" 
                                                        value="matricula" 
                                                        checked={newUserIdType === 'matricula'} 
                                                        onChange={() => {
                                                            setNewUserIdType('matricula');
                                                            setNewUser('');
                                                            setNewUserCpf('');
                                                        }} 
                                                        className="hidden"
                                                    />
                                                    <Hash size={18} /> Matrícula
                                                </label>
                                                <label className={`flex-1 p-3 rounded-xl border cursor-pointer flex items-center justify-center gap-2 transition-all ${newUserIdType === 'cpf' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                                                    <input 
                                                        type="radio" 
                                                        name="idType" 
                                                        value="cpf" 
                                                        checked={newUserIdType === 'cpf'} 
                                                        onChange={() => {
                                                            setNewUserIdType('cpf');
                                                            setNewUser('');
                                                            setNewUserCpf('');
                                                        }} 
                                                        className="hidden"
                                                    />
                                                    <CreditCard size={18} /> CPF
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {newUserIdType === 'matricula' ? 'Número da Matrícula' : 'Número do CPF'}
                                            </label>
                                            <input 
                                                type="text" 
                                                value={newUser}
                                                onChange={(e) => setNewUser(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder={newUserIdType === 'matricula' ? "Ex: 12345" : "Ex: 123.456.789-00"}
                                            />
                                        </div>

                                        {newUserIdType === 'matricula' && (
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 animate-fade-in">
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    CPF do Funcionário (Opcional - Para Login)
                                                </label>
                                                <input 
                                                    type="text" 
                                                    value={newUserCpf}
                                                    onChange={(e) => setNewUserCpf(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                                    placeholder="123.456.789-00"
                                                />
                                                <p className="text-xs text-blue-600 mt-2">
                                                    {newUserCpf 
                                                        ? "• Com o CPF informado, o usuário acessará a conta usando o CPF." 
                                                        : "• Sem CPF, será necessário informar o número da matrícula para o funcionário acessar."}
                                                </p>
                                            </div>
                                        )}

                                        <button 
                                            onClick={handleCreateUser}
                                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                        >
                                            Criar Acesso
                                        </button>
                                        {userMsg && (
                                            <div className={`flex items-start gap-2 text-sm p-3 rounded-lg ${userMsgType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                <CheckCircle size={16} className="mt-0.5 shrink-0" /> 
                                                <span>{userMsg}</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                             {!currentUser.permissions?.createContent && !isSuperUser ? (
                                <div className="text-center text-gray-500 py-8">Você não tem permissão para publicar conteúdo.</div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                                            <Upload size={24} />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-800">Publicar Conteúdo</h2>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="border border-gray-200 rounded-xl p-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <Users size={16}/> Quem deve receber?
                                            </label>
                                            <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                                                <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedUserIds.includes('all')}
                                                        onChange={() => toggleUserSelection('all')}
                                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">Todos os Colaboradores</span>
                                                </label>
                                                {userList.map(u => (
                                                    <label key={u.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer ml-2 border-l-2 border-transparent hover:border-gray-200">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedUserIds.includes(u.id)}
                                                            onChange={() => toggleUserSelection(u.id)}
                                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm text-gray-600">
                                                            {u.personalData?.fullName || `Usuário: ${u.username}`}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                            <input 
                                                type="text" 
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Referente</label>
                                            <input 
                                                type="date" 
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Conteúdo</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setContentType('file')}
                                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border ${contentType === 'file' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                                >
                                                    <FileText size={16}/> Arquivo
                                                </button>
                                                <button
                                                    onClick={() => setContentType('link')}
                                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border ${contentType === 'link' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                                >
                                                    <LinkIcon size={16}/> Link Web
                                                </button>
                                            </div>
                                        </div>

                                        {contentType === 'file' ? (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload de Arquivo</label>
                                                <div className="relative">
                                                    <input 
                                                        type="file" 
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                        id="file-upload"
                                                    />
                                                    <label htmlFor="file-upload" className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                                        <div className="text-center">
                                                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                                            <span className="mt-2 block text-sm text-gray-600">{file ? file.name : "Clique para selecionar arquivo"}</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Link</label>
                                                <input 
                                                    type="url" 
                                                    value={linkUrl}
                                                    onChange={(e) => setLinkUrl(e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        )}

                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <label className="block text-sm font-medium text-indigo-900 mb-1 flex items-center gap-2">
                                                Descrição (IA Gemini)
                                                {isAnalyzing && <Loader2 className="animate-spin h-3 w-3" />}
                                            </label>
                                            <textarea 
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                rows={3}
                                            />
                                        </div>

                                        <button 
                                            onClick={handleUpload}
                                            disabled={isAnalyzing}
                                            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                                        >
                                            {isAnalyzing ? 'Processando IA...' : 'Publicar no Portal'}
                                        </button>
                                        {uploadMsg && (
                                            <div className="flex items-center gap-2 text-indigo-600 text-sm bg-indigo-50 p-3 rounded-lg">
                                                <CheckCircle size={16} /> {uploadMsg}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
      )}

      {/* ADMINS MANAGEMENT VIEW */}
      {currentView === 'admins' && (
        <div className="p-6 space-y-6">
            <button onClick={() => setCurrentView('dashboard')} className="flex items-center text-blue-900 font-medium mb-4"><ChevronLeft size={20}/> Voltar</button>
            
            {/* Create Admin Form - Only for Super Users */}
            {isSuperUser ? (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Shield size={20} className="text-blue-600"/> Novo Administrador</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                type="text" 
                                placeholder="Nome de Usuário (Login)"
                                value={newAdminName}
                                onChange={(e) => setNewAdminName(e.target.value)}
                                className="p-3 border rounded-xl w-full"
                            />
                             <input 
                                type="text" 
                                placeholder="Senha"
                                value={newAdminPass}
                                onChange={(e) => setNewAdminPass(e.target.value)}
                                className="p-3 border rounded-xl w-full"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Permissões:</p>
                            <div className="grid grid-cols-2 gap-2">
                                 <label className="flex items-center gap-2 text-sm text-gray-600 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" checked={newAdminPerms.createUsers} onChange={(e) => setNewAdminPerms({...newAdminPerms, createUsers: e.target.checked})} /> Criar Usuários
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" checked={newAdminPerms.createContent} onChange={(e) => setNewAdminPerms({...newAdminPerms, createContent: e.target.checked})} /> Publicar Conteúdo
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" checked={newAdminPerms.editData} onChange={(e) => setNewAdminPerms({...newAdminPerms, editData: e.target.checked})} /> Editar Dados
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" checked={newAdminPerms.deleteData} onChange={(e) => setNewAdminPerms({...newAdminPerms, deleteData: e.target.checked})} /> Excluir Dados
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" checked={newAdminPerms.viewUsers} onChange={(e) => setNewAdminPerms({...newAdminPerms, viewUsers: e.target.checked})} /> Visualizar Usuários
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" checked={newAdminPerms.manageAdmins} onChange={(e) => setNewAdminPerms({...newAdminPerms, manageAdmins: e.target.checked})} /> Gerenciar Admins
                                </label>
                            </div>
                        </div>
                        <button onClick={handleCreateAdmin} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">Cadastrar Admin</button>
                        {adminMsg && <p className="text-green-600 text-sm text-center">{adminMsg}</p>}
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 p-4 rounded-xl text-yellow-800 text-sm text-center">
                    Apenas administradores principais podem criar novos administradores.
                </div>
            )}

            {/* Admin List */}
            <div className="space-y-3">
                <h3 className="text-gray-700 font-semibold ml-1">Administradores Existentes</h3>
                {adminList.map(admin => (
                    <div key={admin.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Shield size={18} /></div>
                            <div>
                                <p className="font-semibold text-gray-800">{admin.username}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">
                                    {[
                                        admin.permissions?.createUsers && 'Criar', 
                                        admin.permissions?.createContent && 'Publicar',
                                        admin.permissions?.editData && 'Editar',
                                        admin.permissions?.deleteData && 'Excluir',
                                        admin.permissions?.viewUsers && 'Ver Users',
                                        admin.permissions?.manageAdmins && 'Gerir Admins'
                                    ].filter(Boolean).join(' • ') || 'Acesso Limitado'}
                                </p>
                            </div>
                        </div>
                        {admin.username !== 'admin' && canDelete && (
                            <button onClick={() => handleDeleteUser(admin.id)} className="text-red-400 hover:text-red-600 p-2">
                                <Trash2 size={18} />
                            </button>
                        )}
                        {admin.username === 'admin' && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Sistema</span>}
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* USERS LIST VIEW */}
      {currentView === 'users' && (
        <div className="p-6 space-y-6">
            <button onClick={() => setCurrentView('dashboard')} className="flex items-center text-blue-900 font-medium mb-4"><ChevronLeft size={20}/> Voltar</button>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Users size={20} className="text-blue-600"/> Usuários Cadastrados</h3>

            {!canViewUsers ? (
                 <div className="bg-red-50 p-6 rounded-xl text-red-600 text-center">Você não tem permissão para visualizar a lista de usuários.</div>
            ) : (
                <div className="space-y-3">
                    {userList.length === 0 ? <p className="text-gray-400 text-center py-10">Nenhum usuário comum cadastrado.</p> : userList.map(u => (
                        <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-300 transition-colors" onClick={() => openUserDetails(u)}>
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-full text-green-600"><Users size={18} /></div>
                                <div>
                                    <p className="font-semibold text-gray-800">{u.personalData?.fullName || u.username}</p>
                                    <p className="text-xs text-gray-500">{u.idType === 'matricula' ? `Mat: ${u.username}` : `CPF: ${u.username}`}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {canEdit && <button className="p-2 text-gray-400 hover:text-blue-600"><Edit size={18} /></button>}
                                {canDelete && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }} className="p-2 text-gray-400 hover:text-red-600">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* USER DETAILS VIEW */}
      {currentView === 'user-details' && selectedUserForDetails && (
          <div className="p-6 space-y-6">
             <button onClick={() => setCurrentView('users')} className="flex items-center text-blue-900 font-medium mb-4"><ChevronLeft size={20}/> Voltar</button>
             
             {!canViewUsers ? (
                 <div className="bg-red-50 p-6 rounded-xl text-red-600 text-center">Você não tem permissão para visualizar os detalhes deste usuário.</div>
             ) : (
                 <>
                    {/* User Header */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-1">{selectedUserForDetails.personalData?.fullName || selectedUserForDetails.username}</h2>
                                <p className="text-sm text-gray-500">
                                    {selectedUserForDetails.idType === 'matricula' ? 'Matrícula' : 'CPF'}: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{selectedUserForDetails.username}</span>
                                </p>
                            </div>
                            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold uppercase">
                                Ativo
                            </div>
                        </div>

                        {/* Data Sections */}
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            {/* Personal Info */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><UserCog size={16}/> Dados Pessoais</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-gray-50 py-1">
                                        <span className="text-gray-500">RG</span>
                                        <span className="text-gray-800 font-medium">{selectedUserForDetails.personalData?.rg || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 py-1">
                                        <span className="text-gray-500">Nascimento</span>
                                        <span className="text-gray-800 font-medium">{selectedUserForDetails.personalData?.birthDate ? new Date(selectedUserForDetails.personalData.birthDate).toLocaleDateString('pt-BR') : '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 py-1">
                                        <span className="text-gray-500">Telefone</span>
                                        <span className="text-gray-800 font-medium">{selectedUserForDetails.personalData?.phone || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 py-1">
                                        <span className="text-gray-500">{selectedUserForDetails.idType === 'matricula' ? 'CPF' : 'Matrícula'} (Secundário)</span>
                                        <span className="text-gray-800 font-medium">{selectedUserForDetails.personalData?.secondaryId || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 py-1">
                                        <span className="text-gray-500">PIS/PASEP</span>
                                        <span className="text-gray-800 font-medium">{selectedUserForDetails.personalData?.pisPasep || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Address Info */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin size={16}/> Endereço</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-gray-50 py-1">
                                        <span className="text-gray-500">Cidade/UF</span>
                                        <span className="text-gray-800 font-medium">{selectedUserForDetails.personalData?.city}/{selectedUserForDetails.personalData?.state}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 py-1">
                                        <span className="text-gray-500">Bairro</span>
                                        <span className="text-gray-800 font-medium">{selectedUserForDetails.personalData?.neighborhood || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 py-1">
                                        <span className="text-gray-500">CEP</span>
                                        <span className="text-gray-800 font-medium">{selectedUserForDetails.personalData?.cep || '-'}</span>
                                    </div>
                                    <div className="flex flex-col border-b border-gray-50 py-1">
                                        <span className="text-gray-500 text-xs">Logradouro</span>
                                        <span className="text-gray-800 font-medium">{selectedUserForDetails.personalData?.address}, {selectedUserForDetails.personalData?.houseNumber} {selectedUserForDetails.personalData?.complement ? `(${selectedUserForDetails.personalData?.complement})` : ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bank Data */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                             <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><CreditCard size={16}/> Dados Bancários / Pix</h4>
                             <div className="bg-gray-50 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-600">Banco: <span className="font-semibold text-gray-800">{selectedUserForDetails.personalData?.bankData?.bankName || '-'}</span></p>
                                    <p className="text-sm text-gray-600">Ag: <span className="font-semibold text-gray-800">{selectedUserForDetails.personalData?.bankData?.agency || '-'}</span> CC: <span className="font-semibold text-gray-800">{selectedUserForDetails.personalData?.bankData?.account || '-'}</span></p>
                                    <p className="text-sm text-gray-600">Titular: <span className="font-semibold text-gray-800">{selectedUserForDetails.personalData?.bankData?.holderName || '-'}</span></p>
                                    <p className="text-sm text-gray-600 mt-2">Chave Pix ({selectedUserForDetails.personalData?.bankData?.pixType}):</p>
                                    <p className="font-mono text-gray-800 bg-white border px-2 py-1 rounded inline-block">{selectedUserForDetails.personalData?.bankData?.pixKey || 'Não cadastrada'}</p>
                                </div>
                                
                                {selectedUserForDetails.personalData?.bankData?.pixKey && selectedUserForDetails.personalData.bankData.holderName && (
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button 
                                            onClick={() => handleCopyPix(selectedUserForDetails.personalData?.bankData?.pixKey || '')}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                                        >
                                            <Copy size={16}/> Copiar
                                        </button>
                                        <button 
                                            onClick={() => setShowPixQr(!showPixQr)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            <QrCode size={16}/> {showPixQr ? 'Ocultar' : 'Ver QR'}
                                        </button>
                                    </div>
                                )}
                             </div>
                             
                             {showPixQr && selectedUserForDetails.personalData?.bankData?.pixKey && (
                                 <div className="mt-4 flex justify-center animate-fade-in">
                                     <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
                                         <p className="text-xs text-gray-500 mb-2">QR Code gerado para a chave:</p>
                                         {/* Using a public API for QR Code generation for demonstration */}
                                         <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedUserForDetails.personalData.bankData.pixKey)}`} 
                                            alt="QR Code Pix" 
                                            className="mx-auto"
                                         />
                                         <p className="text-sm font-bold mt-2 text-gray-800">{selectedUserForDetails.personalData.bankData.holderName}</p>
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>

                    <h3 className="font-semibold text-gray-700">Histórico de Conteúdo</h3>
                    <div className="space-y-3">
                        {userContentHistory.length === 0 ? <p className="text-gray-400 text-sm">Nenhum conteúdo enviado para este usuário.</p> : userContentHistory.map(c => (
                            <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center group">
                                <div className="flex gap-3 items-center">
                                    <div className={`p-2 rounded-lg ${c.contentType === 'link' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}`}>
                                        {c.contentType === 'link' ? <LinkIcon size={20}/> : <File size={20}/>}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{c.title}</p>
                                        <p className="text-xs text-gray-500">{new Date(c.date).toLocaleDateString()} • {c.contentType === 'link' ? 'Link' : c.fileType}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] sm:max-w-md truncate">{c.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button 
                                        onClick={() => handleDownloadContent(c)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title={c.contentType === 'link' ? "Acessar Link" : "Baixar Arquivo"}
                                     >
                                         {c.contentType === 'link' ? <ExternalLink size={18}/> : <Download size={18}/>}
                                     </button>

                                    {canDelete && (
                                        <button onClick={() => handleDeleteContent(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                            <Trash2 size={18}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
             )}
          </div>
      )}

      {/* Floating Settings Menu (Moved outside Header for Z-Index fix) */}
      {showMenu && (
        <>
            <div className="fixed inset-0 z-[90]" onClick={() => setShowMenu(false)}></div>
            <div className="fixed right-6 top-20 bg-white rounded-xl shadow-xl border border-gray-100 w-48 overflow-hidden text-gray-700 z-[100]">
                <button onClick={() => { setCurrentView('dashboard'); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium border-b border-gray-50 flex items-center gap-2">
                    <LayoutDashboard size={16} /> Dashboard
                </button>
                {/* Permissão para ver administradores */}
                {canManageAdmins && (
                    <button onClick={() => { setCurrentView('admins'); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium border-b border-gray-50 flex items-center gap-2">
                        <Shield size={16} /> Administradores
                    </button>
                )}
                {/* Permissão para ver usuários */}
                {canViewUsers && (
                    <button onClick={() => { setCurrentView('users'); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium border-b border-gray-50 flex items-center gap-2">
                        <Users size={16} /> Usuários
                    </button>
                )}
                <button onClick={onLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2">
                    <LogOut size={16} /> Sair
                </button>
            </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;