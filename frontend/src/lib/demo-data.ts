export type DemoClient = {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  sites: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
};

export const demoClients: DemoClient[] = [
  { id: "client-001", name: "ABC Bank Limited", code: "CLI-001", contactPerson: "Thoko Banda", phone: "+265 999 210 015", email: "thoko.banda@abcbank.mw", sites: 4, status: "ACTIVE", createdAt: "12 May 2026" },
  { id: "client-002", name: "Central Plaza", code: "CLI-002", contactPerson: "Mphatso Phiri", phone: "+265 888 140 223", email: "security@centralplaza.mw", sites: 2, status: "ACTIVE", createdAt: "4 May 2026" },
  { id: "client-003", name: "Lakeview Logistics", code: "CLI-003", contactPerson: "Ruth Chisale", phone: "+265 999 032 851", email: "ruth@lakeviewlogistics.mw", sites: 1, status: "ACTIVE", createdAt: "28 April 2026" },
  { id: "client-004", name: "Malawi Agri Supplies", code: "CLI-004", contactPerson: "Peter Mbewe", phone: "+265 888 715 902", email: "peter@malawiagri.mw", sites: 3, status: "INACTIVE", createdAt: "18 March 2026" },
  { id: "client-005", name: "City Mall Management", code: "CLI-005", contactPerson: "Chikondi Zulu", phone: "+265 999 643 201", email: "operations@citymall.mw", sites: 1, status: "ACTIVE", createdAt: "9 February 2026" },
];

export type DemoClientSite = { id: string; clientId: string; name: string; code: string; location: string; contactPerson: string; phone: string; status: "ACTIVE" | "INACTIVE" };
export type DemoContract = { id: string; clientId: string; number: string; startDate: string; endDate: string; monthlyCharge: string; status: "ACTIVE" | "EXPIRED" };

export const demoClientSites: DemoClientSite[] = [
  { id: "site-001", clientId: "client-001", name: "Area 3 Branch", code: "ABC-A3", location: "Area 3, Lilongwe", contactPerson: "Thoko Banda", phone: "+265 999 210 015", status: "ACTIVE" },
  { id: "site-002", clientId: "client-001", name: "Kanengo Branch", code: "ABC-KAN", location: "Kanengo, Lilongwe", contactPerson: "Chisomo Moyo", phone: "+265 888 210 091", status: "ACTIVE" },
  { id: "site-003", clientId: "client-001", name: "Mzuzu Branch", code: "ABC-MZU", location: "Mzuzu City Centre", contactPerson: "Thoko Banda", phone: "+265 999 210 015", status: "ACTIVE" },
  { id: "site-004", clientId: "client-002", name: "Central Plaza Main", code: "CP-MAIN", location: "City Centre, Lilongwe", contactPerson: "Mphatso Phiri", phone: "+265 888 140 223", status: "ACTIVE" },
  { id: "site-005", clientId: "client-002", name: "Central Plaza Warehouse", code: "CP-WH", location: "Kanengo, Lilongwe", contactPerson: "Mphatso Phiri", phone: "+265 888 140 223", status: "ACTIVE" },
  { id: "site-006", clientId: "client-003", name: "Lakeview Depot", code: "LL-DEPOT", location: "Chipoka, Salima", contactPerson: "Ruth Chisale", phone: "+265 999 032 851", status: "ACTIVE" },
];

export const demoContracts: DemoContract[] = [
  { id: "contract-001", clientId: "client-001", number: "CON-2026-001", startDate: "1 January 2026", endDate: "31 December 2026", monthlyCharge: "MWK 2,400,000", status: "ACTIVE" },
  { id: "contract-002", clientId: "client-002", number: "CON-2026-002", startDate: "1 March 2026", endDate: "28 February 2027", monthlyCharge: "MWK 1,250,000", status: "ACTIVE" },
  { id: "contract-003", clientId: "client-003", number: "CON-2026-003", startDate: "1 April 2026", endDate: "31 March 2027", monthlyCharge: "MWK 850,000", status: "ACTIVE" },
];

export type DemoEmployee = {
  id: string;
  employeeNumber: string;
  fullName: string;
  phone: string;
  email: string;
  jobTitle: string;
  employeeType: "GUARD" | "SUPERVISOR" | "OFFICE_STAFF";
  basicSalary: string;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  dateJoined: string;
  siteId?: string;
};

export const demoEmployees: DemoEmployee[] = [
  { id: "employee-001", employeeNumber: "EMP-1001", fullName: "Blessings Nyirenda", phone: "+265 999 620 114", email: "blessings.n@securitask.demo", jobTitle: "Security Guard", employeeType: "GUARD", basicSalary: "MWK 185,000", status: "ACTIVE", dateJoined: "14 January 2025", siteId: "site-001" },
  { id: "employee-002", employeeNumber: "EMP-1002", fullName: "Tapiwa Chirwa", phone: "+265 888 047 291", email: "tapiwa.c@securitask.demo", jobTitle: "Site Supervisor", employeeType: "SUPERVISOR", basicSalary: "MWK 310,000", status: "ACTIVE", dateJoined: "3 March 2024", siteId: "site-001" },
  { id: "employee-003", employeeNumber: "EMP-1003", fullName: "Chisomo Kafwafwa", phone: "+265 999 734 505", email: "chisomo.k@securitask.demo", jobTitle: "Security Guard", employeeType: "GUARD", basicSalary: "MWK 185,000", status: "ACTIVE", dateJoined: "21 August 2025", siteId: "site-002" },
  { id: "employee-004", employeeNumber: "EMP-1004", fullName: "Esther Mbewe", phone: "+265 888 601 842", email: "esther.m@securitask.demo", jobTitle: "Security Guard", employeeType: "GUARD", basicSalary: "MWK 185,000", status: "SUSPENDED", dateJoined: "10 June 2024", siteId: "site-004" },
  { id: "employee-005", employeeNumber: "EMP-1005", fullName: "Henry Kachale", phone: "+265 999 129 310", email: "henry.k@securitask.demo", jobTitle: "Operations Assistant", employeeType: "OFFICE_STAFF", basicSalary: "MWK 275,000", status: "ACTIVE", dateJoined: "1 February 2026" },
  { id: "employee-006", employeeNumber: "EMP-1006", fullName: "Memory Nkhoma", phone: "+265 888 886 123", email: "memory.n@securitask.demo", jobTitle: "Security Guard", employeeType: "GUARD", basicSalary: "MWK 185,000", status: "INACTIVE", dateJoined: "9 November 2023", siteId: "site-006" },
];

export type DemoFinancialAccount = { id: string; name: string; accountType: "BANK" | "CASH" | "MOBILE_MONEY_RECORD"; bankName?: string; accountNumberMasked?: string; currency: string; openingBalance: string; recordedBalance: string; isActive: boolean };

export const demoFinancialAccounts: DemoFinancialAccount[] = [
  { id: "account-001", name: "National Bank Current Account", accountType: "BANK", bankName: "National Bank of Malawi", accountNumberMasked: "•••• 4812", currency: "MWK", openingBalance: "MWK 4,250,000", recordedBalance: "MWK 15,750,000", isActive: true },
  { id: "account-002", name: "Office Cash", accountType: "CASH", currency: "MWK", openingBalance: "MWK 500,000", recordedBalance: "MWK 2,350,000", isActive: true },
  { id: "account-003", name: "Airtel Money Record", accountType: "MOBILE_MONEY_RECORD", accountNumberMasked: "•••• 0921", currency: "MWK", openingBalance: "MWK 0", recordedBalance: "MWK 1,180,000", isActive: true },
  { id: "account-004", name: "Petty Cash", accountType: "CASH", currency: "MWK", openingBalance: "MWK 100,000", recordedBalance: "MWK 85,000", isActive: false },
];

export type DemoExpenseCategory = { id: string; name: string; description: string; isActive: boolean; expensesThisMonth: string };

export const demoExpenseCategories: DemoExpenseCategory[] = [
  { id: "category-001", name: "Salaries", description: "Employee salary payments and payroll costs.", isActive: true, expensesThisMonth: "MWK 3,120,000" },
  { id: "category-002", name: "Fuel", description: "Fuel for company and operational transport.", isActive: true, expensesThisMonth: "MWK 465,000" },
  { id: "category-003", name: "Uniforms", description: "Guard uniforms and related protective clothing.", isActive: true, expensesThisMonth: "MWK 280,000" },
  { id: "category-004", name: "Office Expenses", description: "Office supplies, stationery, and consumables.", isActive: true, expensesThisMonth: "MWK 190,000" },
  { id: "category-005", name: "Bank Charges", description: "Bank fees and account-related charges.", isActive: true, expensesThisMonth: "MWK 75,000" },
  { id: "category-006", name: "Repairs", description: "Repairs and maintenance for business assets.", isActive: false, expensesThisMonth: "MWK 0" },
];

export type DemoInvoiceItem = { description: string; quantity: number; unitPrice: string; amount: string };
export type DemoInvoice = { id: string; number: string; clientId: string; invoiceDate: string; dueDate: string; total: string; amountPaid: string; balance: string; status: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE"; items: DemoInvoiceItem[] };

export const demoInvoices: DemoInvoice[] = [
  { id: "invoice-001", number: "INV-2026-0015", clientId: "client-001", invoiceDate: "1 May 2026", dueDate: "31 May 2026", total: "MWK 2,400,000", amountPaid: "MWK 1,500,000", balance: "MWK 900,000", status: "PARTIALLY_PAID", items: [{ description: "Security guards – ABC Bank branches", quantity: 12, unitPrice: "MWK 200,000", amount: "MWK 2,400,000" }] },
  { id: "invoice-002", number: "INV-2026-0016", clientId: "client-002", invoiceDate: "1 May 2026", dueDate: "31 May 2026", total: "MWK 1,250,000", amountPaid: "MWK 1,250,000", balance: "MWK 0", status: "PAID", items: [{ description: "Security services – Central Plaza", quantity: 1, unitPrice: "MWK 1,250,000", amount: "MWK 1,250,000" }] },
  { id: "invoice-003", number: "INV-2026-0017", clientId: "client-003", invoiceDate: "1 May 2026", dueDate: "31 May 2026", total: "MWK 850,000", amountPaid: "MWK 0", balance: "MWK 850,000", status: "OVERDUE", items: [{ description: "Security services – Lakeview Depot", quantity: 1, unitPrice: "MWK 850,000", amount: "MWK 850,000" }] },
  { id: "invoice-004", number: "INV-2026-0018", clientId: "client-005", invoiceDate: "1 June 2026", dueDate: "30 June 2026", total: "MWK 920,000", amountPaid: "MWK 0", balance: "MWK 920,000", status: "ISSUED", items: [{ description: "Security services – City Mall", quantity: 1, unitPrice: "MWK 920,000", amount: "MWK 920,000" }] },
];

export type DemoPayment = { id: string; number: string; clientId: string; paymentDate: string; amount: string; method: string; account: string; reference: string; status: "RECORDED" | "REVERSED"; allocations: { invoiceId: string; amount: string }[] };

export const demoPayments: DemoPayment[] = [
  { id: "payment-001", number: "PAY-2026-0012", clientId: "client-001", paymentDate: "18 May 2026", amount: "MWK 1,500,000", method: "Bank transfer", account: "National Bank Current Account", reference: "NBS-TRF-819230", status: "RECORDED", allocations: [{ invoiceId: "invoice-001", amount: "MWK 1,500,000" }] },
  { id: "payment-002", number: "PAY-2026-0013", clientId: "client-002", paymentDate: "20 May 2026", amount: "MWK 1,250,000", method: "Bank transfer", account: "National Bank Current Account", reference: "NBS-TRF-821042", status: "RECORDED", allocations: [{ invoiceId: "invoice-002", amount: "MWK 1,250,000" }] },
];

export type DemoExpense = { id: string; number: string; expenseDate: string; categoryId: string; description: string; payee: string; amount: string; paymentMethod: string; accountId: string; reference: string; status: "RECORDED" | "APPROVED" | "PAID" | "VOIDED" };

export const demoExpenses: DemoExpense[] = [
  { id: "expense-001", number: "EXP-2026-0021", expenseDate: "22 May 2026", categoryId: "category-002", description: "Fuel for client site patrols", payee: "Puma Energy", amount: "MWK 265,000", paymentMethod: "Bank transfer", accountId: "account-001", reference: "NBS-TRF-825901", status: "PAID" },
  { id: "expense-002", number: "EXP-2026-0022", expenseDate: "23 May 2026", categoryId: "category-004", description: "Office printer supplies", payee: "Stationery House", amount: "MWK 85,000", paymentMethod: "Cash", accountId: "account-002", reference: "CASH-1551", status: "PAID" },
  { id: "expense-003", number: "EXP-2026-0023", expenseDate: "25 May 2026", categoryId: "category-003", description: "Guard uniform replacement", payee: "Secure Wear Ltd", amount: "MWK 280,000", paymentMethod: "Bank transfer", accountId: "account-001", reference: "NBS-TRF-827492", status: "APPROVED" },
  { id: "expense-004", number: "EXP-2026-0024", expenseDate: "27 May 2026", categoryId: "category-005", description: "Monthly account charges", payee: "National Bank of Malawi", amount: "MWK 75,000", paymentMethod: "Bank charge", accountId: "account-001", reference: "NBS-CHG-MAY", status: "RECORDED" },
];

export type DemoAccountTransaction = { id: string; accountId: string; transactionDate: string; transactionType: string; description: string; reference: string; direction: "CREDIT" | "DEBIT"; amount: string; status: "RECORDED" | "REVERSED" };

export const demoAccountTransactions: DemoAccountTransaction[] = [
  { id: "ledger-001", accountId: "account-001", transactionDate: "18 May 2026", transactionType: "Client payment", description: "Payment from ABC Bank Limited", reference: "PAY-2026-0012", direction: "CREDIT", amount: "MWK 1,500,000", status: "RECORDED" },
  { id: "ledger-002", accountId: "account-001", transactionDate: "20 May 2026", transactionType: "Client payment", description: "Payment from Central Plaza", reference: "PAY-2026-0013", direction: "CREDIT", amount: "MWK 1,250,000", status: "RECORDED" },
  { id: "ledger-003", accountId: "account-001", transactionDate: "22 May 2026", transactionType: "Expense", description: "Fuel for client site patrols", reference: "EXP-2026-0021", direction: "DEBIT", amount: "MWK 265,000", status: "RECORDED" },
  { id: "ledger-004", accountId: "account-002", transactionDate: "23 May 2026", transactionType: "Expense", description: "Office printer supplies", reference: "EXP-2026-0022", direction: "DEBIT", amount: "MWK 85,000", status: "RECORDED" },
];

export type DemoPayrollLine = { employeeId: string; basicSalary: string; allowances: string; overtime: string; deductions: string; advanceRecovery: string; netPay: string; paymentStatus: "PENDING" | "PAID" };
export type DemoPayrollRun = { id: string; name: string; period: string; status: "DRAFT" | "REVIEWED" | "APPROVED" | "PAID"; paymentDate?: string; totalNetPay: string; lines: DemoPayrollLine[] };

export const demoPayrollRuns: DemoPayrollRun[] = [
  { id: "payroll-001", name: "May 2026 Payroll", period: "1 May 2026 — 31 May 2026", status: "APPROVED", totalNetPay: "MWK 1,090,000", lines: [{ employeeId: "employee-001", basicSalary: "MWK 185,000", allowances: "MWK 10,000", overtime: "MWK 15,000", deductions: "MWK 5,000", advanceRecovery: "MWK 0", netPay: "MWK 205,000", paymentStatus: "PENDING" }, { employeeId: "employee-002", basicSalary: "MWK 310,000", allowances: "MWK 20,000", overtime: "MWK 0", deductions: "MWK 10,000", advanceRecovery: "MWK 40,000", netPay: "MWK 280,000", paymentStatus: "PENDING" }, { employeeId: "employee-003", basicSalary: "MWK 185,000", allowances: "MWK 10,000", overtime: "MWK 20,000", deductions: "MWK 5,000", advanceRecovery: "MWK 0", netPay: "MWK 210,000", paymentStatus: "PENDING" }, { employeeId: "employee-005", basicSalary: "MWK 275,000", allowances: "MWK 15,000", overtime: "MWK 0", deductions: "MWK 10,000", advanceRecovery: "MWK 0", netPay: "MWK 280,000", paymentStatus: "PENDING" }, { employeeId: "employee-004", basicSalary: "MWK 185,000", allowances: "MWK 0", overtime: "MWK 0", deductions: "MWK 0", advanceRecovery: "MWK 0", netPay: "MWK 115,000", paymentStatus: "PENDING" }] },
  { id: "payroll-002", name: "April 2026 Payroll", period: "1 April 2026 — 30 April 2026", status: "PAID", paymentDate: "30 April 2026", totalNetPay: "MWK 1,075,000", lines: [] },
];

export type DemoAdvance = { id: string; number: string; employeeId: string; advanceDate: string; amount: string; recovered: string; balance: string; reason: string; account: string; status: "OUTSTANDING" | "PARTIALLY_RECOVERED" | "RECOVERED" | "CANCELLED" };

export const demoAdvances: DemoAdvance[] = [
  { id: "advance-001", number: "ADV-2026-0004", employeeId: "employee-002", advanceDate: "12 April 2026", amount: "MWK 100,000", recovered: "MWK 40,000", balance: "MWK 60,000", reason: "Emergency medical support", account: "Office Cash", status: "PARTIALLY_RECOVERED" },
  { id: "advance-002", number: "ADV-2026-0005", employeeId: "employee-001", advanceDate: "4 May 2026", amount: "MWK 50,000", recovered: "MWK 0", balance: "MWK 50,000", reason: "Family emergency", account: "Office Cash", status: "OUTSTANDING" },
  { id: "advance-003", number: "ADV-2026-0003", employeeId: "employee-003", advanceDate: "18 March 2026", amount: "MWK 40,000", recovered: "MWK 40,000", balance: "MWK 0", reason: "Transport assistance", account: "National Bank Current Account", status: "RECOVERED" },
];
