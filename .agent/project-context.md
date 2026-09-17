# Project Context: Mini Sistema de Pedidos e Produção (MVP)

## Visão Geral

Sistema interno para registrar pedidos, e atribuir a vendedores conectados, calcular/organizar prazos de entrega e acompanhar a evolução da produção.

- **Usuários:** 2 a 3 usuários internos.
- **Volume:** 100 a 200 pedidos/mês (~3-7 pedidos/dia).
- **Objetivo:** Gerenciamento, Organização, Acompanhamento, aprendizado e praticidade.

## Funcionalidades

- **Cadastrar pedidos:** Atribuição a vendedor, verificar datas disponíveis com base em regras de finais de semana e feriados.
- **Listar Pedidos:** Os pedidos são exibidos em mais de um local, quando o usuário está definindo a data de um novo pedido, é possivel ver número de pedidos para a data que atualmente estiver selecionada, é possivel também ver todos pedidos com data de entrega pro dia atual, com separação por vendedor, com possibilidade de manualmente mudar a data e ver outros dias, anteriores a data atual ou posteriores.
- **Listar Vendas:** Nessa parte o foco está na quantidade de peças e o valor vendido, por vendedor, com opção de visualização por dia, mês ou ano, com visualização facilitada para poder usar o serviço print do browser e imprimir todas as vendas do periodo escolhido.
- **Definir feriados:** um pequeno form que recebe um titulo e uma data, e injeta na tabela da planilha para corrigir os cálculos de dias disponíveis para entrega.
- **Cadastrar usuários:** envia os dados do form de novo usuário para a planilha `Users`.

## Stack Tecnológica

- **Frontend:** TanStack Start + Vite + React + Tailwind CSS v4 + shadcn/ui (preset Vega).
- **Roteamento:** TanStack Router (`src/routes/`).
- **Backend/API:** Google Apps Script (Web App).
- **Persistência:** Google Sheets.
- **Comunicação:** HTTP + JSON.

## Regras de Negócio Core

1. **Prazos:** Calculados em um utilitario em lib, o app recebe um json com o conteudo de 500 linhas da planilha de pedidos, e tudo que tiver em (dias úteis, feriados, capacidade diária).
2. **Concorrência:** Uso de `LockService` no Apps Script para evitar conflitos de gravação simultânea.
3. **Finais de semana e Feriados:** são datas que ficam indisponiveis no seletor de data para escolha de dia pra entregar um pedido.
4. **Estrutura de Dados:** dentro da planilha que servirá com banco de dados teremos as planilhas: `Pedidos`, `Users` e `Feriados`.
5. **Usuários:** Inicialmente é possivel alterar o usuário ativo simplesmente clicando no dropdown do user e selecionando da lista, sem autenticação, o usuário que estiver selecionado será atribuido a todo novo pedido criado naquele browser, para alterar o usuário que ficou atribuido a um pedido é nescessário manualmente mudar na planilha.
