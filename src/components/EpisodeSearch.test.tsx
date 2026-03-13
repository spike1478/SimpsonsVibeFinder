import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EpisodeSearch } from './EpisodeSearch';
import type { Episode } from '../types';

describe('EpisodeSearch', () => {
  const mockEpisodes: Episode[] = [
    {
      id: 1,
      name: 'Homer Goes to College',
      overview: 'Homer goes to college',
      episode_number: 1,
      season_number: 5,
      air_date: '1993-10-14',
      vote_average: 8.5,
      vote_count: 100,
      still_path: null,
    },
    {
      id: 2,
      name: 'Marge vs. the Monorail',
      overview: 'Springfield gets a monorail',
      episode_number: 12,
      season_number: 4,
      air_date: '1993-01-14',
      vote_average: 9.0,
      vote_count: 200,
      still_path: null,
    },
    {
      id: 3,
      name: 'Bart Gets an F',
      overview: 'Bart struggles with school',
      episode_number: 1,
      season_number: 2,
      air_date: '1990-10-11',
      vote_average: 8.0,
      vote_count: 150,
      still_path: null,
    },
  ];

  const mockOnEpisodeSelect = vi.fn();
  const mockOnSubmit = vi.fn();

  it('should render search input', () => {
    render(
      <EpisodeSearch
        episodes={mockEpisodes}
        onEpisodeSelect={mockOnEpisodeSelect}
        onSubmit={mockOnSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/type episode title/i);
    expect(input).toBeInTheDocument();
  });

  it('should filter episodes as user types', async () => {
    render(
      <EpisodeSearch
        episodes={mockEpisodes}
        onEpisodeSelect={mockOnEpisodeSelect}
        onSubmit={mockOnSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/type episode title/i);
    fireEvent.change(input, { target: { value: 'homer' } });

    await waitFor(() => {
      expect(screen.getByText('Homer Goes to College')).toBeInTheDocument();
    });
  });

  it('should call onEpisodeSelect and onSubmit when episode is clicked', async () => {
    render(
      <EpisodeSearch
        episodes={mockEpisodes}
        onEpisodeSelect={mockOnEpisodeSelect}
        onSubmit={mockOnSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/type episode title/i);
    fireEvent.change(input, { target: { value: 'homer' } });

    await waitFor(() => {
      const episodeButton = screen.getByText('Homer Goes to College');
      fireEvent.click(episodeButton);
    });

    expect(mockOnEpisodeSelect).toHaveBeenCalledWith(mockEpisodes[0]);
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should show no results message when no matches found', async () => {
    render(
      <EpisodeSearch
        episodes={mockEpisodes}
        onEpisodeSelect={mockOnEpisodeSelect}
        onSubmit={mockOnSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/type episode title/i);
    fireEvent.change(input, { target: { value: 'nonexistent episode' } });

    await waitFor(() => {
      expect(screen.getByText(/no episodes found/i)).toBeInTheDocument();
    });
  });

  it('should handle Enter key on exact match', async () => {
    render(
      <EpisodeSearch
        episodes={mockEpisodes}
        onEpisodeSelect={mockOnEpisodeSelect}
        onSubmit={mockOnSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/type episode title/i);
    fireEvent.change(input, { target: { value: 'Homer Goes to College' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnEpisodeSelect).toHaveBeenCalledWith(mockEpisodes[0]);
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });
});
