export interface LineItem {
  id: string;
  name: string;
  description: string;
  amount: number;
  category: 'Service' | 'Optional';
}

export interface InvoiceData {
  invoiceNo: string;
  date: string;
  dueDate: string;
  fromName: string;
  fromAddress: string;
  fromContact: string;
  toName: string;
  toAddress: string;
  currency: string;
  secondaryCurrency?: string;
  exchangeRate?: number;
  logo?: string;
  themeColor: string;
  items: LineItem[];
  paymentDetails: string;
  notes: string;
}
