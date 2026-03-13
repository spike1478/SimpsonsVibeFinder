import type { Filters as FiltersType } from '../types';

interface FiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

export const Filters: React.FC<FiltersProps> = ({ filters, onFiltersChange }) => {
  const handleToggle = (key: keyof FiltersType) => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  return (
    <fieldset className="filters-panel">
      <legend>Filters</legend>
      <div className="filters-grid">
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={filters.excludeClipShows}
            onChange={() => handleToggle('excludeClipShows')}
            aria-label="Exclude clip shows"
          />
          <span>Exclude clip shows</span>
        </label>

        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={filters.excludeHalloween}
            onChange={() => handleToggle('excludeHalloween')}
            aria-label="Exclude Halloween episodes"
          />
          <span>Exclude Halloween</span>
        </label>

        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={filters.classicOnly}
            onChange={() => handleToggle('classicOnly')}
            aria-label="Classic only (Seasons 3-9)"
          />
          <span>Classic only (S3-S9)</span>
        </label>
      </div>
    </fieldset>
  );
};


