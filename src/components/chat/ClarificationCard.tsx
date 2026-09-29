import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, HelpCircle, Check, Edit2, Sparkles } from 'lucide-react';
import { ClarificationRequest, ClarificationField } from '../../types/chat.ts';

interface ClarificationCardProps {
  request: ClarificationRequest;
  onSubmit: (values: Record<string, string>) => void;
  isGenerating?: boolean;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  request,
  onSubmit,
  isGenerating = false,
}) => {
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = { ...(request.submittedValues || {}) };
    request.fields.forEach((f) => {
      if (!initial[f.id] && f.defaultValue) {
        initial[f.id] = f.defaultValue;
      }
    });
    return initial;
  });

  const [activeWhyId, setActiveWhyId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(!request.isCompleted);
  const [customInputActive, setCustomInputActive] = useState<Record<string, boolean>>({});

  const handleChipSelect = (fieldId: string, option: string) => {
    if (option.includes('Other')) {
      setCustomInputActive((prev) => ({ ...prev, [fieldId]: true }));
      setFormValues((prev) => ({ ...prev, [fieldId]: '' }));
    } else {
      setCustomInputActive((prev) => ({ ...prev, [fieldId]: false }));
      setFormValues((prev) => ({ ...prev, [fieldId]: option }));
    }
  };

  const handleChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Check required fields
    const missingRequired = request.fields.find(
      (f) => f.required && (!formValues[f.id] || !formValues[f.id].trim())
    );

    if (missingRequired) {
      alert(`Please provide ${missingRequired.label} to continue.`);
      return;
    }

    setIsEditing(false);
    onSubmit(formValues);
  };

  const handleQuickSkip = () => {
    setIsEditing(false);
    onSubmit(formValues);
  };

  const hasUnfilledRequired = request.fields.some(
    (f) => f.required && (!formValues[f.id] || !formValues[f.id].trim())
  );

  // If already completed and user is not editing, show the sleek summary
  if (request.isCompleted && !isEditing) {
    const summaryEntries = Object.entries(request.submittedValues || formValues);
    return (
      <div className="nexora-clarification-summary-card">
        <div className="nexora-clarification-summary-header">
          <div className="nexora-summary-badge">
            <Check size={12} color="var(--radar-white)" />
            <span>Parameters Gathered for Analysis</span>
          </div>
          <button
            className="nexora-summary-edit-btn"
            onClick={() => setIsEditing(true)}
            type="button"
            aria-label="Edit analysis parameters"
          >
            <Edit2 size={12} />
            <span>Edit Context</span>
          </button>
        </div>

        <div className="nexora-summary-tags-grid">
          {summaryEntries.map(([key, val]) => {
            const field = request.fields.find((f) => f.id === key);
            const label = field ? field.label.replace(/\s*\(Optional\)/i, '') : key;
            if (!val || !val.trim()) return null;
            return (
              <div key={key} className="nexora-summary-tag">
                <span className="nexora-summary-tag-label">{label}:</span>
                <span className="nexora-summary-tag-value">{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="nexora-clarification-card"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header with intent and icon */}
      <div className="nexora-clarification-header">
        <div className="nexora-clarification-pill">
          <Sparkles size={12} color="#7c3aed" />
          <span>{request.intentTitle}</span>
        </div>
      </div>

      {/* Conversational Explanation */}
      <p className="nexora-clarification-lead">{request.leadExplanation}</p>

      {/* Fields Form */}
      <form onSubmit={handleSubmit} className="nexora-clarification-form">
        {request.fields.map((field: ClarificationField) => {
          const isWhyOpen = activeWhyId === field.id;
          const isCustom = customInputActive[field.id];
          const val = formValues[field.id] || '';

          return (
            <div key={field.id} className="nexora-clarification-field">
              {/* Field Label & Why Toggle */}
              <div className="nexora-field-header">
                <label className="nexora-field-label" htmlFor={`input_${field.id}`}>
                  {field.label}
                  {field.required && <span className="nexora-field-required">*</span>}
                </label>

                <button
                  type="button"
                  className="nexora-why-toggle"
                  onClick={() => setActiveWhyId(isWhyOpen ? null : field.id)}
                  aria-label={`Why does Nexora ask for ${field.label}?`}
                >
                  <HelpCircle size={12} />
                  <span>Why ask this?</span>
                </button>
              </div>

              {/* Collapsible Why Explanation */}
              {isWhyOpen && (
                <div className="nexora-why-callout">
                  <span>💡 <strong>Reasoning:</strong> {field.why}</span>
                </div>
              )}

              {/* Input Control according to field type */}
              {field.type === 'chips' ? (
                <div className="nexora-chips-group">
                  {field.options?.map((opt) => {
                    const isSelected = val === opt || (opt.includes('Other') && isCustom);
                    return (
                      <button
                        key={opt}
                        type="button"
                        className={`nexora-chip-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleChipSelect(field.id, opt)}
                      >
                        {isSelected && <Check size={11} />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}

                  {/* Fallback custom text input if user selects 'Other...' */}
                  {isCustom && (
                    <div style={{ width: '100%', marginTop: '6px' }}>
                      <input
                        id={`input_${field.id}`}
                        type="text"
                        className="nexora-compact-input"
                        placeholder="Type competitor name..."
                        value={val}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              ) : field.type === 'select' ? (
                <select
                  id={`input_${field.id}`}
                  className="nexora-compact-select"
                  value={val}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                >
                  <option value="">Select option...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`input_${field.id}`}
                  type="text"
                  className="nexora-compact-input"
                  placeholder={field.placeholder || 'Type here...'}
                  value={val}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                />
              )}
            </div>
          );
        })}

        {/* Submit Actions */}
        <div className="nexora-clarification-actions">
          <button
            type="submit"
            className="nexora-clarification-submit-btn"
            disabled={hasUnfilledRequired || isGenerating}
          >
            <span>Generate Intelligence</span>
            <ArrowRight size={13} />
          </button>

          {!hasUnfilledRequired && request.fields.some((f) => !f.required) && (
            <button
              type="button"
              className="nexora-clarification-skip-btn"
              onClick={handleQuickSkip}
              disabled={isGenerating}
            >
              Skip optional
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};
