import React from 'react';
import Card from './ui/Card';

const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l.586-.586a2 2 0 012.828 0l.586.586M15.707 4.293l.586-.586a2 2 0 012.828 0l.586.586M9 11v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1a2 2 0 012-2h1a2 2 0 012 2zm10-1v1a2 2 0 01-2 2h-1a2 2 0 01-2-2v-1a2 2 0 012-2h1a2 2 0 012 2z" /></svg>;

const portals = [
    {
        name: 'e-CAC (Receita Federal)',
        description: 'Acesse o Centro Virtual de Atendimento para consultar a situação fiscal federal, débitos, parcelamentos, emitir DARF e muito mais.',
        url: 'https://cav.receita.fazenda.gov.br/autenticacao/login',
        color: 'bg-secondary'
    },
    {
        name: 'SEFAZ/MS',
        description: 'Portal da Secretaria de Estado de Fazenda do Mato Grosso do Sul para consultas de débitos de ICMS, ITCD e situação cadastral estadual.',
        url: 'https://www.sefaz.ms.gov.br/',
        color: 'bg-blue-600'
    },
    {
        name: 'Simples Nacional',
        description: 'Portal oficial para empresas do Simples Nacional. Realize o cálculo do PGDAS-D, consulte débitos e acompanhe o status da empresa.',
        url: 'http://www8.receita.fazenda.gov.br/SimplesNacional/',
        color: 'bg-green-600'
    }
]

const FiscalSituation: React.FC = () => {
  return (
    <Card>
      <h2 className="text-2xl font-bold text-primary mb-2">Central de Portais Fiscais</h2>
      <p className="text-gray-600 mb-6">Acesse os principais portais governamentais para consultar a situação fiscal de seus clientes. É necessário o Certificado Digital para acesso a algumas áreas.</p>

      <div className="space-y-4">
        {portals.map(portal => (
            <div key={portal.name} className="rounded-lg shadow-md overflow-hidden border">
                <div className="p-6 bg-white flex flex-col md:flex-row items-start md:items-center">
                    <div className={`hidden md:flex flex-shrink-0 items-center justify-center h-16 w-16 rounded-full ${portal.color} mr-6`}>
                       <GlobeIcon />
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-xl font-semibold text-primary">{portal.name}</h3>
                        <p className="text-gray-600 mt-1">{portal.description}</p>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                         <a
                            href={portal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-6 py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-accent transition-colors"
                        >
                            Acessar Portal <ArrowRightIcon />
                        </a>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </Card>
  );
};

export default FiscalSituation;