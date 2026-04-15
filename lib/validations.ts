import * as z from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Table
export const tableSchema = z.object({
  tableNumber: z.number({ message: 'Table number is required' }).min(1, 'Table number must be at least 1'),
  seats: z.number({ message: 'Seats are required' }).min(1, 'At least 1 seat is required'),
});

export type TableInput = z.infer<typeof tableSchema>;

// Restaurant Profile
export const restaurantProfileSchema = z.object({
  restaurantName: z.string().min(2, 'Restaurant name is too short'),
  ownerName: z.string().min(2, 'Owner name is too short'),
  address: z.string().min(5, 'Address is too short'),
  phone: z.string().optional(),
  motto: z.string().max(100, 'Motto is too long').optional(),
});

export type RestaurantProfileInput = z.infer<typeof restaurantProfileSchema>;

// Password Update
export const passwordUpdateSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;

// Delete Account
export const deleteAccountSchema = z.object({
  captcha: z.literal('DELETE', {
    message: 'Please type DELETE to confirm',
  }),
  reason: z.string().min(5, 'Please provide a valid reason'),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// Menu Item
export const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number({ message: 'Price must be a number' }).min(0, 'Price cannot be negative'),
  offerPrice: z.number().min(0, 'Offer price cannot be negative').optional(),
  foodType: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isVeg: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;

// Order
export const orderItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(1),
  offerPrice: z.number().optional(),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional(),
  orderType: z.enum(['dine-in', 'takeaway', 'delivery']),
  tableNumber: z.number().min(1, 'Table number is required').optional(),
  numberOfPersons: z.number().min(1, 'At least 1 person required').optional(),
  specialInstructions: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.orderType === 'dine-in') {
    if (!data.tableNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Table number is required for dine-in',
        path: ['tableNumber'],
      });
    }
    if (!data.numberOfPersons) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Number of persons is required for dine-in',
        path: ['numberOfPersons'],
      });
    }
  }
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
