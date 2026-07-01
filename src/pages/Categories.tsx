import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Loader2, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

import { categoryService } from '@/services/categoryService';
import {
  CATEGORY_TYPE,
  type CategoryType,
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
import { Skeleton } from '@/components/ui/skeleton';

// ─── Design tokens ──────────────────────────────────────────────────────────
const B = '#C5A059'; // brass — buttons & active states ONLY
const CARD: React.CSSProperties = {
  background: 'var(--color-obsidian)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  overflow: 'hidden',
};
const DIALOG_CONTENT: React.CSSProperties = {
  backgroundColor: 'var(--color-obsidian)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '18px',
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
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  marginBottom: '6px',
  display: 'block',
};


// ─── Schema ────────────────────────────────────────────────────────────────
const categorySchema = z.object({
  categoryName: z
    .string()
    .min(2, 'Kategori adı en az 2 karakter olmalıdır')
    .max(50, 'Kategori adı en fazla 50 karakter olabilir'),
  type: z.coerce.number() as z.ZodType<CategoryType>,
});

type FormValues = z.infer<typeof categorySchema>;

// ─── Component ─────────────────────────────────────────────────────────────
export default function Categories() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rawCategories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const categories: Category[] = Array.isArray(rawCategories)
    ? rawCategories
    : ((rawCategories as any)?.data ?? (rawCategories as any)?.items ?? []);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori silindi');
    },
    onError: () => { toast.error('Kategori silinemedi'); },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) =>
      categoryService.createCategory({ categoryName: data.categoryName, type: data.type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori başarıyla oluşturuldu');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => { toast.error('Kategori oluşturulamadı'); },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: { categoryName: '', type: CATEGORY_TYPE.EXPENSE },
  });

  const onSubmit: SubmitHandler<FormValues> = (values) => { createMutation.mutate(values); };

  const handleDelete = (id: number) => {
    if (confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const isIncome = (cat: Category) =>
    cat.type === CATEGORY_TYPE.INCOME || (cat.type as any) === 1;

  return (
    <div className="animate-fade-in px-4 md:px-0" style={{ paddingBottom: '2.5rem' }}>

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '3px', height: '22px', background: `linear-gradient(180deg, ${B} 0%, ${B}44 100%)`, borderRadius: '2px', flexShrink: 0 }} />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Kategoriler
            </h1>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', paddingLeft: '1.1875rem', letterSpacing: '0.01em' }}>
            Gelir ve gider kategorilerinizi yönetin
          </p>
        </div>

        {/* ── Add Category Dialog ── */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) form.reset(); }}>
          <DialogTrigger asChild>
            <button
              id="add-category-btn"
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
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
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
              Yeni Kategori
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[480px]" style={DIALOG_CONTENT}>
            <DialogHeader style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Tag size={15} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <DialogTitle style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-text-primary)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Yeni Kategori
                </DialogTitle>
              </div>
              <DialogDescription style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8125rem', paddingLeft: '3rem' }}>
                Kategori bilgilerini aşağıya girin.
              </DialogDescription>
            </DialogHeader>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '1.75rem' }} />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="category-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.375rem' }}>

                <FormField
                  control={form.control}
                  name="categoryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={LABEL_STYLE}>Kategori Adı</FormLabel>
                      <FormControl>
                        <Input
                          id="category-name-input"
                          placeholder="Örn: Market, Kira, Maaş..."
                          style={INPUT_STYLE}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage style={{ color: '#BF6868', fontSize: '0.75rem', marginTop: '4px' }} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={LABEL_STYLE}>Tür</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger id="category-type-select">
                            <SelectValue placeholder="Tür seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={CATEGORY_TYPE.EXPENSE.toString()}>Gider</SelectItem>
                          <SelectItem value={CATEGORY_TYPE.INCOME.toString()}>Gelir</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage style={{ color: '#BF6868', fontSize: '0.75rem', marginTop: '4px' }} />
                    </FormItem>
                  )}
                />

                <button
                  id="category-submit-btn"
                  type="submit"
                  disabled={createMutation.isPending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.8125rem',
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
                  ) : 'Kategoriyi Kaydet'}
                </button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Table Card ──────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={{ padding: '1.375rem 2rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
            Tüm Kategoriler
          </h3>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
            {categories.length} kategori
          </p>
        </div>

        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} style={{ height: '52px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : !categories || categories.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag style={{ color: '#71717a' }} size={24} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-tertiary)', fontSize: '0.9375rem', fontWeight: 500, marginBottom: '4px' }}>Henüz kategori yok</p>
                <p style={{ fontFamily: 'var(--font-sans)', color: '#52525b', fontSize: '0.8125rem' }}>Oluşturmak için "Yeni Kategori" butonuna tıklayın.</p>
              </div>
            </div>
          ) : (
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    {['Kategori Adı', 'Tür', ''].map((h, i) => (
                      <TableHead
                        key={i}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: 'var(--color-text-tertiary)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.6025rem',
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          padding: '1rem 1.25rem',
                          width: i === 2 ? '72px' : undefined,
                          textAlign: i === 2 ? 'right' : 'left',
                        }}
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => {
                    const income = isIncome(cat);
                    return (
                      <TableRow 
                        key={cat.id} 
                        style={{ borderColor: 'rgba(255,255,255,0.06)', transition: 'background 140ms' }} 
                        className="hover:bg-[rgba(255,255,255,0.03)]"
                      >
                        <TableCell style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '0.875rem', padding: '1.125rem 1.25rem' }}>
                          {cat.name}
                        </TableCell>

                        <TableCell style={{ padding: '1.125rem 1.25rem' }}>
                          {cat.type !== undefined ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              fontFamily: 'var(--font-sans)',
                              letterSpacing: '0.04em',
                              background: income ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                              color: income ? '#4ade80' : '#f87171',
                              border: `1px solid ${income ? 'rgba(74,222,128,0.18)' : 'rgba(248,113,113,0.18)'}`,
                            }}>
                              {income ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {income ? 'Gelir' : 'Gider'}
                            </span>
                          ) : (
                            <span style={{ color: '#3f3f46', fontSize: '0.8125rem', fontStyle: 'italic' }}>—</span>
                          )}
                        </TableCell>

                        <TableCell style={{ textAlign: 'right', padding: '1.125rem 1rem' }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            id={`delete-category-${cat.id}`}
                            style={{ color: '#3e3c3a', borderRadius: '8px', width: '32px', height: '32px' }}
                            className="hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                            onClick={() => handleDelete(cat.id)}
                            disabled={deleteMutation.isPending && deleteMutation.variables === cat.id}
                          >
                            {deleteMutation.isPending && deleteMutation.variables === cat.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="sr-only">Sil</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: '#52525b', letterSpacing: '0.05em' }}>
                  {categories.length} kategori
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
