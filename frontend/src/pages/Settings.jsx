import React, { useState, useEffect } from 'react';
import { Save, Bell, Moon, Sun, Globe, Shield, Database, RefreshCw } from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState({
        theme: 'light',
        currency: 'INR',
        notifications: true,
        autoBackup: false,
        dataRetention: '5'
    });

    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('fintech_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        localStorage.setItem('fintech_settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
                    <p className="text-slate-500">Manage application preferences and configurations</p>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Settings */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
                        <Moon className="w-5 h-5 mr-2 text-indigo-500" />
                        Appearance
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleChange('theme', 'light')}
                                    className={`flex items-center justify-center p-3 rounded-lg border ${settings.theme === 'light' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <Sun className="w-4 h-4 mr-2" /> Light
                                </button>
                                <button
                                    onClick={() => handleChange('theme', 'dark')}
                                    className={`flex items-center justify-center p-3 rounded-lg border ${settings.theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <Moon className="w-4 h-4 mr-2" /> Dark
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Regional Settings */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
                        <Globe className="w-5 h-5 mr-2 text-emerald-500" />
                        Regional
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Display Currency</label>
                            <select
                                value={settings.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="INR">Indian Rupee (INR)</option>
                                <option value="USD">US Dollar (USD)</option>
                                <option value="EUR">Euro (EUR)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
                        <Bell className="w-5 h-5 mr-2 text-amber-500" />
                        Notifications
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-800">Enable Alerts</p>
                                <p className="text-sm text-slate-500">Receive anomaly detection alerts</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notifications}
                                    onChange={(e) => handleChange('notifications', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
                        <Database className="w-5 h-5 mr-2 text-blue-500" />
                        Data Management
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-800">Auto-Backup</p>
                                <p className="text-sm text-slate-500">Daily database backups</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.autoBackup}
                                    onChange={(e) => handleChange('autoBackup', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Retention (Years)</label>
                            <select
                                value={settings.dataRetention}
                                onChange={(e) => handleChange('dataRetention', e.target.value)}
                                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="1">1 Year</option>
                                <option value="3">3 Years</option>
                                <option value="5">5 Years</option>
                                <option value="10">10 Years</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start">
                <Shield className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-indigo-800">
                    <p className="font-bold mb-1">Admin Mode Active</p>
                    <p>Settings changes are applied globally. Some changes may require a server restart to take effect.</p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
