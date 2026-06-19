import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SuggestedPromptChips from './SuggestedPromptChips';

const PROMPTS = ['A', 'B', 'C', 'D', 'E'];

describe('SuggestedPromptChips', () => {
  it('shows only the first 3 prompts by default', () => {
    render(<SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} variant="hero" />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText('D')).not.toBeInTheDocument();
  });

  it('reveals the rest after clicking "Show more"', () => {
    render(<SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} variant="hero" />);
    fireEvent.click(screen.getByText(/show more/i));
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
  });

  it('re-collapses after clicking "Show less"', () => {
    render(<SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} variant="hero" />);
    fireEvent.click(screen.getByText(/show more/i));
    fireEvent.click(screen.getByText(/show less/i));
    expect(screen.queryByText('D')).not.toBeInTheDocument();
  });

  it('does not render a "Show more" toggle when there are 3 or fewer prompts', () => {
    render(<SuggestedPromptChips prompts={['A', 'B', 'C']} onSelect={vi.fn()} variant="hero" />);
    expect(screen.queryByText(/show more/i)).not.toBeInTheDocument();
  });

  it('calls onSelect with the clicked prompt', () => {
    const onSelect = vi.fn();
    render(<SuggestedPromptChips prompts={PROMPTS} onSelect={onSelect} variant="hero" />);
    fireEvent.click(screen.getByText('A'));
    expect(onSelect).toHaveBeenCalledWith('A');
  });

  it('disables all visible chips when disabled is true', () => {
    render(<SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} disabled variant="panel" />);
    expect(screen.getByText('A').closest('button')).toBeDisabled();
    expect(screen.getByText('C').closest('button')).toBeDisabled();
  });

  it('shows a checkmark on the active prompt for the panel variant', () => {
    render(
      <SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} activePrompt="B" variant="panel" />
    );
    const button = screen.getByText('B').closest('button');
    expect(button?.querySelector('svg')).toBeInTheDocument();
  });

  it('never shows a checkmark for the hero variant even with an activePrompt', () => {
    render(
      <SuggestedPromptChips prompts={PROMPTS} onSelect={vi.fn()} activePrompt="B" variant="hero" />
    );
    const button = screen.getByText('B').closest('button');
    expect(button?.querySelector('svg')).not.toBeInTheDocument();
  });
});
