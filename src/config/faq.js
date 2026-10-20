/*
 * Perguntas frequentes. Aparecem em /perguntas e as 3 primeiras na página inicial.
 *
 * ⚠ CONFIRMAR: as respostas abaixo são rascunhos para checar com a Marlene antes
 * de o site ir ao ar. Depois de confirmar, troque "confirmar: true" por false.
 * Para adicionar uma pergunta, copie um bloco { pergunta, resposta }.
 */
export const perguntasFrequentes = [
  {
    pergunta: 'Quanto tempo demora o atendimento?',
    resposta:
      'Manicure ou pedicure leva de 1h30 a 2h, dependendo da cutilagem. O design de ' +
      'sobrancelhas é mais rápido. Ao agendar, o tempo máximo fica reservado só para ' +
      'você, sem pressa.',
    confirmar: true, // CONFIRMAR: duração do design de sobrancelhas
  },
  {
    pergunta: 'Preciso pagar adiantado?',
    resposta: 'Não. O pagamento é feito no dia, depois do atendimento.',
    confirmar: true, // CONFIRMAR
  },
  {
    pergunta: 'Quais formas de pagamento são aceitas?',
    resposta: 'Dinheiro e Pix.',
    confirmar: true, // CONFIRMAR: aceita cartão?
  },
  {
    pergunta: 'Como faço para cancelar ou remarcar?',
    resposta:
      'Avise pelo WhatsApp assim que souber. Quanto antes, melhor: o horário volta a ' +
      'ficar livre para outra cliente.',
    confirmar: true, // CONFIRMAR: existe prazo mínimo para avisar?
  },
  {
    pergunta: 'O que acontece se eu me atrasar?',
    resposta:
      'Avise pelo WhatsApp. Atrasos curtos são encaixados; atrasos maiores podem ' +
      'precisar de remarcação para não atrasar a cliente seguinte.',
    confirmar: true, // CONFIRMAR: tolerância de atraso
  },
  {
    pergunta: 'Atende em domicílio?',
    resposta: 'Não. O atendimento é feito no espaço da Marlene, no bairro Donga Micheles.',
    confirmar: true, // CONFIRMAR
  },
]
