export type NotificationType = 
  | 'ORDER_NEW' 
  | 'ORDER_UPDATE' 
  | 'ORDER_ACCEPTED' 
  | 'ORDER_REJECTED' 
  | 'ORDER_CANCELLED'
  | 'ORDER_COMPLETED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_RETRY'
  | 'ACCOUNT_STATUS';

export interface NotificationMetadata {
  orderId?: string;
  orderNumber?: string;
  tableNumber?: string;
  amount?: number;
  orderData?: any;
}

export interface Notification {
  _id: string;
  recipient: string;
  recipientType: 'ADMIN' | 'CUSTOMER';
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  isRead: boolean;
  createdAt: string;
}
