# Architecture & API Contract

## Fluxo de Comunicação

```text
React Frontend ──(HTTP)──▶ Google Apps Script Web App ──(LockService)──▶ Google Sheets
```

## Arquitetura de Camadas

- **Frontend (React):** UI, estado local/global, formulários, tabelas, dashboard, consumo de API.
- **Backend (Apps Script):** gateway de acesso a planilha, inicialmente sem autenticação, repositório de planilhas, permite gravar/ler o conteúdo da planilha linkada.
- **Persistência (Google Sheets):** Armazenamento em tabela.

## Contrato de Endpoints (Apps Script)

- `GET /pedidos` - Retorna todos os ultimos 500 pedidos.
- `GET /allpedidos` - Retorna todos os pedidos do sistema.
- `GET /feriados` - Retorna a lista completa de feriados cadastrados.
- `GET /users` - Retorna a lista de usuários cadastrados no sistema.
- `POST /pedidos` - Cria novo pedido, com os dados enviados pelo form do frontend.
- `POST /feriados` - Cria novo feriado.
- `POST /users` - adiciona um novo usuário no sistema.
