import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';

type Transaction = {
  id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  created_at: string;
}

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Could not fetch transactions.", error);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) {
      return;
    }

    setIsLoading(true);
    const newTx = { title, amount: Number(amount), type };

    try {
      await fetch('http://localhost:8080/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      setTitle('');
      setAmount('');
      fetchTransactions();
    } catch (error) {
      console.error("Could not save transactions.", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/transactions/${id}`, {
        method: 'DELETE',
      });
      fetchTransactions();
    } catch (error) {
      console.error("Could not delete transactions.", error);
    }
  }

  const totalIncome = transactions
      .filter(tx => tx.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  // PERBAIKAN DI SINI: Tanpa kurung kurawal agar otomatis me-return hasil
  const formatIDR = (num: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateString));
  };

  return (
      <div className="min-h-screen pb-12">
        <header className="pt-12 pb-6 px-6 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">Finansialku.</h1>
          <p className="text-slate-500 mt-1">Kelola uangmu dengan lebih cerdas.</p>
        </header>

        <main className="max-w-3xl mx-auto px-6 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg md:col-span-3">
              <div className="flex items-center space-x-3 mb-2 opacity-80">
                <Wallet size={20} />
                <h2 className="text-sm font-medium">Total Saldo</h2>
              </div>
              <p className="text-4xl font-bold tracking-tight">{formatIDR(balance)}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Pemasukan</p>
                <p className="text-lg font-bold text-slate-900">{formatIDR(totalIncome)}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Pengeluaran</p>
                <p className="text-lg font-bold text-slate-900">{formatIDR(totalExpense)}</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Tambah Transaksi</h3>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
              <input
                  type="text"
                  placeholder="Keterangan (cth: Makan Siang)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                  required
              />
              <input
                  type="number"
                  placeholder="Jumlah (Rp)"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="md:w-48 bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                  required
              />
              <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                  className="md:w-36 bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-slate-900 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
              <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-3 font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
              >
                <Plus size={20} />
                <span className="md:hidden">Simpan</span>
              </button>
            </form>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 px-2">Riwayat Terkini</h3>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {transactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    Belum ada transaksi tercatat.
                  </div>
              ) : (
                  <div className="divide-y divide-slate-50">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                              {tx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{tx.title}</p>
                              <p className="text-sm text-slate-400">{formatDate(tx.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <p className={`font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                              {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
                            </p>
                            <button
                                onClick={() => handleDelete(tx.id)}
                                className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Hapus Transaksi"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
          </section>
        </main>
      </div>
  );
}

export default App;