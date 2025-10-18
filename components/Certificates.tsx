import React from 'react';
import Card from './ui/Card';

// Icons
const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ScaleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>;

const certificateGroups = [
  {
    title: 'Certidões Fiscais',
    certificates: [
      {
        name: 'CND Federal',
        description: 'Certidão de Débitos Relativos a Créditos Tributários Federais e à Dívida Ativa da União.',
        url: 'https://solucoes.receita.fazenda.gov.br/Servicos/CertidaoInternet/PJ/Emitir',
        icon: <FileTextIcon />,
      },
      {
        name: 'CND Estadual - MS',
        description: 'Certidão Negativa de Débitos Estaduais para o Mato Grosso do Sul.',
        url: 'https://servicos.efaz.ms.gov.br/certidaonegativadebitos/',
        icon: <FileTextIcon />,
      },
       {
        name: 'CND Municipal - Sidrolândia',
        description: 'Certidão Negativa de Débitos para o município de Sidrolândia - MS.',
        url: 'https://sidrolandia.ms.gov.br/portal-do-contribuinte',
        icon: <FileTextIcon />,
      },
    ],
  },
  {
    title: 'Trabalhistas e Outras',
    certificates: [
       {
        name: 'CND Trabalhista (TST)',
        description: 'Certidão Negativa de Débitos Trabalhistas emitida pelo Tribunal Superior do Trabalho.',
        url: 'https://www.tst.jus.br/certidao',
        icon: <BriefcaseIcon />,
      },
      {
        name: 'Regularidade do FGTS (CRF)',
        description: 'Consulta a regularidade do empregador junto ao FGTS, emitida pela Caixa Econômica Federal.',
        url: 'https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf',
        icon: <BriefcaseIcon />,
      },
       {
        name: 'Justiça Federal (TRF3)',
        description: 'Certidão de Distribuição Cível, Criminal e Fiscal para a Justiça Federal da 3ª Região (SP/MS).',
        url: 'https://www.trf3.jus.br/servicos/certidoes/certidao-de-distribuicao/',
        icon: <ScaleIcon />,
      },
    ]
  }
];

const Certificates: React.FC = () => {
  return (
    <Card>
      <h2 className="text-2xl font-bold text-primary mb-6">Emissão de Certidões</h2>
      <div className="space-y-8">
        {certificateGroups.map(group => (
          <div key={group.title}>
            <h3 className="text-xl font-semibold text-secondary mb-4 pb-2 border-b-2 border-light">{group.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.certificates.map(cert => (
                <div key={cert.name} className="bg-extralight p-4 rounded-lg border border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center mb-2">
                        <span className="text-accent">{cert.icon}</span>
                        <h4 className="font-bold text-primary ml-2">{cert.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{cert.description}</p>
                  </div>
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto block w-full text-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent transition-colors text-sm font-semibold"
                  >
                    Emitir Certidão
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Certificates;