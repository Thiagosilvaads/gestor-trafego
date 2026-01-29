/**
 * SCRIPT: Link Checker - Verificador de Links
 * 
 * O QUE FAZ:
 * - Verifica todas as URLs finais dos anúncios
 * - Detecta erros 404, 500, timeout, etc
 * - Alerta imediatamente quando encontra link quebrado
 * - Evita gastar dinheiro mandando tráfego para páginas que não funcionam
 * 
 * FREQUÊNCIA RECOMENDADA: Diária (links podem quebrar a qualquer momento)
 * 
 * IMPORTANTE: Este script faz requisições HTTP para verificar os links.
 * Se você tiver muitos anúncios, pode levar alguns minutos.
 * 
 * CONFIGURAÇÃO:
 * 1. Substituir EMAIL_DESTINATARIO
 * 2. Ajustar TIMEOUT_SEGUNDOS se necessário
 */

// ============ CONFIGURAÇÕES ============
var CONFIG = {
  // Email para alertas
  EMAIL_DESTINATARIO: 'SUBSTITUIR_EMAIL',
  
  // Timeout para cada requisição (segundos)
  TIMEOUT_SEGUNDOS: 10,
  
  // Códigos HTTP considerados erro
  CODIGOS_ERRO: [404, 500, 502, 503, 504],
  
  // Verificar também sitelinks
  VERIFICAR_SITELINKS: true,
  
  // Máximo de URLs para verificar (evitar timeout do script)
  MAX_URLS: 200,
  
  // Pausar anúncios com erro automaticamente? (CUIDADO!)
  PAUSAR_AUTOMATICO: false,
  
  // Debug
  DEBUG: false
};

// ============ FUNÇÃO PRINCIPAL ============
function main() {
  Logger.log('=== LINK CHECKER - ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + ' ===');
  Logger.log('Conta: ' + AdsApp.currentAccount().getName());
  
  var urlsVerificadas = {};
  var errosEncontrados = [];
  var urlsOk = 0;
  
  // Coletar URLs dos anúncios
  Logger.log('');
  Logger.log('--- Coletando URLs dos anúncios ---');
  
  var anuncios = AdsApp.ads()
    .withCondition('Status = ENABLED')
    .withCondition('CampaignStatus = ENABLED')
    .withCondition('AdGroupStatus = ENABLED')
    .get();
  
  var urlsParaVerificar = [];
  
  while (anuncios.hasNext() && urlsParaVerificar.length < CONFIG.MAX_URLS) {
    var anuncio = anuncios.next();
    var urls = anuncio.urls();
    
    if (urls) {
      var finalUrl = urls.getFinalUrl();
      
      if (finalUrl && !urlsVerificadas[finalUrl]) {
        urlsVerificadas[finalUrl] = true;
        urlsParaVerificar.push({
          url: finalUrl,
          tipo: 'Anúncio',
          campanha: anuncio.getCampaign().getName(),
          grupo: anuncio.getAdGroup().getName(),
          entidade: anuncio
        });
      }
    }
  }
  
  Logger.log('URLs únicas encontradas: ' + urlsParaVerificar.length);
  
  // Coletar URLs dos sitelinks
  if (CONFIG.VERIFICAR_SITELINKS) {
    Logger.log('');
    Logger.log('--- Coletando URLs dos sitelinks ---');
    
    var sitelinks = AdsApp.extensions().sitelinks().get();
    
    while (sitelinks.hasNext() && urlsParaVerificar.length < CONFIG.MAX_URLS) {
      var sitelink = sitelinks.next();
      var urls = sitelink.urls();
      
      if (urls) {
        var finalUrl = urls.getFinalUrl();
        
        if (finalUrl && !urlsVerificadas[finalUrl]) {
          urlsVerificadas[finalUrl] = true;
          urlsParaVerificar.push({
            url: finalUrl,
            tipo: 'Sitelink',
            campanha: '-',
            grupo: '-',
            entidade: sitelink
          });
        }
      }
    }
    
    Logger.log('Total URLs (incluindo sitelinks): ' + urlsParaVerificar.length);
  }
  
  // Verificar cada URL
  Logger.log('');
  Logger.log('--- Verificando URLs ---');
  
  for (var i = 0; i < urlsParaVerificar.length; i++) {
    var item = urlsParaVerificar[i];
    var resultado = verificarUrl(item.url);
    
    if (resultado.erro) {
      errosEncontrados.push({
        url: item.url,
        tipo: item.tipo,
        campanha: item.campanha,
        grupo: item.grupo,
        codigoHttp: resultado.codigo,
        mensagem: resultado.mensagem,
        entidade: item.entidade
      });
      
      Logger.log('❌ ERRO ' + resultado.codigo + ': ' + item.url);
      
      // Pausar automaticamente se configurado
      if (CONFIG.PAUSAR_AUTOMATICO && item.tipo === 'Anúncio') {
        try {
          item.entidade.pause();
          Logger.log('   ⏸️ Anúncio pausado automaticamente');
        } catch (e) {
          Logger.log('   ⚠️ Não foi possível pausar: ' + e.message);
        }
      }
    } else {
      urlsOk++;
      Logger.log('✅ OK: ' + item.url);
    }
    
    // Pequena pausa para não sobrecarregar
    if (i % 10 === 0 && i > 0) {
      Utilities.sleep(500);
    }
  }
  
  // Resumo
  Logger.log('');
  Logger.log('=== RESUMO ===');
  Logger.log('URLs verificadas: ' + urlsParaVerificar.length);
  Logger.log('URLs OK: ' + urlsOk);
  Logger.log('URLs com erro: ' + errosEncontrados.length);
  
  // Enviar email se houver erros
  if (errosEncontrados.length > 0) {
    enviarEmail(errosEncontrados, urlsParaVerificar.length);
  } else {
    Logger.log('');
    Logger.log('✅ Todos os links estão funcionando!');
  }
}

// ============ VERIFICAÇÃO DE URL ============
function verificarUrl(url) {
  try {
    var opcoes = {
      'muteHttpExceptions': true,
      'followRedirects': true,
      'timeout': CONFIG.TIMEOUT_SEGUNDOS * 1000
    };
    
    var resposta = UrlFetchApp.fetch(url, opcoes);
    var codigo = resposta.getResponseCode();
    
    // Verificar se é código de erro
    if (CONFIG.CODIGOS_ERRO.indexOf(codigo) !== -1) {
      return {
        erro: true,
        codigo: codigo,
        mensagem: getDescricaoCodigo(codigo)
      };
    }
    
    // Códigos 2xx e 3xx são OK
    if (codigo >= 200 && codigo < 400) {
      return {
        erro: false,
        codigo: codigo
      };
    }
    
    // Outros códigos (4xx que não estão na lista)
    return {
      erro: true,
      codigo: codigo,
      mensagem: 'Código HTTP inesperado'
    };
    
  } catch (e) {
    // Timeout ou erro de conexão
    return {
      erro: true,
      codigo: 0,
      mensagem: e.message || 'Erro de conexão/timeout'
    };
  }
}

function getDescricaoCodigo(codigo) {
  var descricoes = {
    404: 'Página não encontrada',
    500: 'Erro interno do servidor',
    502: 'Bad Gateway',
    503: 'Serviço indisponível',
    504: 'Gateway Timeout'
  };
  
  return descricoes[codigo] || 'Erro HTTP ' + codigo;
}

// ============ EMAIL ============
function enviarEmail(erros, totalVerificado) {
  if (CONFIG.DEBUG) {
    Logger.log('DEBUG: Email não enviado');
    return;
  }
  
  var assunto = '🔗 ' + erros.length + ' Link(s) Quebrado(s) - ' + AdsApp.currentAccount().getName();
  
  var corpo = '<html><body style="font-family: Arial, sans-serif;">';
  corpo += '<h2>🔗 Links Quebrados Detectados</h2>';
  corpo += '<p>Conta: <strong>' + AdsApp.currentAccount().getName() + '</strong></p>';
  corpo += '<p>Data: ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + '</p>';
  
  // Resumo
  corpo += '<div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0;">';
  corpo += '<p><strong>URLs verificadas:</strong> ' + totalVerificado + '</p>';
  corpo += '<p><strong style="color: #d32f2f;">URLs com erro:</strong> ' + erros.length + '</p>';
  if (CONFIG.PAUSAR_AUTOMATICO) {
    corpo += '<p><em>⏸️ Anúncios com links quebrados foram pausados automaticamente</em></p>';
  }
  corpo += '</div>';
  
  // Tabela de erros
  corpo += '<h3>Links com Problema:</h3>';
  corpo += '<table style="border-collapse: collapse; width: 100%;">';
  corpo += '<tr style="background-color: #f5f5f5;">';
  corpo += '<th style="border: 1px solid #ddd; padding: 8px;">URL</th>';
  corpo += '<th style="border: 1px solid #ddd; padding: 8px;">Tipo</th>';
  corpo += '<th style="border: 1px solid #ddd; padding: 8px;">Campanha</th>';
  corpo += '<th style="border: 1px solid #ddd; padding: 8px;">Código</th>';
  corpo += '<th style="border: 1px solid #ddd; padding: 8px;">Erro</th>';
  corpo += '</tr>';
  
  for (var i = 0; i < erros.length; i++) {
    var e = erros[i];
    corpo += '<tr style="background-color: #ffebee;">';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px; word-break: break-all; max-width: 300px;">' + e.url + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + e.tipo + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + e.campanha + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; color: #d32f2f;">' + (e.codigoHttp || '-') + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + e.mensagem + '</td>';
    corpo += '</tr>';
  }
  
  corpo += '</table>';
  
  // Recomendações
  corpo += '<h3>📋 Ações Recomendadas:</h3>';
  corpo += '<ul>';
  corpo += '<li><strong>404:</strong> A página foi removida ou URL está errada. Corrija ou redirecione.</li>';
  corpo += '<li><strong>500/502/503:</strong> Problema no servidor. Verifique com a equipe técnica.</li>';
  corpo += '<li><strong>Timeout:</strong> Página muito lenta. Otimize a velocidade do site.</li>';
  corpo += '<li><strong>URGENTE:</strong> Você está pagando por cliques que vão para páginas quebradas!</li>';
  corpo += '</ul>';
  
  corpo += '<p style="color: #666; font-size: 12px; margin-top: 20px;">Relatório automático - Link Checker</p>';
  corpo += '</body></html>';
  
  MailApp.sendEmail({
    to: CONFIG.EMAIL_DESTINATARIO,
    subject: assunto,
    htmlBody: corpo
  });
  
  Logger.log('Email enviado para: ' + CONFIG.EMAIL_DESTINATARIO);
}
