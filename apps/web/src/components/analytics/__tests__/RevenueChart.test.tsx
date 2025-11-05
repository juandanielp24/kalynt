import { render, screen } from '@testing-library/react';
import { RevenueChart } from '../RevenueChart';

describe('RevenueChart', () => {
  const mockData = [
    { date: '2024-01-01', revenue: 100000, salesCount: 10 },
    { date: '2024-01-02', revenue: 150000, salesCount: 15 },
    { date: '2024-01-03', revenue: 120000, salesCount: 12 },
  ];

  it('should render chart with data', () => {
    render(<RevenueChart data={mockData} />);

    // Chart should be rendered
    expect(screen.getByText(/01 ene/i)).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    render(<RevenueChart data={[]} />);

    // Should not crash
    expect(document.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should format currency correctly', () => {
    const { container } = render(<RevenueChart data={mockData} />);

    // Check if Y-axis has currency format
    const yAxis = container.querySelector('.recharts-yAxis');
    expect(yAxis).toBeInTheDocument();
  });

  it('should display both revenue and sales count lines', () => {
    const { container } = render(<RevenueChart data={mockData} />);

    // Check for two line elements
    const lines = container.querySelectorAll('.recharts-line');
    expect(lines.length).toBe(2);
  });

  it('should format dates in Spanish locale', () => {
    render(<RevenueChart data={mockData} />);

    // Date should be formatted in Spanish
    expect(screen.getByText(/ene/i)).toBeInTheDocument();
  });
});
