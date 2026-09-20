// Interfaces baseadas nas planilhas da API (Google Apps Script + Google Sheets)
// Ver .agent/contexto da api.md para a referência das colunas

// planilha `users`: id, name, mail, role, is_active
export interface User {
  id: string
  name: string
  mail: string
  role: string
  is_active: boolean
}

// planilha `orders`: id, user_id, order_name, shirt_count,
// others_items_count, total_amount, created_at, delivery_date
// - created_at: string ISO gerada no backend (new Date())
// - delivery_date: "YYYY-MM-DD" (data de calendário, sem horário/timezone)
export interface Order {
  id: string
  user_id: string
  order_name: string
  shirt_count: number
  others_items_count: number
  total_amount: number
  created_at: string
  delivery_date: string
}

// planilha `holidays`: holiday_date, holiday_description
// - holiday_date: "YYYY-MM-DD" (data de calendário, sem horário/timezone)
export interface Holiday {
  holiday_date: string
  holiday_description: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}
