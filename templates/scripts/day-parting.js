/**
 * SCRIPT: Day-parting - Ajuste de Lances por Horário
 * 
 * O QUE FAZ:
 * - Analisa performance por hora do dia e dia da semana
 * - Ajusta lances automaticamente baseado nos horários que mais convertem
 * - Reduz lances em horários de baixa performance
 * - Aumenta lances em horários de alta performance
 * 
 * ⚠️ IMPORTANTE: Este script SÓ funciona com:
 * - Manual CPC
 * - Maximize Clicks (com limite de CPC)
 * 
 * NÃO funciona com Smart Bidding (Target CPA, Target ROAS, Maximize Conversions)
 * porque o Smart Bidding ignora ajustes manuais.
 * 
 * FREQUÊNCIA RECOMENDADA: Horária (para reagir ao horário atual)
 * 
 * CONFIGURAÇÃO:
 * 1. Verificar se campanhas usam Manual CPC ou Maximize Clicks
 * 2. Ajustar PERIODO_ANALISE e outros parâmetros
 * 3. Começar com DEBUG: true para ver o que faria
 * 4. GERAR RELATÓRIO primeiro para entender os padrões
 */

// ============ CONFIGURAÇÕES ============
var CONFIG = {
  // Email para relatórios
  EMAIL_DESTINATARIO: 'SUBSTITUIR_EMAIL',
  
  // Período de análise para calcular performance por hora
  PERIODO_ANALISE_DIAS: 30,
  
  // Mínimos para considerar (evita ajustes com pouco dado)
  MINIMOS: {
    CLIQUES_HORA: 5,        // Mínimo de cliques na hora para ajustar
    CONVERSOES_HORA: 1,     // Mínimo de conversões na hora para considerar "boa"
    CUSTO_TOTAL: 100        // Custo mínimo total no período para analisar
  },
  
  // Ajustes de lance (em %)
  AJUSTES: {
    // Horário com CPA muito abaixo da média = aumenta lance
    AUMENTO_FORTE: 30,      // +30% para horários muito bons
    AUMENTO_LEVE: 15,       // +15% para horários bons
    
    // Horário com CPA acima da média = diminui lance
    REDUCAO_LEVE: -15,      // -15% para horários ruins
    REDUCAO_FORTE: -30,     // -30% para horários muito ruins
    
    // Horário sem conversões (após muitos cliques) = reduz bastante
    SEM_CONVERSAO: -50,     // -50% para horários sem conversão
    
    // Madrugada (geralmente baixa qualidade)
    MADRUGADA_DEFAULT: -30  // -30% para 0h-6h se não tiver dados
  },
  
  // Thresholds para classificar horário
  THRESHOLDS: {
    CPA_BOM: 0.70,          // CPA < 70% da média = bom
    CPA_OTIMO: 0.50,        // CPA < 50% da média = ótimo
    CPA_RUIM: 1.30,         // CPA > 130% da média = ruim
    CPA_PESSIMO: 1.70,      // CPA > 170% da média = péssimo
    CLIQUES_SEM_CONV: 20    // X cliques sem conversão = problema
  },
  
  // Campanhas para aplicar (deixe vazio para todas)
  CAMPANHAS_INCLUIR: [],    // Ex: ['Campanha 1', 'Campanha 2']
  CAMPANHAS_EXCLUIR: [],    // Ex: ['Branding', 'Teste']
  
  // Controles
  APLICAR_AJUSTES: false,   // false = só analisa, true = aplica mudanças
  APENAS_RELATORIO: true,   // true = gera relatório sem aplicar
  DEBUG: true
};

// ============ FUNÇÃO PRINCIPAL ============
function main() {
  Logger.log('=== DAY-PARTING - ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + ' ===');
  Logger.log('Conta: ' + AdsApp.currentAccount().getName());
  Logger.log('Período de análise: ' + CONFIG.PERIODO_ANALISE_DIAS + ' dias');
  
  // Analisar dados por hora
  var dadosPorHora = analisarPerformancePorHora();
  
  if (Object.keys(dadosPorHora).length === 0) {
    Logger.log('❌ Sem dados suficientes para análise');
    return;
  }
  
  // Calcular CPA médio geral
  var cpaMedia = calcularCpaMedia(dadosPorHora);
  Logger.log('CPA Médio geral: R$ ' + cpaMedia.toFixed(2));
  
  // Classificar cada hora
  var horasClassificadas = classificarHoras(dadosPorHora, cpaMedia);
  
  // Gerar relatório
  gerarRelatorio(horasClassificadas, cpaMedia);
  
  // Aplicar ajustes se configurado
  if (CONFIG.APLICAR_AJUSTES && !CONFIG.APENAS_RELATORIO) {
    aplicarAjustes(horasClassificadas);
  } else {
    Logger.log('');
    Logger.log('ℹ️ Modo análise. Para aplicar ajustes, mude APLICAR_AJUSTES para true');
  }
}

// ============ ANÁLISE DE DADOS ============
function analisarPerformancePorHora() {
  var dados = {};
  
  // Query GAQL para dados por hora
  var query = 'SELECT ' +
    'segments.hour, ' +
    'segments.day_of_week, ' +
    'metrics.clicks, ' +
    'metrics.impressions, ' +
    'metrics.cost_micros, ' +
    'metrics.conversions ' +
    'FROM campaign ' +
    'WHERE segments.date DURING LAST_' + CONFIG.PERIODO_ANALISE_DIAS + '_DAYS ' +
    'AND campaign.status = "ENABLED"';
  
  try {
    var report = AdsApp.report(query);
    var rows = report.rows();
    
    while (rows.hasNext()) {
      var row = rows.next();
      var hora = parseInt(row['segments.hour']);
      var diaSemana = row['segments.day_of_week'];
      var cliques = parseInt(row['metrics.clicks']) || 0;
      var impressoes = parseInt(row['metrics.impressions']) || 0;
      var custo = (parseInt(row['metrics.cost_micros']) || 0) / 1000000;
      var conversoes = parseFloat(row['metrics.conversions']) || 0;
      
      // Agregar por hora
      if (!dados[hora]) {
        dados[hora] = {
          hora: hora,
          cliques: 0,
          impressoes: 0,
          custo: 0,
          conversoes: 0,
          diasSemana: {}
        };
      }
      
      dados[hora].cliques += cliques;
      dados[hora].impressoes += impressoes;
      dados[hora].custo += custo;
      dados[hora].conversoes += conversoes;
      
      // Agregar por dia da semana também
      if (!dados[hora].diasSemana[diaSemana]) {
        dados[hora].diasSemana[diaSemana] = {
          cliques: 0,
          custo: 0,
          conversoes: 0
        };
      }
      dados[hora].diasSemana[diaSemana].cliques += cliques;
      dados[hora].diasSemana[diaSemana].custo += custo;
      dados[hora].diasSemana[diaSemana].conversoes += conversoes;
    }
    
    // Calcular CPA por hora
    for (var h in dados) {
      var d = dados[h];
      d.cpa = d.conversoes > 0 ? d.custo / d.conversoes : null;
      d.ctr = d.impressoes > 0 ? (d.cliques / d.impressoes) * 100 : 0;
      d.cpc = d.cliques > 0 ? d.custo / d.cliques : 0;
    }
    
    Logger.log('Dados coletados para ' + Object.keys(dados).length + ' horas');
    
  } catch (e) {
    Logger.log('Erro ao coletar dados: ' + e.message);
  }
  
  return dados;
}

function calcularCpaMedia(dados) {
  var custoTotal = 0;
  var conversoesTotal = 0;
  
  for (var h in dados) {
    custoTotal += dados[h].custo;
    conversoesTotal += dados[h].conversoes;
  }
  
  return conversoesTotal > 0 ? custoTotal / conversoesTotal : 0;
}

// ============ CLASSIFICAÇÃO DE HORAS ============
function classificarHoras(dados, cpaMedia) {
  var horas = [];
  
  for (var h = 0; h < 24; h++) {
    var d = dados[h] || {
      hora: h,
      cliques: 0,
      impressoes: 0,
      custo: 0,
      conversoes: 0,
      cpa: null
    };
    
    var classificacao = classificarHora(d, cpaMedia);
    
    horas.push({
      hora: h,
      horaFormatada: formatarHora(h),
      cliques: d.cliques,
      custo: d.custo,
      conversoes: d.conversoes,
      cpa: d.cpa,
      classificacao: classificacao.tipo,
      ajusteSugerido: classificacao.ajuste,
      motivo: classificacao.motivo
    });
  }
  
  return horas;
}

function classificarHora(dados, cpaMedia) {
  // Sem dados suficientes
  if (dados.cliques < CONFIG.MINIMOS.CLIQUES_HORA * (CONFIG.PERIODO_ANALISE_DIAS / 30)) {
    // Madrugada sem dados = reduzir por precaução
    if (dados.hora >= 0 && dados.hora < 6) {
      return {
        tipo: 'BAIXO_DADO_MADRUGADA',
        ajuste: CONFIG.AJUSTES.MADRUGADA_DEFAULT,
        motivo: 'Madrugada sem dados suficientes'
      };
    }
    return {
      tipo: 'SEM_DADOS',
      ajuste: 0,
      motivo: 'Dados insuficientes para análise'
    };
  }
  
  // Muitos cliques sem conversão
  if (dados.conversoes < CONFIG.MINIMOS.CONVERSOES_HORA && 
      dados.cliques >= CONFIG.THRESHOLDS.CLIQUES_SEM_CONV * (CONFIG.PERIODO_ANALISE_DIAS / 30)) {
    return {
      tipo: 'SEM_CONVERSAO',
      ajuste: CONFIG.AJUSTES.SEM_CONVERSAO,
      motivo: dados.cliques + ' cliques, ' + dados.conversoes.toFixed(1) + ' conv'
    };
  }
  
  // Sem conversões mas poucos cliques
  if (dados.conversoes < CONFIG.MINIMOS.CONVERSOES_HORA) {
    return {
      tipo: 'NEUTRO',
      ajuste: 0,
      motivo: 'Poucas conversões para classificar'
    };
  }
  
  // Classificar por CPA
  var razaoCpa = dados.cpa / cpaMedia;
  
  if (razaoCpa <= CONFIG.THRESHOLDS.CPA_OTIMO) {
    return {
      tipo: 'OTIMO',
      ajuste: CONFIG.AJUSTES.AUMENTO_FORTE,
      motivo: 'CPA R$' + dados.cpa.toFixed(2) + ' (' + (razaoCpa * 100).toFixed(0) + '% da média)'
    };
  }
  
  if (razaoCpa <= CONFIG.THRESHOLDS.CPA_BOM) {
    return {
      tipo: 'BOM',
      ajuste: CONFIG.AJUSTES.AUMENTO_LEVE,
      motivo: 'CPA R$' + dados.cpa.toFixed(2) + ' (' + (razaoCpa * 100).toFixed(0) + '% da média)'
    };
  }
  
  if (razaoCpa >= CONFIG.THRESHOLDS.CPA_PESSIMO) {
    return {
      tipo: 'PESSIMO',
      ajuste: CONFIG.AJUSTES.REDUCAO_FORTE,
      motivo: 'CPA R$' + dados.cpa.toFixed(2) + ' (' + (razaoCpa * 100).toFixed(0) + '% da média)'
    };
  }
  
  if (razaoCpa >= CONFIG.THRESHOLDS.CPA_RUIM) {
    return {
      tipo: 'RUIM',
      ajuste: CONFIG.AJUSTES.REDUCAO_LEVE,
      motivo: 'CPA R$' + dados.cpa.toFixed(2) + ' (' + (razaoCpa * 100).toFixed(0) + '% da média)'
    };
  }
  
  return {
    tipo: 'NEUTRO',
    ajuste: 0,
    motivo: 'CPA dentro da média'
  };
}

function formatarHora(h) {
  return (h < 10 ? '0' : '') + h + ':00';
}

// ============ RELATÓRIO ============
function gerarRelatorio(horas, cpaMedia) {
  Logger.log('');
  Logger.log('=== RELATÓRIO POR HORA ===');
  Logger.log('CPA Médio: R$ ' + cpaMedia.toFixed(2));
  Logger.log('');
  
  // Separar por classificação
  var otimos = horas.filter(function(h) { return h.classificacao === 'OTIMO'; });
  var bons = horas.filter(function(h) { return h.classificacao === 'BOM'; });
  var ruins = horas.filter(function(h) { return h.classificacao === 'RUIM'; });
  var pessimos = horas.filter(function(h) { return h.classificacao === 'PESSIMO' || h.classificacao === 'SEM_CONVERSAO'; });
  
  Logger.log('📈 Horários ÓTIMOS (' + otimos.length + '): ' + otimos.map(function(h) { return h.horaFormatada; }).join(', '));
  Logger.log('✅ Horários BONS (' + bons.length + '): ' + bons.map(function(h) { return h.horaFormatada; }).join(', '));
  Logger.log('⚠️ Horários RUINS (' + ruins.length + '): ' + ruins.map(function(h) { return h.horaFormatada; }).join(', '));
  Logger.log('❌ Horários PÉSSIMOS (' + pessimos.length + '): ' + pessimos.map(function(h) { return h.horaFormatada; }).join(', '));
  
  Logger.log('');
  Logger.log('--- DETALHAMENTO ---');
  
  for (var i = 0; i < horas.length; i++) {
    var h = horas[i];
    var emoji = getEmojiClassificacao(h.classificacao);
    var ajuste = h.ajusteSugerido > 0 ? '+' + h.ajusteSugerido + '%' : h.ajusteSugerido + '%';
    
    Logger.log(emoji + ' ' + h.horaFormatada + ' | ' + h.cliques + ' cliques | ' + 
               h.conversoes.toFixed(1) + ' conv | ' +
               (h.cpa ? 'CPA R$' + h.cpa.toFixed(2) : 'CPA -') + ' | ' +
               'Ajuste: ' + ajuste + ' | ' + h.motivo);
  }
  
  // Enviar email com relatório
  if (CONFIG.EMAIL_DESTINATARIO && CONFIG.EMAIL_DESTINATARIO !== 'SUBSTITUIR_EMAIL') {
    enviarEmailRelatorio(horas, cpaMedia);
  }
}

function getEmojiClassificacao(classificacao) {
  var emojis = {
    'OTIMO': '🟢',
    'BOM': '🟢',
    'NEUTRO': '⚪',
    'RUIM': '🟡',
    'PESSIMO': '🔴',
    'SEM_CONVERSAO': '🔴',
    'SEM_DADOS': '⚪',
    'BAIXO_DADO_MADRUGADA': '🟡'
  };
  return emojis[classificacao] || '⚪';
}

// ============ APLICAR AJUSTES ============
function aplicarAjustes(horas) {
  Logger.log('');
  Logger.log('=== APLICANDO AJUSTES ===');
  
  // Este é um exemplo simplificado
  // Na prática, você precisaria configurar Ad Schedule na conta
  // e usar AdsApp.targeting().adSchedules() para ajustar
  
  Logger.log('⚠️ A aplicação automática de ajustes de horário requer configuração');
  Logger.log('   de Ad Schedule (Programação de Anúncios) na conta Google Ads.');
  Logger.log('');
  Logger.log('📋 Para configurar manualmente:');
  Logger.log('   1. Vá em Campanhas > Programação de anúncios');
  Logger.log('   2. Configure os horários conforme o relatório acima');
  Logger.log('   3. Aplique os ajustes de lance sugeridos');
  
  // Log dos ajustes sugeridos
  Logger.log('');
  Logger.log('--- AJUSTES SUGERIDOS ---');
  
  var ajustesAtivos = horas.filter(function(h) { return h.ajusteSugerido !== 0; });
  
  for (var i = 0; i < ajustesAtivos.length; i++) {
    var h = ajustesAtivos[i];
    Logger.log(h.horaFormatada + ': ' + (h.ajusteSugerido > 0 ? '+' : '') + h.ajusteSugerido + '% (' + h.classificacao + ')');
  }
}

// ============ EMAIL ============
function enviarEmailRelatorio(horas, cpaMedia) {
  if (CONFIG.DEBUG) {
    Logger.log('DEBUG: Email não enviado');
    return;
  }
  
  var assunto = '📊 Day-parting Report - ' + AdsApp.currentAccount().getName();
  
  var corpo = '<html><body style="font-family: Arial, sans-serif;">';
  corpo += '<h2>📊 Análise de Performance por Horário</h2>';
  corpo += '<p>Conta: <strong>' + AdsApp.currentAccount().getName() + '</strong></p>';
  corpo += '<p>Período: últimos ' + CONFIG.PERIODO_ANALISE_DIAS + ' dias</p>';
  corpo += '<p>CPA Médio: <strong>R$ ' + cpaMedia.toFixed(2) + '</strong></p>';
  
  // Tabela de horários
  corpo += '<h3>Performance por Hora:</h3>';
  corpo += '<table style="border-collapse: collapse; width: 100%;">';
  corpo += '<tr style="background-color: #f5f5f5;">';
  corpo += '<th style="border: 1px solid #ddd; padding: 8px;">Hora</th>';
  corpo += '<th style="border: 1px solid #ddd; padding: 8px;">Cliques</th>';
  corpo += '<th style="border: 1px solid #ddd; padding: 8px;">Conv</th>';
  corpo += '<th style="border: 1px solid #ddd; padding: 8px;">CPA</th>';
  corpo += '<th style="border: 1px solid #ddd; padding: 8px;">Status</th>';
  corpo += '<th style="border: 1px solid #ddd; padding: 8px;">Ajuste</th>';
  corpo += '</tr>';
  
  for (var i = 0; i < horas.length; i++) {
    var h = horas[i];
    var corFundo = getCorClassificacao(h.classificacao);
    var ajusteStr = h.ajusteSugerido > 0 ? '+' + h.ajusteSugerido + '%' : h.ajusteSugerido + '%';
    
    corpo += '<tr style="background-color: ' + corFundo + ';">';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + h.horaFormatada + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">' + h.cliques + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">' + h.conversoes.toFixed(1) + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">' + (h.cpa ? 'R$ ' + h.cpa.toFixed(2) : '-') + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + h.classificacao + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">' + ajusteStr + '</td>';
    corpo += '</tr>';
  }
  
  corpo += '</table>';
  
  // Legenda
  corpo += '<h3>Legenda:</h3>';
  corpo += '<ul>';
  corpo += '<li><span style="background-color: #c8e6c9; padding: 2px 8px;">ÓTIMO/BOM</span> - Aumentar lances</li>';
  corpo += '<li><span style="background-color: #fff9c4; padding: 2px 8px;">RUIM</span> - Reduzir lances</li>';
  corpo += '<li><span style="background-color: #ffcdd2; padding: 2px 8px;">PÉSSIMO</span> - Reduzir bastante ou excluir</li>';
  corpo += '</ul>';
  
  corpo += '<p style="color: #666; font-size: 12px; margin-top: 20px;">Relatório automático - Day-parting Script</p>';
  corpo += '</body></html>';
  
  MailApp.sendEmail({
    to: CONFIG.EMAIL_DESTINATARIO,
    subject: assunto,
    htmlBody: corpo
  });
  
  Logger.log('Email enviado para: ' + CONFIG.EMAIL_DESTINATARIO);
}

function getCorClassificacao(classificacao) {
  var cores = {
    'OTIMO': '#c8e6c9',
    'BOM': '#c8e6c9',
    'NEUTRO': '#ffffff',
    'RUIM': '#fff9c4',
    'PESSIMO': '#ffcdd2',
    'SEM_CONVERSAO': '#ffcdd2',
    'SEM_DADOS': '#f5f5f5',
    'BAIXO_DADO_MADRUGADA': '#fff9c4'
  };
  return cores[classificacao] || '#ffffff';
}
