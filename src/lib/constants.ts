// Constantes de la aplicación

export const APP_CONFIG = {
  name: 'Flamenca Store',
  description: 'Gestión integral para tu tienda de trajes de flamenca',
  version: '1.0.0',
  author: 'Flamenca Store Team',
} as const;

export const API_CONFIG = {
  timeout: 30000, // 30 segundos
  retryAttempts: 3,
  retryDelay: 1000, // 1 segundo
} as const;

export const UI_CONFIG = {
  animationDuration: 300,
  toastDuration: 4000,
  debounceDelay: 300,
  paginationSize: 20,
} as const;

export const STORAGE_KEYS = {
  userPreferences: 'flamenca_user_preferences',
  cartItems: 'flamenca_cart_items',
  recentSearches: 'flamenca_recent_searches',
} as const;

export const ROUTES = {
  home: '/',
  auth: '/auth',
  dashboard: '/dashboard',
  products: '/products',
  orders: '/orders',
  pos: '/pos',
  timeEntries: '/time-entries',
  incidents: '/incidents',
  employees: '/employees',
  invoices: '/invoices',
} as const;

export const PERMISSIONS = {
  view_dashboard: 'view_dashboard',
  view_products: 'view_products',
  create_product: 'create_product',
  edit_product: 'edit_product',
  delete_product: 'delete_product',
  view_orders: 'view_orders',
  create_order: 'create_order',
  edit_order: 'edit_order',
  delete_order: 'delete_order',
  access_pos: 'access_pos',
  view_time_entries: 'view_time_entries',
  create_time_entry: 'create_time_entry',
  edit_time_entry: 'edit_time_entry',
  delete_time_entry: 'delete_time_entry',
  view_incidents: 'view_incidents',
  create_incident: 'create_incident',
  edit_incident: 'edit_incident',
  delete_incident: 'delete_incident',
  view_employees: 'view_employees',
  create_employee: 'create_employee',
  edit_employee: 'edit_employee',
  delete_employee: 'delete_employee',
  view_invoices: 'view_invoices',
  create_invoice: 'create_invoice',
  edit_invoice: 'edit_invoice',
  delete_invoice: 'delete_invoice',
} as const;

export const ORDER_STATUS = {
  pending: 'pending',
  in_progress: 'in_progress',
  ready: 'ready',
  delivered: 'delivered',
  cancelled: 'cancelled',
} as const;

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.pending]: 'Pendiente',
  [ORDER_STATUS.in_progress]: 'En Proceso',
  [ORDER_STATUS.ready]: 'Listo',
  [ORDER_STATUS.delivered]: 'Entregado',
  [ORDER_STATUS.cancelled]: 'Cancelado',
} as const;

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.pending]: 'bg-yellow-500',
  [ORDER_STATUS.in_progress]: 'bg-blue-500',
  [ORDER_STATUS.ready]: 'bg-green-500',
  [ORDER_STATUS.delivered]: 'bg-gray-500',
  [ORDER_STATUS.cancelled]: 'bg-red-500',
} as const;

export const PAYMENT_METHODS = {
  cash: 'cash',
  card: 'card',
  transfer: 'transfer',
} as const;

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.cash]: 'Efectivo',
  [PAYMENT_METHODS.card]: 'Tarjeta',
  [PAYMENT_METHODS.transfer]: 'Transferencia',
} as const;

export const INCIDENT_TYPES = {
  technical: 'technical',
  customer_service: 'customer_service',
  inventory: 'inventory',
  other: 'other',
} as const;

export const INCIDENT_TYPE_LABELS = {
  [INCIDENT_TYPES.technical]: 'Técnico',
  [INCIDENT_TYPES.customer_service]: 'Atención al Cliente',
  [INCIDENT_TYPES.inventory]: 'Inventario',
  [INCIDENT_TYPES.other]: 'Otro',
} as const;

export const INCIDENT_STATUS = {
  open: 'open',
  in_progress: 'in_progress',
  resolved: 'resolved',
  closed: 'closed',
} as const;

export const INCIDENT_STATUS_LABELS = {
  [INCIDENT_STATUS.open]: 'Abierto',
  [INCIDENT_STATUS.in_progress]: 'En Proceso',
  [INCIDENT_STATUS.resolved]: 'Resuelto',
  [INCIDENT_STATUS.closed]: 'Cerrado',
} as const;

export const INCIDENT_PRIORITIES = {
  low: 'low',
  medium: 'medium',
  high: 'high',
} as const;

export const INCIDENT_PRIORITY_LABELS = {
  [INCIDENT_PRIORITIES.low]: 'Baja',
  [INCIDENT_PRIORITIES.medium]: 'Media',
  [INCIDENT_PRIORITIES.high]: 'Alta',
} as const;

export const INCIDENT_PRIORITY_COLORS = {
  [INCIDENT_PRIORITIES.low]: 'bg-green-500',
  [INCIDENT_PRIORITIES.medium]: 'bg-yellow-500',
  [INCIDENT_PRIORITIES.high]: 'bg-red-500',
} as const;
