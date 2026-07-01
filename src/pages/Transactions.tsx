import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Plus, Trash2, Loader2, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

import { transactionService } from '@/services/transactionService';
import { categoryService } from '@/services/categoryService';
import {
  TRANSACTION_TYPE,
  type TransactionType,
  type CreateTransactionDto,
  type Transaction,
  type Category,
} from '@/types/transaction';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Design tokens ──────────────────────────────────────────────────────────
const B = '#C4973A'; // --color-accent (brass)

// Surfaces
const CARD: React.CSSProperties = {
  background: 'var(--color-obsidian)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '14px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  overflow: 'hidden',
};
const DIALOG_CONTENT: React.CSSProperties = {
  backgroundColor: 'var(--color-obsidian)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '20px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  padding: '2.25rem',
};
const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--color-abyss)',
  borderColor: 'var(--color-slate)',
  color: 'var(--color-text-primary)',
  borderRadius: '10px',
  height: '44px',
  fontSize: '0.9rem',
};
const LABEL_STYLE: React.CSSProperties = {
  color: 'var(--color-text-tertiary)',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.10em',
  textTransform: 'uppercase' as const,
  marginBottom: '6px',
  display: 'block',
};


// ─── Schema ────────────────────────────────────────────────────────────────
const transactionSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Tutar 0 dan büyük olmalıdır').max(1000000, 'Tutar çok yüksek'),
  description: z.string().min(2, 'En az 2 karakter girmelisiniz').max(100, 'En fazla 100 karakter'),
  type: z.coerce.number() as z.ZodType<TransactionType>,
  categoryId: z.coerce.number().min(1, 'Lütfen bir kategori seçin'),
});

type FormValues = z.infer<typeof transactionSchema>;

// ─── Component ─────────────────────────────────────────────────────────────
export default function Transactions() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Queries
  const { data: rawTxData, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionService.getTransactions(),
  });
  const transactions: Transaction[] = Array.isArray(rawTxData)
    ? rawTxData
    : ((rawTxData as any)?.data ?? (rawTxData as any)?.items ?? []);

  const { data: rawCatData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });
  const categories: Category[] = Array.isArray(rawCatData)
    ? rawCatData
    : ((rawCatData as any)?.data || (rawCatData as any)?.items || []);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      toast.success('İşlem silindi');
    },
    onError: () => { toast.error('İşlem silinemedi'); },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionDto) => transactionService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      toast.success('İşlem başarıyla eklendi');
      setIsAddModalOpen(false);
      form.reset();
    },
    onError: () => { toast.error('İşlem eklenemedi'); },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      amount: 0,
      description: '',
      type: TRANSACTION_TYPE.EXPENSE,
      categoryId: 0,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    createMutation.mutate({
      ...values,
      amount: Number(values.amount),
      categoryId: Number(values.categoryId),
      type: Number(values.type) as TransactionType,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const formattedTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions]);

  const getCategoryName = useCallback(
    (t: any): string =>
      t?.categoryName ?? t?.category?.name ?? 'Bilinmeyen',
    [],
  );

  return (
    <div className="animate-fade-in px-4 md:px-0" style={{ paddingBottom: '2.5rem' }}>

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '3px', height: '22px', background: `linear-gradient(180deg, ${B} 0%, ${B}44 100%)`, borderRadius: '2px', flexShrink: 0 }} />
            <h1
              className="text-xl md:text-2xl"
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
                margin: 0
              }}
            >
              İşlemler
            </h1>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', paddingLeft: '1.1875rem', letterSpacing: '0.01em' }}>
            Finansal kayıtlarınızı görüntüleyin, ekleyin ve silin
          </p>
        </div>

        {/* ── Add Transaction Dialog ── */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.375rem',
                background: `linear-gradient(135deg, ${B} 0%, #a07828 100%)`,
                border: 'none',
                borderRadius: '10px',
                color: '#0a0a0a',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                boxShadow: `0 4px 16px rgba(0,0,0,0.4)`,
                transition: 'transform 150ms, box-shadow 150ms',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 24px ${B}50, inset 0 1px 0 rgba(255,255,255,0.2)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 18px ${B}35, inset 0 1px 0 rgba(255,255,255,0.18)`;
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Yeni İşlem
            </button>
          </DialogTrigger>

          <DialogContent
            className="sm:max-w-[500px]"
            style={DIALOG_CONTENT}
          >
            <DialogHeader style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Plus size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <DialogTitle style={{ fontFamily: 'var(--font-serif)', color: '#f4f4f5', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Yeni İşlem
                </DialogTitle>
              </div>
              <DialogDescription style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8125rem', paddingLeft: '3rem' }}>
                İşlem detaylarını aşağıya girin.
              </DialogDescription>
            </DialogHeader>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '1.75rem' }} />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.375rem' }}>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={LABEL_STYLE}>İşlem Türü</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tür seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TRANSACTION_TYPE.EXPENSE.toString()}>Gider</SelectItem>
                          <SelectItem value={TRANSACTION_TYPE.INCOME.toString()}>Gelir</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage style={{ color: '#BF6868', fontSize: '0.75rem', marginTop: '4px' }} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={LABEL_STYLE}>Tutar (₺)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          style={INPUT_STYLE}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage style={{ color: '#BF6868', fontSize: '0.75rem', marginTop: '4px' }} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={LABEL_STYLE}>Kategori</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(parseInt(val))}
                        value={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isCategoriesLoading ? 'Yükleniyor...' : 'Kategori seçin'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent style={{ maxHeight: '15rem' }}>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage style={{ color: '#BF6868', fontSize: '0.75rem', marginTop: '4px' }} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={LABEL_STYLE}>Açıklama</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Market, Kira, Maaş..."
                          style={INPUT_STYLE}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage style={{ color: '#BF6868', fontSize: '0.75rem', marginTop: '4px' }} />
                    </FormItem>
                  )}
                />

                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="py-3 md:py-3.5 px-4"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    marginTop: '0.5rem',
                    background: createMutation.isPending ? '#27272a' : `linear-gradient(135deg, ${B} 0%, #a07828 100%)`,
                    border: 'none',
                    borderRadius: '12px',
                    color: createMutation.isPending ? '#52525b' : '#0a0a0a',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.02em',
                    boxShadow: createMutation.isPending ? 'none' : '0 4px 16px rgba(0,0,0,0.4)',
                    transition: 'all 150ms',
                  }}
                >
                  {createMutation.isPending ? (
                    <><Loader2 size={15} className="animate-spin" /> Kaydediliyor…</>
                  ) : 'İşlemi Kaydet'}
                </button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Table Card ──────────────────────────────────────────── */}
      <div style={CARD}>
        {/* Card header strip */}
          <div style={{ padding: '1.375rem 2rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3
              className="text-sm md:text-base"
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.01em'
              }}
            >
              Tüm İşlemler
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
              {formattedTransactions.length} kayıt · tarihe göre sıralı
            </p>
          </div>

        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          {isTransactionsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem' }}>
              <Loader2 size={28} className="animate-spin" style={{ color: B }} />
              <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)', fontSize: '0.8125rem' }}>İşlemler yükleniyor…</p>
            </div>
          ) : formattedTransactions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeftRight style={{ color: 'var(--color-text-tertiary)' }} size={24} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)', fontSize: '0.9375rem', fontWeight: 500, marginBottom: '4px' }}>Henüz işlem yok</p>
                <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-tertiary)', fontSize: '0.8125rem' }}>Oluşturmak için "Yeni İşlem" butonuna tıklayın.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop View (Table) */}
              <div className="hidden md:block" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                      {['Tarih', 'Açıklama', 'Kategori', 'Tür', 'Tutar', ''].map((h, i) => (
                        <TableHead
                          key={i}
                          style={{
                            color: 'var(--color-text-tertiary)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.6025rem',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            padding: '1rem 1.25rem',
                            textAlign: i === 4 ? 'right' : i === 5 ? 'right' : 'left',
                            width: i === 5 ? '72px' : undefined,
                          }}
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formattedTransactions.map((tx) => (
                      <TableRow
                        key={tx.id}
                        style={{ borderColor: 'rgba(255,255,255,0.06)', transition: 'background 140ms' }}
                        className="hover:bg-[rgba(255,255,255,0.03)]"
                      >
                        <TableCell style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', whiteSpace: 'nowrap', padding: '1.125rem 1.25rem' }}>
                          {format(new Date(tx.date), 'dd.MM.yyyy')}
                        </TableCell>

                        <TableCell
                          style={{
                            color: '#f4f4f5',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            maxWidth: '220px',
                            padding: '1.125rem 1.25rem',
                          }}
                          className="truncate"
                        >
                          {tx.description || (
                            <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', fontWeight: 400 }}>Açıklama yok</span>
                          )}
                        </TableCell>

                        <TableCell style={{ padding: '1.125rem 1.25rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.6875rem',
                            fontWeight: 500,
                            fontFamily: 'var(--font-sans)',
                            background: 'rgba(39,39,42,0.5)',   /* zinc-800/50 */
                            color: '#d4d4d8',                   /* zinc-300 */
                            border: '1px solid rgba(63,63,70,0.5)', /* zinc-700/50 */
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap',
                          }}>
                            {getCategoryName(tx)}
                          </span>
                        </TableCell>

                        <TableCell style={{ padding: '1.125rem 1.25rem' }}>
                          <span style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: tx.type === TRANSACTION_TYPE.INCOME ? '#5DB88A' : '#C06060',
                            background: tx.type === TRANSACTION_TYPE.INCOME ? 'rgba(93,184,138,0.10)' : 'rgba(192,96,96,0.10)',
                            border: `1px solid ${tx.type === TRANSACTION_TYPE.INCOME ? 'rgba(93,184,138,0.20)' : 'rgba(192,96,96,0.20)'}`,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            letterSpacing: '0.02em',
                          }}>
                            {tx.type === TRANSACTION_TYPE.INCOME ? 'Gelir' : 'Gider'}
                          </span>
                        </TableCell>

                        <TableCell style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '1.125rem 1.25rem' }}>
                          <span style={{
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 700,
                            fontSize: '0.9375rem',
                            letterSpacing: '-0.01em',
                            color: tx.type === TRANSACTION_TYPE.INCOME ? '#5DB88A' : 'var(--color-text-primary)',
                          }}>
                            {tx.type === TRANSACTION_TYPE.INCOME ? '+' : '−'}
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tx.amount)}
                          </span>
                        </TableCell>

                        <TableCell style={{ textAlign: 'right', padding: '1.125rem 1rem' }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            style={{ color: '#3e3c3a', borderRadius: '8px', width: '32px', height: '32px' }}
                            className="hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                            onClick={() => handleDelete(tx.id)}
                            disabled={deleteMutation.isPending && deleteMutation.variables === tx.id}
                          >
                            {deleteMutation.isPending && deleteMutation.variables === tx.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="sr-only">Sil</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Footer */}
                <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: '#52525b', letterSpacing: '0.05em' }}>
                    {formattedTransactions.length} işlem
                  </span>
                </div>
              </div>

              {/* Mobile View (Cards) */}
              <div className="flex flex-col gap-6 mt-6 md:hidden w-full mx-auto">
                {formattedTransactions.map((tx) => (
                  <div key={tx.id} className="relative bg-zinc-900 border border-zinc-800 rounded-xl tx-card-padded shadow-md flex flex-col">
                    {/* Top Row: Title & Amount */}
                    <div className="flex justify-between items-center mb-2 gap-4">
                      <div className="flex-1 min-w-0 font-sans font-semibold text-base text-[#f4f4f5] leading-tight truncate">
                        {tx.description || <span className="text-zinc-400 italic font-normal text-sm">Açıklama yok</span>}
                      </div>
                      <div className="text-right whitespace-nowrap flex-shrink-0">
                        <span
                          className="text-base"
                          style={{
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                            color: tx.type === TRANSACTION_TYPE.INCOME ? '#5DB88A' : 'var(--color-text-primary)',
                          }}
                        >
                          {tx.type === TRANSACTION_TYPE.INCOME ? '+' : '−'}
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tx.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Metadata & Delete */}
                    <div className="flex justify-between items-end mt-1">
                      {/* Metadata */}
                      <div className="flex items-center gap-2 flex-wrap text-zinc-400">
                        {/* Date */}
                        <span className="font-sans text-xs font-medium text-zinc-400">
                          {format(new Date(tx.date), 'dd.MM.yyyy')}
                        </span>
                        
                        {/* Divider */}
                        <div className="w-[3px] h-[3px] rounded-full bg-zinc-700" />
                        
                        {/* Category Badge */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.625rem',
                          fontWeight: 500,
                          fontFamily: 'var(--font-sans)',
                          background: 'rgba(39,39,42,0.5)',   /* zinc-800/50 */
                          color: '#a1a1aa',                   /* zinc-400 */
                          border: '1px solid rgba(63,63,70,0.5)', /* zinc-700/50 */
                          letterSpacing: '0.03em',
                        }}>
                          {getCategoryName(tx)}
                        </span>
                        
                        {/* Type Badge */}
                        <span style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          color: tx.type === TRANSACTION_TYPE.INCOME ? '#5DB88A' : '#C06060',
                          background: tx.type === TRANSACTION_TYPE.INCOME ? 'rgba(93,184,138,0.10)' : 'rgba(192,96,96,0.10)',
                          border: `1px solid ${tx.type === TRANSACTION_TYPE.INCOME ? 'rgba(93,184,138,0.20)' : 'rgba(192,96,96,0.20)'}`,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          letterSpacing: '0.02em',
                        }}>
                          {tx.type === TRANSACTION_TYPE.INCOME ? 'Gelir' : 'Gider'}
                        </span>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        style={{ color: '#52525b', borderRadius: '8px', width: '28px', height: '28px', marginRight: '-4px', marginBottom: '-4px', flexShrink: 0 }}
                        className="hover:bg-rose-500/10 hover:text-rose-400 transition-colors ml-4"
                        onClick={() => handleDelete(tx.id)}
                        disabled={deleteMutation.isPending && deleteMutation.variables === tx.id}
                      >
                        {deleteMutation.isPending && deleteMutation.variables === tx.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span className="sr-only">Sil</span>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Mobile Footer */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.25rem', paddingBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: '#52525b', letterSpacing: '0.05em' }}>
                    {formattedTransactions.length} işlem listeleniyor
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
