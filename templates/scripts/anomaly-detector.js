/**
 * SCRIPT: Anomaly Detector - Detecção de Anomalias
 * 
 * O QUE FAZ:
 * - Compara métricas de HOJE vs média dos últimos X dias
 * - Detecta variações anormais em: CPC, CTR, Conversões, Impressões, Custo
 * - Alerta por email quando algo está fora do padrão
 * - Analisa tanto a conta geral quanto cada campanha
 * 
 * FREQUÊNCIA RECOMENDADA: Horária (detectar problemas cedo)
 * 
 * BASEADO EM: Google Ads Account Anomaly Detector + Melhores práticas 2024
 * 
 * CONFIGURAÇÃO:
 * 1. Substituir EMAIL_DESTINATARIO pelo seu email
 * 2. Ajustar THRESHOLDS conforme necessidade
 * 3. Ajustar PERIODO_COMPARACAO
 */

// ============ CONFIGURAÇÕES ============
var CONFIG = {
  // Email para alertas
  EMAIL_DESTINATARIO: 'SUBSTITUIR_EMAIL',
  
  // Período de comparação (média dos últimos X dias)
  PERIODO_COMPARACAO: 14,
  
  // Hora mínima para rodar (evita falsos positivos de manhã cedo)
  HORA_MINIMA_RODAR: 10, // Só analisa após 10h
  
  // Thresholds de anomalia (variação % para disparar alerta)
  THRESHOLDS: {
    // Custo - monitora gasto fora do normal
    CUSTO_AUMENTO: 50,        // +50% = alerta
    CUSTO_QUEDA: 50,          // -50% = alerta (campanha pode ter parado)
    
    // CPC - monitora se lances/concorrência mudaram
    CPC_AUMENTO: 40,          // +40% = alerta (concorrência ou QS caindo)
    CPC_QUEDA: 40,            // -40% = alerta (verificar se é bom ou problema)
    
    // CTR - monitora relevância dos anúncios
    CTR_AUMENTO: 50,          // +50% = verificar (bom, mas pode ser anomalia)
    CTR_QUEDA: 40,            // -40% = alerta (anúncios perdendo relevância)
    
    // Impressões - monitora alcance
    IMPRESSOES_AUMENTO: 100,  // +100% = verificar
    IMPRESSOES_QUEDA: 50,     // -50% = alerta (QS? Budget? Lances?)
    
    // Conversões - monitora resultado final
    CONVERSOES_AUMENTO: 100,  // +100% = verificar (ótimo, mas pode ser anomalia)
    CONVERSOES_QUEDA: 50      // -50% = CRÍTICO (problema sério)
  },
  
  // Mínimos para considerar (evita alertas com pouco dado)
  MINIMOS: {
    CUSTO_DIARIO_MEDIO: 10,   // Ignora campanhas com gasto médio < R$10/dia
    CLIQUES_DIARIO_MEDIO: 5,  // Ignora campanhas com < 5 cliques/dia médio
    IMPRESSOES_HOJE: 50       // Ignora se hoje ainda tem < 50 impressões
  },
  
  // Debug
  DEBUG: false,
  ENVIAR_EMAIL_SEM_ALERTAS: false
};

// ============ FUNÇÃO PRINCIPAL ============
function main() {
  var horaAtual = new Date().getHours();
  
  // Verificar hora mínima
  if (horaAtual < CONFIG.HORA_MINIMA_RODAR) {
    Logger.log('Muito cedo para análise confiável. Hora atual: ' + horaAtual + 'h. Mínimo: ' + CONFIG.HORA_MINIMA_RODAR + 'h');
    return;
  }
  
  Logger.log('=== ANOMALY DETECTOR - ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + ' ===');
  Logger.log('Comparando HOJE vs média dos últimos ' + CONFIG.PERIODO_COMPARACAO + ' dias');
  
  var alertas = [];
  
  // Analisar conta geral
  var alertasConta = analisarConta();
  alertas = alertas.concat(alertasConta);
  
  // Analisar cada campanha
  var alertasCampanhas = analisarCampanhas();
  alertas = alertas.concat(alertasCampanhas);
  
  // Resumo
  Logger.log('');
  Logger.log('=== RESUMO ===');
  Logger.log('Total de anomalias detectadas: ' + alertas.length);
  
  if (alertas.length > 0) {
    // Separar por severidade
    var criticos = alertas.filter(function(a) { return a.severidade === 'CRÍTICO'; });
    var avisos = alertas.filter(function(a) { return a.severidade === 'AVISO'; });
    
    Logger.log('- Críticos: ' + criticos.length);
    Logger.log('- Avisos: ' + avisos.length);
    
    enviarEmailAnomalias(alertas);
  } else {
    Logger.log('✅ Nenhuma anomalia detectada');
    if (CONFIG.ENVIAR_EMAIL_SEM_ALERTAS) {
      enviarEmailSemAnomalias();
    }
  }
}

// ============ ANÁLISE DA CONTA GERAL ============
function analisarConta() {
  var alertas = [];
  
  Logger.log('');
  Logger.log('--- Analisando CONTA GERAL ---');
  
  // Métricas de hoje
  var statsHoje = AdsApp.currentAccount().getStatsFor('TODAY');
  var hoje = {
    custo: statsHoje.getCost(),
    cliques: statsHoje.getClicks(),
    impressoes: statsHoje.getImpressions(),
    ctr: statsHoje.getCtr() * 100,
    cpc: statsHoje.getAverageCpc(),
    conversoes: statsHoje.getConversions()
  };
  
  // Métricas do período de comparação
  var dataFim = new Date();
  dataFim.setDate(dataFim.getDate() - 1);
  var dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - CONFIG.PERIODO_COMPARACAO - 1);
  
  var statsPeriodo = AdsApp.currentAccount().getStatsFor(
    formatarData(dataInicio), 
    formatarData(dataFim)
  );
  
  var mediaDiaria = {
    custo: statsPeriodo.getCost() / CONFIG.PERIODO_COMPARACAO,
    cliques: statsPeriodo.getClicks() / CONFIG.PERIODO_COMPARACAO,
    impressoes: statsPeriodo.getImpressions() / CONFIG.PERIODO_COMPARACAO,
    ctr: statsPeriodo.getCtr() * 100,
    cpc: statsPeriodo.getAverageCpc(),
    conversoes: statsPeriodo.getConversions() / CONFIG.PERIODO_COMPARACAO
  };
  
  Logger.log('Hoje: Custo=' + formatarMoeda(hoje.custo) + ', Cliques=' + hoje.cliques + ', Conv=' + hoje.conversoes.toFixed(1));
  Logger.log('Média: Custo=' + formatarMoeda(mediaDiaria.custo) + ', Cliques=' + mediaDiaria.cliques.toFixed(0) + ', Conv=' + mediaDiaria.conversoes.toFixed(1));
  
  // Verificar cada métrica
  alertas = alertas.concat(verificarMetrica('CONTA GERAL', 'Custo', hoje.custo, mediaDiaria.custo, CONFIG.THRESHOLDS.CUSTO_AUMENTO, CONFIG.THRESHOLDS.CUSTO_QUEDA, 'moeda'));
  alertas = alertas.concat(verificarMetrica('CONTA GERAL', 'CPC', hoje.cpc, mediaDiaria.cpc, CONFIG.THRESHOLDS.CPC_AUMENTO, CONFIG.THRESHOLDS.CPC_QUEDA, 'moeda'));
  alertas = alertas.concat(verificarMetrica('CONTA GERAL', 'CTR', hoje.ctr, mediaDiaria.ctr, CONFIG.THRESHOLDS.CTR_AUMENTO, CONFIG.THRESHOLDS.CTR_QUEDA, 'percentual'));
  alertas = alertas.concat(verificarMetrica('CONTA GERAL', 'Impressões', hoje.impressoes, mediaDiaria.impressoes, CONFIG.THRESHOLDS.IMPRESSOES_AUMENTO, CONFIG.THRESHOLDS.IMPRESSOES_QUEDA, 'numero'));
  alertas = alertas.concat(verificarMetrica('CONTA GERAL', 'Conversões', hoje.conversoes, mediaDiaria.conversoes, CONFIG.THRESHOLDS.CONVERSOES_AUMENTO, CONFIG.THRESHOLDS.CONVERSOES_QUEDA, 'numero'));
  
  return alertas;
}

// ============ ANÁLISE DAS CAMPANHAS ============
function analisarCampanhas() {
  var alertas = [];
  
  Logger.log('');
  Logger.log('--- Analisando CAMPANHAS ---');
  
  var campanhas = AdsApp.campaigns()
    .withCondition('Status = ENABLED')
    .get();
  
  while (campanhas.hasNext()) {
    var campanha = campanhas.next();
    var nome = campanha.getName();
    
    // Métricas de hoje
    var statsHoje = campanha.getStatsFor('TODAY');
    var hoje = {
      custo: statsHoje.getCost(),
      cliques: statsHoje.getClicks(),
      impressoes: statsHoje.getImpressions(),
      ctr: statsHoje.getCtr() * 100,
      cpc: statsHoje.getAverageCpc(),
      conversoes: statsHoje.getConversions()
    };
    
    // Verificar mínimos
    if (hoje.impressoes < CONFIG.MINIMOS.IMPRESSOES_HOJE) {
      continue; // Poucas impressões ainda hoje
    }
    
    // Métricas do período
    var dataFim = new Date();
    dataFim.setDate(dataFim.getDate() - 1);
    var dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - CONFIG.PERIODO_COMPARACAO - 1);
    
    var statsPeriodo = campanha.getStatsFor(
      formatarData(dataInicio), 
      formatarData(dataFim)
    );
    
    var mediaDiaria = {
      custo: statsPeriodo.getCost() / CONFIG.PERIODO_COMPARACAO,
      cliques: statsPeriodo.getClicks() / CONFIG.PERIODO_COMPARACAO,
      impressoes: statsPeriodo.getImpressions() / CONFIG.PERIODO_COMPARACAO,
      ctr: statsPeriodo.getCtr() * 100,
      cpc: statsPeriodo.getAverageCpc(),
      conversoes: statsPeriodo.getConversions() / CONFIG.PERIODO_COMPARACAO
    };
    
    // Verificar mínimos de dados históricos
    if (mediaDiaria.custo < CONFIG.MINIMOS.CUSTO_DIARIO_MEDIO || mediaDiaria.cliques < CONFIG.MINIMOS.CLIQUES_DIARIO_MEDIO) {
      continue; // Pouco histórico para comparar
    }
    
    Logger.log(nome + ': Hoje=' + formatarMoeda(hoje.custo) + ' vs Média=' + formatarMoeda(mediaDiaria.custo));
    
    // Verificar métricas
    alertas = alertas.concat(verificarMetrica(nome, 'Custo', hoje.custo, mediaDiaria.custo, CONFIG.THRESHOLDS.CUSTO_AUMENTO, CONFIG.THRESHOLDS.CUSTO_QUEDA, 'moeda'));
    alertas = alertas.concat(verificarMetrica(nome, 'CPC', hoje.cpc, mediaDiaria.cpc, CONFIG.THRESHOLDS.CPC_AUMENTO, CONFIG.THRESHOLDS.CPC_QUEDA, 'moeda'));
    alertas = alertas.concat(verificarMetrica(nome, 'CTR', hoje.ctr, mediaDiaria.ctr, CONFIG.THRESHOLDS.CTR_AUMENTO, CONFIG.THRESHOLDS.CTR_QUEDA, 'percentual'));
    alertas = alertas.concat(verificarMetrica(nome, 'Conversões', hoje.conversoes, mediaDiaria.conversoes, CONFIG.THRESHOLDS.CONVERSOES_AUMENTO, CONFIG.THRESHOLDS.CONVERSOES_QUEDA, 'numero'));
  }
  
  return alertas;
}

// ============ VERIFICAÇÃO DE MÉTRICA ============
function verificarMetrica(entidade, nomeMetrica, valorHoje, valorMedia, thresholdAumento, thresholdQueda, formato) {
  var alertas = [];
  
  // Evitar divisão por zero
  if (valorMedia === 0) {
    if (valorHoje > 0) {
      // Tinha zero e agora tem algo - pode ser anomalia
      alertas.push({
        entidade: entidade,
        metrica: nomeMetrica,
        valorHoje: formatarValor(valorHoje, formato),
        valorMedia: formatarValor(valorMedia, formato),
        variacao: 'N/A (era zero)',
        tipo: 'NOVO',
        severidade: 'AVISO',
        mensagem: nomeMetrica + ' era zero e agora tem valor'
      });
    }
    return alertas;
  }
  
  var variacao = ((valorHoje - valorMedia) / valorMedia) * 100;
  
  // Verificar aumento
  if (variacao >= thresholdAumento) {
    var severidade = 'AVISO';
    var mensagem = nomeMetrica + ' aumentou ' + variacao.toFixed(1) + '%';
    
    // Conversões subindo muito pode ser bom, mas verificar
    // CPC/Custo subindo é geralmente ruim
    if ((nomeMetrica === 'Custo' || nomeMetrica === 'CPC') && variacao >= thresholdAumento * 1.5) {
      severidade = 'CRÍTICO';
    }
    
    alertas.push({
      entidade: entidade,
      metrica: nomeMetrica,
      valorHoje: formatarValor(valorHoje, formato),
      valorMedia: formatarValor(valorMedia, formato),
      variacao: '+' + variacao.toFixed(1) + '%',
      tipo: 'AUMENTO',
      severidade: severidade,
      mensagem: mensagem
    });
    
    Logger.log('⬆️ ' + entidade + ' - ' + mensagem);
  }
  
  // Verificar queda
  if (variacao <= -thresholdQueda) {
    var severidade = 'AVISO';
    var mensagem = nomeMetrica + ' caiu ' + Math.abs(variacao).toFixed(1) + '%';
    
    // Conversões caindo é CRÍTICO
    // Impressões caindo muito também
    if (nomeMetrica === 'Conversões' || (nomeMetrica === 'Impressões' && variacao <= -70)) {
      severidade = 'CRÍTICO';
    }
    
    alertas.push({
      entidade: entidade,
      metrica: nomeMetrica,
      valorHoje: formatarValor(valorHoje, formato),
      valorMedia: formatarValor(valorMedia, formato),
      variacao: variacao.toFixed(1) + '%',
      tipo: 'QUEDA',
      severidade: severidade,
      mensagem: mensagem
    });
    
    Logger.log('⬇️ ' + entidade + ' - ' + mensagem);
  }
  
  return alertas;
}

// ============ FUNÇÕES AUXILIARES ============
function formatarData(data) {
  return Utilities.formatDate(data, 'America/Sao_Paulo', 'yyyyMMdd');
}

function formatarMoeda(valor) {
  return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

function formatarValor(valor, formato) {
  switch (formato) {
    case 'moeda':
      return formatarMoeda(valor);
    case 'percentual':
      return valor.toFixed(2) + '%';
    case 'numero':
    default:
      return valor.toFixed(1);
  }
}

// ============ EMAIL ============
function enviarEmailAnomalias(alertas) {
  if (CONFIG.DEBUG) {
    Logger.log('DEBUG: Email não enviado (modo debug)');
    return;
  }
  
  var criticos = alertas.filter(function(a) { return a.severidade === 'CRÍTICO'; });
  var avisos = alertas.filter(function(a) { return a.severidade === 'AVISO'; });
  
  var emoji = criticos.length > 0 ? '🚨' : '⚠️';
  var assunto = emoji + ' Anomalias Detectadas (' + alertas.length + ') - ' + AdsApp.currentAccount().getName();
  
  var corpo = '<html><body style="font-family: Arial, sans-serif;">';
  corpo += '<h2>' + emoji + ' Anomalias Detectadas</h2>';
  corpo += '<p>Conta: <strong>' + AdsApp.currentAccount().getName() + '</strong></p>';
  corpo += '<p>Data/Hora: ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + '</p>';
  corpo += '<p>Período de comparação: últimos ' + CONFIG.PERIODO_COMPARACAO + ' dias</p>';
  
  // Alertas críticos
  if (criticos.length > 0) {
    corpo += '<h3 style="color: #d32f2f;">🚨 Alertas Críticos (' + criticos.length + ')</h3>';
    corpo += montarTabelaAlertas(criticos, '#ffcdd2');
  }
  
  // Avisos
  if (avisos.length > 0) {
    corpo += '<h3 style="color: #f57c00;">⚠️ Avisos (' + avisos.length + ')</h3>';
    corpo += montarTabelaAlertas(avisos, '#fff3e0');
  }
  
  // Recomendações
  corpo += '<h3>📋 O que verificar:</h3>';
  corpo += '<ul>';
  corpo += '<li><strong>CPC aumentando:</strong> Concorrência subiu? Quality Score caiu?</li>';
  corpo += '<li><strong>CTR caindo:</strong> Anúncios cansados? Posição pior?</li>';
  corpo += '<li><strong>Conversões caindo:</strong> LP com problema? Tracking quebrado?</li>';
  corpo += '<li><strong>Impressões caindo:</strong> Budget? QS? Sazonalidade?</li>';
  corpo += '</ul>';
  
  corpo += '<p style="color: #666; font-size: 12px; margin-top: 20px;">Email automático - Anomaly Detector</p>';
  corpo += '</body></html>';
  
  MailApp.sendEmail({
    to: CONFIG.EMAIL_DESTINATARIO,
    subject: assunto,
    htmlBody: corpo
  });
  
  Logger.log('Email enviado para: ' + CONFIG.EMAIL_DESTINATARIO);
}

function montarTabelaAlertas(alertas, corFundo) {
  var html = '<table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">';
  html += '<tr style="background-color: #f5f5f5;">';
  html += '<th style="border: 1px solid #ddd; padding: 8px;">Entidade</th>';
  html += '<th style="border: 1px solid #ddd; padding: 8px;">Métrica</th>';
  html += '<th style="border: 1px solid #ddd; padding: 8px;">Média (' + CONFIG.PERIODO_COMPARACAO + 'd)</th>';
  html += '<th style="border: 1px solid #ddd; padding: 8px;">Hoje</th>';
  html += '<th style="border: 1px solid #ddd; padding: 8px;">Variação</th>';
  html += '</tr>';
  
  for (var i = 0; i < alertas.length; i++) {
    var a = alertas[i];
    var corVariacao = a.tipo === 'AUMENTO' ? '#c62828' : '#1565c0';
    
    html += '<tr style="background-color: ' + corFundo + ';">';
    html += '<td style="border: 1px solid #ddd; padding: 8px;">' + a.entidade + '</td>';
    html += '<td style="border: 1px solid #ddd; padding: 8px;">' + a.metrica + '</td>';
    html += '<td style="border: 1px solid #ddd; padding: 8px;">' + a.valorMedia + '</td>';
    html += '<td style="border: 1px solid #ddd; padding: 8px;">' + a.valorHoje + '</td>';
    html += '<td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: ' + corVariacao + ';">' + a.variacao + '</td>';
    html += '</tr>';
  }
  
  html += '</table>';
  return html;
}

function enviarEmailSemAnomalias() {
  if (CONFIG.DEBUG) return;
  
  var assunto = '✅ Sem Anomalias - ' + AdsApp.currentAccount().getName();
  var corpo = '<html><body style="font-family: Arial, sans-serif;">';
  corpo += '<h2>✅ Nenhuma Anomalia Detectada</h2>';
  corpo += '<p>Conta: <strong>' + AdsApp.currentAccount().getName() + '</strong></p>';
  corpo += '<p>Data/Hora: ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + '</p>';
  corpo += '<p>Todas as métricas estão dentro dos parâmetros normais.</p>';
  corpo += '</body></html>';
  
  MailApp.sendEmail({
    to: CONFIG.EMAIL_DESTINATARIO,
    subject: assunto,
    htmlBody: corpo
  });
}
