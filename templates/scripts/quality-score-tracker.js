/**
 * SCRIPT: Quality Score Tracker - Monitoramento de QS
 * 
 * O QUE FAZ:
 * - Coleta Quality Score de todas as keywords ativas
 * - Salva histórico em Google Sheet para acompanhar tendências
 * - Alerta quando QS cai significativamente
 * - Identifica keywords problemáticas (QS baixo)
 * 
 * FREQUÊNCIA RECOMENDADA: Diária (QS não muda a cada hora)
 * 
 * CONFIGURAÇÃO:
 * 1. Criar uma Google Sheet para o histórico
 * 2. Substituir SHEET_ID pelo ID da planilha
 * 3. Substituir EMAIL_DESTINATARIO
 */

// ============ CONFIGURAÇÕES ============
var CONFIG = {
  // Email para alertas
  EMAIL_DESTINATARIO: 'SUBSTITUIR_EMAIL',
  
  // Planilha para histórico (obrigatório para tracking de tendências)
  SHEET_ID: 'SUBSTITUIR_SHEET_ID',
  
  // Thresholds
  QS_CRITICO: 3,          // QS ≤ 3 é crítico
  QS_ATENCAO: 5,          // QS ≤ 5 merece atenção
  QUEDA_ALERTA: 2,        // Alerta se QS cair 2+ pontos vs último registro
  
  // Filtros
  IMPRESSOES_MINIMAS: 100, // Ignorar keywords sem impressões recentes
  DIAS_ANALISE: 30,        // Período para verificar impressões
  
  // Debug
  DEBUG: false
};

// ============ FUNÇÃO PRINCIPAL ============
function main() {
  Logger.log('=== QUALITY SCORE TRACKER - ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + ' ===');
  Logger.log('Conta: ' + AdsApp.currentAccount().getName());
  
  // Verificar se tem planilha configurada
  if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID === 'SUBSTITUIR_SHEET_ID') {
    Logger.log('❌ ERRO: SHEET_ID não configurado. O histórico não será salvo.');
    Logger.log('Crie uma Google Sheet e substitua SUBSTITUIR_SHEET_ID pelo ID.');
    // Continua mesmo sem sheet para mostrar dados atuais
  }
  
  // Coletar QS atual
  var dadosAtuais = coletarQualityScores();
  Logger.log('Keywords analisadas: ' + dadosAtuais.length);
  
  if (dadosAtuais.length === 0) {
    Logger.log('Nenhuma keyword com dados suficientes encontrada.');
    return;
  }
  
  // Calcular QS médio
  var somaQS = 0;
  var countQS = 0;
  for (var i = 0; i < dadosAtuais.length; i++) {
    if (dadosAtuais[i].qs > 0) {
      somaQS += dadosAtuais[i].qs;
      countQS++;
    }
  }
  var qsMedio = countQS > 0 ? (somaQS / countQS).toFixed(1) : 0;
  Logger.log('QS Médio da conta: ' + qsMedio);
  
  // Identificar keywords problemáticas
  var criticas = dadosAtuais.filter(function(k) { return k.qs > 0 && k.qs <= CONFIG.QS_CRITICO; });
  var atencao = dadosAtuais.filter(function(k) { return k.qs > CONFIG.QS_CRITICO && k.qs <= CONFIG.QS_ATENCAO; });
  
  Logger.log('Keywords críticas (QS ≤ ' + CONFIG.QS_CRITICO + '): ' + criticas.length);
  Logger.log('Keywords atenção (QS ≤ ' + CONFIG.QS_ATENCAO + '): ' + atencao.length);
  
  // Carregar histórico e detectar quedas
  var historicoAnterior = {};
  var quedas = [];
  
  if (CONFIG.SHEET_ID && CONFIG.SHEET_ID !== 'SUBSTITUIR_SHEET_ID') {
    historicoAnterior = carregarUltimoHistorico();
    quedas = detectarQuedas(dadosAtuais, historicoAnterior);
    Logger.log('Quedas de QS detectadas: ' + quedas.length);
    
    // Salvar novo histórico
    salvarHistorico(dadosAtuais, qsMedio);
  }
  
  // Enviar alerta se necessário
  var temProblemas = criticas.length > 0 || quedas.length > 0;
  
  if (temProblemas) {
    enviarEmail(dadosAtuais, criticas, atencao, quedas, qsMedio);
  } else {
    Logger.log('✅ Nenhum problema de QS detectado');
  }
  
  // Log das piores keywords
  if (criticas.length > 0) {
    Logger.log('');
    Logger.log('--- TOP 10 PIORES QS ---');
    var topPiores = criticas.slice(0, 10);
    for (var j = 0; j < topPiores.length; j++) {
      var k = topPiores[j];
      Logger.log('QS ' + k.qs + ' | ' + k.keyword + ' | ' + k.campanha);
    }
  }
}

// ============ COLETA DE DADOS ============
function coletarQualityScores() {
  var keywords = [];
  
  var iterator = AdsApp.keywords()
    .withCondition('Status = ENABLED')
    .withCondition('CampaignStatus = ENABLED')
    .withCondition('AdGroupStatus = ENABLED')
    .forDateRange('LAST_' + CONFIG.DIAS_ANALISE + '_DAYS')
    .withCondition('Impressions > ' + CONFIG.IMPRESSOES_MINIMAS)
    .orderBy('QualityScore ASC')
    .get();
  
  while (iterator.hasNext()) {
    var kw = iterator.next();
    var qs = kw.getQualityScore();
    
    // QS pode ser null para keywords novas
    if (qs === null) continue;
    
    var stats = kw.getStatsFor('LAST_' + CONFIG.DIAS_ANALISE + '_DAYS');
    
    keywords.push({
      keyword: kw.getText(),
      matchType: kw.getMatchType(),
      campanha: kw.getCampaign().getName(),
      grupo: kw.getAdGroup().getName(),
      qs: qs,
      impressoes: stats.getImpressions(),
      cliques: stats.getClicks(),
      custo: stats.getCost(),
      conversoes: stats.getConversions()
    });
  }
  
  return keywords;
}

// ============ HISTÓRICO ============
function carregarUltimoHistorico() {
  var historico = {};
  
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName('Histórico QS');
    
    if (!sheet) {
      Logger.log('Aba "Histórico QS" não encontrada. Será criada.');
      return historico;
    }
    
    var dados = sheet.getDataRange().getValues();
    
    // Encontrar a data mais recente (que não seja hoje)
    var hoje = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
    var dataAnterior = null;
    
    for (var i = dados.length - 1; i >= 1; i--) {
      var dataRegistro = Utilities.formatDate(new Date(dados[i][0]), 'America/Sao_Paulo', 'yyyy-MM-dd');
      if (dataRegistro !== hoje) {
        dataAnterior = dataRegistro;
        break;
      }
    }
    
    if (!dataAnterior) {
      Logger.log('Sem histórico anterior para comparação.');
      return historico;
    }
    
    Logger.log('Comparando com histórico de: ' + dataAnterior);
    
    // Carregar dados da data anterior
    for (var j = 1; j < dados.length; j++) {
      var dataRegistro = Utilities.formatDate(new Date(dados[j][0]), 'America/Sao_Paulo', 'yyyy-MM-dd');
      if (dataRegistro === dataAnterior) {
        var chave = dados[j][1] + '|' + dados[j][3]; // keyword + campanha
        historico[chave] = {
          keyword: dados[j][1],
          qs: dados[j][5]
        };
      }
    }
    
    Logger.log('Keywords no histórico: ' + Object.keys(historico).length);
    
  } catch (e) {
    Logger.log('Erro ao carregar histórico: ' + e.message);
  }
  
  return historico;
}

function salvarHistorico(dados, qsMedio) {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName('Histórico QS');
    
    // Criar aba se não existir
    if (!sheet) {
      sheet = ss.insertSheet('Histórico QS');
      sheet.getRange(1, 1, 1, 7).setValues([['Data', 'Keyword', 'Match Type', 'Campanha', 'Grupo', 'QS', 'Impressões']]);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f5f5f5');
      sheet.setFrozenRows(1);
    }
    
    // Salvar resumo em aba separada
    var sheetResumo = ss.getSheetByName('Resumo Diário');
    if (!sheetResumo) {
      sheetResumo = ss.insertSheet('Resumo Diário');
      sheetResumo.getRange(1, 1, 1, 6).setValues([['Data', 'QS Médio', 'Keywords', 'QS ≤ 3', 'QS ≤ 5', 'QS ≥ 7']]);
      sheetResumo.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f5f5f5');
    }
    
    var agora = new Date();
    
    // Contar distribuição de QS
    var qsCritico = dados.filter(function(k) { return k.qs > 0 && k.qs <= 3; }).length;
    var qsAtencao = dados.filter(function(k) { return k.qs > 0 && k.qs <= 5; }).length;
    var qsBom = dados.filter(function(k) { return k.qs >= 7; }).length;
    
    // Salvar resumo
    sheetResumo.appendRow([agora, parseFloat(qsMedio), dados.length, qsCritico, qsAtencao, qsBom]);
    
    // Salvar detalhes (limitar a 500 para não explodir a planilha)
    var linhas = [];
    var limite = Math.min(dados.length, 500);
    
    for (var i = 0; i < limite; i++) {
      var k = dados[i];
      linhas.push([agora, k.keyword, k.matchType, k.campanha, k.grupo, k.qs, k.impressoes]);
    }
    
    if (linhas.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, linhas.length, 7).setValues(linhas);
    }
    
    Logger.log('Histórico salvo: ' + linhas.length + ' keywords');
    
    // Limpar dados antigos (manter últimos 60 dias)
    limparHistoricoAntigo(sheet, 60);
    
  } catch (e) {
    Logger.log('Erro ao salvar histórico: ' + e.message);
  }
}

function limparHistoricoAntigo(sheet, diasManter) {
  var limite = new Date();
  limite.setDate(limite.getDate() - diasManter);
  
  var dados = sheet.getDataRange().getValues();
  var linhasRemover = [];
  
  for (var i = dados.length - 1; i >= 1; i--) {
    var data = new Date(dados[i][0]);
    if (data < limite) {
      linhasRemover.push(i + 1);
    }
  }
  
  // Remover em lotes (do fim para o início)
  for (var j = 0; j < linhasRemover.length && j < 100; j++) {
    sheet.deleteRow(linhasRemover[j] - j);
  }
  
  if (linhasRemover.length > 0) {
    Logger.log('Histórico antigo removido: ' + Math.min(linhasRemover.length, 100) + ' linhas');
  }
}

// ============ DETECÇÃO DE QUEDAS ============
function detectarQuedas(dadosAtuais, historicoAnterior) {
  var quedas = [];
  
  for (var i = 0; i < dadosAtuais.length; i++) {
    var k = dadosAtuais[i];
    var chave = k.keyword + '|' + k.campanha;
    
    if (historicoAnterior[chave]) {
      var qsAnterior = historicoAnterior[chave].qs;
      var diferenca = qsAnterior - k.qs;
      
      if (diferenca >= CONFIG.QUEDA_ALERTA) {
        quedas.push({
          keyword: k.keyword,
          campanha: k.campanha,
          qsAnterior: qsAnterior,
          qsAtual: k.qs,
          queda: diferenca
        });
        
        Logger.log('⬇️ QUEDA: "' + k.keyword + '" QS ' + qsAnterior + ' → ' + k.qs + ' (-' + diferenca + ')');
      }
    }
  }
  
  // Ordenar por maior queda
  quedas.sort(function(a, b) { return b.queda - a.queda; });
  
  return quedas;
}

// ============ EMAIL ============
function enviarEmail(dadosAtuais, criticas, atencao, quedas, qsMedio) {
  if (CONFIG.DEBUG) {
    Logger.log('DEBUG: Email não enviado');
    return;
  }
  
  var temQuedas = quedas.length > 0;
  var temCriticos = criticas.length > 0;
  
  var emoji = temCriticos ? '🚨' : (temQuedas ? '⬇️' : '⚠️');
  var assunto = emoji + ' QS Report: Média ' + qsMedio + ' - ' + AdsApp.currentAccount().getName();
  
  var corpo = '<html><body style="font-family: Arial, sans-serif;">';
  corpo += '<h2>📊 Quality Score Report</h2>';
  corpo += '<p>Conta: <strong>' + AdsApp.currentAccount().getName() + '</strong></p>';
  corpo += '<p>Data: ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy') + '</p>';
  
  // Resumo
  corpo += '<div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">';
  corpo += '<h3 style="margin-top: 0;">📈 Resumo</h3>';
  corpo += '<p><strong>QS Médio:</strong> ' + qsMedio + '</p>';
  corpo += '<p><strong>Keywords analisadas:</strong> ' + dadosAtuais.length + '</p>';
  corpo += '<p><strong>QS Crítico (≤3):</strong> ' + criticas.length + '</p>';
  corpo += '<p><strong>QS Atenção (≤5):</strong> ' + atencao.length + '</p>';
  corpo += '</div>';
  
  // Quedas
  if (quedas.length > 0) {
    corpo += '<h3 style="color: #d32f2f;">⬇️ Quedas de QS Detectadas (' + quedas.length + ')</h3>';
    corpo += '<table style="border-collapse: collapse; width: 100%;">';
    corpo += '<tr style="background-color: #f5f5f5;"><th style="border: 1px solid #ddd; padding: 8px;">Keyword</th><th style="border: 1px solid #ddd; padding: 8px;">Campanha</th><th style="border: 1px solid #ddd; padding: 8px;">Antes</th><th style="border: 1px solid #ddd; padding: 8px;">Agora</th><th style="border: 1px solid #ddd; padding: 8px;">Queda</th></tr>';
    
    var maxQuedas = Math.min(quedas.length, 15);
    for (var i = 0; i < maxQuedas; i++) {
      var q = quedas[i];
      corpo += '<tr style="background-color: #ffebee;">';
      corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + q.keyword + '</td>';
      corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + q.campanha + '</td>';
      corpo += '<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">' + q.qsAnterior + '</td>';
      corpo += '<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">' + q.qsAtual + '</td>';
      corpo += '<td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #d32f2f; font-weight: bold;">-' + q.queda + '</td>';
      corpo += '</tr>';
    }
    corpo += '</table>';
  }
  
  // Keywords críticas
  if (criticas.length > 0) {
    corpo += '<h3 style="color: #d32f2f;">🚨 Keywords com QS Crítico (≤' + CONFIG.QS_CRITICO + ')</h3>';
    corpo += '<table style="border-collapse: collapse; width: 100%;">';
    corpo += '<tr style="background-color: #f5f5f5;"><th style="border: 1px solid #ddd; padding: 8px;">Keyword</th><th style="border: 1px solid #ddd; padding: 8px;">Campanha</th><th style="border: 1px solid #ddd; padding: 8px;">QS</th><th style="border: 1px solid #ddd; padding: 8px;">Custo (30d)</th></tr>';
    
    var maxCriticas = Math.min(criticas.length, 20);
    for (var j = 0; j < maxCriticas; j++) {
      var k = criticas[j];
      corpo += '<tr style="background-color: #ffebee;">';
      corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + k.keyword + '</td>';
      corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + k.campanha + '</td>';
      corpo += '<td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; color: #d32f2f;">' + k.qs + '</td>';
      corpo += '<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">R$ ' + k.custo.toFixed(2) + '</td>';
      corpo += '</tr>';
    }
    corpo += '</table>';
  }
  
  // Recomendações
  corpo += '<h3>📋 Como melhorar QS:</h3>';
  corpo += '<ul>';
  corpo += '<li><strong>Relevância do anúncio:</strong> Incluir a keyword no título e descrição</li>';
  corpo += '<li><strong>CTR esperado:</strong> Testar novas variações de anúncio</li>';
  corpo += '<li><strong>Experiência da LP:</strong> Velocidade, mobile-friendly, conteúdo relevante</li>';
  corpo += '<li><strong>Considere pausar:</strong> Keywords QS ≤3 com alto custo e baixa conversão</li>';
  corpo += '</ul>';
  
  corpo += '<p style="color: #666; font-size: 12px; margin-top: 20px;">Relatório automático - Quality Score Tracker</p>';
  corpo += '</body></html>';
  
  MailApp.sendEmail({
    to: CONFIG.EMAIL_DESTINATARIO,
    subject: assunto,
    htmlBody: corpo
  });
  
  Logger.log('Email enviado para: ' + CONFIG.EMAIL_DESTINATARIO);
}
