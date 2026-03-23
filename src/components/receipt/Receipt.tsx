"use client"

import { Order } from '@/types';
import { format } from 'date-fns';

export function Receipt({ order }: { order: Order }) {
  const date = order.paidAt?.toDate ? order.paidAt.toDate() : (order.createdAt?.toDate ? order.createdAt.toDate() : new Date());
  
  return (
    <div id="printable-receipt" className="text-black font-mono p-4 w-[80mm] mx-auto bg-white">
      <div className="text-center mb-6 space-y-1">
        <h1 className="text-xl font-black uppercase tracking-tighter">JP Cafe & Tandoori</h1>
        <p className="text-[10px]">Chaksibari, Thamel, Kathmandu</p>
        <p className="text-[10px]">VAT: 601234567 | PH: +977-9800000000</p>
      </div>

      <div className="border-t border-b border-black py-2 my-2 text-[10px] space-y-1">
        <div className="flex justify-between font-bold">
          <span>TABLE: {order.tableNumber}</span>
          <span># {order.id.slice(-6).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>DATE: {format(date, 'dd/MM/yyyy')}</span>
          <span>TIME: {format(date, 'hh:mm a')}</span>
        </div>
      </div>

      <table className="w-full text-[10px] mb-4">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1">ITEM</th>
            <th className="py-1 text-center">QTY</th>
            <th className="py-1 text-right">AMT</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} className="border-b border-dashed border-black/20">
              <td className="py-1 uppercase">{item.name}</td>
              <td className="text-center py-1">{item.qty}</td>
              <td className="text-right py-1">{item.price * item.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1 border-t border-black pt-2">
        <div className="flex justify-between font-black text-sm">
          <span>GRAND TOTAL</span>
          <span>Rs. {order.total}</span>
        </div>
        {order.paymentMethod && (
          <div className="flex justify-between text-[10px] uppercase font-bold">
            <span>PAID VIA</span>
            <span>{order.paymentMethod}</span>
          </div>
        )}
      </div>

      <div className="text-center mt-10 text-[9px] border-t border-black pt-4">
        <p className="font-bold">THANK YOU FOR YOUR VISIT!</p>
        <p className="opacity-60 italic">Software by JP POS</p>
      </div>
    </div>
  );
}
