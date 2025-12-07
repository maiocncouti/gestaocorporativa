import React, { useState, useEffect } from 'react';
import { User, PersonalData } from '../types';
import { saveUser } from '../services/storageService';
import { ChevronRight, Save, User as UserIcon, MapPin, CreditCard, Lock, Phone } from 'lucide-react';

interface UserRegistrationProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

// Interfaces para a API do IBGE
interface IBGEUF {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
}

const UserRegistration: React.FC<UserRegistrationProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PersonalData>({
    fullName: '',
    rg: '',
    birthDate: '',
    phone: '',
    secondaryId: user.personalData?.secondaryId || '', // Load secondary ID if admin set it (e.g. matricula linked to cpf)
    voterTitle: '',
    reservistId: '',
    pisPasep: '',
    cep: '',
    city: '',
    state: '',
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
  });

  // States para listas de localidade
  const [ufList, setUfList] = useState<IBGEUF[]>([]);
  const [cityList, setCityList] = useState<IBGECity[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Busca Estados ao carregar o componente
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setUfList(data))
      .catch(err => console.error("Erro ao buscar estados:", err));
  }, []);

  // Busca Cidades quando o Estado muda
  useEffect(() => {
    if (formData.state) {
      setLoadingCities(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`)
        .then(res => res.json())
        .then(data => {
            setCityList(data);
            setLoadingCities(false);
        })
        .catch(err => {
            console.error("Erro ao buscar cidades:", err);
            setLoadingCities(false);
        });
    } else {
        setCityList([]);
    }
  }, [formData.state]);

  const handleChange = (field: keyof PersonalData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBankChange = (field: keyof PersonalData['bankData'], value: string) => {
    setFormData(prev => ({
      ...prev,
      bankData: { ...prev.bankData, [field]: value }
    }));
  };

  const handleSubmit = () => {
    const updatedUser: User = {
      ...user,
      isFirstAccess: false,
      personalData: formData
    };
    saveUser(updatedUser);
    onComplete(updatedUser);
  };

  const steps = [
    { title: "Dados Pessoais", icon: <UserIcon size={20} /> },
    { title: "Endereço", icon: <MapPin size={20} /> },
    { title: "Dados Bancários", icon: <CreditCard size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-white">
       <header className="bg-blue-600 text-white p-6 shadow-md">
            <h1 className="text-xl font-bold">Complete seu Cadastro</h1>
            <p className="text-blue-100 text-sm">Passo {step} de 3</p>
            <div className="flex mt-4 gap-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-blue-400'}`} />
                ))}
            </div>
      </header>

      <div className="p-6 pb-24">
        {step === 1 && (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    {steps[0].icon} {steps[0].title}
                </h2>
                
                <div className="space-y-4">
                    {/* Read-Only Credentials Section */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                         <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">
                                {user.idType === 'matricula' 
                                    ? 'Matrícula (Cadastrado como Usuário Pela Empresa)' 
                                    : 'CPF (Cadastrado como Usuário Pela Empresa)'}
                            </label>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-blue-200 text-gray-500">
                                <UserIcon size={16} />
                                <span className="text-sm font-medium">{user.username}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">
                                Senha para acesso futuro
                            </label>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-blue-200 text-gray-500">
                                <Lock size={16} />
                                <span className="text-sm font-medium">{user.password}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-2"></div>

                    {/* Personal Data Inputs */}
                    <input type="text" placeholder="Nome Completo" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" value={formData.fullName} onChange={e => handleChange('fullName', e.target.value)} />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="RG" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.rg} onChange={e => handleChange('rg', e.target.value)} />
                        <input type="date" placeholder="Nascimento" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.birthDate} onChange={e => handleChange('birthDate', e.target.value)} />
                    </div>

                    <div className="relative">
                        <Phone className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                        <input type="tel" placeholder="Telefone com DDD" className="w-full pl-10 p-3 border rounded-xl bg-gray-50" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                    </div>

                    {/* Conditional Input Logic */}
                    {user.idType === 'matricula' ? (
                         <div className="relative">
                            <CreditCard className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                            <input 
                                type="text" 
                                placeholder="Informe seu CPF" 
                                className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={formData.secondaryId} 
                                onChange={e => handleChange('secondaryId', e.target.value)} 
                            />
                        </div>
                    ) : (
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                            <input 
                                type="text" 
                                placeholder="Informe sua Matrícula" 
                                className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={formData.secondaryId} 
                                onChange={e => handleChange('secondaryId', e.target.value)} 
                            />
                        </div>
                    )}

                    <input type="text" placeholder="Título de Eleitor" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.voterTitle} onChange={e => handleChange('voterTitle', e.target.value)} />
                    <input type="text" placeholder="Cert. Reservista (Opcional)" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.reservistId} onChange={e => handleChange('reservistId', e.target.value)} />
                    <input type="text" placeholder="PIS/PASEP/NIS" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.pisPasep} onChange={e => handleChange('pisPasep', e.target.value)} />
                </div>
            </div>
        )}

        {step === 2 && (
             <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    {steps[1].icon} {steps[1].title}
                </h2>
                <div className="space-y-3">
                    <input type="text" placeholder="CEP" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.cep} onChange={e => handleChange('cep', e.target.value)} />
                    
                    {/* State and City Selects */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <select 
                                className="w-full p-3 border rounded-xl bg-gray-50 outline-none" 
                                value={formData.state} 
                                onChange={e => {
                                    handleChange('state', e.target.value);
                                    handleChange('city', ''); // Reset city when state changes
                                }}
                            >
                                <option value="">UF</option>
                                {ufList.map(uf => (
                                    <option key={uf.id} value={uf.sigla}>{uf.sigla}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <select 
                                className="w-full p-3 border rounded-xl bg-gray-50 outline-none disabled:bg-gray-100" 
                                value={formData.city} 
                                onChange={e => handleChange('city', e.target.value)}
                                disabled={!formData.state || loadingCities}
                            >
                                <option value="">{loadingCities ? 'Carregando...' : 'Cidade'}</option>
                                {cityList.map(city => (
                                    <option key={city.id} value={city.nome}>{city.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <input type="text" placeholder="Endereço (Rua, Av...)" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.address} onChange={e => handleChange('address', e.target.value)} />
                    
                    <div className="grid grid-cols-3 gap-3">
                        <input type="text" placeholder="Número" className="col-span-1 p-3 border rounded-xl bg-gray-50" value={formData.houseNumber} onChange={e => handleChange('houseNumber', e.target.value)} />
                        <input type="text" placeholder="Bairro" className="col-span-2 p-3 border rounded-xl bg-gray-50" value={formData.neighborhood} onChange={e => handleChange('neighborhood', e.target.value)} />
                    </div>

                     <input type="text" placeholder="Complemento (Opcional)" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.complement} onChange={e => handleChange('complement', e.target.value || '')} />
                </div>
             </div>
        )}

        {step === 3 && (
             <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    {steps[2].icon} {steps[2].title}
                </h2>
                <div className="space-y-3">
                     <select className="w-full p-3 border rounded-xl bg-gray-50" value={formData.bankData.pixType} onChange={e => handleBankChange('pixType', e.target.value)}>
                        <option value="">Tipo de Chave Pix</option>
                        <option value="cpf">CPF</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Celular</option>
                        <option value="random">Aleatória</option>
                     </select>
                     <input type="text" placeholder="Chave Pix" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.bankData.pixKey} onChange={e => handleBankChange('pixKey', e.target.value)} />
                     
                     <input type="text" placeholder="Nome Completo do Titular" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.bankData.holderName} onChange={e => handleBankChange('holderName', e.target.value)} />
                     
                     <input type="text" placeholder="Nome do Banco" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.bankData.bankName} onChange={e => handleBankChange('bankName', e.target.value)} />
                     <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Agência" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.bankData.agency} onChange={e => handleBankChange('agency', e.target.value)} />
                        <input type="text" placeholder="Conta" className="w-full p-3 border rounded-xl bg-gray-50" value={formData.bankData.account} onChange={e => handleBankChange('account', e.target.value)} />
                     </div>
                </div>
             </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-gray-100 flex justify-between gap-4">
        {step > 1 && (
             <button onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium">
                Voltar
            </button>
        )}
        {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold flex justify-center items-center gap-2 shadow-lg shadow-blue-200">
                Próximo <ChevronRight size={20} />
            </button>
        ) : (
            <button onClick={handleSubmit} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex justify-center items-center gap-2 shadow-lg shadow-green-200">
                Salvar e Acessar <Save size={20} />
            </button>
        )}
      </div>
    </div>
  );
};

export default UserRegistration;