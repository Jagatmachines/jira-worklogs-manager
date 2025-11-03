import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import type { JiraAccount, Settings } from '../types/jira';
import { randomUUID } from '../utils/uuid';
import { useForm } from 'react-hook-form';

interface AccountFormData {
  jiraSubdomain: string;
  email: string;
  jiraToken: string;
  squaderySquadId: string;
  squaderyToken: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  setSettings: (value: Settings) => void;
  activeAccount: JiraAccount | undefined;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState<Settings | null>(settings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings, isOpen]);


  const { register, handleSubmit, formState: { errors }, setValue } = useForm<AccountFormData>({
    mode: 'onChange'
  });

  const handleGlobalSettingChange = (field: keyof Settings, value: Settings[keyof Settings]) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, [field]: value });
  };

  const handleAddAccount = () => {
    if (!localSettings) return;
    const newAccount: JiraAccount = {
      id: randomUUID(),
      jiraSubdomain: '',
      email: '',
      jiraToken: '',
      squaderySquadId: '',
      squaderyToken: '',
    };
    const newSettings = {
      ...localSettings,
      accounts: [...localSettings.accounts, newAccount],
      activeAccount: newAccount.id,
    };
    setLocalSettings(newSettings);
  };

  const handleRemoveAccount = () => {
    if (!localSettings?.activeAccount || localSettings.accounts.length <= 1) return;
    const newAccounts = localSettings.accounts.filter((acc) => acc.id !== localSettings.activeAccount);
    const newActiveAccount = newAccounts[0]?.id || '';
    setLocalSettings({ ...localSettings, accounts: newAccounts, activeAccount: newActiveAccount });
  };

  const selectedAccount = localSettings?.accounts.find((acc) => acc.id === localSettings.activeAccount);

  const onSubmit = (data: AccountFormData) => {
    if (!localSettings || !selectedAccount) return;
    const newAccounts = localSettings.accounts.map((acc) => 
      acc.id === localSettings.activeAccount 
        ? { ...acc, ...data }
        : acc
    );
    const updatedSettings = {
      ...localSettings,
      accounts: newAccounts,
    };
    setLocalSettings(updatedSettings);
    setSettings(updatedSettings);
  };

  useEffect(() => {
    if (selectedAccount) {
      setValue('jiraSubdomain', selectedAccount.jiraSubdomain);
      setValue('email', selectedAccount.email);
      setValue('jiraToken', selectedAccount.jiraToken);
      setValue('squaderySquadId', selectedAccount.squaderySquadId || '');
      setValue('squaderyToken', selectedAccount.squaderyToken || '');
    }
  }, [selectedAccount, setValue]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-4">
        <div className={`flex flex-wrap gap-2 mb-4 ${selectedAccount ? 'border-b pb-4' : ''} dark:border-gray-700`}>
          {localSettings?.accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => handleGlobalSettingChange('activeAccount', acc.id)}
              className={`px-3 py-1 text-sm rounded-md ${localSettings.activeAccount === acc.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
            >
              {acc.jiraSubdomain || 'New Account'}
            </button>
          ))}
          <button onClick={handleAddAccount} className="px-3 py-1 text-sm rounded-md bg-green-500 text-white hover:bg-green-600">
            +
          </button>
        </div>
        {selectedAccount && (
          <form id="accountForm" onSubmit={handleSubmit((data) => {
            if (localSettings) {
              onSubmit(data);
              onClose();
            }
          })} className="space-y-4">
            <div>
              <label htmlFor="jiraSubdomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Jira Subdomain
              </label>
              <input
                id="jiraSubdomain"
                type="text"
                {...register('jiraSubdomain', {
                  required: 'Subdomain is required',
                  validate: {
                    noHttp: (value) => 
                      !/(https?:\/\/)/.test(value) || 'Should not include http or https',
                    noAtlassianNet: (value) => 
                      !/(atlassian|\.net)/.test(value) || 'Should not include atlassian or .net',
                    noUrl: (value) => 
                      !/[./]/.test(value) || 'Should not be in URL format',
                    lowercase: (value) => 
                      value === value.toLowerCase() || 'Should be in lowercase',
                    format: (value) => 
                      /^[a-z0-9-_]+$/.test(value) || 'Can only contain lowercase letters, numbers, hyphens and underscores'
                  }
                })}
                className={`mt-1 block w-full p-2 border rounded-md bg-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 ${
                  errors.jiraSubdomain ? 'border-red-500 dark:border-red-500' : ''
                }`}
                placeholder="Enter your subdomain (e.g., my-company)"
              />
              {errors.jiraSubdomain && (
                <p className="mt-1 text-sm text-red-500">{errors.jiraSubdomain.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className={`mt-1 block w-full p-2 border rounded-md bg-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 ${
                  errors.email ? 'border-red-500 dark:border-red-500' : ''
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="jiraToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Jira API Token
              </label>
              <input
                id="jiraToken"
                type="password"
                {...register('jiraToken', {
                  required: 'API Token is required',
                  minLength: {
                    value: 6,
                    message: 'API Token must be at least 6 characters'
                  }
                })}
                className={`mt-1 block w-full p-2 border rounded-md bg-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 ${
                  errors.jiraToken ? 'border-red-500 dark:border-red-500' : ''
                }`}
              />
              {errors.jiraToken && (
                <p className="mt-1 text-sm text-red-500">{errors.jiraToken.message}</p>
              )}
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline mt-1 inline-block"
              >
                How to create an API token
              </a>
            </div>

            <div>
              <label htmlFor="squaderySquadId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Squadery Squad ID (after you press Add work in Squadery, you will see https://connect.squadery.com/#/add-worklogs/`squadery-squad-id`)
              </label>
              <input
                id="squaderySquadId"
                type="text"
                {...register('squaderySquadId', {
                  validate: {
                    alphanumeric: (value) => 
                      !value || /^[a-zA-Z0-9]*$/.test(value) || 'Squad ID must contain only letters and numbers'
                  }
                })}
                className={`mt-1 block w-full p-2 border rounded-md bg-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 ${
                  errors.squaderySquadId ? 'border-red-500 dark:border-red-500' : ''
                }`}
                placeholder="Enter your Squadery Squad ID"
              />
              {errors.squaderySquadId && (
                <p className="mt-1 text-sm text-red-500">{errors.squaderySquadId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="squaderyToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Squadery Bearer token (from the network tab in the browser console via graphql api - please get the token and change it everyday, since it expires within few hrs)
              </label>
              <input
                id="squaderyToken"
                type="password"
                {...register('squaderyToken', {
                  minLength: {
                    value: 6,
                    message: 'Bearer Token must be at least 6 characters'
                  }
                })}
                className={`mt-1 block w-full p-2 border rounded-md bg-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 ${
                  errors.squaderyToken ? 'border-red-500 dark:border-red-500' : ''
                }`}
                placeholder="Enter your Squadery Bearer Token"
              />
              {errors.squaderyToken && (
                <p className="mt-1 text-sm text-red-500">{errors.squaderyToken.message}</p>
              )}
            </div>

          </form>
        )}
        <div className="border-t pt-4 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Display each item on a new line</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <span className="sr-only">Toggle display on new line</span>
              <input
                type="checkbox"
                checked={localSettings?.displayOnNewLine || false}
                onChange={(e) => handleGlobalSettingChange('displayOnNewLine', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Floating Header</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <span className="sr-only">Toggle floating header</span>
              <input
                type="checkbox"
                checked={!localSettings?.isHeaderNonFloating || false}
                onChange={(e) => handleGlobalSettingChange('isHeaderNonFloating', !e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
            <div className="flex items-center gap-2">
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleGlobalSettingChange('theme', theme)}
                  className={`px-3 py-1 text-sm rounded-md ${localSettings?.theme === theme ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-between pt-4">
          {localSettings && localSettings.accounts.length > 1 && (
            <button onClick={handleRemoveAccount} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded whitespace-pre">
              Remove Account
            </button>
          )}
          <div className="flex justify-end gap-2 w-full">
            <button 
              type="submit"
              form="accountForm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={Object.keys(errors).length > 0}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
