/**
 * SCRIPT: Budget Alert - Monitoramento de Gasto
 * 
 * O QUE FAZ:
 * - Monitora gasto diário de todas as campanhas ativas
 * - Alerta por email quando gasto excede % do budget
 * - Alerta quando projeção de gasto do mês excede budget mensal
 * - Log de histórico para análise
 * 
 * FREQUÊNCIA RECOMENDADA: Horária (Google pode gastar até 2x do budget diário)
 * 
 * BASEADO EM: Brainlabs Budget Alert Script + Melhores práticas 2024
 * 
 * CONFIGURAÇÃO:
 * 1. Substituir EMAIL_DESTINATARIO pelo seu email
 * 2. Ajustar ALERTA_PERCENTUAL conforme necessidade
 * 3. Opcional: Configurar SHEET_ID para log histórico
 */

// ============ CONFIGURAÇÕES ============
var CONFIG = {
  // Email para receber alertas
  EMAIL_DESTINATARIO: 'SUBSTITUIR_EMAIL',
  
  // Alertas de gasto diário
  ALERTA_PERCENTUAL_AVISO: 80,      // Aviso quando gasto > 80% do budget diário
  ALERTA_PERCENTUAL_CRITICO: 100,   // Crítico quando gasto > 100% do budget diário
  ALERTA_PERCENTUAL_EMERGENCIA: 150, // Emergência quando gasto > 150% (Google permite até 200%)
  
  // Alertas de projeção mensal
  ALERTA_PROJECAO_MES: true,        // Ativar alerta de projeção mensal
  TOLERANCIA_PROJECAO: 10,          // Alerta se projeção > budget mensal + 10%
  
  // Log em Google Sheet (opcional)
  SALVAR_LOG: true,
  SHEET_ID: 'SUBSTITUIR_SHEET_ID',  // Deixar vazio para não usar
  
  // Filtros
  IGNORAR_CAMPANHAS_PAUSADAS: true,
  CAMPANHAS_IGNORAR: [],            // Nomes de campanhas para ignorar (ex: ['Teste', 'Branding'])
  
  // Debug
  DEBUG: false,                     // true = só loga, não envia email
  SEMPRE_ENVIAR_RESUMO: false       // true = envia resumo mesmo sem alertas
};

// ============ FUNÇÃO PRINCIPAL ============
function main() {
  var hoje = new Date();
  var diaDoMes = hoje.getDate();
  var diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  var diasRestantes = diasNoMes - diaDoMes + 1;
  
  var campanhas = getCampanhasAtivas();
  var alertas = [];
  var resumo = [];
  
  Logger.log('=== BUDGET ALERT - ' + Utilities.formatDate(hoje, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + ' ===');
  Logger.log('Campanhas ativas encontradas: ' + campanhas.length);
  
  for (var i = 0; i < campanhas.length; i++) {
    var campanha = campanhas[i];
    var nome = campanha.getName();
    
    // Verificar se deve ignorar
    if (CONFIG.CAMPANHAS_IGNORAR.indexOf(nome) !== -1) {
      Logger.log('Ignorando campanha: ' + nome);
      continue;
    }
    
    var budget = campanha.getBudget();
    var budgetDiario = budget.getAmount();
    var budgetMensal = budgetDiario * diasNoMes;
    
    // Métricas de hoje
    var stats = campanha.getStatsFor('TODAY');
    var gastoHoje = stats.getCost();
    var percentualGasto = (gastoHoje / budgetDiario) * 100;
    
    // Métricas do mês
    var statsMes = campanha.getStatsFor('THIS_MONTH');
    var gastoMes = statsMes.getCost();
    var projecaoMes = (gastoMes / diaDoMes) * diasNoMes;
    var percentualProjecao = (projecaoMes / budgetMensal) * 100;
    
    // Montar resumo
    var statusCampanha = {
      nome: nome,
      budgetDiario: budgetDiario,
      gastoHoje: gastoHoje,
      percentualGasto: percentualGasto,
      budgetMensal: budgetMensal,
      gastoMes: gastoMes,
      projecaoMes: projecaoMes,
      percentualProjecao: percentualProjecao,
      nivel: 'OK'
    };
    
    // Verificar alertas diários
    if (percentualGasto >= CONFIG.ALERTA_PERCENTUAL_EMERGENCIA) {
      statusCampanha.nivel = 'EMERGÊNCIA';
      alertas.push({
        nivel: '🚨 EMERGÊNCIA',
        campanha: nome,
        mensagem: 'Gasto ACIMA de ' + CONFIG.ALERTA_PERCENTUAL_EMERGENCIA + '% do budget diário!',
        gastoHoje: formatarMoeda(gastoHoje),
        budgetDiario: formatarMoeda(budgetDiario),
        percentual: percentualGasto.toFixed(1) + '%'
      });
    } else if (percentualGasto >= CONFIG.ALERTA_PERCENTUAL_CRITICO) {
      statusCampanha.nivel = 'CRÍTICO';
      alertas.push({
        nivel: '🔴 CRÍTICO',
        campanha: nome,
        mensagem: 'Gasto ATINGIU ' + CONFIG.ALERTA_PERCENTUAL_CRITICO + '% do budget diário',
        gastoHoje: formatarMoeda(gastoHoje),
        budgetDiario: formatarMoeda(budgetDiario),
        percentual: percentualGasto.toFixed(1) + '%'
      });
    } else if (percentualGasto >= CONFIG.ALERTA_PERCENTUAL_AVISO) {
      statusCampanha.nivel = 'AVISO';
      alertas.push({
        nivel: '🟡 AVISO',
        campanha: nome,
        mensagem: 'Gasto acima de ' + CONFIG.ALERTA_PERCENTUAL_AVISO + '% do budget diário',
        gastoHoje: formatarMoeda(gastoHoje),
        budgetDiario: formatarMoeda(budgetDiario),
        percentual: percentualGasto.toFixed(1) + '%'
      });
    }
    
    // Verificar projeção mensal
    if (CONFIG.ALERTA_PROJECAO_MES && percentualProjecao > (100 + CONFIG.TOLERANCIA_PROJECAO)) {
      alertas.push({
        nivel: '📊 PROJEÇÃO',
        campanha: nome,
        mensagem: 'Projeção mensal ACIMA do budget',
        gastoMes: formatarMoeda(gastoMes),
        projecaoMes: formatarMoeda(projecaoMes),
        budgetMensal: formatarMoeda(budgetMensal),
        percentual: percentualProjecao.toFixed(1) + '%'
      });
    }
    
    resumo.push(statusCampanha);
    
    Logger.log(nome + ': R$' + gastoHoje.toFixed(2) + ' / R$' + budgetDiario.toFixed(2) + ' (' + percentualGasto.toFixed(1) + '%)');
  }
  
  // Salvar log se configurado
  if (CONFIG.SALVAR_LOG && CONFIG.SHEET_ID && CONFIG.SHEET_ID !== 'SUBSTITUIR_SHEET_ID') {
    salvarLog(resumo);
  }
  
  // Enviar email se houver alertas
  if (alertas.length > 0) {
    enviarEmailAlerta(alertas, resumo);
  } else if (CONFIG.SEMPRE_ENVIAR_RESUMO) {
    enviarEmailResumo(resumo);
  }
  
  Logger.log('=== FIM - ' + alertas.length + ' alertas encontrados ===');
}

// ============ FUNÇÕES AUXILIARES ============

function getCampanhasAtivas() {
  var campanhas = [];
  var iterator;
  
  if (CONFIG.IGNORAR_CAMPANHAS_PAUSADAS) {
    iterator = AdsApp.campaigns()
      .withCondition('Status = ENABLED')
      .get();
  } else {
    iterator = AdsApp.campaigns().get();
  }
  
  while (iterator.hasNext()) {
    campanhas.push(iterator.next());
  }
  
  return campanhas;
}

function formatarMoeda(valor) {
  return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

function enviarEmailAlerta(alertas, resumo) {
  if (CONFIG.DEBUG) {
    Logger.log('DEBUG: Email não enviado (modo debug)');
    Logger.log('Alertas: ' + JSON.stringify(alertas));
    return;
  }
  
  var assunto = '⚠️ Budget Alert - ' + alertas.length + ' alerta(s) - ' + AdsApp.currentAccount().getName();
  
  var corpo = '<html><body style="font-family: Arial, sans-serif;">';
  corpo += '<h2 style="color: #d32f2f;">⚠️ Alertas de Budget</h2>';
  corpo += '<p>Conta: <strong>' + AdsApp.currentAccount().getName() + '</strong></p>';
  corpo += '<p>Data/Hora: ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + '</p>';
  
  // Alertas
  corpo += '<h3>Alertas Ativos:</h3>';
  corpo += '<table style="border-collapse: collapse; width: 100%;">';
  corpo += '<tr style="background-color: #f5f5f5;"><th style="border: 1px solid #ddd; padding: 8px;">Nível</th><th style="border: 1px solid #ddd; padding: 8px;">Campanha</th><th style="border: 1px solid #ddd; padding: 8px;">Mensagem</th><th style="border: 1px solid #ddd; padding: 8px;">Gasto</th><th style="border: 1px solid #ddd; padding: 8px;">Budget</th><th style="border: 1px solid #ddd; padding: 8px;">%</th></tr>';
  
  for (var i = 0; i < alertas.length; i++) {
    var a = alertas[i];
    var corLinha = a.nivel.indexOf('EMERGÊNCIA') !== -1 ? '#ffcdd2' : 
                   a.nivel.indexOf('CRÍTICO') !== -1 ? '#ffe0b2' :
                   a.nivel.indexOf('AVISO') !== -1 ? '#fff9c4' : '#e8f5e9';
    
    corpo += '<tr style="background-color: ' + corLinha + ';">';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + a.nivel + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + a.campanha + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + a.mensagem + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + (a.gastoHoje || a.gastoMes || '-') + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + (a.budgetDiario || a.budgetMensal || '-') + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;"><strong>' + a.percentual + '</strong></td>';
    corpo += '</tr>';
  }
  corpo += '</table>';
  
  // Resumo geral
  corpo += '<h3>Resumo de Todas as Campanhas:</h3>';
  corpo += '<table style="border-collapse: collapse; width: 100%;">';
  corpo += '<tr style="background-color: #f5f5f5;"><th style="border: 1px solid #ddd; padding: 8px;">Campanha</th><th style="border: 1px solid #ddd; padding: 8px;">Gasto Hoje</th><th style="border: 1px solid #ddd; padding: 8px;">Budget Diário</th><th style="border: 1px solid #ddd; padding: 8px;">% Diário</th><th style="border: 1px solid #ddd; padding: 8px;">Gasto Mês</th><th style="border: 1px solid #ddd; padding: 8px;">Projeção</th></tr>';
  
  for (var j = 0; j < resumo.length; j++) {
    var r = resumo[j];
    var corStatus = r.nivel === 'EMERGÊNCIA' ? '#ffcdd2' :
                    r.nivel === 'CRÍTICO' ? '#ffe0b2' :
                    r.nivel === 'AVISO' ? '#fff9c4' : '#ffffff';
    
    corpo += '<tr style="background-color: ' + corStatus + ';">';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + r.nome + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + formatarMoeda(r.gastoHoje) + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + formatarMoeda(r.budgetDiario) + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + r.percentualGasto.toFixed(1) + '%</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + formatarMoeda(r.gastoMes) + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + formatarMoeda(r.projecaoMes) + '</td>';
    corpo += '</tr>';
  }
  corpo += '</table>';
  
  corpo += '<p style="color: #666; font-size: 12px; margin-top: 20px;">Este é um email automático gerado pelo script Budget Alert.</p>';
  corpo += '</body></html>';
  
  MailApp.sendEmail({
    to: CONFIG.EMAIL_DESTINATARIO,
    subject: assunto,
    htmlBody: corpo
  });
  
  Logger.log('Email enviado para: ' + CONFIG.EMAIL_DESTINATARIO);
}

function enviarEmailResumo(resumo) {
  if (CONFIG.DEBUG) {
    Logger.log('DEBUG: Email de resumo não enviado (modo debug)');
    return;
  }
  
  var assunto = '📊 Budget Resumo Diário - ' + AdsApp.currentAccount().getName();
  
  var corpo = '<html><body style="font-family: Arial, sans-serif;">';
  corpo += '<h2>📊 Resumo de Budget</h2>';
  corpo += '<p>Conta: <strong>' + AdsApp.currentAccount().getName() + '</strong></p>';
  corpo += '<p>Data/Hora: ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + '</p>';
  corpo += '<p style="color: green;">✅ Nenhum alerta ativo</p>';
  
  corpo += '<h3>Resumo:</h3>';
  corpo += '<table style="border-collapse: collapse; width: 100%;">';
  corpo += '<tr style="background-color: #f5f5f5;"><th style="border: 1px solid #ddd; padding: 8px;">Campanha</th><th style="border: 1px solid #ddd; padding: 8px;">Gasto Hoje</th><th style="border: 1px solid #ddd; padding: 8px;">Budget Diário</th><th style="border: 1px solid #ddd; padding: 8px;">%</th></tr>';
  
  for (var j = 0; j < resumo.length; j++) {
    var r = resumo[j];
    corpo += '<tr>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + r.nome + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + formatarMoeda(r.gastoHoje) + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + formatarMoeda(r.budgetDiario) + '</td>';
    corpo += '<td style="border: 1px solid #ddd; padding: 8px;">' + r.percentualGasto.toFixed(1) + '%</td>';
    corpo += '</tr>';
  }
  corpo += '</table>';
  
  corpo += '</body></html>';
  
  MailApp.sendEmail({
    to: CONFIG.EMAIL_DESTINATARIO,
    subject: assunto,
    htmlBody: corpo
  });
}

function salvarLog(resumo) {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName('Budget Log') || ss.insertSheet('Budget Log');
    
    // Criar header se necessário
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 8).setValues([['Data/Hora', 'Campanha', 'Gasto Hoje', 'Budget Diário', '% Diário', 'Gasto Mês', 'Projeção Mês', 'Status']]);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f5f5f5');
    }
    
    var agora = new Date();
    var linhas = [];
    
    for (var i = 0; i < resumo.length; i++) {
      var r = resumo[i];
      linhas.push([
        agora,
        r.nome,
        r.gastoHoje,
        r.budgetDiario,
        r.percentualGasto / 100,
        r.gastoMes,
        r.projecaoMes,
        r.nivel
      ]);
    }
    
    if (linhas.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, linhas.length, 8).setValues(linhas);
      
      // Formatar moeda e percentual
      var ultimaLinha = sheet.getLastRow();
      var primeiraNovaLinha = ultimaLinha - linhas.length + 1;
      sheet.getRange(primeiraNovaLinha, 3, linhas.length, 2).setNumberFormat('R$ #,##0.00');
      sheet.getRange(primeiraNovaLinha, 5, linhas.length, 1).setNumberFormat('0.0%');
      sheet.getRange(primeiraNovaLinha, 6, linhas.length, 2).setNumberFormat('R$ #,##0.00');
    }
    
    Logger.log('Log salvo na planilha');
  } catch (e) {
    Logger.log('Erro ao salvar log: ' + e.message);
  }
}
