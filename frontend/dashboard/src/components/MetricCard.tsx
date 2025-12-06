/**
 * Metric Card Component
 * Displays a single metric with label and value
 */

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  return (
    <div
      style={{
        background: 'white',
        padding: '28px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        flex: 1,
        minWidth: '200px',
        transition: 'all 0.2s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </div>
      <div
        style={{
          fontSize: '36px',
          fontWeight: 700,
          color: '#003A78',
          marginBottom: '8px',
          lineHeight: '1.2',
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '13px', color: '#999', marginTop: '8px', fontWeight: 400 }}>
          {subtitle}
        </div>
      )}
      {trend && (
        <div
          style={{
            fontSize: '13px',
            color: trend.isPositive ? '#1F9D55' : '#e74c3c',
            marginTop: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
  );
}

