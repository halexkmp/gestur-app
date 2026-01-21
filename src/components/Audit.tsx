import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  limit, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuditLog as BaseAuditLog } from '../types';

type AuditLog = BaseAuditLog & {
  profiles: { full_name: string } | null;
};

export default function Audit() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadAuditLogs();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadAuditLogs = async () => {
    try {
      let querySnapshot;
      try {
        const q = query(
          collection(db, 'audit_log'),
          orderBy('created_at', 'desc'),
          limit(100)
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        console.error('Error loading audit logs with orderBy:', error);
        // Fallback: simple query, manual sort and limit
        const allDocsSnap = await getDocs(collection(db, 'audit_log'));
        const sortedDocs = allDocsSnap.docs
          .sort((a, b) => {
            const dateA = a.data().created_at?.toDate() || 0;
            const dateB = b.data().created_at?.toDate() || 0;
            return dateB - dateA;
          })
          .slice(0, 100);
        querySnapshot = { docs: sortedDocs };
      }
      
      const data = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const logData = docSnapshot.data();
        
        let fullName = 'Sistema';
        if (logData.user_id) {
          const profileDoc = await getDoc(doc(db, 'user', logData.user_id));
          if (profileDoc.exists()) {
            fullName = profileDoc.data().full_name;
          }
        }

        return {
          id: docSnapshot.id,
          ...logData,
          profiles: { full_name: fullName },
          created_at: logData.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
        } as AuditLog;
      }));

      setLogs(data);
      setLoading(false);
    } catch (error) {
      console.error('General error in loadAuditLogs:', error);
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg flex flex-col items-center gap-3">
          <AlertCircle className="w-12 h-12" />
          <h2 className="text-xl font-semibold">Acesso Negado</h2>
          <p>Apenas administradores podem visualizar os logs de auditoria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Auditoria</h1>
        <p className="text-gray-600 mt-1">Histórico completo de modificações no sistema</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 mt-2">Carregando...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Logs de Auditoria
            </h2>
          </div>

          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum log de auditoria encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tabela</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ação</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Usuário</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {log.table_name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.action === 'INSERT' ? 'bg-green-100 text-green-700' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.profiles?.full_name || 'Sistema'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-700">
                            Ver detalhes
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                            {log.old_data && (
                              <div className="mb-2">
                                <strong>Anterior:</strong>
                                <pre className="mt-1 overflow-x-auto">
                                  {JSON.stringify(log.old_data, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_data && (
                              <div>
                                <strong>Novo:</strong>
                                <pre className="mt-1 overflow-x-auto">
                                  {JSON.stringify(log.new_data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
