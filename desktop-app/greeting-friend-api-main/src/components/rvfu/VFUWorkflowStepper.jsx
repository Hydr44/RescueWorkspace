import React from 'react';
import { FiCheck, FiCircle } from 'react-icons/fi';
import { getWorkflowSteps, getStatoBadgeColor } from '@/lib/vfu-state-machine';

const VFUWorkflowStepper = ({ statoCorrente }) => {
  const steps = getWorkflowSteps(statoCorrente);

  return (
    <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044] p-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Workflow VFU</h3>
      
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-700">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ 
              width: `${steps.filter(s => s.isCompleted).length / (steps.length - 1) * 100}%` 
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, idx) => {
            const color = getStatoBadgeColor(step.stato);
            let bgColor = 'bg-gray-700';
            let textColor = 'text-gray-400';
            let ringColor = 'ring-gray-600';

            if (step.isCompleted) {
              bgColor = 'bg-green-600';
              textColor = 'text-white';
              ringColor = 'ring-green-500';
            } else if (step.isCurrent) {
              bgColor = `bg-${color}-600`;
              textColor = 'text-white';
              ringColor = `ring-${color}-500`;
            }

            return (
              <div key={step.stato} className="flex flex-col items-center relative z-10">
                {/* Circle */}
                <div 
                  className={`w-10 h-10 rounded-full ${bgColor} ${textColor} flex items-center justify-center ring-4 ${ringColor} ring-opacity-20 transition-all duration-300`}
                >
                  {step.isCompleted ? (
                    <FiCheck className="w-5 h-5" />
                  ) : step.isCurrent ? (
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  ) : (
                    <FiCircle className="w-4 h-4" />
                  )}
                </div>
                
                {/* Label */}
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium ${step.isCurrent ? 'text-white' : 'text-gray-400'}`}>
                    {step.label}
                  </div>
                  {step.isCurrent && (
                    <div className="text-[10px] text-blue-400 mt-0.5">
                      Corrente
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VFUWorkflowStepper;
