export interface MenuItem {
    _id: string;
    name: string;
    price: number;
    foodType?: string;
    description?: string;
    images?: string[];
    image?: string;
    isAvailable: boolean;
    isVeg?: boolean;
    isBestSeller?: boolean;
}

export interface CartItem extends MenuItem {
    quantity: number;
}

export interface OrderItem {
    itemId?: string;
    name: string;
    price: number;
    quantity: number;
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
    status: 'PLACED' | 'ACCEPTED' | 'PREPARED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
    paymentMethod?: 'ONLINE' | 'CASH';
    paymentStatus?: 'PENDING' | 'VERIFIED' | 'RETRY' | 'UNPAID';
    paymentDueStatus?: 'CLEAR' | 'DUE';
    collectedVia?: 'CASH' | 'ONLINE' | 'NOT_COLLECTED' | 'SPLIT';
    utr?: string;
    retryCount?: number;
    collectedAt?: string;
    collectedBy?: string;
    transactions?: any[];
    rejectionReason?: string;
    cancellationReason?: string;
    createdAt: string;
    updatedAt?: string;
    sessionId?: string;
    deviceId?: string;
    createdBy?: string;
    source?: 'admin' | 'customer';
    restaurant?: string;
    adminId?: string;
    specialInstructions?: string;
    feedback?: {
        comment?: string;
        rating?: number;
        submittedAt?: string;
    };
    paymentVerificationRequestbycustomer?: {
        applied?: boolean;
        appliedUTR?: string;
        retrycount?: number;
        adminAskedretry?: boolean;
    };
    gstEnabled?: boolean;
    sgstAmount?: number;
    cgstAmount?: number;
    igstAmount?: number;
    serviceChargeAmount?: number;
    taxableAmount?: number;
    roundOff?: number;
    grandTotal?: number;
    subtotal?: number;
    isCollected?: boolean;
    isDue?: boolean;
    isPending?: boolean;
    submittedUtr?: string;
    orderType?: string;
}
