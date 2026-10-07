import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { ArrowLeft, TrendingUp, TrendingDown, Layers, GitFork, Network } from 'lucide-react';

// ═══════════════════════════════════════════════════
//  POWERBI-STYLE REAL CONNECTED TREE DATASETS
// ═══════════════════════════════════════════════════

// 1. Decomposition Tree Data (Root cause breakdown)
const decompositionTreeData = {
  name: 'Revenue Delta\n-$180,000 (-14%)',
  value: '-$180K',
  itemStyle: { color: '#EA4335', borderColor: '#B71C1C', borderWidth: 2 },
  label: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  children: [
    {
      name: 'Product Sales\n-$120,000 (67% of drop)',
      itemStyle: { color: '#FF7043' },
      children: [
        {
          name: 'Electronics\n-$85,000',
          itemStyle: { color: '#FF7043' },
          children: [
            { name: 'Laptops\n-$60,000 (Supply Shortage)', itemStyle: { color: '#E64A19' } },
            { name: 'Phones\n-$25,000 (Seasonal Dip)', itemStyle: { color: '#FF8A65' } },
          ]
        },
        {
          name: 'Clothing\n-$35,000 (Inventory Delay)',
          itemStyle: { color: '#FF8A65' }
        }
      ]
    },
    {
      name: 'Services\n-$40,000 (22% of drop)',
      itemStyle: { color: '#FFA726' },
      children: [
        { name: 'Consulting\n-$25,000 (2 Contracts Lost)', itemStyle: { color: '#FB8C00' } },
        { name: 'Tech Support\n-$15,000 (Churn Spike)', itemStyle: { color: '#FFB74D' } },
      ]
    },
    {
      name: 'Subscriptions\n-$20,000 (11% of drop)',
      itemStyle: { color: '#AB47BC' },
      children: [
        { name: 'Enterprise SaaS\n+$10,000 (New Accounts)', itemStyle: { color: '#34A853' } },
        { name: 'SMB Plans\n-$30,000 (48 Churned)', itemStyle: { color: '#E64A19' } },
      ]
    }
  ]
};

// 2. Organization / Regional Financial Tree Data (Top-Down Connected)
const regionalFinancialTree = {
  name: 'Global Enterprise\n$4,250,000 Revenue',
  itemStyle: { color: '#1A73E8', borderColor: '#0D47A1', borderWidth: 2 },
  children: [
    {
      name: 'North America\n$2,100,000 (+18%)',
      itemStyle: { color: '#4285F4' },
      children: [
        {
          name: 'United States\n$1,600,000 (+22%)',
          itemStyle: { color: '#669DF6' },
          children: [
            { name: 'Enterprise\n$1,100,000', itemStyle: { color: '#aecbfa' } },
            { name: 'SMB Segment\n$500,000', itemStyle: { color: '#aecbfa' } },
          ]
        },
        {
          name: 'Canada\n$500,000 (+8%)',
          itemStyle: { color: '#669DF6' }
        }
      ]
    },
    {
      name: 'Europe (EMEA)\n$1,450,000 (+5%)',
      itemStyle: { color: '#34A853' },
      children: [
        { name: 'United Kingdom\n$650,000 (+12%)', itemStyle: { color: '#81C995' } },
        { name: 'Germany\n$450,000 (-3%)', itemStyle: { color: '#F28B82' } },
        { name: 'France\n$350,000 (+8%)', itemStyle: { color: '#81C995' } },
      ]
    },
    {
      name: 'Asia Pacific (APAC)\n$700,000 (+25%)',
      itemStyle: { color: '#FBBC04' },
      children: [
        { name: 'India\n$380,000 (+42%)', itemStyle: { color: '#FDE293' } },
        { name: 'Japan\n$220,000 (+10%)', itemStyle: { color: '#FDE293' } },
        { name: 'Australia\n$100,000 (-5%)', itemStyle: { color: '#F28B82' } },
      ]
    }
  ]
};

// 3. ECharts Real Sankey Data (Cash Flow Mapping)
const sankeyData = {
  nodes: [
    { name: 'Gross Revenue' }, { name: 'Subscriptions' }, { name: 'Consulting' },
    { name: 'Cost of Goods (COGS)' }, { name: 'Operating Expenses' },
    { name: 'Engineering & R&D' }, { name: 'Sales & Marketing' }, { name: 'Admin & Facilities' },
    { name: 'Gross Margin' }, { name: 'Net Operating Income' }, { name: 'Net Profit' }
  ],
  links: [
    { source: 'Gross Revenue', target: 'COGS', value: 350 },
    { source: 'Gross Revenue', target: 'Gross Margin', value: 850 },
    { source: 'Subscriptions', target: 'Gross Revenue', value: 700 },
    { source: 'Consulting', target: 'Gross Revenue', value: 500 },
    { source: 'Gross Margin', target: 'Operating Expenses', value: 550 },
    { source: 'Gross Margin', target: 'Net Operating Income', value: 300 },
    { source: 'Operating Expenses', target: 'Engineering & R&D', value: 250 },
    { source: 'Operating Expenses', target: 'Sales & Marketing', value: 200 },
    { source: 'Operating Expenses', target: 'Admin & Facilities', value: 100 },
    { source: 'Net Operating Income', target: 'Net Profit', value: 300 }
  ]
};

// 4. ECharts Sunburst Multi-Level Category Breakdown
const sunburstData = [
  {
    name: 'Operating Costs',
    itemStyle: { color: '#4285F4' },
    children: [
      {
        name: 'Payroll',
        itemStyle: { color: '#669DF6' },
        children: [
          { name: 'Engineering', value: 140, itemStyle: { color: '#AECBFA' } },
          { name: 'Product & Design', value: 60, itemStyle: { color: '#AECBFA' } },
          { name: 'Sales Reps', value: 90, itemStyle: { color: '#AECBFA' } }
        ]
      },
      {
        name: 'Infrastructure',
        itemStyle: { color: '#8AB4F8' },
        children: [
          { name: 'AWS Cloud', value: 45, itemStyle: { color: '#D2E3FC' } },
          { name: 'SaaS Tooling', value: 25, itemStyle: { color: '#D2E3FC' } }
        ]
      }
    ]
  },
  {
    name: 'Marketing & Growth',
    itemStyle: { color: '#34A853' },
    children: [
      {
        name: 'Paid Acquisition',
        itemStyle: { color: '#81C995' },
        children: [
          { name: 'Google Search Ads', value: 50, itemStyle: { color: '#CEEAD6' } },
          { name: 'LinkedIn Ads', value: 35, itemStyle: { color: '#CEEAD6' } }
        ]
      },
      {
        name: 'Events & PR',
        itemStyle: { color: '#A8DAB5' },
        children: [
          { name: 'Conferences', value: 30, itemStyle: { color: '#E6F4EA' } }
        ]
      }
    ]
  }
];

// 5. ECharts Real Gauge Speedometer
const getGaugeOption = (title, val, color) => ({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      splitNumber: 5,
      axisLine: {
        lineStyle: {
          width: 12,
          color: [
            [0.3, '#34A853'],
            [0.7, '#FBBC04'],
            [1, '#EA4335']
          ]
        }
      },
      pointer: {
        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
        length: '60%',
        width: 6,
        offsetCenter: [0, '5%'],
        itemStyle: { color: 'auto' }
      },
      axisTick: { length: 6, lineStyle: { color: 'auto', width: 1 } },
      splitLine: { length: 12, lineStyle: { color: 'auto', width: 2 } },
      axisLabel: { color: 'var(--text-muted)', fontSize: 10, distance: -35 },
      title: { offsetCenter: [0, '-20%'], fontSize: 12, color: 'var(--text-muted)' },
      detail: {
        fontSize: 22,
        offsetCenter: [0, '35%'],
        valueAnimation: true,
        formatter: '{value}%',
        color: 'inherit'
      },
      data: [{ value: val, name: title }]
    }
  ]
});

// 6. ECharts Network Graph (Inter-company transactions)
const networkData = {
  nodes: [
    { id: '0', name: 'Parent Corp (HQ)', symbolSize: 50, itemStyle: { color: '#1A73E8' } },
    { id: '1', name: 'US Subsidiary', symbolSize: 35, itemStyle: { color: '#34A853' } },
    { id: '2', name: 'UK Holding Ltd', symbolSize: 35, itemStyle: { color: '#FBBC04' } },
    { id: '3', name: 'India R&D Hub', symbolSize: 35, itemStyle: { color: '#EA4335' } },
    { id: '4', name: 'Vendor Alpha', symbolSize: 22, itemStyle: { color: '#AB47BC' } },
    { id: '5', name: 'Vendor Beta', symbolSize: 22, itemStyle: { color: '#00ACC1' } },
  ],
  links: [
    { source: '0', target: '1', label: { show: true, formatter: '$1.2M Transfer' } },
    { source: '0', target: '2', label: { show: true, formatter: '$800K Royalty' } },
    { source: '0', target: '3', label: { show: true, formatter: '$500K Payroll' } },
    { source: '1', target: '4', label: { show: true, formatter: '$200K Supply' } },
    { source: '2', target: '5', label: { show: true, formatter: '$150K Legal' } },
  ]
};

export default function ChartGallery({ onBack }) {
  // ── 1. PowerBI Decomposition Tree Option (Apache ECharts Native Connected Node-Link Tree)
  const getDecompositionTreeOption = () => ({
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [
      {
        type: 'tree',
        data: [decompositionTreeData],
        top: '5%',
        left: '12%',
        bottom: '5%',
        right: '25%',
        symbol: 'rectangle',
        symbolSize: [170, 48],
        orient: 'LR', // Left to Right
        expandAndCollapse: true, // Click to expand/collapse nodes!
        initialTreeDepth: 3,
        lineStyle: {
          color: '#4285F4',
          width: 2.5,
          curveness: 0.5 // Smooth connecting curves between parent and child nodes!
        },
        label: {
          position: 'inside',
          verticalAlign: 'middle',
          align: 'center',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#ffffff',
          lineHeight: 14
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
            color: 'var(--text-primary)',
            fontSize: 11,
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-strong)',
            borderWidth: 1,
            borderRadius: 6,
            padding: [6, 10]
          }
        },
        animationDurationUpdate: 750
      }
    ]
  });

  // ── 2. Regional Financial Organization Tree Option (Top to Bottom Connected)
  const getRegionalTreeOption = () => ({
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [
      {
        type: 'tree',
        data: [regionalFinancialTree],
        top: '10%',
        left: '8%',
        bottom: '12%',
        right: '8%',
        symbol: 'roundRect',
        symbolSize: [150, 44],
        orient: 'TB', // Top to Bottom
        expandAndCollapse: true,
        initialTreeDepth: 3,
        lineStyle: {
          color: '#34A853',
          width: 2,
          curveness: 0.4
        },
        label: {
          position: 'inside',
          verticalAlign: 'middle',
          align: 'center',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#ffffff',
          lineHeight: 13
        },
        animationDurationUpdate: 750
      }
    ]
  });

  // ── 3. ECharts Sankey Option
  const getSankeyOption = () => ({
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [
      {
        type: 'sankey',
        data: sankeyData.nodes,
        links: sankeyData.links,
        emphasis: { focus: 'adjacency' },
        lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.4 },
        label: { color: 'var(--text-primary)', fontSize: 11, fontWeight: 'bold' },
        itemStyle: { borderWidth: 1, borderColor: '#fff' }
      }
    ]
  });

  // ── 4. ECharts Sunburst Option
  const getSunburstOption = () => ({
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'sunburst',
        data: sunburstData,
        radius: [0, '90%'],
        label: { rotate: 'radial', fontSize: 10, color: '#fff', fontWeight: 'bold' },
        itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: 'var(--bg-card)' },
        levels: [
          {},
          { r0: '0%', r1: '35%', label: { rotate: 0 } },
          { r0: '35%', r1: '70%' },
          { r0: '70%', r1: '95%', label: { position: 'outside', padding: 3, color: 'var(--text-primary)' } }
        ]
      }
    ]
  });

  // ── 5. ECharts Network Graph Option
  const getNetworkOption = () => ({
    tooltip: {},
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: networkData.nodes,
        links: networkData.links,
        roam: true,
        label: { show: true, position: 'right', color: 'var(--text-primary)', fontWeight: 'bold' },
        force: { repulsion: 400, edgeLength: 120 },
        lineStyle: { color: '#4285F4', width: 2, curveness: 0.1 }
      }
    ]
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <button
        onClick={onBack}
        className="btn btn-ghost"
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Network color="#1A73E8" size={28} /> PowerBI Enterprise Tree & Graph Engine
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Powered by Apache ECharts — Click any tree node to dynamically expand/collapse connected branches in real-time.
          </p>
        </div>
      </div>

      {/* ─── HIGHLIGHT 1: POWERBI DECOMPOSITION TREE (CONNECTED NODES) ───── */}
      <div style={{
        padding: '1.75rem', background: 'var(--bg-card)', borderRadius: '16px',
        border: '1px solid var(--border)', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <GitFork color="#EA4335" size={20} /> PowerBI Decomposition Tree (Root-Cause Analyzer)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Interactive connected node-link diagram. Click any colored node box to open/close child branches and trace financial variances.
            </p>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: 20, background: 'rgba(234,67,53,0.12)', color: '#EA4335',
            fontSize: '0.75rem', fontWeight: 700
          }}>
            Interactive Node-Link Canvas
          </span>
        </div>
        <div style={{ height: 480, background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border)', padding: 10 }}>
          <ReactECharts option={getDecompositionTreeOption()} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* ─── HIGHLIGHT 2: HIERARCHICAL REGIONAL FINANCIAL TREE ───────────── */}
      <div style={{
        padding: '1.75rem', background: 'var(--bg-card)', borderRadius: '16px',
        border: '1px solid var(--border)', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers color="#34A853" size={20} /> PowerBI Organizational Financial Tree (Top-Down Connected)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Structured breakdown of Global Revenue → Region → Country → Sales Segment with curved connector lines.
            </p>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: 20, background: 'rgba(52,168,83,0.12)', color: '#34A853',
            fontSize: '0.75rem', fontWeight: 700
          }}>
            Top-Down Hierarchy
          </span>
        </div>
        <div style={{ height: 450, background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border)', padding: 10 }}>
          <ReactECharts option={getRegionalTreeOption()} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* ─── GRID FOR OTHER APACHE ECHARTS ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(550px, 1fr))', gap: '1.5rem' }}>

        {/* 3. SANKEY CASH FLOW */}
        <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>Apache ECharts Real Sankey Diagram</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>Fluid cash flow tracking from Revenue sources to Net Profit</p>
          <div style={{ height: 340, background: 'var(--bg-base)', borderRadius: 10, padding: 8 }}>
            <ReactECharts option={getSankeyOption()} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 4. SUNBURST MULTI-LEVEL */}
        <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>Apache ECharts Concentric Sunburst</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>Multi-layered departmental expense rings</p>
          <div style={{ height: 340, background: 'var(--bg-base)', borderRadius: 10, padding: 8 }}>
            <ReactECharts option={getSunburstOption()} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 5. GAUGE SPEEDOMETERS */}
        <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>Apache ECharts Precision Gauges</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>Live KPI health dial indicators</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 340, background: 'var(--bg-base)', borderRadius: 10, padding: 8 }}>
            <ReactECharts option={getGaugeOption('Profit Target', 84, '#34A853')} style={{ height: '100%' }} />
            <ReactECharts option={getGaugeOption('Risk Meter', 62, '#FBBC04')} style={{ height: '100%' }} />
          </div>
        </div>

        {/* 6. NETWORK GRAPH */}
        <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>Inter-Entity Transaction Network</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>Force-directed graph of inter-company funds & vendors</p>
          <div style={{ height: 340, background: 'var(--bg-base)', borderRadius: 10, padding: 8 }}>
            <ReactECharts option={getNetworkOption()} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

      </div>
    </div>
  );
}
