import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlowSelector } from './FlowSelector';

describe('FlowSelector', () => {
  it('renders selection buttons when no flow is selected', () => {
    render(
      <FlowSelector 
        flowType={null} 
        onFlowSelect={() => {}} 
        onEditFlow={() => {}} 
      />
    );

    expect(screen.getByText('Shot')).toBeInTheDocument();
    expect(screen.getByText('Turnover')).toBeInTheDocument();
    expect(screen.getByText('Foul')).toBeInTheDocument();
  });

  it('calls onFlowSelect when a button is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <FlowSelector 
        flowType={null} 
        onFlowSelect={handleSelect} 
        onEditFlow={() => {}} 
      />
    );

    fireEvent.click(screen.getByText('Shot'));
    expect(handleSelect).toHaveBeenCalledWith('Shot');
  });

  it('renders collapsed step when flow is selected', () => {
    render(
      <FlowSelector 
        flowType="Shot" 
        onFlowSelect={() => {}} 
        onEditFlow={() => {}} 
      />
    );

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Shot')).toBeInTheDocument();
    // Buttons should not be visible
    expect(screen.queryByText('Turnover')).not.toBeInTheDocument();
  });

  it('calls onEditFlow when collapsed step is clicked', () => {
    const handleEdit = vi.fn();
    render(
      <FlowSelector 
        flowType="Shot" 
        onFlowSelect={() => {}} 
        onEditFlow={handleEdit} 
      />
    );

    fireEvent.click(screen.getByText('Shot').closest('div')!.parentElement!.parentElement!);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });
});
