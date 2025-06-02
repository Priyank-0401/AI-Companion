import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Download, 
  Trash2,
  Save,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  EyeOff
} from 'lucide-react'

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    // User preferences
    name: 'Alex Johnson',
    email: 'alex@example.com',
    
    // Appearance
    theme: 'dark',
    fontSize: 'medium',
    animations: true,
    
    // Notifications
    chatNotifications: true,
    wellnessReminders: true,
    journalReminders: true,
    emailNotifications: false,
    
    // Privacy
    dataCollection: false,
    shareUsageData: false,
    
    // Audio
    soundEffects: true,
    volume: 70,
    
    // AI Settings
    aiModel: 'llama3',
    responseLength: 'medium',
    conversationStyle: 'supportive'
  })

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = () => {
    // Here you would save settings to backend/localStorage
    console.log('Saving settings:', settings)
    // Show success message
  }

  const handleExportData = () => {
    const data = {
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-companion-data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDeleteData = () => {
    if (window.confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      // Handle data deletion
      console.log('Deleting user data')
    }
  }

  const settingSections = [
    {
      title: 'Profile',
      icon: User,
      settings: [
        {
          type: 'input',
          key: 'name',
          label: 'Display Name',
          value: settings.name
        },
        {
          type: 'input',
          key: 'email',
          label: 'Email Address',
          value: settings.email,
          inputType: 'email'
        }
      ]
    },
    {
      title: 'Appearance',
      icon: Palette,
      settings: [
        {
          type: 'select',
          key: 'theme',
          label: 'Theme',
          value: settings.theme,
          options: [
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'auto', label: 'Auto' }
          ]
        },
        {
          type: 'select',
          key: 'fontSize',
          label: 'Font Size',
          value: settings.fontSize,
          options: [
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' }
          ]
        },
        {
          type: 'toggle',
          key: 'animations',
          label: 'Enable Animations',
          value: settings.animations
        }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      settings: [
        {
          type: 'toggle',
          key: 'chatNotifications',
          label: 'Chat Notifications',
          value: settings.chatNotifications
        },
        {
          type: 'toggle',
          key: 'wellnessReminders',
          label: 'Wellness Reminders',
          value: settings.wellnessReminders
        },
        {
          type: 'toggle',
          key: 'journalReminders',
          label: 'Journal Reminders',
          value: settings.journalReminders
        },
        {
          type: 'toggle',
          key: 'emailNotifications',
          label: 'Email Notifications',
          value: settings.emailNotifications
        }
      ]
    },
    {
      title: 'AI Assistant',
      icon: Settings,
      settings: [
        {
          type: 'select',
          key: 'aiModel',
          label: 'AI Model',
          value: settings.aiModel,
          options: [
            { value: 'llama3', label: 'Llama 3 (Recommended)' },
            { value: 'llama2', label: 'Llama 2' },
            { value: 'codellama', label: 'Code Llama' }
          ]
        },
        {
          type: 'select',
          key: 'responseLength',
          label: 'Response Length',
          value: settings.responseLength,
          options: [
            { value: 'short', label: 'Short' },
            { value: 'medium', label: 'Medium' },
            { value: 'long', label: 'Long' }
          ]
        },
        {
          type: 'select',
          key: 'conversationStyle',
          label: 'Conversation Style',
          value: settings.conversationStyle,
          options: [
            { value: 'supportive', label: 'Supportive' },
            { value: 'analytical', label: 'Analytical' },
            { value: 'casual', label: 'Casual' },
            { value: 'professional', label: 'Professional' }
          ]
        }
      ]
    },
    {
      title: 'Audio',
      icon: Volume2,
      settings: [
        {
          type: 'toggle',
          key: 'soundEffects',
          label: 'Sound Effects',
          value: settings.soundEffects
        },
        {
          type: 'range',
          key: 'volume',
          label: 'Volume',
          value: settings.volume,
          min: 0,
          max: 100
        }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      settings: [
        {
          type: 'toggle',
          key: 'dataCollection',
          label: 'Anonymous Data Collection',
          value: settings.dataCollection,
          description: 'Help improve the app by sharing anonymous usage data'
        },
        {
          type: 'toggle',
          key: 'shareUsageData',
          label: 'Share Usage Analytics',
          value: settings.shareUsageData,
          description: 'Share anonymized usage patterns to help improve features'
        }
      ]
    }
  ]

  const renderSetting = (setting) => {
    switch (setting.type) {
      case 'input':
        return (
          <input
            type={setting.inputType || 'text'}
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="input-field"
          />
        )
      
      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="input-field"
          >
            {setting.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'toggle':
        return (
          <button
            onClick={() => handleSettingChange(setting.key, !setting.value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              setting.value ? 'bg-accent' : 'bg-mediumDark/50'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                setting.value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        )
      
      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={setting.min}
              max={setting.max}
              value={setting.value}
              onChange={(e) => handleSettingChange(setting.key, parseInt(e.target.value))}
              className="w-full h-2 bg-mediumDark rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="text-right text-sm text-lightText/70">{setting.value}%</div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light to-background-dark text-text-light p-4 sm:p-6 md:p-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mb-10 text-center"
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-primary-accent mb-3">
          Customize Your Seriva Companion
        </h1>
        <p className="text-lg sm:text-xl text-text-light/90">
          Tailor your experience to best suit your needs and preferences.
        </p>
      </motion.header>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingSections.map((section, sectionIndex) => {
          const Icon = section.icon
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
              className="card"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold text-primary-accent mb-2">{section.title}</h2>
              </div>

              <div className="space-y-6">
                {section.settings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <label className="block text-sm font-medium mb-1">
                        {setting.label}
                      </label>
                      {setting.description && (
                        <p className="text-xs text-lightText/60">{setting.description}</p>
                      )}
                    </div>
                    <div className="w-48">
                      {renderSetting(setting)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
              <Download className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-2xl font-semibold text-primary-accent mb-2">Data Management</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Export Your Data</h3>
                <p className="text-sm text-lightText/70">
                  Download a copy of your conversation history and settings.
                </p>
              </div>
              <button onClick={handleExportData} className="btn-secondary">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Delete All Data</h3>
                <p className="text-sm text-lightText/70">
                  Permanently delete all your data from our servers
                </p>
              </div>
              <button 
                onClick={handleDeleteData} 
                className="btn-secondary hover:bg-red-500/20 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex justify-end"
        >
          <button onClick={handleSaveSettings} className="btn-primary">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
        </motion.div>
      </div>

      {/* Custom Styles for Range Slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #00ADB5;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #00ADB5;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}

export default SettingsPage
