import { render, screen } from '@testing-library/react';
import { MetricCard } from '../MetricCard';
import { DollarSign } from 'lucide-react';

describe('MetricCard', () => {
  it('should render metric with value', () => {
    render(
      <MetricCard
        title="Total Revenue"
        value="$10,000.00"
        icon={<DollarSign />}
      />
    );

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
  });

  it('should display positive change', () => {
    render(
      <MetricCard
        title="Sales"
        value={100}
        change={15.5}
        trend="up"
      />
    );

    expect(screen.getByText(/\+15\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/vs período anterior/)).toBeInTheDocument();
  });

  it('should display negative change', () => {
    render(
      <MetricCard
        title="Sales"
        value={100}
        change={-10.2}
      />
    );

    expect(screen.getByText(/-10\.2%/)).toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    render(
      <MetricCard
        title="Customers"
        value={500}
        subtitle="50 new"
      />
    );

    expect(screen.getByText('50 new')).toBeInTheDocument();
  });

  it('should not display change when change is zero', () => {
    render(
      <MetricCard
        title="Sales"
        value={100}
        change={0}
      />
    );

    expect(screen.queryByText(/vs período anterior/)).not.toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    const { container } = render(
      <MetricCard
        title="Revenue"
        value="$1000"
        icon={<DollarSign data-testid="dollar-icon" />}
      />
    );

    expect(container.querySelector('[data-testid="dollar-icon"]')).toBeInTheDocument();
  });

  it('should display correct styling for positive change', () => {
    const { container } = render(
      <MetricCard
        title="Sales"
        value={100}
        change={20}
      />
    );

    const changeElement = screen.getByText(/\+20\.0%/);
    expect(changeElement).toHaveClass('text-green-600');
  });

  it('should display correct styling for negative change', () => {
    const { container } = render(
      <MetricCard
        title="Sales"
        value={100}
        change={-20}
      />
    );

    const changeElement = screen.getByText(/-20\.0%/);
    expect(changeElement).toHaveClass('text-red-600');
  });
});
