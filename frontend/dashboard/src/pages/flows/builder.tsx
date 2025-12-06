/**
 * Flow Builder Page
 * Three-column layout: Steps List | Step Editor | Preview
 */

import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';

interface FlowStep {
  type: 'pause' | 'downgrade' | 'discount' | 'support' | 'feedback';
  title: string;
  message: string;
  config?: Record<string, any>;
}

interface Flow {
  id?: number;
  name: string;
  steps: FlowStep[];
  language: string;
  rankingScore?: number;
}

const FlowBuilder: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuth();
  const [flow, setFlow] = useState<Flow>({
    name: '',
    steps: [],
    language: 'en',
  });
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      loadFlow(parseInt(id as string));
    }
  }, [id]);

  const loadFlow = async (flowId: number) => {
    try {
      const response = await apiClient.getFlow(flowId);
      if (response.success) {
        setFlow(response.flow);
        if (response.flow.steps.length > 0) {
          setSelectedStepIndex(0);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load flow');
      router.push('/flows');
    }
  };

  const handleValidate = async () => {
    try {
      const validationResponse = await apiClient.validateFlow(flow);
      setValidation(validationResponse.validation);
    } catch (err: any) {
      console.error('Validation error:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate flow first
      const validationResponse = await apiClient.validateFlow(flow);
      setValidation(validationResponse.validation);
      
      if (!validationResponse.validation.valid) {
        alert(`Flow validation failed:\n${validationResponse.validation.errors.join('\n')}`);
        setSaving(false);
        return;
      }

      if (flow.id) {
        // Update existing flow
        const response = await apiClient.updateFlowFull(flow.id, flow);
        setFlow({ ...flow, ...response.flow });
        alert('Flow saved successfully!');
      } else {
        // Create new flow
        const response = await apiClient.createFlow(flow);
        router.push(`/flows/builder?id=${response.flow.id}`);
        return;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save flow');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!flow.id) {
      alert('Please save the flow first');
      return;
    }
    try {
      await apiClient.activateFlow(flow.id);
      alert('Flow activated!');
      await loadFlow(flow.id);
    } catch (err: any) {
      alert(err.message || 'Failed to activate flow');
    }
  };

  const handleDeactivate = async () => {
    if (!flow.id) {
      return;
    }
    try {
      await apiClient.deactivateFlow(flow.id);
      alert('Flow deactivated!');
      await loadFlow(flow.id);
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate flow');
    }
  };

  const handleLoadTemplate = async (template: Flow) => {
    if (!confirm('Load this template? This will replace your current flow.')) return;
    setFlow(template);
    setSelectedStepIndex(template.steps.length > 0 ? 0 : null);
  };

  const handleAddStep = (type: FlowStep['type']) => {
    const newStep: FlowStep = {
      type,
      title: '',
      message: '',
      config: type === 'discount' ? { percentage: 20 } : type === 'downgrade' ? { plan: '' } : undefined,
    };
    const newSteps = [...flow.steps, newStep];
    setFlow({ ...flow, steps: newSteps });
    setSelectedStepIndex(newSteps.length - 1);
  };

  const handleDeleteStep = (index: number) => {
    if (!confirm('Delete this step?')) return;
    const newSteps = flow.steps.filter((_, i) => i !== index);
    setFlow({ ...flow, steps: newSteps });
    if (selectedStepIndex === index) {
      setSelectedStepIndex(newSteps.length > 0 ? Math.min(index, newSteps.length - 1) : null);
    } else if (selectedStepIndex !== null && selectedStepIndex > index) {
      setSelectedStepIndex(selectedStepIndex - 1);
    }
  };

  const handleUpdateStep = (index: number, updates: Partial<FlowStep>) => {
    const newSteps = [...flow.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setFlow({ ...flow, steps: newSteps });
  };

  const handleMoveStep = (fromIndex: number, toIndex: number) => {
    const newSteps = [...flow.steps];
    const [moved] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, moved);
    setFlow({ ...flow, steps: newSteps });
    setSelectedStepIndex(toIndex);
  };

  const handleDragStart = (index: number) => {
    setDraggedStepIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedStepIndex === null || draggedStepIndex === index) return;
    
    const newSteps = [...flow.steps];
    const [moved] = newSteps.splice(draggedStepIndex, 1);
    newSteps.splice(index, 0, moved);
    setFlow({ ...flow, steps: newSteps });
    setDraggedStepIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedStepIndex(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  const selectedStep = selectedStepIndex !== null ? flow.steps[selectedStepIndex] : null;

  return (
    <Layout>
      <Head>
        <title>Flow Builder - RetentionOS Dashboard</title>
        <meta name="description" content="Build retention flows" />
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={flow.name}
              onChange={(e) => setFlow({ ...flow, name: e.target.value })}
              placeholder="Flow Name"
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#003A78',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
              }}
            />
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', alignItems: 'center' }}>
              <select
                value={flow.language}
                onChange={(e) => setFlow({ ...flow, language: e.target.value })}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
              {validation && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {validation.valid ? (
                    <span style={{ color: '#1F9D55', fontSize: '14px', fontWeight: 500 }}>✓ Valid</span>
                  ) : (
                    <span style={{ color: '#e74c3c', fontSize: '14px', fontWeight: 500 }}>
                      ✗ {validation.errors.length} error(s)
                    </span>
                  )}
                  {validation.warnings.length > 0 && (
                    <span style={{ color: '#f39c12', fontSize: '12px' }}>
                      ⚠ {validation.warnings.length} warning(s)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {flow.id && (
              <>
                {flow.rankingScore === 0 ? (
                  <button
                    onClick={handleActivate}
                    style={{
                      padding: '10px 20px',
                      background: '#1F9D55',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    onClick={handleDeactivate}
                    style={{
                      padding: '10px 20px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Deactivate
                  </button>
                )}
              </>
            )}
            <button
              onClick={handleValidate}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: '#003A78',
                border: '1px solid #003A78',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Validate
            </button>
            <button
              onClick={() => router.push('/flows')}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: '#003A78',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Flow'}
            </button>
          </div>
        </div>

        {/* Three Column Layout */}
        <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>
          {/* Left: Steps List */}
          <div style={{ 
            width: '300px', 
            background: 'white', 
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflowY: 'auto',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#003A78', marginBottom: '12px' }}>
                Steps ({flow.steps.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {['pause', 'downgrade', 'discount', 'support', 'feedback'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleAddStep(type as FlowStep['type'])}
                    style={{
                      padding: '6px 12px',
                      background: '#f0f4f8',
                      color: '#003A78',
                      border: '1px solid #003A78',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    + {type}
                  </button>
                ))}
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await apiClient.getFlowTemplates();
                    if (response.success && response.templates.length > 0) {
                      // Show template selector
                      const templateNames = response.templates.map((t: Flow, i: number) => `${i + 1}. ${t.name}`).join('\n');
                      const selection = prompt(`Select a template (1-${response.templates.length}):\n\n${templateNames}`);
                      const index = parseInt(selection || '') - 1;
                      if (index >= 0 && index < response.templates.length) {
                        if (confirm(`Load "${response.templates[index].name}" template? This will replace your current flow.`)) {
                          handleLoadTemplate(response.templates[index]);
                        }
                      }
                    }
                  } catch (err: any) {
                    alert(err.message || 'Failed to load templates');
                    console.error('Failed to load templates:', err);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  color: '#666',
                  border: '1px dashed #ddd',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                📋 Load Template
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {flow.steps.map((step, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedStepIndex(index)}
                  style={{
                    padding: '12px',
                    background: selectedStepIndex === index ? '#f0f4f8' : 'white',
                    border: selectedStepIndex === index ? '2px solid #003A78' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'move',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#003A78', textTransform: 'capitalize' }}>
                      {index + 1}. {step.type}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {step.title || 'Untitled step'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStep(index);
                    }}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      color: '#e74c3c',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {flow.steps.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>
                  No steps yet. Add a step to get started.
                </div>
              )}
            </div>
          </div>

          {/* Middle: Step Editor */}
          <div style={{ 
            flex: 1, 
            background: 'white', 
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflowY: 'auto',
          }}>
            {selectedStep ? (
              <>
                <StepEditor
                  step={selectedStep}
                  index={selectedStepIndex!}
                  onChange={(updates) => handleUpdateStep(selectedStepIndex!, updates)}
                />
                {validation && validation.errors.length > 0 && (
                  <div style={{ 
                    marginTop: '24px', 
                    padding: '16px', 
                    background: '#fee', 
                    borderRadius: '8px',
                    border: '1px solid #e74c3c',
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#e74c3c', marginBottom: '8px' }}>
                      Validation Errors:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#c33' }}>
                      {validation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {validation && validation.warnings.length > 0 && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    background: '#fff8e1', 
                    borderRadius: '8px',
                    border: '1px solid #f39c12',
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f39c12', marginBottom: '8px' }}>
                      Warnings:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#e67e22' }}>
                      {validation.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>Select a step to edit</div>
                <div style={{ fontSize: '14px' }}>Click on a step from the list or add a new one</div>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div style={{ 
            width: '400px', 
            background: '#f8f9fa', 
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflowY: 'auto',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#003A78', marginBottom: '16px' }}>
              Preview
            </h3>
            <FlowPreview steps={flow.steps} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Step Editor Component
interface StepEditorProps {
  step: FlowStep;
  index: number;
  onChange: (updates: Partial<FlowStep>) => void;
}

function StepEditor({ step, index, onChange }: StepEditorProps) {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
          Step Type
        </label>
        <select
          value={step.type}
          onChange={(e) => {
            const newType = e.target.value as FlowStep['type'];
            // Reset config when changing type
            const newConfig = newType === 'discount' ? { percentage: 20 } : 
                             newType === 'downgrade' ? { plan: '' } : 
                             undefined;
            onChange({ type: newType, config: newConfig });
          }}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            background: 'white',
            color: '#333',
            cursor: 'pointer',
            textTransform: 'capitalize',
          }}
        >
          <option value="pause">Pause</option>
          <option value="downgrade">Downgrade</option>
          <option value="discount">Discount</option>
          <option value="support">Support</option>
          <option value="feedback">Feedback</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
          Title *
        </label>
        <input
          type="text"
          value={step.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Step title"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
          Message *
        </label>
        <textarea
          value={step.message}
          onChange={(e) => onChange({ message: e.target.value })}
          placeholder="Step message"
          rows={4}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Type-specific config */}
      {step.type === 'discount' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
            Discount Percentage
          </label>
          <input
            type="number"
            value={step.config?.percentage || 20}
            onChange={(e) => onChange({ config: { ...step.config, percentage: parseInt(e.target.value) || 0 } })}
            min="1"
            max="100"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {step.type === 'downgrade' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
            Target Plan
          </label>
          <input
            type="text"
            value={step.config?.plan || ''}
            onChange={(e) => onChange({ config: { ...step.config, plan: e.target.value } })}
            placeholder="e.g., basic, starter"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {step.type === 'pause' && (
        <div style={{ marginBottom: '20px', padding: '12px', background: '#f0f4f8', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            💡 Pause steps allow users to temporarily pause their subscription without canceling.
          </div>
        </div>
      )}

      {step.type === 'support' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
            Support Contact (Optional)
          </label>
          <input
            type="text"
            value={step.config?.contact || ''}
            onChange={(e) => onChange({ config: { ...step.config, contact: e.target.value } })}
            placeholder="e.g., support@example.com or +1-800-123-4567"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Leave blank to use default support contact
          </div>
        </div>
      )}

      {step.type === 'feedback' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
            Feedback Type
          </label>
          <select
            value={step.config?.feedbackType || 'general'}
            onChange={(e) => onChange({ config: { ...step.config, feedbackType: e.target.value } })}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          >
            <option value="general">General Feedback</option>
            <option value="pricing">Pricing</option>
            <option value="features">Missing Features</option>
            <option value="performance">Performance Issues</option>
            <option value="other">Other</option>
          </select>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            This helps categorize the feedback for analysis
          </div>
        </div>
      )}
    </div>
  );
}

// Flow Preview Component
interface FlowPreviewProps {
  steps: FlowStep[];
}

function FlowPreview({ steps }: FlowPreviewProps) {
  if (steps.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>
        Add steps to see preview
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '8px', 
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#003A78', marginBottom: '16px', textAlign: 'center' }}>
        Before you go...
      </div>
      {steps.map((step, index) => (
        <div key={index} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: index < steps.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
            {step.title || `Step ${index + 1}`}
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            {step.message || 'No message'}
          </div>
          {step.type === 'discount' && step.config?.percentage && (
            <div style={{ 
              padding: '8px 12px', 
              background: '#e8f5e9', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#1F9D55',
              display: 'inline-block',
            }}>
              {step.config.percentage}% OFF
            </div>
          )}
          {step.type === 'downgrade' && step.config?.plan && (
            <div style={{ 
              padding: '8px 12px', 
              background: '#f0f4f8', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#003A78',
              display: 'inline-block',
            }}>
              Downgrade to {step.config.plan}
            </div>
          )}
          {step.type === 'pause' && (
            <button style={{
              padding: '10px 20px',
              background: '#003A78',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: '8px',
            }}>
              Pause Subscription
            </button>
          )}
          {step.type === 'support' && (
            <button style={{
              padding: '10px 20px',
              background: '#1F9D55',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: '8px',
            }}>
              Contact Support
            </button>
          )}
          {step.type === 'feedback' && (
            <div style={{ marginTop: '12px' }}>
              <textarea
                placeholder="Enter your feedback..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <button style={{
                padding: '8px 16px',
                background: '#003A78',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                marginTop: '8px',
              }}>
                Submit Feedback
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default FlowBuilder;

