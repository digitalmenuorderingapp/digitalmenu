'use client';

import { forwardRef } from 'react';

interface PrintableBillProps {
  order: any;
  restaurantName?: string;
  restaurantLogo?: string;
  isPaid?: boolean;
  gstEnabled?: boolean;
}

// Helper functions
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const calculateSubtotal = (order: any) => {
  return order.subtotal || order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
};

// Scenario 1: Neither service charge nor GST enabled
const SimpleBill = ({ order, subtotal }: { order: any; subtotal: number }) => (
  <div className="flex justify-between font-black text-lg mt-2 pt-2 border-t-2 border-black">
    <span>AMOUNT PAYABLE:</span>
    <span>₹{Math.round(order.totalAmount).toFixed(0)}</span>
  </div>
);

// Scenario 2: Service charge enabled, GST NOT enabled
const ServiceChargeOnlyBill = ({ order, subtotal }: { order: any; subtotal: number }) => (
  <>
    <div className="flex justify-between">
      <span>Service Charge:</span>
      <span>₹{(order.serviceChargeAmount || 0).toFixed(0)}</span>
    </div>
    <div className="flex justify-between font-black text-lg mt-2 pt-2 border-t-2 border-black">
      <span>AMOUNT PAYABLE:</span>
      <span>₹{Math.round(order.totalAmount).toFixed(0)}</span>
    </div>
  </>
);

// Scenario 3: GST enabled, Service charge NOT enabled
const GSTOnlyBill = ({ order, subtotal, gstEnabled }: { order: any; subtotal: number; gstEnabled: boolean }) => {
  const taxAmount = order.totalAmount - subtotal;
  const grandTotal = order.grandTotal || (subtotal + (order.sgstAmount || 0) + (order.cgstAmount || 0) + (order.igstAmount || 0));
  
  return (
    <>
      <div className="flex justify-between font-semibold">
        <span>Taxable Amount:</span>
        <span>₹{(order.taxableAmount || subtotal).toFixed(0)}</span>
      </div>
      <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
        <div className="text-xs font-bold mb-1">TAX BREAKDOWN</div>
        {(order.sgstAmount || 0) > 0 && (
          <div className="flex justify-between text-xs">
            <span>SGST:</span>
            <span>₹{(order.sgstAmount || 0).toFixed(2)}</span>
          </div>
        )}
        {(order.cgstAmount || 0) > 0 && (
          <div className="flex justify-between text-xs">
            <span>CGST:</span>
            <span>₹{(order.cgstAmount || 0).toFixed(2)}</span>
          </div>
        )}
        {(order.igstAmount || 0) > 0 && (
          <div className="flex justify-between text-xs">
            <span>IGST:</span>
            <span>₹{(order.igstAmount || 0).toFixed(2)}</span>
          </div>
        )}
        {(order.sgstAmount || 0) === 0 && (order.cgstAmount || 0) === 0 && (order.igstAmount || 0) === 0 && taxAmount > 0 && (
          <div className="flex justify-between text-xs">
            <span>Tax:</span>
            <span>₹{taxAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="flex justify-between mt-2 pt-2 border-t border-gray-300">
        <span>Total:</span>
        <span>₹{grandTotal.toFixed(2)}</span>
      </div>
      {order.roundOff !== 0 && (
        <div className="flex justify-between text-xs">
          <span>Round Off:</span>
          <span>{(order.roundOff || 0) > 0 ? '+' : ''}₹{(order.roundOff || 0).toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between font-black text-lg mt-2 pt-2 border-t-2 border-black">
        <span>AMOUNT PAYABLE:</span>
        <span>₹{Math.round(order.totalAmount).toFixed(0)}</span>
      </div>
    </>
  );
};

// Scenario 4: Both service charge AND GST enabled
const FullBill = ({ order, subtotal, gstEnabled }: { order: any; subtotal: number; gstEnabled: boolean }) => {
  const serviceCharge = order.serviceChargeAmount || 0;
  const taxableAmount = order.taxableAmount || (subtotal + serviceCharge);
  const taxAmount = order.totalAmount - subtotal - serviceCharge;
  const grandTotal = order.grandTotal || (taxableAmount + (order.sgstAmount || 0) + (order.cgstAmount || 0) + (order.igstAmount || 0));
  
  return (
    <>
      <div className="flex justify-between">
        <span>Service Charge:</span>
        <span>₹{serviceCharge.toFixed(0)}</span>
      </div>
      <div className="flex justify-between font-semibold">
        <span>Taxable Amount:</span>
        <span>₹{taxableAmount.toFixed(0)}</span>
      </div>
      <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
        <div className="text-xs font-bold mb-1">TAX BREAKDOWN</div>
        {(order.sgstAmount || 0) > 0 && (
          <div className="flex justify-between text-xs">
            <span>SGST:</span>
            <span>₹{(order.sgstAmount || 0).toFixed(2)}</span>
          </div>
        )}
        {(order.cgstAmount || 0) > 0 && (
          <div className="flex justify-between text-xs">
            <span>CGST:</span>
            <span>₹{(order.cgstAmount || 0).toFixed(2)}</span>
          </div>
        )}
        {(order.igstAmount || 0) > 0 && (
          <div className="flex justify-between text-xs">
            <span>IGST:</span>
            <span>₹{(order.igstAmount || 0).toFixed(2)}</span>
          </div>
        )}
        {(order.sgstAmount || 0) === 0 && (order.cgstAmount || 0) === 0 && (order.igstAmount || 0) === 0 && taxAmount > 0 && (
          <div className="flex justify-between text-xs">
            <span>Tax:</span>
            <span>₹{taxAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="flex justify-between mt-2 pt-2 border-t border-gray-300">
        <span>Total:</span>
        <span>₹{grandTotal.toFixed(2)}</span>
      </div>
      {order.roundOff !== 0 && (
        <div className="flex justify-between text-xs">
          <span>Round Off:</span>
          <span>{(order.roundOff || 0) > 0 ? '+' : ''}₹{(order.roundOff || 0).toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between font-black text-lg mt-2 pt-2 border-t-2 border-black">
        <span>AMOUNT PAYABLE:</span>
        <span>₹{Math.round(order.totalAmount).toFixed(0)}</span>
      </div>
    </>
  );
};

// Main Bill Totals Component that decides which scenario to render
const BillTotals = ({ order, subtotal, gstEnabled }: { order: any; subtotal: number; gstEnabled: boolean }) => {
  const hasServiceCharge = (order.serviceChargeAmount || 0) > 0;
  const hasTaxAmounts = (order.sgstAmount || 0) > 0 || (order.cgstAmount || 0) > 0 || (order.igstAmount || 0) > 0;
  const hasGSTFlag = order.gstEnabled || gstEnabled;
  const hasTaxByAmount = order.totalAmount > (subtotal + (order.serviceChargeAmount || 0));
  const hasGST = hasTaxAmounts || hasGSTFlag || hasTaxByAmount;

  // Scenario 1: No service charge, no GST
  if (!hasServiceCharge && !hasGST) {
    return <SimpleBill order={order} subtotal={subtotal} />;
  }

  // Scenario 2: Service charge only, no GST
  if (hasServiceCharge && !hasGST) {
    return <ServiceChargeOnlyBill order={order} subtotal={subtotal} />;
  }

  // Scenario 3: GST only, no service charge
  if (!hasServiceCharge && hasGST) {
    return <GSTOnlyBill order={order} subtotal={subtotal} gstEnabled={gstEnabled} />;
  }

  // Scenario 4: Both service charge and GST
  return <FullBill order={order} subtotal={subtotal} gstEnabled={gstEnabled} />;
};

const PrintableBill = forwardRef<HTMLDivElement, PrintableBillProps>(
  ({ order, restaurantName = 'Restaurant', restaurantLogo, isPaid, gstEnabled = false }, ref) => {
    const subtotal = calculateSubtotal(order);

    return (
      <div
        ref={ref}
        className="bg-white p-4 w-[80mm] text-sm font-mono"
        style={{ fontFamily: 'monospace' }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          {restaurantLogo && (
            <div className="mb-2">
              <img 
                src={restaurantLogo.startsWith('http') ? restaurantLogo : `${window.location.origin}${restaurantLogo}`} 
                alt="Logo" 
                className="h-16 mx-auto object-contain"
                crossOrigin="anonymous"
              />
            </div>
          )}
          <h1 className="text-lg font-bold uppercase">{restaurantName}</h1>
          <p className="text-xs text-gray-600">Order Receipt</p>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-400 mb-4"></div>

        {/* Order Info */}
        <div className="mb-4 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Order #:</span>
            <span className="font-semibold">{order.orderNumber || order._id.slice(-6)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-semibold">{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Table:</span>
            <span className="font-semibold">#{order.tableNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Customer:</span>
            <span className="font-semibold">{order.customerName}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-400 mb-4"></div>

        {/* Items */}
        <div className="mb-4">
          <h2 className="font-bold mb-2 text-center">ITEMS</h2>
          
          {/* Header Row */}
          <div className="flex justify-between text-xs font-bold mb-1 border-b border-gray-300 pb-1">
            <span className="flex-1">Description</span>
            <span className="w-8 text-center">Qty</span>
            <span className="w-14 text-right">Actual</span>
            <span className="w-14 text-right">Offer</span>
            <span className="w-14 text-right">Total</span>
          </div>

          {order.items.map((item: any, idx: number) => {
            const originalPrice = item.originalPrice || item.price;
            const finalPrice = item.price;
            const offerPrice = item.offerPrice;
            const total = finalPrice * item.quantity;

            return (
              <div key={idx} className="flex justify-between text-xs mb-1">
                <span className="flex-1 whitespace-normal" title={item.name}>{item.name}</span>
                <span className="w-8 text-center flex-shrink-0">{item.quantity}</span>
                <span className="w-14 text-right flex-shrink-0">₹{originalPrice.toFixed(0)}</span>
                <span className="w-14 text-right flex-shrink-0">{offerPrice ? `₹${offerPrice.toFixed(0)}` : '-'}</span>
                <span className="w-14 text-right font-semibold flex-shrink-0">₹{total.toFixed(0)}</span>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-400 mb-4"></div>

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(0)}</span>
          </div>
          <BillTotals order={order} subtotal={subtotal} gstEnabled={gstEnabled} />
        </div>

        {/* PAID Stamp */}
        {isPaid && (
          <div className="mt-3 border-2 border-black rounded-md p-2 text-center">
            <div className="border border-black rounded-sm p-1">
              <span className="text-xl font-black tracking-[0.3em]">PAID</span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-dashed border-gray-400 mt-4 mb-4"></div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600">
          <p>Thank you for dining with us!</p>
          <p className="mt-1">Visit us again</p>
        </div>
      </div>
    );
  }
);

PrintableBill.displayName = 'PrintableBill';

export default PrintableBill;
