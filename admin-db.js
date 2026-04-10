/* =====================================================================
   admin-db.js — THERMATIS — NoSQL JSON Database Management
   Gerencia exportação, importação e limpeza de dados (Versão Unificada)
   ===================================================================== */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  setupDatabaseActions();
});

function setupDatabaseActions() {
  document.getElementById('btnExportarDados')?.addEventListener('click', () => {
     if (typeof exportDataUnificado === 'function') exportDataUnificado();
  });
  
  document.getElementById('inputImportarDados')?.addEventListener('change', importarDadosUnificado);
  document.getElementById('btnLimparDados')?.addEventListener('click', () => {
     if (typeof resetFactory === 'function') resetFactory();
  });
}

/**
 * Lê o arquivo JSON enviado pelo usuário e restaura o sistema
 */
function importarDadosUnificado(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const db = JSON.parse(e.target.result);

      if (!confirm('ATENÇÃO: Isso vai substituir todos os dados atuais (Site, Orçamentos e Clientes). Deseja continuar?')) {
        event.target.value = '';
        return;
      }

      // Restauração das coleções dinâmicas
      if (db.orcamentos) localStorage.setItem('climamax_orcamentos', JSON.stringify(db.orcamentos));
      if (db.clientes)   localStorage.setItem('climamax_clientes',   JSON.stringify(db.clientes));
      if (db.visitas)    localStorage.setItem('climamax_visitas',    JSON.stringify(db.visitas));
      
      // Restauração da Store Global (v2.0) ou legado
      if (db.store) {
        localStorage.setItem('thermatis_master_store', JSON.stringify(db.store));
      } else if (db.site_content || db.config) {
        // Fallback para backups antigos (serão migrados pelo admin-cms.js no próximo reload)
        if (db.site_content) localStorage.setItem('thermatis_site_content', JSON.stringify(db.site_content));
        if (db.config) {
           if (db.config.user) localStorage.setItem('climamax_auth_user', db.config.user);
           if (db.config.pass) localStorage.setItem('climamax_auth_pass', db.config.pass);
        }
      }

      showToast('🚀 Sistema restaurado com sucesso! Recarregando...', 'success');
      setTimeout(() => location.reload(), 1500);

    } catch (err) {
      console.error(err);
      showToast('❌ Erro: arquivo de backup inválido.', 'error');
    }
  };
  reader.readAsText(file);
}
