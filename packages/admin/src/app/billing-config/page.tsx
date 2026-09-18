'use client'

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  PlusIcon, TrashIcon,
  CogIcon, CurrencyDollarIcon, ClockIcon, GiftIcon,
  BoltIcon, StarIcon, CheckIcon
} from '@heroicons/react/24/outline'

// ============================================
// PRICING UNIT TYPES (Configurable - Add New Anytime)
// ============================================
const PRICING_UNIT_TYPES = [
  { value: 'per_second', label: 'Per Second', unit: 'Second', plural: 'Seconds', secondsPerUnit: 1 },
  { value: 'per_minute', label: 'Per Minute', unit: 'Minute', plural: 'Minutes', secondsPerUnit: 60 },
  { value: 'per_hour', label: 'Per Hour', unit: 'Hour', plural: 'Hours', secondsPerUnit: 3600 },
  { value: 'per_day', label: 'Per Day', unit: 'Day', plural: 'Days', secondsPerUnit: 86400 },
  { value: 'per_week', label: 'Per Week', unit: 'Week', plural: 'Weeks', secondsPerUnit: 604800 },
  { value: 'per_month', label: 'Per Month', unit: 'Month', plural: 'Months', secondsPerUnit: null },
  { value: 'per_year', label: 'Per Year', unit: 'Year', plural: 'Years', secondsPerUnit: null },
  { value: 'per_session', label: 'Per Session', unit: 'Session', plural: 'Sessions', secondsPerUnit: null },
  { value: 'per_question', label: 'Per Question', unit: 'Question', plural: 'Questions', secondsPerUnit: null },
  { value: 'per_message', label: 'Per Message', unit: 'Message', plural: 'Messages', secondsPerUnit: null },
  { value: 'per_document', label: 'Per Document', unit: 'Document', plural: 'Documents', secondsPerUnit: null },
  { value: 'per_project', label: 'Per Project', unit: 'Project', plural: 'Projects', secondsPerUnit: null },
  { value: 'per_consultation', label: 'Per Consultation', unit: 'Consultation', plural: 'Consultations', secondsPerUnit: null },
  { value: 'per_download', label: 'Per Download', unit: 'Download', plural: 'Downloads', secondsPerUnit: null },
  { value: 'per_credit', label: 'Per Credit', unit: 'Credit', plural: 'Credits', secondsPerUnit: null },
  { value: 'per_token', label: 'Per AI Token', unit: 'Token', plural: 'Tokens', secondsPerUnit: null },
  { value: 'per_minute_video', label: 'Per Video Minute', unit: 'Video Minute', plural: 'Video Minutes', secondsPerUnit: 60 },
  { value: 'per_minute_audio', label: 'Per Audio Minute', unit: 'Audio Minute', plural: 'Audio Minutes', secondsPerUnit: 60 },
  { value: 'custom', label: 'Custom Unit', unit: 'Custom', plural: 'Customs', secondsPerUnit: null },
]

// AI Providers (Configurable)
const AI_PROVIDERS = [
  { value: 'standard', label: 'Standard AI (Free/Local)', type: 'free', icon: '🦙' },
  { value: 'openai', label: 'OpenAI (Paid)', type: 'paid', icon: '🤖' },
  { value: 'ai-pro', label: 'AI Pro (Paid)', type: 'paid', icon: '🧠' },
  { value: 'google', label: 'Google Gemini (Paid)', type: 'paid', icon: '✨' },
  { value: 'azure', label: 'Azure OpenAI (Paid)', type: 'paid', icon: '☁️' },
  { value: 'aws', label: 'AWS Bedrock (Paid)', type: 'paid', icon: '📦' },
  { value: 'cohere', label: 'Cohere (Paid)', type: 'paid', icon: '💬' },
  { value: 'local', label: 'Local Model', type: 'free', icon: '🏠' },
  { value: 'custom', label: 'Custom Provider', type: 'custom', icon: '⚙️' },
]

// Offer Types (Configurable)
const OFFER_TYPES = [
  { value: 'coupon', label: 'Coupon Code' },
  { value: 'referral', label: 'Referral Bonus' },
  { value: 'flash_sale', label: 'Flash Sale' },
  { value: 'seasonal', label: 'Seasonal Offer' },
  { value: 'first_booking', label: 'First Booking Discount' },
  { value: 'loyalty', label: 'Loyalty Reward' },
  { value: 'milestone', label: 'Milestone Reward' },
  { value: 'bundle', label: 'Bundle Deal' },
  { value: 'limited_time', label: 'Limited Time Offer' },
  { value: 'subscription_upgrade', label: 'Subscription Upgrade' },
  { value: 'recharge_bonus', label: 'Recharge Bonus' },
  { value: 'custom', label: 'Custom Offer' },
]

// Benefit Types (Configurable)
const BENEFIT_TYPES = [
  { value: 'discount_percent', label: 'Percentage Discount (%)' },
  { value: 'discount_fixed', label: 'Fixed Amount Discount ($)' },
  { value: 'free_units', label: 'Free Units (Minutes, Questions, etc.)' },
  { value: 'bonus_wallet', label: 'Wallet Bonus ($)' },
  { value: 'bonus_credits', label: 'Bonus Credits' },
  { value: 'bonus_loyalty', label: 'Bonus Loyalty Points' },
  { value: 'free_feature', label: 'Free Feature Unlock' },
  { value: 'upgrade_tier', label: 'Tier Upgrade' },
  { value: 'extended_validity', label: 'Extended Validity' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'custom', label: 'Custom Benefit' },
]

// ============================================
// BILLING CONFIGURATION PAGE
// ============================================
export default function BillingConfigPage() {
  const [activeTab, setActiveTab] = useState<'pricing' | 'tiers' | 'promotions' | 'recharge' | 'wallet' | 'rules'>('pricing')
  const [isLoading, setIsLoading] = useState(false)
  const [, setConfigData] = useState<any>(null)

  // Fetch current configuration
  useEffect(() => {
    fetchConfiguration()
  }, [])

  const fetchConfiguration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/billing-config')
      const data = await response.json()
      setConfigData(data)
    } catch (error) {
      console.error('Failed to fetch config:', error)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            <CurrencyDollarIcon className="inline w-8 h-8 mr-2" />
            Billing Configuration
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure all billing options - pricing models, subscription tiers, promotions, wallet, and rules. No hard coding - everything is configurable.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'pricing', label: 'Pricing Models', icon: ClockIcon },
              { id: 'tiers', label: 'Subscription Tiers', icon: StarIcon },
              { id: 'promotions', label: 'Promotions', icon: GiftIcon },
              { id: 'recharge', label: 'Wallet Recharge', icon: CurrencyDollarIcon },
              { id: 'rules', label: 'Billing Rules', icon: CogIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'pricing' && <PricingModelsConfig />}
            {activeTab === 'tiers' && <SubscriptionTiersConfig />}
            {activeTab === 'promotions' && <PromotionsConfig />}
            {activeTab === 'recharge' && <RechargePackagesConfig />}
            {activeTab === 'rules' && <BillingRulesConfig />}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================
// PRICING MODELS CONFIGURATION
// ============================================
function PricingModelsConfig() {
  const { register, control, handleSubmit, watch } = useForm<{ pricingModels: any[] }>({
    defaultValues: {
      pricingModels: [
        {
          name: 'Per Minute',
          slug: 'per_minute',
          unitType: 'per_minute',
          unitName: 'Minute',
          unitPlural: 'Minutes',
          unitSeconds: 60,
          baseRate: 2.50,
          minUnits: 5,
          maxUnits: null,
          minAmount: 0,
          maxAmount: null,
          billingCadence: 'realtime',
          billingInterval: null,
          roundingStrategy: 'round_up',
          thresholdConfig: [{ units: 30, discountPercent: 10 }, { units: 60, discountPercent: 15 }],
          platformFeeType: 'percentage',
          platformFeeValue: 15,
          isActive: true,
        }
      ]
    }
  })

  const { fields: pricingModels, append: addModel, remove: removeModel } = useFieldArray({
    control,
    name: 'pricingModels'
  })

  const onSubmit = async (data: any) => {
    console.log('Saving pricing models:', data)
    // API call to save
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Add New Pricing Model Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Pricing Models</h2>
        <button
          type="button"
          onClick={() => addModel({
            name: 'New Pricing Model',
            slug: '',
            unitType: 'per_minute',
            unitName: 'Minute',
            unitPlural: 'Minutes',
            baseRate: 0,
            minUnits: 1,
            billingCadence: 'postpaid',
            isActive: true,
          })}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Pricing Model
        </button>
      </div>

      {/* Pricing Models List */}
      {pricingModels.map((model, index) => (
        <div key={model.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-md font-medium text-gray-900">Model #{index + 1}</h3>
            <button
              type="button"
              onClick={() => removeModel(index)}
              className="text-red-500 hover:text-red-700"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                {...register(`pricingModels.${index}.name`)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL identifier)</label>
              <input
                {...register(`pricingModels.${index}.slug`)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Unit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Unit Type</label>
              <select
                {...register(`pricingModels.${index}.unitType`)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {PRICING_UNIT_TYPES.map(unit => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>

            {/* Custom Unit Name (for custom unit type) */}
            {watch(`pricingModels.${index}.unitType`) === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Unit Name</label>
                  <input
                    {...register(`pricingModels.${index}.unitName`)}
                    placeholder="e.g., 'Consultation'"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Unit Plural</label>
                  <input
                    {...register(`pricingModels.${index}.unitPlural`)}
                    placeholder="e.g., 'Consultations'"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {/* Seconds per Unit (for time-based) */}
            {watch(`pricingModels.${index}.unitType`)?.includes('minute') ||
             watch(`pricingModels.${index}.unitType`)?.includes('second') ||
             watch(`pricingModels.${index}.unitType`)?.includes('hour') ||
             watch(`pricingModels.${index}.unitType`)?.includes('day') ||
             watch(`pricingModels.${index}.unitType`)?.includes('week') ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seconds per Unit</label>
                <input
                  type="number"
                  {...register(`pricingModels.${index}.unitSeconds`, { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : null}

            {/* Base Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate ($)</label>
              <input
                type="number"
                step="0.01"
                {...register(`pricingModels.${index}.baseRate`, { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                {...register(`pricingModels.${index}.currency`)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="AUD">AUD</option>
              </select>
            </div>

            {/* Min Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Units</label>
              <input
                type="number"
                {...register(`pricingModels.${index}.minUnits`, { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Units (optional)</label>
              <input
                type="number"
                {...register(`pricingModels.${index}.maxUnits`, { valueAsNumber: true })}
                placeholder="Leave empty for unlimited"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Billing Cadence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cadence</label>
              <select
                {...register(`pricingModels.${index}.billingCadence`)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="prepaid">Prepaid (Pay before use)</option>
                <option value="postpaid">Postpaid (Pay after use)</option>
                <option value="realtime">Realtime (Bill during session)</option>
              </select>
            </div>

            {/* Rounding Strategy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rounding Strategy</label>
              <select
                {...register(`pricingModels.${index}.roundingStrategy`)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="round_up">Round Up (favor platform)</option>
                <option value="round_down">Round Down (favor user)</option>
                <option value="exact">Exact (no rounding)</option>
                <option value="round_nearest">Round to Nearest</option>
              </select>
            </div>

            {/* Platform Fee Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee Type</label>
              <select
                {...register(`pricingModels.${index}.platformFeeType`)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
                <option value="tiered">Tiered (varies by amount)</option>
                <option value="hybrid">Hybrid (percentage + fixed)</option>
              </select>
            </div>

            {/* Platform Fee Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee Value</label>
              <input
                type="number"
                step="0.01"
                {...register(`pricingModels.${index}.platformFeeValue`, { valueAsNumber: true })}
                placeholder={watch(`pricingModels.${index}.platformFeeType`) === 'percentage' ? 'e.g., 15 for 15%' : 'e.g., 5.00 for $5'}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Threshold Config (Volume Discounts) */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume/Threshold Discounts
                <span className="text-gray-500 text-xs ml-2">(Discount after certain units purchased)</span>
              </label>
              <ThresholdConfigInput control={control} index={index} />
            </div>

            {/* Active Status */}
            <div className="col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register(`pricingModels.${index}.isActive`)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>
      ))}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <CheckIcon className="w-5 h-5 mr-2" />
          Save Pricing Models
        </button>
      </div>
    </form>
  )
}

// ============================================
// SUBSCRIPTION TIERS CONFIGURATION (with AI Provider Settings)
// ============================================
function SubscriptionTiersConfig() {
  const { register, control, handleSubmit, watch } = useForm<{ tiers: any[] }>({
    defaultValues: {
      tiers: [
        {
          name: 'Free',
          slug: 'free',
          tierLevel: 0,
          tierColor: '#808080',
          pricingOptions: [{ unit: 'forever', price: 0 }],
          features: {},
          limits: {},
          aiConfig: {
            enabled: true,
            provider: 'standard',
            modelId: 'standard',
            apiEndpoint: 'http://localhost:11434',
            maxTokens: 512,
            requestsPerMinute: 10,
          },
          perks: [],
          isActive: true,
        }
      ]
    }
  })

  const { fields: tiers, append: addTier, remove: removeTier } = useFieldArray({
    control,
    name: 'tiers'
  })

  return (
    <form onSubmit={handleSubmit(data => console.log('Save tiers:', data))} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Subscription Tiers</h2>
        <button
          type="button"
          onClick={() => addTier({
            name: 'New Tier',
            slug: '',
            tierLevel: tiers.length,
            tierColor: '#3B82F6',
            pricingOptions: [{ unit: 'month', price: 0 }],
            aiConfig: { enabled: false, provider: 'standard', modelId: '', maxTokens: 1024 },
            isActive: true,
          })}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Tier
        </button>
      </div>

      {tiers.map((tier, index) => (
        <div key={tier.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Tier Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: watch(`tiers.${index}.tierColor`) || '#808080' }}
              />
              <h3 className="text-md font-medium text-gray-900">
                Tier Level {watch(`tiers.${index}.tierLevel`) || index} - {watch(`tiers.${index}.name`)}
              </h3>
            </div>
            <button onClick={() => removeTier(index)} className="text-red-500 hover:text-red-700">
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Tier Configuration */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
                <input {...register(`tiers.${index}.name`)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input {...register(`tiers.${index}.slug`)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier Level</label>
                <input
                  type="number"
                  {...register(`tiers.${index}.tierLevel`, { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier Color (hex)</label>
                <input
                  type="color"
                  {...register(`tiers.${index}.tierColor`)}
                  className="w-full h-10 border rounded-lg cursor-pointer"
                />
              </div>

              {/* Pricing Options Section */}
              <div className="col-span-2 border rounded-lg p-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Pricing Options (Multiple pricing per tier)</h4>
                <PricingOptionsInput control={control} index={index} />
              </div>

              {/* AI Configuration Section */}
              <div className="col-span-2 border rounded-lg p-4 mt-4 bg-blue-50">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <BoltIcon className="w-5 h-5 mr-2 text-blue-500" />
                  AI Provider Settings for this Tier
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Enabled */}
                  <div className="col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register(`tiers.${index}.aiConfig.enabled`)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">AI Enabled for this tier</span>
                    </label>
                  </div>

                  {/* Provider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
                    <select
                      {...register(`tiers.${index}.aiConfig.provider`)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {AI_PROVIDERS.map(p => (
                        <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name/ID</label>
                    <input
                      {...register(`tiers.${index}.aiConfig.modelId`)}
                      placeholder="e.g., standard"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  {/* API Endpoint (for custom/local) */}
                  {watch(`tiers.${index}.aiConfig.provider`) === 'standard' ||
                   watch(`tiers.${index}.aiConfig.provider`) === 'local' ||
                   watch(`tiers.${index}.aiConfig.provider`) === 'custom' ? (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint URL</label>
                      <input
                        {...register(`tiers.${index}.aiConfig.apiEndpoint`)}
                        placeholder="http://localhost:11434"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  ) : null}

                  {/* Max Tokens */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Tokens
                      <span className="text-xs text-gray-500 ml-2">Higher = longer responses (more cost)</span>
                    </label>
                    <input
                      type="number"
                      {...register(`tiers.${index}.aiConfig.maxTokens`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (0-1)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      {...register(`tiers.${index}.aiConfig.temperature`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  {/* Requests per Minute */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requests per Minute</label>
                    <input
                      type="number"
                      {...register(`tiers.${index}.aiConfig.requestsPerMinute`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  {/* Tokens per Minute */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tokens per Minute</label>
                    <input
                      type="number"
                      {...register(`tiers.${index}.aiConfig.tokensPerMinute`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  {/* Fallback Provider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fallback Provider (optional)</label>
                    <select
                      {...register(`tiers.${index}.aiConfig.fallbackProvider`)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">No Fallback</option>
                      {AI_PROVIDERS.map(p => (
                        <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fallback Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fallback Model</label>
                    <input
                      {...register(`tiers.${index}.aiConfig.fallbackModelId`)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="col-span-2 border rounded-lg p-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Features Available</h4>
                <FeaturesConfigInput control={control} index={index} />
              </div>

              {/* Limits Section */}
              <div className="col-span-2 border rounded-lg p-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Usage Limits</h4>
                <LimitsConfigInput control={control} index={index} />
              </div>

              {/* Perks Section */}
              <div className="col-span-2 border rounded-lg p-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Perks/Benefits</h4>
                <PerksConfigInput control={control} index={index} />
              </div>

              {/* Active */}
              <div className="col-span-2">
                <label className="flex items-center">
                  <input type="checkbox" {...register(`tiers.${index}.isActive`)} className="rounded border-gray-300 text-blue-600" />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Save */}
      <div className="flex justify-end">
        <button type="submit" className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <CheckIcon className="w-5 h-5 mr-2" />
          Save Subscription Tiers
        </button>
      </div>
    </form>
  )
}

// ============================================
// PROMOTIONS CONFIGURATION
// ============================================
function PromotionsConfig() {
  const { register, control, handleSubmit, watch } = useForm<{ promotions: any[] }>({
    defaultValues: {
      promotions: []
    }
  })

  const { fields: promotions, append: addPromo, remove: removePromo } = useFieldArray({
    control,
    name: 'promotions'
  })

  return (
    <form onSubmit={handleSubmit(data => console.log('Save promotions:', data))} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Promotional Offers</h2>
        <button
          type="button"
          onClick={() => addPromo({
            name: 'New Promotion',
            code: '',
            offerType: 'coupon',
            benefitType: 'discount_percent',
            benefitValue: 0,
            appliesToBooking: true,
            isActive: true,
          })}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Promotion
        </button>
      </div>

      {promotions.map((promo, index) => (
        <div key={promo.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-md font-medium text-gray-900">{watch(`promotions.${index}.name`) || `Promotion #${index + 1}`}</h3>
            <button onClick={() => removePromo(index)} className="text-red-500">
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Name</label>
              <input {...register(`promotions.${index}.name`)} className="w-full px-3 py-2 border rounded-lg" />
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
              <input {...register(`promotions.${index}.code`)} placeholder="e.g., SAVE20" className="w-full px-3 py-2 border rounded-lg uppercase" />
            </div>

            {/* Offer Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offer Type</label>
              <select {...register(`promotions.${index}.offerType`)} className="w-full px-3 py-2 border rounded-lg">
                {OFFER_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Benefit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benefit Type</label>
              <select {...register(`promotions.${index}.benefitType`)} className="w-full px-3 py-2 border rounded-lg">
                {BENEFIT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Benefit Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benefit Value</label>
              <input
                type="number"
                step="0.01"
                {...register(`promotions.${index}.benefitValue`, { valueAsNumber: true })}
                placeholder={watch(`promotions.${index}.benefitType`)?.includes('percent') ? 'e.g., 20 for 20%' : 'e.g., 25.00'}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Free Units Config (for free_units benefit type) */}
            {watch(`promotions.${index}.benefitType`) === 'free_units' && (
              <div className="col-span-2 border rounded-lg p-4 bg-yellow-50">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Free Units Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Unit Type</label>
                    <select {...register(`promotions.${index}.benefitConfig.unitType`)} className="w-full px-3 py-2 border rounded-lg">
                      {PRICING_UNIT_TYPES.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Number of Free Units</label>
                    <input
                      type="number"
                      {...register(`promotions.${index}.benefitConfig.freeUnits`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Validity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <input type="datetime-local" {...register(`promotions.${index}.validFrom`)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input type="datetime-local" {...register(`promotions.${index}.validUntil`)} className="w-full px-3 py-2 border rounded-lg" />
            </div>

            {/* Usage Limits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
              <input
                type="number"
                {...register(`promotions.${index}.totalLimit`, { valueAsNumber: true })}
                placeholder="Leave empty for unlimited"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
              <input
                type="number"
                {...register(`promotions.${index}.perUserLimit`, { valueAsNumber: true })}
                defaultValue={1}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Purchase ($)</label>
              <input
                type="number"
                step="0.01"
                {...register(`promotions.${index}.minPurchase`, { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Discount ($)</label>
              <input
                type="number"
                step="0.01"
                {...register(`promotions.${index}.maxDiscount`, { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Applicability */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Applies To</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input type="checkbox" {...register(`promotions.${index}.appliesToBooking`)} className="rounded border-gray-300" />
                  <span className="ml-2 text-sm">Bookings</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" {...register(`promotions.${index}.appliesToSubscription`)} className="rounded border-gray-300" />
                  <span className="ml-2 text-sm">Subscriptions</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" {...register(`promotions.${index}.appliesToRecharge`)} className="rounded border-gray-300" />
                  <span className="ml-2 text-sm">Wallet Recharge</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" {...register(`promotions.${index}.appliesToContent`)} className="rounded border-gray-300" />
                  <span className="ml-2 text-sm">Content</span>
                </label>
              </div>
            </div>

            {/* First Time Only */}
            <div className="col-span-2">
              <label className="flex items-center">
                <input type="checkbox" {...register(`promotions.${index}.firstTimeOnly`)} className="rounded border-gray-300" />
                <span className="ml-2 text-sm">First-time users only</span>
              </label>
            </div>

            {/* Auto Apply */}
            <div className="col-span-2">
              <label className="flex items-center">
                <input type="checkbox" {...register(`promotions.${index}.autoApply`)} className="rounded border-gray-300" />
                <span className="ml-2 text-sm">Auto-apply (no code required)</span>
              </label>
            </div>

            {/* Active */}
            <div className="col-span-2">
              <label className="flex items-center">
                <input type="checkbox" {...register(`promotions.${index}.isActive`)} className="rounded border-gray-300 text-blue-600" />
                <span className="ml-2 text-sm">Active</span>
              </label>
            </div>
          </div>
        </div>
      ))}

      {/* Save */}
      <div className="flex justify-end">
        <button type="submit" className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <CheckIcon className="w-5 h-5 mr-2" />
          Save Promotions
        </button>
      </div>
    </form>
  )
}

// ============================================
// RECHARGE PACKAGES CONFIGURATION
// ============================================
function RechargePackagesConfig() {
  const { register, control, handleSubmit, watch } = useForm<{ packages: any[] }>({
    defaultValues: {
      packages: [
        { name: 'Basic Recharge', amount: 25, bonusPercent: 0, price: 25 },
        { name: 'Standard Recharge', amount: 50, bonusPercent: 10, price: 50, isPopular: true },
        { name: 'Value Recharge', amount: 100, bonusPercent: 20, price: 100 },
      ]
    }
  })

  const { fields: packages, append, remove } = useFieldArray({ control, name: 'packages' })

  return (
    <form onSubmit={handleSubmit(data => console.log('Save packages:', data))} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Wallet Recharge Packages</h2>
        <button onClick={() => append({ name: 'New Package', amount: 0, bonusPercent: 0, price: 0 })} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Package
        </button>
      </div>

      {packages.map((pkg, index) => (
        <div key={pkg.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-medium">{watch(`packages.${index}.name`)}</h3>
            <button onClick={() => remove(index)} className="text-red-500"><TrashIcon className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
              <input {...register(`packages.${index}.name`)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input type="number" step="1" {...register(`packages.${index}.amount`, { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Percent (%)</label>
              <input type="number" {...register(`packages.${index}.bonusPercent`, { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Bonus ($)</label>
              <input type="number" step="0.01" {...register(`packages.${index}.bonusAmount`, { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input type="number" step="0.01" {...register(`packages.${index}.price`, { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Value</label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                ${((watch(`packages.${index}.amount`) || 0) +
                   (watch(`packages.${index}.bonusAmount`) || 0) +
                   ((watch(`packages.${index}.amount`) || 0) * (watch(`packages.${index}.bonusPercent`) || 0) / 100)
                ).toFixed(2)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Credits</label>
              <input type="number" {...register(`packages.${index}.bonusCredits`, { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validity Days</label>
              <input type="number" {...register(`packages.${index}.validityDays`, { valueAsNumber: true })} placeholder="Leave empty for no expiry" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
              <input {...register(`packages.${index}.badgeText`)} placeholder="e.g., 'Best Value'" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="col-span-3 flex space-x-4">
              <label className="flex items-center">
                <input type="checkbox" {...register(`packages.${index}.isPopular`)} className="rounded border-gray-300" />
                <span className="ml-2 text-sm">Popular</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" {...register(`packages.${index}.isFeatured`)} className="rounded border-gray-300" />
                <span className="ml-2 text-sm">Featured</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" {...register(`packages.${index}.isActive`)} className="rounded border-gray-300" />
                <span className="ml-2 text-sm">Active</span>
              </label>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button type="submit" className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg">
          <CheckIcon className="w-5 h-5 mr-2" />
          Save Recharge Packages
        </button>
      </div>
    </form>
  )
}

// ============================================
// BILLING RULES CONFIGURATION
// ============================================
function BillingRulesConfig() {
  const { register, control, handleSubmit, watch } = useForm<{ rules: any[] }>({
    defaultValues: { rules: [] }
  })

  const { fields: rules, append, remove } = useFieldArray({ control, name: 'rules' })

  return (
    <form onSubmit={handleSubmit(data => console.log('Save rules:', data))} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Dynamic Billing Rules</h2>
        <button onClick={() => append({ name: 'New Rule', ruleType: 'discount', appliesTo: 'all', actionType: 'discount_percent', actionValue: 0 })} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Rule
        </button>
      </div>

      {rules.map((rule, index) => (
        <div key={rule.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-medium">{watch(`rules.${index}.name`)}</h3>
            <button onClick={() => remove(index)} className="text-red-500"><TrashIcon className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
              <input {...register(`rules.${index}.name`)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
              <select {...register(`rules.${index}.ruleType`)} className="w-full px-3 py-2 border rounded-lg">
                <option value="discount">Discount</option>
                <option value="multiplier">Rate Multiplier</option>
                <option value="override">Price Override</option>
                <option value="bonus">Add Bonus</option>
                <option value="condition">Conditional Pricing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
              <select {...register(`rules.${index}.appliesTo`)} className="w-full px-3 py-2 border rounded-lg">
                <option value="all">All</option>
                <option value="consultant">Specific Consultant</option>
                <option value="seeker">Specific Seeker</option>
                <option value="tier">Subscription Tier</option>
                <option value="vertical">Vertical/Category</option>
                <option value="region">Region</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
              <select {...register(`rules.${index}.actionType`)} className="w-full px-3 py-2 border rounded-lg">
                <option value="discount_percent">Discount Percent (%)</option>
                <option value="discount_fixed">Discount Fixed ($)</option>
                <option value="multiply_rate">Multiply Rate</option>
                <option value="override_rate">Override Rate</option>
                <option value="add_bonus">Add Bonus</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Value</label>
              <input type="number" step="0.01" {...register(`rules.${index}.actionValue`, { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority (higher overrides lower)</label>
              <input type="number" {...register(`rules.${index}.priority`, { valueAsNumber: true })} defaultValue={100} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Conditions (JSON)</label>
              <textarea
                {...register(`rules.${index}.conditions`)}
                placeholder='{"min_duration": 30, "first_booking": true}'
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>
            <div className="col-span-2 flex space-x-4">
              <label className="flex items-center">
                <input type="checkbox" {...register(`rules.${index}.stackable`)} className="rounded border-gray-300" />
                <span className="ml-2 text-sm">Stackable (can combine with other rules)</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" {...register(`rules.${index}.exclusive`)} className="rounded border-gray-300" />
                <span className="ml-2 text-sm">Exclusive (no other rules apply)</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" {...register(`rules.${index}.isActive`)} className="rounded border-gray-300" />
                <span className="ml-2 text-sm">Active</span>
              </label>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button type="submit" className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg">
          <CheckIcon className="w-5 h-5 mr-2" />
          Save Billing Rules
        </button>
      </div>
    </form>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

function ThresholdConfigInput({ control, index }: any) {
  const { fields, append, remove } = useFieldArray({ control, name: `pricingModels.${index}.thresholdConfig` })

  return (
    <div className="space-y-2">
      {fields.map((field, i) => (
        <div key={field.id} className="flex items-center space-x-2">
          <input
            type="number"
            {...control.register(`pricingModels.${index}.thresholdConfig.${i}.units`, { valueAsNumber: true })}
            placeholder="Units threshold"
            className="w-32 px-2 py-1 border rounded"
          />
          <span className="text-sm text-gray-600">units →</span>
          <input
            type="number"
            {...control.register(`pricingModels.${index}.thresholdConfig.${i}.discountPercent`, { valueAsNumber: true })}
            placeholder="Discount %"
            className="w-24 px-2 py-1 border rounded"
          />
          <span className="text-sm text-gray-600">% discount</span>
          <button onClick={() => remove(i)} className="text-red-500"><TrashIcon className="w-4 h-4" /></button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ units: 0, discountPercent: 0 })}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        + Add Threshold
      </button>
    </div>
  )
}

function PricingOptionsInput({ control, index }: any) {
  const { fields, append, remove } = useFieldArray({ control, name: `tiers.${index}.pricingOptions` })

  return (
    <div className="space-y-2">
      {fields.map((field, i) => (
        <div key={field.id} className="flex items-center space-x-2">
          <select {...control.register(`tiers.${index}.pricingOptions.${i}.unit`)} className="px-2 py-1 border rounded">
            {PRICING_UNIT_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
          <span className="text-sm">at $</span>
          <input
            type="number"
            step="0.01"
            {...control.register(`tiers.${index}.pricingOptions.${i}.price`, { valueAsNumber: true })}
            className="w-24 px-2 py-1 border rounded"
          />
          <button onClick={() => remove(i)} className="text-red-500"><TrashIcon className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={() => append({ unit: 'month', price: 0 })} className="text-sm text-blue-600">
        + Add Pricing Option
      </button>
    </div>
  )
}

function FeaturesConfigInput(_props: any) {
  const [features, setFeatures] = useState([{ key: 'video_sessions', value: 'true' }])

  return (
    <div className="space-y-2">
      {features.map((f, i) => (
        <div key={i} className="flex items-center space-x-2">
          <input
            value={f.key}
            onChange={(e) => { features[i].key = e.target.value; setFeatures([...features]) }}
            placeholder="Feature name"
            className="w-40 px-2 py-1 border rounded"
          />
          <input
            value={f.value}
            onChange={(e) => { features[i].value = e.target.value; setFeatures([...features]) }}
            placeholder="Value (true/false/number/string)"
            className="w-32 px-2 py-1 border rounded"
          />
          <button onClick={() => setFeatures(features.filter((_, idx) => idx !== i))} className="text-red-500">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => setFeatures([...features, { key: '', value: '' }])}
        className="text-sm text-blue-600"
      >
        + Add Feature
      </button>
    </div>
  )
}

function LimitsConfigInput(_props: any) {
  const [limits, setLimits] = useState([{ key: 'monthly_minutes', value: '60' }])

  return (
    <div className="space-y-2">
      {limits.map((l, i) => (
        <div key={i} className="flex items-center space-x-2">
          <input
            value={l.key}
            onChange={(e) => { limits[i].key = e.target.value; setLimits([...limits]) }}
            placeholder="Limit name (e.g., daily_sessions)"
            className="w-40 px-2 py-1 border rounded"
          />
          <input
            value={l.value}
            onChange={(e) => { limits[i].value = e.target.value; setLimits([...limits]) }}
            placeholder="Limit value"
            className="w-24 px-2 py-1 border rounded"
          />
          <button onClick={() => setLimits(limits.filter((_, idx) => idx !== i))} className="text-red-500">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => setLimits([...limits, { key: '', value: '' }])}
        className="text-sm text-blue-600"
      >
        + Add Limit
      </button>
    </div>
  )
}

function PerksConfigInput(_props: any) {
  const [perks, setPerks] = useState<string[]>([])

  return (
    <div className="space-y-2">
      {perks.map((perk, i) => (
        <div key={i} className="flex items-center space-x-2">
          <input
            value={perk}
            onChange={(e) => { perks[i] = e.target.value; setPerks([...perks]) }}
            placeholder="Perk name (e.g., priority_support)"
            className="w-48 px-2 py-1 border rounded"
          />
          <button onClick={() => setPerks(perks.filter((_, idx) => idx !== i))} className="text-red-500">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => setPerks([...perks, ''])}
        className="text-sm text-blue-600"
      >
        + Add Perk
      </button>
    </div>
  )
}