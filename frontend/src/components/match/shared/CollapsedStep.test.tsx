import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsedStep } from './CollapsedStep';
import { Activity } from 'lucide-react';

describe('CollapsedStep', () => {
  it('renders label and value correctly', () => {
    render(
      <CollapsedStep 
        label="Test Label" 
        value="Test Value" 
        onEdit={() => {}} 
        icon={Activity} 
      />
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Test Value')).toBeInTheDocument();
  });

  it('calls onEdit when clicked', () => {
    const handleEdit = vi.fn();
    render(
      <CollapsedStep 
        label="Test Label" 
        value="Test Value" 
        onEdit={handleEdit} 
        icon={Activity} 
      />
    );

    fireEvent.click(screen.getByText('Test Label').closest('div')!.parentElement!.parentElement!);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });
});
