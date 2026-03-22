// src/pages/SparePartsManagement.jsx
import { useState } from 'react';
import { FiPackage, FiUpload, FiMapPin, FiPrinter, FiSettings } from 'react-icons/fi';
import SparePartsMVP from './SparePartsMVP';
import DismantlingImport from '@/components/spare-parts/DismantlingImport';
import ShelfManager from '@/components/spare-parts/ShelfManager';
import LabelPrinter from '@/components/spare-parts/LabelPrinter';
import WarehouseMap from '@/components/spare-parts/WarehouseMap';

const SparePartsManagement = () => {
  const [activeTab, setActiveTab] = useState('parts');

  const tabs = [
    { id: 'parts', label: 'Ricambi', icon: FiPackage, component: SparePartsMVP },
    { id: 'import', label: 'Import Distinte', icon: FiUpload, component: DismantlingImport },
    { id: 'shelves', label: 'Scaffali', icon: FiMapPin, component: ShelfManager },
    { id: 'labels', label: 'Stampa Etichette', icon: FiPrinter, component: LabelPrinter },
    { id: 'warehouse', label: 'Mappa Magazzino', icon: FiSettings, component: WarehouseMap }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Gestione Ricambi</h1>
          <p className="text-xs text-slate-500 mt-0.5">Ricambi, distinte smontaggio e magazzino</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044]">
        <div className="px-3">
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default SparePartsManagement;
