import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Target,
  Tag,
  ArrowRight,
  PieChart as PieChartIcon,
  type LucideIcon,
} from 'lucide-react';
import { transactionService } from '@/services/transactionService';
import { categoryService } from '@/services/categoryService';
import { formatCurrency, formatShortDate } from '@/lib/format';
import { TRANSACTION_TYPE, type Transaction } from '@/types/transaction';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

// ─── Brass-anchored palette ────────────────────────────────────────────────
const BRASS = '#C5A059';
const CHART_COLORS = [
  '#C5A059', // brass — primary
  '#5DB88A', // emerald
  '#6A9EC4', // steel blue
  '#BF6868', // muted crimson
  '#9B7FBA', // dusty violet
  '#C49A6C', // warm copper
  '#5DBFBF', // teal
  '#A0B85A', // sage
];

// ─── Sub-types ─────────────────────────────────────────────────────────────
interface ChartDataItem {
  name: string;
  value: number;
}

// ─── SummaryCard ───────────────────────────────────────────────────────────
interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  accentColor: string;
  valueBrass?: boolean;
  loading: boolean;
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor,
  valueBrass = false,
  loading,
}: SummaryCardProps) {
  if (loading) {
    return (
      <div
        className="card-padded flex flex-col justify-center"
        style={{
          background: 'var(--color-abyss)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
        }}
      >
        <Skeleton style={{ width: '38%', height: '7px', marginBottom: '1.375rem', borderRadius: '4px' }} />
        <Skeleton style={{ width: '62%', height: '36px', marginBottom: '10px', borderRadius: '6px' }} />
        <Skeleton style={{ width: '44%', height: '7px', borderRadius: '4px' }} />
      </div>
    );
  }

  return (
    <div
      className="card-padded flex flex-col justify-center"
      style={{
        background: 'var(--color-obsidian)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderTop: `1.5px solid ${accentColor}`,
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        transition: 'border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px ${accentColor}40`;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-slate)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Ambient radial glow in top-right corner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '120px',
          height: '120px',
          background: `radial-gradient(circle at 100% 0%, ${accentColor}12 0%, transparent 68%)`,
          pointerEvents: 'none',
          borderRadius: '16px',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.125rem',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.625rem',
            fontWeight: 600,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {title}
        </span>
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          <Icon size={13} strokeWidth={1.8} style={{ color: accentColor }} />
        </div>
      </div>

      <p
        className="text-xl md:text-3xl"
        style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
          color: valueBrass ? BRASS : 'var(--color-text-primary)',
          marginBottom: '0.4rem',
          position: 'relative',
        }}
      >
        {value}
      </p>

      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.6875rem',
          color: 'var(--color-text-tertiary)',
          position: 'relative',
          letterSpacing: '0.01em',
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <div
      style={{
        height: '1px',
        background: 'rgba(255,255,255,0.06)',
        margin: '0',
      }}
    />
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { monthlyBudget } = useAuth();
  const [hoveredData, setHoveredData] = useState<{ name: string; value: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: rawTransactions, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', { pageSize: 100 }],
    queryFn: () => transactionService.getTransactions({ pageSize: 100 }),
  });

  const { data: rawCategories, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const categoriesArray = useMemo((): any[] => {
    if (!rawCategories) return [];
    if (Array.isArray(rawCategories)) return rawCategories;
    const wrapped = rawCategories as Record<string, any>;
    return wrapped.items ?? wrapped.data ?? [];
  }, [rawCategories]);

  const isLoading = txLoading || catLoading;

  const transactions = useMemo((): Transaction[] => {
    if (!rawTransactions) return [];
    if (Array.isArray(rawTransactions)) return rawTransactions;
    const wrapped = rawTransactions as Record<string, unknown>;
    if (Array.isArray(wrapped['data'])) return wrapped['data'] as Transaction[];
    if (Array.isArray(wrapped['items'])) return wrapped['items'] as Transaction[];
    return [];
  }, [rawTransactions]);

  const getCatNameFromTx = useCallback(
    (t: any): string =>
      t?.categoryName ?? t?.category?.name ?? 'Bilinmeyen',
    [],
  );

  const expenses = useMemo(
    () => transactions.filter((t) => t.type === TRANSACTION_TYPE.EXPENSE),
    [transactions],
  );

  const totalSpent = useMemo(
    () => expenses.reduce((sum, t) => sum + t.amount, 0),
    [expenses],
  );

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === TRANSACTION_TYPE.INCOME)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );

  const remaining = monthlyBudget !== null ? monthlyBudget - totalSpent : null;
  const categoryCount = categoriesArray.length;

  const chartData = useMemo((): ChartDataItem[] => {
    const acc = new Map<string, number>();
    expenses.forEach((t) => {
      const name = getCatNameFromTx(t);
      acc.set(name, (acc.get(name) ?? 0) + t.amount);
    });
    return Array.from(acc.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [expenses, getCatNameFromTx]);

  const recentTx = useMemo(() => transactions.slice(0, 5), [transactions]);

  const budgetPct =
    monthlyBudget !== null && monthlyBudget > 0
      ? Math.min((totalSpent / monthlyBudget) * 100, 100)
      : null;

  return (
    <div
      className="animate-fade-in px-4 md:px-0"
      style={{ paddingBottom: '2.5rem' }}
    >

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
          <div style={{ width: '3px', height: '22px', background: `linear-gradient(180deg, ${BRASS} 0%, ${BRASS}44 100%)`, borderRadius: '2px', flexShrink: 0 }} />
          <h1
            className="text-xl md:text-2xl"
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Gösterge Paneli
          </h1>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-tertiary)',
            letterSpacing: '0.01em',
            paddingLeft: '1.1875rem',
          }}
        >
          Harcama özetiniz · Dönem analizi · Son işlemler
        </p>
      </div>

      <div className="stagger grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 w-full mx-auto">
        <SummaryCard
          title="Toplam Harcama"
          value={formatCurrency(totalSpent)}
          subtitle="Tüm gider işlemleri"
          icon={TrendingDown}
          accentColor="#BF6868"
          loading={isLoading}
        />
        <SummaryCard
          title="Toplam Gelir"
          value={formatCurrency(totalIncome)}
          subtitle="Tüm gelir işlemleri"
          icon={TrendingUp}
          accentColor="#5DB88A"
          loading={isLoading}
        />
        <SummaryCard
          title="Aylık Bütçe"
          value={monthlyBudget !== null ? formatCurrency(monthlyBudget) : '—'}
          subtitle={monthlyBudget !== null ? 'Belirlenen limit' : 'Henüz belirlenmedi'}
          icon={Target}
          accentColor={BRASS}
          valueBrass
          loading={isLoading}
        />
        <SummaryCard
          title="Kategoriler"
          value={String(categoryCount)}
          subtitle="Aktif kategori sayısı"
          icon={Tag}
          accentColor="#6A9EC4"
          loading={isLoading}
        />
      </div>

      {!isLoading && budgetPct !== null && (
        <div
          style={{
            background: 'var(--color-abyss)',
            border: `1px solid ${BRASS}22`,
            borderRadius: '14px',
            padding: '1.125rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                Bütçe Kullanımı
              </span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.875rem', fontWeight: 700, color: budgetPct >= 90 ? '#BF6868' : BRASS }}>
                %{budgetPct.toFixed(1)}
              </span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${budgetPct}%`,
                  background: budgetPct >= 90
                    ? 'linear-gradient(90deg, #BF6868 0%, #E07070 100%)'
                    : `linear-gradient(90deg, ${BRASS}cc 0%, ${BRASS} 100%)`,
                  borderRadius: '4px',
                  transition: 'width 600ms cubic-bezier(0.22,1,0.36,1)',
                  boxShadow: budgetPct >= 90 ? '0 0 8px rgba(191,104,104,0.4)' : `0 0 8px ${BRASS}40`,
                }}
              />
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.625rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Kalan</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: remaining !== null && remaining < 0 ? '#BF6868' : 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
              {remaining !== null ? formatCurrency(remaining) : '—'}
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >

        <div
          style={{
            background: 'var(--color-obsidian)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            minHeight: '400px',
          }}
        >
          <div
            style={{
              padding: '1.375rem 1.5rem 1.125rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <h3
                className="text-sm md:text-base"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.015em',
                  marginBottom: '0.2rem',
                }}
              >
                Harcama Dağılımı
              </h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.01em' }}>
                Kategorilere göre giderler
              </p>
            </div>
            <div
              style={{
                padding: '3px 10px',
                borderRadius: '999px',
                background: `${BRASS}0f`,
                border: `1px solid ${BRASS}22`,
                fontFamily: 'var(--font-sans)',
                fontSize: '0.5625rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: BRASS,
              }}
            >
              Analiz
            </div>
          </div>

          <GoldDivider />

          <div style={{ padding: '1.25rem 1.5rem 1.375rem' }}>
            {isLoading ? (
              <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton style={{ width: '200px', height: '200px', borderRadius: '50%' }} />
              </div>
            ) : chartData.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '260px', gap: '1rem', opacity: 0.5 }}>
                <PieChartIcon size={40} style={{ color: 'var(--color-text-tertiary)' }} />
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>Henüz gider verisi yok</p>
              </div>
            ) : (
              <>
                <div className="w-full h-[250px] md:h-[280px]" style={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={106}
                        dataKey="value"
                        strokeWidth={0}
                        paddingAngle={2.5}
                        style={{ outline: 'none' }}
                        onMouseEnter={(event, index) => {
                          const data = chartData[index];
                          if (data) setHoveredData({ name: data.name, value: data.value });
                        }}
                        onMouseLeave={() => {
                          setHoveredData(null);
                        }}
                        onClick={(data) => {
                          if (data) setHoveredData({ name: data.name, value: data.value });
                        }}
                      >
                        {chartData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                            opacity={0.92}
                            style={{ outline: 'none' }}
                          />
                        ))}
                      </Pie>
                      {!isMobile && (
                        <Tooltip
                          formatter={(value) => [formatCurrency(Number(value)), 'Tutar']}
                          labelFormatter={(label) => label}
                          wrapperStyle={{ zIndex: 9999, outline: 'none' }}
                          allowEscapeViewBox={{ x: true, y: true }}
                          offset={16}
                          contentStyle={{
                            backgroundColor: '#0E1116',
                            borderColor: 'rgba(255,255,255,0.12)',
                            borderRadius: '12px',
                            padding: '10px 16px',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.8125rem',
                            color: 'var(--color-text-primary)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(8px)',
                          }}
                          itemStyle={{ color: 'var(--color-text-primary)', fontWeight: 500 }}
                          labelStyle={{ color: BRASS, fontWeight: 700, marginBottom: '4px', fontSize: '0.75rem' }}
                          cursor={false}
                        />
                      )}
                    </PieChart>
                  </ResponsiveContainer>

                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        lineHeight: 1.15,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {hoveredData ? formatCurrency(hoveredData.value) : formatCurrency(totalSpent)}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.5625rem',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-tertiary)',
                        marginTop: '4px',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {hoveredData ? hoveredData.name : 'Toplam Gider'}
                    </p>
                  </div>
                </div>

                {isMobile && (
                  <div className="flex items-center justify-center mt-3 h-8">
                    {hoveredData ? (
                      <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs flex gap-2 items-center">
                        <span className="text-zinc-400">{hoveredData.name}:</span>
                        <span className="font-semibold text-[#f4f4f5]">{formatCurrency(hoveredData.value)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">Kategori detayını görmek için dilimlere dokunun</span>
                    )}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {chartData.map((entry, index) => (
                    <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{entry.name}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                        % {((entry.value / totalSpent) * 100).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-obsidian)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <div
            style={{
              padding: '1.375rem 1.5rem 1.125rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <h3
                className="text-sm md:text-base"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.015em',
                  marginBottom: '0.2rem',
                }}
              >
                Son İşlemler
              </h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.01em' }}>
                Son {Math.min(recentTx.length, 5)} kayıt
              </p>
            </div>
            <Link
              to="/transactions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.625rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: BRASS,
                padding: '4px 10px',
                borderRadius: '999px',
                border: `1px solid ${BRASS}22`,
                background: `${BRASS}0a`,
                textDecoration: 'none',
              }}
            >
              Tümü <ArrowRight size={10} strokeWidth={2.2} />
            </Link>
          </div>

          <GoldDivider />

          <div style={{ padding: '0.5rem 1.5rem' }}>
            {isLoading ? (
              <div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <Skeleton style={{ width: '120px', height: '12px' }} />
                    <Skeleton style={{ width: '60px', height: '12px' }} />
                  </div>
                ))}
              </div>
            ) : recentTx.length === 0 ? (
              <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-tertiary)', fontSize: '0.8125rem' }}>Henüz işlem yok.</p>
              </div>
            ) : (
              <div>
                {recentTx.map((tx, i) => {
                  const isInc = tx.type === TRANSACTION_TYPE.INCOME;
                  return (
                    <div
                      key={tx.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.875rem 0',
                        borderBottom: i < recentTx.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Tag size={15} style={{ color: 'var(--color-text-tertiary)' }} />
                        </div>
                        <div style={{ minWidth: 0, paddingRight: '1rem' }}>
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                            {tx.description || <span style={{ fontStyle: 'italic', color: 'var(--color-text-tertiary)' }}>İsimsiz işlem</span>}
                          </p>
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                            {getCatNameFromTx(tx)} · {formatShortDate(tx.date)}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: isInc ? '#5DB88A' : 'var(--color-text-primary)',
                          }}
                        >
                          {isInc ? '+' : '−'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
