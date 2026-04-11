import React, { useState, useEffect } from 'react';
import { Home, UserPlus, PlusCircle, Trash2, BarChart2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// --- TIPE DATA ---
type Expense = {
  id: number;
  budget_id: number;
  name: string;
  amount: number;
  created_at: string;
};

type Budget = {
  id: number;
  name: string;
  amount: number;
  expenses: Expense[];
  created_at: string;
};


export default function App() {
  // --- STATE MANAGEMENT ---
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Form States
  const [loginName, setLoginName] = useState('');
  const [budgetName, setBudgetName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // --- FETCH DATA ---
  const fetchBudgets = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/budgets');
      const data = await res.json();
      setBudgets(data || []);

      // Update selected budget if currently viewing one
      if (selectedBudget) {
        const updated = data.find((b: Budget) => b.id === selectedBudget.id);
        setSelectedBudget(updated || null);
      }
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };

  useEffect(() => {
    if (userName) fetchBudgets();
  }, [userName]);

  // --- HANDLERS ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim()) return;
    localStorage.setItem('userName', loginName);
    setUserName(loginName);
    toast.success(`Selamat datang, ${loginName}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('userName');
    setUserName(null);
    setSelectedBudget(null);
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:8080/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: budgetName, amount: Number(budgetAmount) })
      });
      toast.success('Budget berhasil dibuat!');
      setBudgetName('');
      setBudgetAmount('');
      fetchBudgets();
    } catch (error) {
      toast.error('Gagal membuat budget');
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!confirm('Yakin ingin menghapus budget ini?')) return;
    await fetch(`http://localhost:8080/api/budgets/${id}`, { method: 'DELETE' });
    toast.success('Budget dihapus!');
    setSelectedBudget(null);
    fetchBudgets();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;
    try {
      await fetch('http://localhost:8080/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget_id: selectedBudget.id,
          name: expenseName,
          amount: Number(expenseAmount)
        })
      });
      toast.success(`Pengeluaran ${expenseName} dicatat!`);
      setExpenseName('');
      setExpenseAmount('');
      fetchBudgets();
    } catch (error) {
      toast.error('Gagal menambah pengeluaran');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    await fetch(`http://localhost:8080/api/expenses/${id}`, { method: 'DELETE' });
    toast.success('Pengeluaran dihapus!');
    fetchBudgets();
  };

  // --- HELPERS ---
  const formatIDR = (num: number) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num);

  const calculateSpent = (expenses: Expense[]) =>
      expenses ? expenses.reduce((acc, curr) => acc + curr.amount, 0) : 0;

  // --- UI COMPONENTS ---

  // 1. Landing Page
  if (!userName) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
          <Toaster position="top-right" />
          <header className="p-8"><h1 className="text-2xl font-bold flex items-center text-slate-800"><Home className="mr-2 text-blue-500" /> Penghitung Uang</h1></header>
          <main className="flex-1 flex items-center justify-center max-w-6xl mx-auto w-full px-6 z-10">
            <div className="w-full max-w-md">
              <h2 className="text-5xl font-extrabold text-slate-800 leading-tight mb-4">
                Take Control <br/> of <span className="text-blue-500">Your Money</span>
              </h2>
              <p className="text-slate-600 text-lg mb-8">Personal budgeting is the secret to financial freedom. Start your journey today.</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="text" placeholder="Siapa namamu?" value={loginName} onChange={(e) => setLoginName(e.target.value)} required
                       className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-md flex items-center hover:bg-slate-800 transition">
                  Masuk <UserPlus className="ml-2" size={18} />
                </button>
              </form>
            </div>
            <div className="hidden md:flex flex-1 justify-center">
              <BarChart2 size={300} className="text-blue-200" strokeWidth={1} />
            </div>
          </main>
          <div className="absolute bottom-0 w-full h-48 bg-blue-500 rounded-t-[100%] scale-150 translate-y-24"></div>
        </div>
    );
  }

  // 2. Budget Details View
  if (selectedBudget) {
    const spent = calculateSpent(selectedBudget.expenses);
    const remaining = selectedBudget.amount - spent;
    const progressPercent = Math.min((spent / selectedBudget.amount) * 100, 100);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden pb-32">
          <Toaster position="top-right" />
          <header className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
            <button onClick={() => setSelectedBudget(null)} className="text-xl font-bold flex items-center text-slate-800 hover:text-blue-600 transition">
              <Home className="mr-2 text-blue-500" /> Pencatat Uang
            </button>
            <button onClick={handleLogout} className="text-red-500 border border-red-500 px-4 py-2 rounded-md hover:bg-red-50 flex items-center">
              Keluar <Trash2 size={16} className="ml-2" />
            </button>
          </header>

          <main className="max-w-5xl mx-auto w-full px-6 mt-6 z-10 space-y-10">
            <h2 className="text-4xl font-bold text-slate-800">
              Detail <span className="text-red-600">{selectedBudget.name}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 rounded-2xl border-[3px] border-red-600 p-6 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-xl font-bold text-red-600">{selectedBudget.name}</h3>
                  <p className="text-red-600">{formatIDR(selectedBudget.amount)} Anggaran</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div className="bg-red-600 h-4 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="flex justify-between text-sm text-slate-500 mb-6">
                  <p>{formatIDR(spent)} terpakai</p>
                  <p>{formatIDR(remaining)} tersisa</p>
                </div>
                <div className="text-center">
                  <button onClick={() => handleDeleteBudget(selectedBudget.id)} className="bg-red-600 text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-red-700">
                    Hapus Budget <Trash2 size={16} className="ml-2" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Catat Pengeluaran <span className="text-red-600">{selectedBudget.name}</span></h3>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Nama Pengeluaran</label>
                      <input type="text" placeholder="cth: Beli Kopi" value={expenseName} onChange={(e) => setExpenseName(e.target.value)} required
                             className="w-full border-2 border-red-600 rounded-md p-2 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Jumlah (Rp)</label>
                      <input type="number" placeholder="cth: 25000" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} required
                             className="w-full border border-gray-300 rounded-md p-2 focus:outline-none" />
                    </div>
                  </div>
                  <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-md flex items-center hover:bg-slate-800">
                    Tambah Data <PlusCircle size={16} className="ml-2" />
                  </button>
                </form>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-slate-800 mb-6">
                Riwayat <span className="text-red-600">{selectedBudget.name}</span>
              </h2>
              <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
                <table className="w-full text-left">
                  <thead className="border-b-4 border-slate-50">
                  <tr>
                    <th className="p-4 font-bold text-lg text-slate-800">Nama</th>
                    <th className="p-4 font-bold text-lg text-slate-800">Jumlah</th>
                    <th className="p-4 font-bold text-lg text-slate-800">Tanggal</th>
                    <th className="p-4"></th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                  {selectedBudget.expenses?.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="p-4 text-slate-600">{exp.name}</td>
                        <td className="p-4 text-slate-600">{formatIDR(exp.amount)}</td>
                        <td className="p-4 text-slate-600">{new Date(exp.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="p-4">
                          <button onClick={() => handleDeleteExpense(exp.id)} className="bg-red-100 text-red-500 p-2 rounded-md hover:bg-red-200">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
          <div className="absolute bottom-0 w-full h-32 bg-blue-500 rounded-t-[100%] scale-150 translate-y-16 -z-0"></div>
        </div>
    );
  }

  // 3. Dashboard View
  return (
      <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
        <Toaster position="top-right" />
        <header className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
          <h1 className="text-2xl font-bold flex items-center text-slate-800"><Home className="mr-2 text-blue-500" /> Pencatat Uang</h1>
          <button onClick={handleLogout} className="text-red-500 border border-red-300 px-4 py-2 rounded-md hover:bg-red-50 flex items-center transition">
            Keluar <Trash2 size={16} className="ml-2" />
          </button>
        </header>

        <main className="flex-1 max-w-6xl mx-auto w-full px-6 mt-10 z-10 space-y-8">
          <div>
            <h2 className="text-5xl font-extrabold text-slate-800 mb-4">
              Selamat datang, <span className="text-blue-500">{userName}</span>
            </h2>
            <p className="text-slate-600 text-lg mb-2">Personal budgeting is the secret to financial freedom.</p>
            <p className="text-slate-600 font-medium">Buat anggaran pertamamu untuk mulai!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Buat Anggaran (Budget)</h3>
              <form onSubmit={handleCreateBudget} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nama Anggaran</label>
                  <input type="text" placeholder="cth: Belanja Bulanan" value={budgetName} onChange={(e) => setBudgetName(e.target.value)} required
                         className="w-full border-2 border-blue-500 rounded-md p-2 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Maksimal Dana (Rp)</label>
                  <input type="number" placeholder="cth: 500000" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} required
                         className="w-full border border-gray-300 rounded-md p-2 focus:outline-none" />
                </div>
                <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-md flex items-center hover:bg-slate-800 transition">
                  Buat Budget <PlusCircle size={16} className="ml-2" />
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">Daftar Anggaranmu</h3>
              {budgets.length === 0 ? (
                  <p className="text-slate-500 italic">Belum ada anggaran.</p>
              ) : (
                  budgets.map(budget => {
                    const spent = calculateSpent(budget.expenses);
                    return (
                        <div key={budget.id} onClick={() => setSelectedBudget(budget)}
                             className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:border-blue-500 transition group">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-lg text-slate-800 group-hover:text-blue-600">{budget.name}</h4>
                            <p className="font-semibold text-slate-600">{formatIDR(budget.amount)}</p>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((spent/budget.amount)*100, 100)}%` }}></div>
                          </div>
                        </div>
                    )
                  })
              )}
            </div>
          </div>
        </main>

        <div className="absolute bottom-0 w-full h-48 bg-blue-500 rounded-t-[100%] scale-150 translate-y-24 -z-0"></div>
      </div>
  );
}