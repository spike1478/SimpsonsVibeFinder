import React from 'react';
import type { QuizAnswers, ToneBuckets } from '../types';

interface QuizProps {
  answers: QuizAnswers;
  onAnswersChange: (answers: QuizAnswers) => void;
  onSubmit: () => void;
}

const toneOptions: Array<{ key: keyof ToneBuckets; label: string }> = [
  { key: 'cosy', label: 'Cosy/comfort' },
  { key: 'laughOutLoud', label: 'Laugh-out-loud' },
  { key: 'cleverSatire', label: 'Clever satire' },
  { key: 'chaotic', label: 'Chaotic/unhinged' },
  { key: 'wholesome', label: 'Wholesome/heartwarming' },
  { key: 'cynical', label: 'Cynical/dark' },
];

export const Quiz: React.FC<QuizProps> = ({ answers, onAnswersChange, onSubmit }) => {
  const handlePrimaryVibeChange = (vibe: keyof ToneBuckets) => {
    onAnswersChange({
      ...answers,
      primaryVibe: vibe,
      // Remove primary from secondary if it was there
      secondaryTones: answers.secondaryTones.filter(t => t !== vibe),
    });
  };

  const handleSecondaryToneToggle = (tone: keyof ToneBuckets) => {
    if (tone === answers.primaryVibe) {
      return; // Can't select primary as secondary
    }

    const currentIndex = answers.secondaryTones.indexOf(tone);
    if (currentIndex >= 0) {
      // Remove it
      onAnswersChange({
        ...answers,
        secondaryTones: answers.secondaryTones.filter(t => t !== tone),
      });
    } else {
      // Add it (max 2)
      if (answers.secondaryTones.length < 2) {
        onAnswersChange({
          ...answers,
          secondaryTones: [...answers.secondaryTones, tone],
        });
      }
    }
  };

  const handleEnergyChange = (energy: 'chill' | 'medium' | 'high') => {
    onAnswersChange({
      ...answers,
      energyLevel: energy,
    });
  };

  const handleHalloweenToggle = () => {
    onAnswersChange({
      ...answers,
      includeHalloween: !answers.includeHalloween,
    });
  };

  const canSubmit = answers.primaryVibe !== null && answers.energyLevel !== null;

  return (
    <div className="quiz-container" role="region" aria-labelledby="quiz-heading">
      <h2 id="quiz-heading">Mood Quiz</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (canSubmit) {
            onSubmit();
          }
        }}
      >
        <fieldset className="quiz-question">
          <legend>What's your main vibe?</legend>
          <div className="radio-group" role="radiogroup" aria-label="Primary vibe">
            {toneOptions.map(option => (
              <label key={option.key} className="radio-label">
                <input
                  type="radio"
                  name="primaryVibe"
                  value={option.key}
                  checked={answers.primaryVibe === option.key}
                  onChange={() => handlePrimaryVibeChange(option.key)}
                  aria-label={option.label}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="quiz-question">
          <legend>What else do you enjoy? (select up to 2)</legend>
          <div className="checkbox-group" role="group" aria-label="Secondary tones">
            {toneOptions
              .filter(option => option.key !== answers.primaryVibe)
              .map(option => (
                <label key={option.key} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={answers.secondaryTones.includes(option.key)}
                    onChange={() => handleSecondaryToneToggle(option.key)}
                    disabled={answers.secondaryTones.length >= 2 && !answers.secondaryTones.includes(option.key)}
                    aria-label={option.label}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
          </div>
        </fieldset>

        <fieldset className="quiz-question">
          <legend>How energetic?</legend>
          <div className="radio-group" role="radiogroup" aria-label="Energy level">
            <label className="radio-label">
              <input
                type="radio"
                name="energyLevel"
                value="chill"
                checked={answers.energyLevel === 'chill'}
                onChange={() => handleEnergyChange('chill')}
                aria-label="Chill/relaxed"
              />
              <span>Chill/relaxed</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="energyLevel"
                value="medium"
                checked={answers.energyLevel === 'medium'}
                onChange={() => handleEnergyChange('medium')}
                aria-label="Medium"
              />
              <span>Medium</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="energyLevel"
                value="high"
                checked={answers.energyLevel === 'high'}
                onChange={() => handleEnergyChange('high')}
                aria-label="High energy/chaotic"
              />
              <span>High energy/chaotic</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="quiz-question">
          <legend>Special preferences</legend>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={answers.includeHalloween}
              onChange={handleHalloweenToggle}
              aria-label="Include Halloween episodes"
            />
            <span>Include Halloween episodes (Treehouse of Horror)</span>
          </label>
        </fieldset>

        <button
          type="submit"
          className="submit-button"
          disabled={!canSubmit}
          aria-label="Get recommendations based on quiz answers"
        >
          Get Recommendations
        </button>
      </form>
    </div>
  );
};


