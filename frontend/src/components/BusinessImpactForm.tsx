import React from "react";
import FormSelect from "./FormSelect";
import FormTextArea from "./FormTextArea";

interface BusinessImpactFormProps {
  value: {
    metric: string;
    targetImprovement: number;
    timeframe: number;
    successDefinition: string;
  };
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
  strategicCategory?: string;
}

// Category-specific business metrics
const CATEGORY_METRICS: Record<string, string[]> = {
  "Leadership & Management Development": [
    "Team performance improvement",
    "Employee engagement scores",
    "Leadership effectiveness",
    "Retention rates",
    "Succession readiness"
  ],
  "Compliance & Risk Management": [
    "Incident reduction",
    "Audit success rates",
    "Risk mitigation",
    "Regulatory compliance",
    "Fine avoidance"
  ],
  "Sales & Customer Excellence": [
    "Revenue growth",
    "Customer satisfaction",
    "Sales conversion rates",
    "Customer retention",
    "Market share"
  ],
  "Technical & Systems Mastery": [
    "Productivity",
    "Quality",
    "Error reduction",
    "System efficiency",
    "Technical competency"
  ],
  "Onboarding & Culture Integration": [
    "Time to productivity",
    "Employee engagement",
    "Culture alignment",
    "Retention rates",
    "Role readiness"
  ],
  "Professional Skills Development": [
    "Skill competency",
    "Performance improvement",
    "Career advancement",
    "Job satisfaction",
    "Professional growth"
  ],
  "Health, Safety & Wellbeing": [
    "Safety incidents",
    "Wellbeing scores",
    "Absenteeism reduction",
    "Health outcomes",
    "Workplace satisfaction"
  ],
  "Diversity, Equity & Inclusion": [
    "Inclusion metrics",
    "Diversity representation",
    "Equity outcomes",
    "Belonging scores",
    "Cultural competence"
  ],
  "Innovation & Future Readiness": [
    "Innovation adoption",
    "Future skills development",
    "Change readiness",
    "Digital transformation",
    "Competitive advantage"
  ],
  "Product & Service Excellence": [
    "Quality improvement",
    "Customer satisfaction",
    "Process efficiency",
    "Service delivery",
    "Product performance"
  ]
};

// Fallback metrics for unknown categories
const DEFAULT_METRICS = [
  "Risk mitigation",
  "Cost reduction", 
  "Revenue growth",
  "Productivity",
  "Quality",
  "Engagement",
  "Safety",
  "Compliance",
  "Retention"
];

const TIMEFRAME_OPTIONS = [
  { value: "30", label: "30 days (for awareness/knowledge)" },
  { value: "60", label: "60 days (for skill application)" },
  { value: "90", label: "90 days (for behavior change)" },
  { value: "180", label: "180 days (for business impact)" }
];

const BusinessImpactForm: React.FC<BusinessImpactFormProps> = ({
  value,
  onChange,
  disabled = false,
  strategicCategory,
}) => {
  // Get category-specific metrics or fallback to default
  const getMetrics = () => {
    if (strategicCategory && CATEGORY_METRICS[strategicCategory]) {
      return CATEGORY_METRICS[strategicCategory];
    }
    return DEFAULT_METRICS;
  };

  const businessMetrics = getMetrics();
  

  const handleMetricChange = (field: string, newValue: string) => {
    onChange("businessImpact", {
      ...value,
      metric: newValue
    });
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value) || 0;
    onChange("businessImpact", {
      ...value,
      targetImprovement: numValue
    });
  };

  const handleTimeframeChange = (field: string, newValue: string) => {
    onChange("businessImpact", {
      ...value,
      timeframe: parseInt(newValue)
    });
  };

  const handleSuccessDefinitionChange = (field: string, newValue: string) => {
    onChange("businessImpact", {
      ...value,
      successDefinition: newValue
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSelect
          label="Primary Metric"
          name="metric"
          value={value.metric}
          onChange={handleMetricChange}
          options={businessMetrics}
          disabled={disabled}
          required
        />

        <div>
          <label
            htmlFor="targetImprovement"
            className="block text-slate-100 font-semibold mb-2"
          >
            Target Improvement <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="targetImprovement"
              name="targetImprovement"
              type="number"
              min="0"
              max="1000"
              step="0.1"
              value={value.targetImprovement}
              onChange={handleTargetChange}
              className="
                block w-full rounded-2xl
                border border-slate-600 bg-slate-700/80
                px-5 py-4 pr-8
                text-slate-100
                shadow-sm
                focus:border-sky-400 focus:ring-2 focus:ring-sky-400
              "
              disabled={disabled}
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-5">
              <span className="text-slate-400 text-sm">%</span>
            </div>
          </div>
        </div>

        <FormSelect
          label="Timeframe"
          name="timeframe"
          value={value.timeframe.toString()}
          onChange={handleTimeframeChange}
          options={TIMEFRAME_OPTIONS}
          disabled={disabled}
          required
        />
      </div>

      <FormTextArea
        label="Success Definition"
        name="successDefinition"
        value={value.successDefinition}
        onChange={handleSuccessDefinitionChange}
        placeholder="Define what success looks like for this initiative..."
        rows={3}
        disabled={disabled}
        required
      />
    </div>
  );
};

export default BusinessImpactForm;
