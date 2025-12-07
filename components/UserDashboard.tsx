import React, { useEffect, useState } from 'react';
import { User, AppContent } from '../types';
import { getContent } from '../services/storageService';
import { FileText, Image, File, Download, LogOut, ExternalLink, Link as LinkIcon } from 'lucide-react';

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout }) => {
  const [contents, setContents] = useState<AppContent[]>([]);

  useEffect(() => {
    // Filter content: Show if 'all' is in targets OR if user.id is in targets
    const allContent = getContent();
    const filteredContent = allContent.filter(c => 
        c.targetUserIds.includes('all') || c.targetUserIds.includes(user.id)
    );
    setContents(filteredContent);
  }, [user]);

  const getIcon = (type: string | undefined, contentType: 'file' | 'link') => {
    if (contentType === 'link') return <LinkIcon className="text-indigo-500" />;

    switch (type) {
      case 'pdf': return <FileText className="text-red-500" />;
      case 'jpg':
      case 'png': return <Image className="text-blue-500" />;
      default: return <File className="text-gray-500" />;
    }
  };

  const handleDownload = (content: AppContent) => {
    if (content.contentType === 'file' && content.fileData) {
        // Create a temporary link to download the base64 data
        const link = document.createElement('a');
        link.href = content.fileData;
        link.download = content.fileName || 'arquivo';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleOpenLink = (url?: string) => {
    if (url) {
        window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-6 relative">
      <header className="bg-white p-6 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold text-gray-800">Olá, {user.personalData?.fullName.split(' ')[0]}</h1>
                <p className="text-gray-400 text-xs mt-1">Matrícula: {user.username}</p>
            </div>
            <button onClick={onLogout} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
                <LogOut size={20} />
            </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 ml-1">Arquivos & Links Recentes</h2>
        
        {contents.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
                <File className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Nenhum conteúdo disponível no momento.</p>
            </div>
        ) : (
            contents.map(content => (
                <div key={content.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="p-3 bg-gray-50 rounded-xl h-fit">
                                {getIcon(content.fileType, content.contentType)}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">{content.title}</h3>
                                <p className="text-xs text-gray-400">{new Date(content.date).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-md uppercase ${content.contentType === 'link' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                            {content.contentType === 'link' ? 'WEB' : content.fileType}
                        </span>
                    </div>
                    
                    {content.description && (
                        <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-400">
                            {content.description}
                        </p>
                    )}

                    {content.contentType === 'file' ? (
                        <button 
                            onClick={() => handleDownload(content)}
                            className="w-full py-2 mt-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Download size={16} /> Baixar Arquivo
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleOpenLink(content.linkUrl)}
                            className="w-full py-2 mt-1 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <ExternalLink size={16} /> Acessar Link
                        </button>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default UserDashboard;