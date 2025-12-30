import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SplitToggle } from './SplitToggle';
import { User, Users } from 'lucide-react';

describe('SplitToggle', () => {
  const defaultProps = {
    value: false,
    onChange: vi.fn(),
    leftOption: { label: 'Individual', icon: User },
    rightOption: { label: 'Collective', icon: Users },
    colorClass: 'purple' as const,
  };

  it('renders both options', () => {
    render(<SplitToggle {...defaultProps} />);
    expect(screen.getByText('Individual')).toBeInTheDocument();
    expect(screen.getByText('Collective')).toBeInTheDocument();
  });

  it('calls onChange with false when left option is clicked', () => {
    const handleChange = vi.fn();
    render(<SplitToggle {...defaultProps} onChange={handleChange} value={true} />);
    
    fireEvent.click(screen.getByText('Individual').closest('button')!);
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('calls onChange with true when right option is clicked', () => {
    const handleChange = vi.fn();
    render(<SplitToggle {...defaultProps} onChange={handleChange} value={false} />);
    
    fireEvent.click(screen.getByText('Collective').closest('button')!);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('highlights the active option', () => {
    const { rerender } = render(<SplitToggle {...defaultProps} value={false} />);
    
    // Left should be active (Individual)
    const leftButton = screen.getByText('Individual').closest('button');
    const rightButton = screen.getByText('Collective').closest('button');
    
    expect(leftButton).toHaveClass('bg-purple-50', 'text-purple-700', 'border-purple-500');
    expect(rightButton).toHaveClass('bg-gray-50', 'text-gray-400', 'border-purple-500');

    // Rerender with true (Collective active)
    rerender(<SplitToggle {...defaultProps} value={true} />);
    
    expect(screen.getByText('Individual').closest('button')).toHaveClass('bg-gray-50', 'text-gray-400', 'border-purple-500');
    expect(screen.getByText('Collective').closest('button')).toHaveClass('bg-purple-50', 'text-purple-700', 'border-purple-500');
  });

  it('renders with orange color class', () => {
    render(<SplitToggle {...defaultProps} colorClass="orange" value={true} />);
    const activeButton = screen.getByText('Collective').closest('button');
    expect(activeButton).toHaveClass('border-orange-500', 'bg-orange-50', 'text-orange-700');
  });

  it('renders with cyan color class', () => {
    render(<SplitToggle {...defaultProps} colorClass="cyan" value={true} />);
    const activeButton = screen.getByText('Collective').closest('button');
    expect(activeButton).toHaveClass('border-cyan-500', 'bg-cyan-50', 'text-cyan-700');
  });

  it('renders multiple icons when icon is an array', () => {
    render(
      <SplitToggle 
        {...defaultProps} 
        rightOption={{ label: 'Multiple', icon: [User, Users] }}
        value={true}
      />
    );
    // Should render a div with multiple icons
    const button = screen.getByText('Multiple').closest('button');
    expect(button).toBeInTheDocument();
  });

  it('supports custom left/right values', () => {
    const handleChange = vi.fn();
    render(
      <SplitToggle
        {...defaultProps}
        value={true}
        onChange={handleChange}
        leftValue={true}
        rightValue={false}
      />
    );

    fireEvent.click(screen.getByText('Collective').closest('button')!);
    expect(handleChange).toHaveBeenCalledWith(false);
  });
});
