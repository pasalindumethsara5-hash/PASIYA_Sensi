import React, { useState } from 'react';
import { Archive, Shield } from 'lucide-react';
import type { PlatformTarget, SensitivityConfig } from '../lib/optimizer';
import { ConfigVaultView } from './ConfigVaultView';
import { SecurityGuardView } from './SecurityGuardView';
import { SlidingSegmentedControl } from './SlidingSegmentedControl';

interface VaultGuardViewProps {
  configs: SensitivityConfig[];
  activeConfig: SensitivityConfig;
  presets: SensitivityConfig[];
  platform: PlatformTarget;
  targetFps: number;
  onLoadConfig: (config: SensitivityConfig) => void;
  onDeleteCustom: (id: string) => void;
  onImportVerifiedConfig: (config: SensitivityConfig) => void;
}

export const VaultGuardView: React.FC<VaultGuardViewProps> = ({
  configs,
  activeConfig,
  presets,
  platform,
  targetFps,
  onLoadConfig,
  onDeleteCustom,
  onImportVerifiedConfig,
}) => {
  const [section, setSection] = useState<'vault' | 'security'>('vault');

  return (
    <div className="space-y-6">
      <SlidingSegmentedControl<'vault' | 'security'>
        ariaLabel="Vault and security sections"
        variant="crimson"
        layout="scrollable"
        className="max-w-full"
        buttonClassName="min-h-[38px] font-bold"
        value={section}
        onChange={setSection}
        options={[
          {
            id: 'vault',
            testId: 'vault-subtab-configs',
            label: (
              <>
                <Archive className="w-3.5 h-3.5" aria-hidden="true" />
                Config Vault &amp; PDF Export
              </>
            ),
          },
          {
            id: 'security',
            testId: 'vault-subtab-security',
            label: (
              <>
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                Security &amp; Tamper Guard
              </>
            ),
          },
        ]}
      />

      <div key={section} className="ios-panel-glide">
        {section === 'vault' ? (
          <ConfigVaultView
            configs={configs}
            activeConfigId={activeConfig.id}
            platform={platform}
            targetFps={targetFps}
            onLoadConfig={onLoadConfig}
            onDeleteCustom={onDeleteCustom}
          />
        ) : (
          <SecurityGuardView
            activeConfig={activeConfig}
            presets={presets}
            onImportVerifiedConfig={onImportVerifiedConfig}
          />
        )}
      </div>
    </div>
  );
};
