import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoneSelector } from './ZoneSelector';
import { ZONE_CONFIG } from '../../../config/zones';

describe('ZoneSelector', () => {
  it('renders all zones by default', () => {
    render(
      <ZoneSelector 
        selectedZone={null} 
        onZoneSelect={() => {}} 
      />
    );

    // Check 6m zones
    ZONE_CONFIG.sixMeter.forEach(z => {
      expect(screen.getByText(z.label)).toBeInTheDocument();
    });

    // Check 9m zones
    ZONE_CONFIG.nineMeter.forEach(z => {
      expect(screen.getByText(z.label)).toBeInTheDocument();
    });

    // Check Penalty
    expect(screen.getByText(ZONE_CONFIG.penalty.label)).toBeInTheDocument();
  });

  it('hides penalty zone when hidePenalty is true', () => {
    render(
      <ZoneSelector 
        selectedZone={null} 
        onZoneSelect={() => {}} 
        hidePenalty={true}
      />
    );

    expect(screen.queryByText(ZONE_CONFIG.penalty.label)).not.toBeInTheDocument();
  });

  it('calls onZoneSelect when a zone is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <ZoneSelector 
        selectedZone={null} 
        onZoneSelect={handleSelect} 
      />
    );

    fireEvent.click(screen.getByText(ZONE_CONFIG.sixMeter[0].label));
    expect(handleSelect).toHaveBeenCalledWith(ZONE_CONFIG.sixMeter[0].zone);
  });

  it('highlights selected zone', () => {
    const selected = ZONE_CONFIG.sixMeter[0];
    render(
      <ZoneSelector 
        selectedZone={selected.zone} 
        onZoneSelect={() => {}} 
      />
    );

    const button = screen.getByText(selected.label);
    expect(button).toHaveClass('bg-indigo-600');
  });
});
