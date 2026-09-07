import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { 
  X, 
  Terminal, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Flame
} from 'lucide-react';
import { SIMULATION_PRESETS } from '../../data/mockData';

export const SimulatorModal: React.FC = () => {
  const { 
    isSimulatorOpen, 
    setIsSimulatorOpen, 
    simulateToolCall, 
    setSelectedEvent,
    agents 
  } = useSecurity();

  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [toolName, setToolName] = useState(SIMULATION_PRESETS[0].tool_name);
  const [agentId, setAgentId] = useState(SIMULATION_PRESETS[0].agent_id);
  const [paramsJson, setParamsJson] = useState(
    JSON.stringify(SIMULATION_PRESETS[0].parameters, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isSimulatorOpen) return null;

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = SIMULATION_PRESETS[index];
    setToolName(preset.tool_name);
    setAgentId(preset.agent_id);
    setParamsJson(JSON.stringify(preset.parameters, null, 2));
    setJsonError(null);
  };

  const handleRun = async () => {
    try {
      setJsonError(null);
      const parsedParams = JSON.parse(paramsJson);
      setIsProcessing(true);

      const event = await simulateToolCall(toolName, parsedParams, agentId);

      setIsProcessing(false);
      setIsSimulatorOpen(false);

      if (event.risk_level === 'RED' || event.decision === 'PENDING_APPROVAL') {
        setTimeout(() => {
          setSelectedEvent(event);
        }, 200);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setJsonError(`Invalid JSON syntax: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsSimulatorOpen(false)}
      />

      <div
        className="relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] fade-in"
        style={{ background: '#161618', border: '1px solid #2a2a2e' }}
      >
        {/* Header */}
        <div
          className="p-5 flex items-center justify-between"
          style={{ background: '#1a1a1c', borderBottom: '1px solid #2a2a2e' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#f0f0f1' }}>
                Simulate Agent Tool Call
              </h2>
              <p className="text-xs" style={{ color: '#888890' }}>
                Evaluate an untrusted agent payload through the zero-trust gateway.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSimulatorOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
            style={{ background: '#222225' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Presets Grid */}
          <div className="space-y-2">
            <label className="text-xs font-medium block" style={{ color: '#888890' }}>
              Test Scenarios
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SIMULATION_PRESETS.map((preset, idx) => {
                const isSelected = selectedPresetIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(idx)}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      background: isSelected ? 'rgba(99,102,241,0.08)' : '#1a1a1c',
                      border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : '#2a2a2e'}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs" style={{ color: isSelected ? '#a5b4fc' : '#f0f0f1' }}>
                        {preset.label}
                      </span>
                      {preset.label.includes('Green') ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : preset.label.includes('Amber') ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : preset.label.includes('Injection') ? (
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] line-clamp-2 leading-relaxed" style={{ color: '#888890' }}>
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tool Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium block" style={{ color: '#888890' }}>
                Tool Name
              </label>
              <input
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="e.g. drop_database_table or read_file"
                className="w-full px-3 py-2 rounded-lg mono text-xs outline-none transition-colors"
                style={{ background: '#111113', color: '#f0f0f1', border: '1px solid #2a2a2e' }}
              />
            </div>

            {/* Agent ID */}
            <div className="space-y-1">
              <label className="text-xs font-medium block" style={{ color: '#888890' }}>
                Agent Identity
              </label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg mono text-xs outline-none cursor-pointer"
                style={{ background: '#111113', color: '#f0f0f1', border: '1px solid #2a2a2e' }}
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* JSON Parameters Editor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium block" style={{ color: '#888890' }}>
                Tool Parameters (JSON)
              </label>
              <span className="text-[10px]" style={{ color: '#555560' }}>
                Validated against gateway schemas
              </span>
            </div>
            <textarea
              rows={6}
              value={paramsJson}
              onChange={(e) => {
                setParamsJson(e.target.value);
                setJsonError(null);
              }}
              className="w-full p-3 rounded-lg mono text-xs outline-none leading-relaxed"
              style={{ background: '#111113', color: '#86efac', border: '1px solid #2a2a2e' }}
            />
            {jsonError && (
              <p className="text-xs font-medium" style={{ color: '#f87171' }}>{jsonError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-5 flex items-center justify-between"
          style={{ background: '#1a1a1c', borderTop: '1px solid #2a2a2e' }}
        >
          <div className="text-[11px] flex items-center gap-2" style={{ color: '#888890' }}>
            <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: '#22c55e' }} />
            <span>Zero-Trust Interceptor active</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSimulatorOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: '#222225', color: '#888890', border: '1px solid #2a2a2e' }}
            >
              Cancel
            </button>
            <button
              disabled={isProcessing}
              onClick={handleRun}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              style={{ background: '#6366f1', color: '#ffffff' }}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isProcessing ? 'Evaluating…' : 'Simulate Call'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
