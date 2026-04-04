export interface MenuItem {
    _id: string;
    name: string;
    price: number;
    foodType?: string;
    description?: string;
    image?: string;
    isAvailable: boolean;
    offerPrice?: number;
    discountPercentage?: number;
    ingredients?: string;
    preparationMethod?: string;
}

export interface CartItem extends MenuItem {
    quantity: number;
}

export interface OrderItem {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    offerPrice?: number;
}

export interface Order {
    _id: string;
    orderNumber?: string;
    tableNumber?: number;
    customerName: string;
    customerPhone?: string;
    numberOfPersons?: number;
    items: OrderItem[];
    totalAmount: number;
    status: 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
    paymentMethod?: 'ONLINE' | 'COUNTER';
    paymentStatus?: 'PENDING' | 'VERIFIED' | 'RETRY' | 'UNPAID';
    paymentDueStatus?: 'CLEAR' | 'DUE';
    collectedVia?: 'CASH' | 'ONLINE' | 'NOT_COLLECTED';
    utr?: string;
    retryCount?: number;
    collectedAt?: string;
    collectedBy?: string;
    refund?: {
        status: 'NOT_REQUIRED' | 'PENDING' | 'COMPLETED';
        method?: string;
        amount?: number;
        processedAt?: string;
    };
    transactions?: any[];
    rejectionReason?: string;
    cancellationReason?: string;
    createdAt: string;
    updatedAt?: string;
    sessionId: string;
    deviceId: string;
    specialInstructions?: string;
    feedback?: {
        comment?: string;
        rating?: number;
        submittedAt?: string;
    };
}
