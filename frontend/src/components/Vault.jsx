/**
 * FILE LOCATION: frontend/src/components/Vault.jsx
 *
 * Vault component for managing branding, professional details, and report customization.
 * Includes advisor personal details, certifications, memberships, branding settings, and scheduling preferences.
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Plus, Edit, Trash2, Palette, Globe, FileText, Clock, Award, Users, Settings, Eye, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { vaultAPI } from '../services/api';
import toast from 'react-hot-toast';

function Vault() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('advisor');
  const [vaultData, setVaultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [editingCertification, setEditingCertification] = useState(null);
  const [editingMembership, setEditingMembership] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  const tabs = [
    { id: 'advisor', label: 'Advisor Details', icon: User },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'memberships', label: 'Memberships', icon: Users },
    { id: 'digital', label: 'Digital Presence', icon: Globe },
    { id: 'reports', label: 'Report Settings', icon: FileText },
    { id: 'scheduling', label: 'Scheduling', icon: Clock },
    { id: 'whitelabel', label: 'White Label', icon: Settings }
  ];

  useEffect(() => {
    loadVaultData();
  }, []);

  const loadVaultData = async () => {
    try {
      setLoading(true);
      const response = await vaultAPI.getVaultData();
      if (response.success) {
        setVaultData(response.data);
        resetFormWithData(response.data);
      }
    } catch (error) {
      console.error('Error loading vault data:', error);
      toast.error('Failed to load vault data');
    } finally {
      setLoading(false);
    }
  };

  const resetFormWithData = (data) => {
    if (!data) return;

    // Helper function to safely set nested values
    const setNestedValue = (path, value) => {
      try {
        setValue(path, value || '');
      } catch (error) {
        console.warn(`Failed to set value for ${path}:`, error);
      }
    };

    // Set top-level fields
    setNestedValue('firstName', data.firstName);
    setNestedValue('lastName', data.lastName);
    setNestedValue('email', data.email);
    setNestedValue('phoneNumber', data.phoneNumber);
    setNestedValue('firmName', data.firmName);
    setNestedValue('sebiRegNumber', data.sebiRegNumber);
    setNestedValue('revenueModel', data.revenueModel);
    setNestedValue('fpsbNumber', data.fpsbNumber);
    setNestedValue('riaNumber', data.riaNumber);
    setNestedValue('arnNumber', data.arnNumber);
    setNestedValue('amfiRegNumber', data.amfiRegNumber);
    setNestedValue('status', data.status);

    // Set branding fields
    if (data.branding) {
      setNestedValue('branding.primaryColor', data.branding.primaryColor);
      setNestedValue('branding.secondaryColor', data.branding.secondaryColor);
      setNestedValue('branding.accentColor', data.branding.accentColor);
      setNestedValue('branding.tagline', data.branding.tagline);
      
      if (data.branding.logo) {
        setNestedValue('branding.logo.url', data.branding.logo.url);
        setNestedValue('branding.logo.altText', data.branding.logo.altText);
      }
      
      if (data.branding.typography) {
        setNestedValue('branding.typography.primaryFont', data.branding.typography.primaryFont);
        setNestedValue('branding.typography.secondaryFont', data.branding.typography.secondaryFont);
        setNestedValue('branding.typography.fontSize', data.branding.typography.fontSize);
      }
    }

    // Set digital presence fields
    if (data.digitalPresence) {
      setNestedValue('digitalPresence.website', data.digitalPresence.website);
      setNestedValue('digitalPresence.linkedin', data.digitalPresence.linkedin);
      setNestedValue('digitalPresence.twitter', data.digitalPresence.twitter);
      setNestedValue('digitalPresence.facebook', data.digitalPresence.facebook);
      setNestedValue('digitalPresence.instagram', data.digitalPresence.instagram);
      setNestedValue('digitalPresence.youtube', data.digitalPresence.youtube);
    }

    // Set report customization fields
    if (data.reportCustomization) {
      setNestedValue('reportCustomization.headerStyle', data.reportCustomization.headerStyle);
      setNestedValue('reportCustomization.footerStyle', data.reportCustomization.footerStyle);
      setNestedValue('reportCustomization.customFooter', data.reportCustomization.customFooter);
      
      if (data.reportCustomization.watermark) {
        setNestedValue('reportCustomization.watermark.isEnabled', data.reportCustomization.watermark.isEnabled);
        setNestedValue('reportCustomization.watermark.text', data.reportCustomization.watermark.text);
        setNestedValue('reportCustomization.watermark.opacity', data.reportCustomization.watermark.opacity);
      }
    }

    // Set scheduling fields
    if (data.scheduling) {
      setNestedValue('scheduling.appointmentDuration', data.scheduling.appointmentDuration);
      setNestedValue('scheduling.timezone', data.scheduling.timezone);
      
      if (data.scheduling.bufferTime) {
        setNestedValue('scheduling.bufferTime.before', data.scheduling.bufferTime.before);
        setNestedValue('scheduling.bufferTime.after', data.scheduling.bufferTime.after);
      }
    }

    // Set white label fields
    if (data.whiteLabel) {
      setNestedValue('whiteLabel.isEnabled', data.whiteLabel.isEnabled);
      setNestedValue('whiteLabel.companyName', data.whiteLabel.companyName);
      setNestedValue('whiteLabel.customDomain', data.whiteLabel.customDomain);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      
      // Process form data based on active tab with proper data cleaning
      let processedData = {};
      
      switch (activeTab) {
        case 'advisor':
          // Send personal information fields - clean empty strings
          processedData = {
            firstName: cleanString(data.firstName),
            lastName: cleanString(data.lastName),
            email: cleanString(data.email),
            phoneNumber: cleanString(data.phoneNumber),
            firmName: cleanString(data.firmName),
            sebiRegNumber: cleanString(data.sebiRegNumber),
            revenueModel: cleanString(data.revenueModel),
            fpsbNumber: cleanString(data.fpsbNumber),
            riaNumber: cleanString(data.riaNumber),
            arnNumber: cleanString(data.arnNumber),
            amfiRegNumber: cleanString(data.amfiRegNumber),
            status: data.status || 'active'
          };
          
          // Remove empty fields to avoid validation errors
          Object.keys(processedData).forEach(key => {
            if (processedData[key] === '' && ['firstName', 'lastName', 'email'].indexOf(key) === -1) {
              delete processedData[key];
            }
          });
          break;
          
        case 'branding':
          processedData = { 
            branding: cleanBrandingData(data.branding)
          };
          break;
          
        case 'certifications':
          // For certifications, we don't send form data - they're managed separately
          toast.info('Certifications are managed through the Add/Edit buttons');
          setSaving(false);
          return;
          
        case 'memberships':
          // For memberships, we don't send form data - they're managed separately
          toast.info('Memberships are managed through the Add/Edit buttons');
          setSaving(false);
          return;
          
        case 'digital':
          processedData = { 
            digitalPresence: cleanDigitalPresenceData(data.digitalPresence)
          };
          break;
          
        case 'reports':
          processedData = { 
            reportCustomization: cleanReportCustomizationData(data.reportCustomization)
          };
          break;
          
        case 'scheduling':
          processedData = {
            scheduling: cleanSchedulingData(data.scheduling)
          };
          break;
          
        case 'whitelabel':
          processedData = { 
            whiteLabel: cleanWhiteLabelData(data.whiteLabel)
          };
          break;
          
        default:
          processedData = cleanGeneralData(data);
      }
      
      console.log('🔍 [VAULT FORM] Sending data for section:', activeTab, processedData);
      
      const response = await vaultAPI.updateVaultData(processedData, activeTab);
      if (response.success) {
        setVaultData(response.data);
        toast.success('Vault updated successfully');
      }
    } catch (error) {
      console.error('Error updating vault:', error);
      
      // Enhanced error handling
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
        toast.error(`Validation errors: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        toast.error(`Failed to update vault: ${error.response.data.message}`);
      } else {
        toast.error('Failed to update vault');
      }
    } finally {
      setSaving(false);
    }
  };

  // Data cleaning utility functions
  const cleanString = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };

  const cleanBrandingData = (brandingData) => {
    if (!brandingData) return {};
    
    const cleaned = {};
    
    // Only include non-empty values
    if (brandingData.primaryColor && brandingData.primaryColor.trim()) {
      cleaned.primaryColor = brandingData.primaryColor.trim();
    }
    if (brandingData.secondaryColor && brandingData.secondaryColor.trim()) {
      cleaned.secondaryColor = brandingData.secondaryColor.trim();
    }
    if (brandingData.accentColor && brandingData.accentColor.trim()) {
      cleaned.accentColor = brandingData.accentColor.trim();
    }
    if (brandingData.tagline && brandingData.tagline.trim()) {
      cleaned.tagline = brandingData.tagline.trim();
    }
    
    // Logo data
    if (brandingData.logo && (brandingData.logo.url || brandingData.logo.altText)) {
      cleaned.logo = {};
      if (brandingData.logo.url && brandingData.logo.url.trim()) {
        cleaned.logo.url = brandingData.logo.url.trim();
      }
      if (brandingData.logo.altText && brandingData.logo.altText.trim()) {
        cleaned.logo.altText = brandingData.logo.altText.trim();
      }
    }
    
    // Typography data
    if (brandingData.typography) {
      cleaned.typography = {};
      if (brandingData.typography.primaryFont) {
        cleaned.typography.primaryFont = brandingData.typography.primaryFont;
      }
      if (brandingData.typography.secondaryFont) {
        cleaned.typography.secondaryFont = brandingData.typography.secondaryFont;
      }
      if (brandingData.typography.fontSize) {
        cleaned.typography.fontSize = brandingData.typography.fontSize;
      }
    }
    
    return cleaned;
  };

  const cleanDigitalPresenceData = (digitalData) => {
    if (!digitalData) return {};
    
    const cleaned = {};
    const fields = ['website', 'linkedin', 'twitter', 'facebook', 'instagram', 'youtube'];
    
    fields.forEach(field => {
      if (digitalData[field] && digitalData[field].trim()) {
        cleaned[field] = digitalData[field].trim();
      }
    });
    
    return cleaned;
  };

  const cleanReportCustomizationData = (reportData) => {
    if (!reportData) return {};
    
    const cleaned = {};
    
    if (reportData.headerStyle) cleaned.headerStyle = reportData.headerStyle;
    if (reportData.footerStyle) cleaned.footerStyle = reportData.footerStyle;
    if (reportData.customFooter && reportData.customFooter.trim()) {
      cleaned.customFooter = reportData.customFooter.trim();
    }
    
    // Watermark data
    if (reportData.watermark) {
      cleaned.watermark = {
        isEnabled: Boolean(reportData.watermark.isEnabled)
      };
      
      if (reportData.watermark.text && reportData.watermark.text.trim()) {
        cleaned.watermark.text = reportData.watermark.text.trim();
      }
      
      if (reportData.watermark.opacity !== undefined) {
        const opacity = Number(reportData.watermark.opacity);
        if (!isNaN(opacity)) {
          cleaned.watermark.opacity = Math.max(0.1, Math.min(1.0, opacity));
        }
      }
    }
    
    return cleaned;
  };

  const cleanSchedulingData = (schedulingData) => {
    if (!schedulingData) return {};
    
    const cleaned = {};
    
    // Appointment duration with proper number conversion
    if (schedulingData.appointmentDuration !== undefined) {
      const duration = Number(schedulingData.appointmentDuration);
      if (!isNaN(duration)) {
        cleaned.appointmentDuration = duration;
      }
    }
    
    // Timezone
    if (schedulingData.timezone && schedulingData.timezone.trim()) {
      cleaned.timezone = schedulingData.timezone.trim();
    }
    
    // Buffer time with proper number conversion
    if (schedulingData.bufferTime) {
      cleaned.bufferTime = {};
      
      if (schedulingData.bufferTime.before !== undefined) {
        const before = Number(schedulingData.bufferTime.before);
        if (!isNaN(before)) {
          cleaned.bufferTime.before = before;
        }
      }
      
      if (schedulingData.bufferTime.after !== undefined) {
        const after = Number(schedulingData.bufferTime.after);
        if (!isNaN(after)) {
          cleaned.bufferTime.after = after;
        }
      }
    }
    
    return cleaned;
  };

  const cleanWhiteLabelData = (whitelabelData) => {
    if (!whitelabelData) return {};
    
    const cleaned = {
      isEnabled: Boolean(whitelabelData.isEnabled)
    };
    
    if (whitelabelData.companyName && whitelabelData.companyName.trim()) {
      cleaned.companyName = whitelabelData.companyName.trim();
    }
    
    if (whitelabelData.customDomain && whitelabelData.customDomain.trim()) {
      cleaned.customDomain = whitelabelData.customDomain.trim();
    }
    
    return cleaned;
  };

  const cleanGeneralData = (data) => {
    const cleaned = {};
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        if (typeof data[key] === 'string') {
          const trimmed = data[key].trim();
          if (trimmed) cleaned[key] = trimmed;
        } else {
          cleaned[key] = data[key];
        }
      }
    });
    
    return cleaned;
  };

  const handleAddCertification = () => {
    setEditingCertification(null);
    setShowCertificationModal(true);
  };

  const handleEditCertification = (certification) => {
    setEditingCertification(certification);
    setShowCertificationModal(true);
  };

  const handleAddMembership = () => {
    setEditingMembership(null);
    setShowMembershipModal(true);
  };

  const handleEditMembership = (membership) => {
    setEditingMembership(membership);
    setShowMembershipModal(true);
  };

  const handleDeleteCertification = async (certId) => {
    if (window.confirm('Are you sure you want to delete this certification?')) {
      try {
        await vaultAPI.deleteCertification(certId);
        toast.success('Certification deleted successfully');
        loadVaultData();
      } catch (error) {
        console.error('Error deleting certification:', error);
        toast.error('Failed to delete certification');
      }
    }
  };

  const handleDeleteMembership = async (membershipId) => {
    if (window.confirm('Are you sure you want to delete this membership?')) {
      try {
        await vaultAPI.deleteMembership(membershipId);
        toast.success('Membership deleted successfully');
        loadVaultData();
      } catch (error) {
        console.error('Error deleting membership:', error);
        toast.error('Failed to delete membership');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vault</h1>
          <p className="text-gray-600">Manage your branding, professional details, and report customization</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            {activeTab === 'advisor' && <AdvisorDetailsTab register={register} errors={errors} vaultData={vaultData} />}
            {activeTab === 'branding' && <BrandingTab register={register} errors={errors} watch={watch} setValue={setValue} />}
            {activeTab === 'certifications' && <CertificationsTab vaultData={vaultData} onAdd={handleAddCertification} onEdit={handleEditCertification} onDelete={handleDeleteCertification} />}
            {activeTab === 'memberships' && <MembershipsTab vaultData={vaultData} onAdd={handleAddMembership} onEdit={handleEditMembership} onDelete={handleDeleteMembership} />}
            {activeTab === 'digital' && <DigitalPresenceTab register={register} errors={errors} />}
            {activeTab === 'reports' && <ReportSettingsTab register={register} errors={errors} watch={watch} />}
            {activeTab === 'scheduling' && <SchedulingTab register={register} errors={errors} />}
            {activeTab === 'whitelabel' && <WhiteLabelTab register={register} errors={errors} watch={watch} />}

            {/* Save Button - Hidden for certifications and memberships tabs */}
            {activeTab !== 'certifications' && activeTab !== 'memberships' && (
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={20} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Modals */}
      {showCertificationModal && (
        <CertificationModal
          isOpen={showCertificationModal}
          onClose={() => setShowCertificationModal(false)}
          certification={editingCertification}
          onSave={async (data) => {
            try {
              if (editingCertification) {
                await vaultAPI.updateCertification(editingCertification._id, data);
                toast.success('Certification updated successfully');
              } else {
                await vaultAPI.addCertification(data);
                toast.success('Certification added successfully');
              }
              setShowCertificationModal(false);
              loadVaultData();
            } catch (error) {
              console.error('Error saving certification:', error);
              toast.error('Failed to save certification');
            }
          }}
        />
      )}

      {showMembershipModal && (
        <MembershipModal
          isOpen={showMembershipModal}
          onClose={() => setShowMembershipModal(false)}
          membership={editingMembership}
          onSave={async (data) => {
            try {
              if (editingMembership) {
                await vaultAPI.updateMembership(editingMembership._id, data);
                toast.success('Membership updated successfully');
              } else {
                await vaultAPI.addMembership(data);
                toast.success('Membership added successfully');
              }
              setShowMembershipModal(false);
              loadVaultData();
            } catch (error) {
              console.error('Error saving membership:', error);
              toast.error('Failed to save membership');
            }
          }}
        />
      )}
    </div>
  );
}

// Advisor Details Tab Component
function AdvisorDetailsTab({ register, errors, vaultData }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
        <p className="text-gray-600 mt-1">Update your personal and professional details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              {...register('firstName', { required: 'First name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter first name"
            />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              {...register('lastName', { required: 'Last name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter last name"
            />
            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              {...register('phoneNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>}
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
            <input
              type="text"
              {...register('firmName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter firm name"
            />
            {errors.firmName && <p className="text-red-500 text-sm mt-1">{errors.firmName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Model</label>
            <select
              {...register('revenueModel')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select revenue model</option>
              <option value="Fee-Only">Fee-Only</option>
              <option value="Commission-Based">Commission-Based</option>
              <option value="Fee + Commission">Fee + Commission</option>
            </select>
            {errors.revenueModel && <p className="text-red-500 text-sm mt-1">{errors.revenueModel.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
          </div>
        </div>
      </div>

      {/* Registration Numbers */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Numbers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SEBI Registration Number</label>
            <input
              type="text"
              {...register('sebiRegNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter SEBI registration number"
            />
            {errors.sebiRegNumber && <p className="text-red-500 text-sm mt-1">{errors.sebiRegNumber.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FPSB Number</label>
            <input
              type="text"
              {...register('fpsbNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter FPSB number"
            />
            {errors.fpsbNumber && <p className="text-red-500 text-sm mt-1">{errors.fpsbNumber.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RIA Number</label>
            <input
              type="text"
              {...register('riaNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter RIA number"
            />
            {errors.riaNumber && <p className="text-red-500 text-sm mt-1">{errors.riaNumber.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ARN Number</label>
            <input
              type="text"
              {...register('arnNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter ARN number"
            />
            {errors.arnNumber && <p className="text-red-500 text-sm mt-1">{errors.arnNumber.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AMFI Registration Number</label>
            <input
              type="text"
              {...register('amfiRegNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter AMFI registration number"
            />
            {errors.amfiRegNumber && <p className="text-red-500 text-sm mt-1">{errors.amfiRegNumber.message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab Components
function BrandingTab({ register, errors, watch, setValue }) {
  const primaryColor = watch('branding.primaryColor');
  const secondaryColor = watch('branding.secondaryColor');
  const accentColor = watch('branding.accentColor');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                {...register('branding.primaryColor')}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                {...register('branding.primaryColor')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="#2563eb"
              />
            </div>
            <div
              className="mt-2 w-full h-8 rounded"
              style={{ backgroundColor: primaryColor }}
            ></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                {...register('branding.secondaryColor')}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                {...register('branding.secondaryColor')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="#64748b"
              />
            </div>
            <div
              className="mt-2 w-full h-8 rounded"
              style={{ backgroundColor: secondaryColor }}
            ></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                {...register('branding.accentColor')}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                {...register('branding.accentColor')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="#f59e0b"
              />
            </div>
            <div
              className="mt-2 w-full h-8 rounded"
              style={{ backgroundColor: accentColor }}
            ></div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Typography</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Font
            </label>
            <select
              {...register('branding.typography.primaryFont')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <select
              {...register('branding.typography.fontSize')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Logo & Tagline</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              {...register('branding.logo.url')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              {...register('branding.tagline')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your professional tagline"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificationsTab({ vaultData, onAdd, onEdit, onDelete }) {
  const certifications = vaultData?.certifications || [];
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Professional Certifications</h3>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Certification
        </button>
      </div>
      
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          💡 <strong>Tip:</strong> Use the Add/Edit buttons above to manage your certifications. 
          Changes are saved automatically when you use these buttons.
        </p>
      </div>

      {certifications.length === 0 ? (
        <div className="text-center py-12">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No certifications added yet</p>
          <button
            onClick={onAdd}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Your First Certification
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert) => (
            <div key={cert._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{cert.name}</h4>
                  <p className="text-sm text-gray-600">Issued by: {cert.issuingBody}</p>
                  {cert.certificateNumber && (
                    <p className="text-sm text-gray-600">Certificate #: {cert.certificateNumber}</p>
                  )}
                  {cert.issueDate && (
                    <p className="text-sm text-gray-600">
                      Issue Date: {new Date(cert.issueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(cert)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Edit certification"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(cert._id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Delete certification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MembershipsTab({ vaultData, onAdd, onEdit, onDelete }) {
  const memberships = vaultData?.memberships || [];
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Professional Memberships</h3>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Membership
        </button>
      </div>
      
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          💡 <strong>Tip:</strong> Use the Add/Edit buttons above to manage your memberships. 
          Changes are saved automatically when you use these buttons.
        </p>
      </div>

      {memberships.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No memberships added yet</p>
          <button
            onClick={onAdd}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Your First Membership
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {memberships.map((membership) => (
            <div key={membership._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{membership.organization}</h4>
                  {membership.membershipType && (
                    <p className="text-sm text-gray-600">Type: {membership.membershipType}</p>
                  )}
                  {membership.membershipNumber && (
                    <p className="text-sm text-gray-600">Member ID: {membership.membershipNumber}</p>
                  )}
                  {membership.memberSince && (
                    <p className="text-sm text-gray-600">
                      Joined: {new Date(membership.memberSince).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(membership)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Edit membership"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(membership._id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Delete membership"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DigitalPresenceTab({ register, errors }) {
  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Digital Presence</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Website URL
        </label>
        <input
          type="url"
          {...register('digitalPresence.website')}
          placeholder="https://yourwebsite.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Social Media</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn Profile
            </label>
            <input
              type="url"
              {...register('digitalPresence.linkedin')}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter Profile
            </label>
            <input
              type="url"
              {...register('digitalPresence.twitter')}
              placeholder="https://twitter.com/yourhandle"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook Page
            </label>
            <input
              type="url"
              {...register('digitalPresence.facebook')}
              placeholder="https://facebook.com/yourpage"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram Profile
            </label>
            <input
              type="url"
              {...register('digitalPresence.instagram')}
              placeholder="https://instagram.com/yourprofile"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Channel
            </label>
            <input
              type="url"
              {...register('digitalPresence.youtube')}
              placeholder="https://youtube.com/yourchannel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportSettingsTab({ register, errors, watch }) {
  const watermarkEnabled = watch('reportCustomization.watermark.isEnabled');

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Report Customization</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Header Style
          </label>
          <select
            {...register('reportCustomization.headerStyle')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="minimal">Minimal</option>
            <option value="professional">Professional</option>
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Footer Style
          </label>
          <select
            {...register('reportCustomization.footerStyle')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="minimal">Minimal</option>
            <option value="detailed">Detailed</option>
            <option value="legal">Legal</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Footer Text
        </label>
        <textarea
          {...register('reportCustomization.customFooter')}
          rows={3}
          placeholder="Enter custom footer text for reports..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Watermark Settings</h4>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            {...register('reportCustomization.watermark.isEnabled')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Enable watermark on reports
          </label>
        </div>

        {watermarkEnabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Watermark Text
              </label>
              <input
                type="text"
                {...register('reportCustomization.watermark.text')}
                placeholder="Enter watermark text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Watermark Opacity
              </label>
              <input
                type="range"
                {...register('reportCustomization.watermark.opacity')}
                min="0.1"
                max="1.0"
                step="0.1"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SchedulingTab({ register, errors }) {
  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Scheduling Preferences</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Appointment Duration
          </label>
          <select
            {...register('scheduling.appointmentDuration')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
            <option value={240}>4 hours</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buffer Time (Before)
          </label>
          <select
            {...register('scheduling.bufferTime.before')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>No buffer</option>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buffer Time (After)
          </label>
          <select
            {...register('scheduling.bufferTime.after')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>No buffer</option>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            {...register('scheduling.timezone')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Asia/Kolkata">India (IST)</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London (GMT)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function WhiteLabelTab({ register, errors, watch }) {
  const whiteLabelEnabled = watch('whiteLabel.isEnabled');

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-medium text-gray-900">White Label Configuration</h3>

      <div className="flex items-center mb-6">
        <input
          type="checkbox"
          {...register('whiteLabel.isEnabled')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">
          Enable white label mode
        </label>
      </div>

      {whiteLabelEnabled && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              {...register('whiteLabel.companyName')}
              placeholder="Enter your company name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Domain
            </label>
            <input
              type="text"
              {...register('whiteLabel.customDomain')}
              placeholder="yourdomain.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter your custom domain for white label branding
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal Components (simplified for now)
function CertificationModal({ isOpen, onClose, certification, onSave }) {
  const [formData, setFormData] = useState({
    name: certification?.name || '',
    issuingBody: certification?.issuingBody || '',
    issueDate: certification?.issueDate ? new Date(certification.issueDate).toISOString().split('T')[0] : '',
    expiryDate: certification?.expiryDate ? new Date(certification.expiryDate).toISOString().split('T')[0] : '',
    certificateNumber: certification?.certificateNumber || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving certification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {certification ? 'Edit Certification' : 'Add Certification'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certification Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Certified Financial Planner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issuing Body *
              </label>
              <input
                type="text"
                name="issuingBody"
                value={formData.issuingBody}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Financial Planning Standards Board"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate Number
              </label>
              <input
                type="text"
                name="certificateNumber"
                value={formData.certificateNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., CFP123456"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : (certification ? 'Update' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function MembershipModal({ isOpen, onClose, membership, onSave }) {
  const [formData, setFormData] = useState({
    organization: membership?.organization || '',
    membershipType: membership?.membershipType || '',
    memberSince: membership?.memberSince ? new Date(membership.memberSince).toISOString().split('T')[0] : '',
    membershipNumber: membership?.membershipNumber || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {membership ? 'Edit Membership' : 'Add Membership'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization *
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Financial Planning Association"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Membership Type *
              </label>
              <select
                name="membershipType"
                value={formData.membershipType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select membership type</option>
                <option value="Regular">Regular</option>
                <option value="Professional">Professional</option>
                <option value="Associate">Associate</option>
                <option value="Fellow">Fellow</option>
                <option value="Student">Student</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Since *
              </label>
              <input
                type="date"
                name="memberSince"
                value={formData.memberSince}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Membership Number
              </label>
              <input
                type="text"
                name="membershipNumber"
                value={formData.membershipNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., MEM123456"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : (membership ? 'Update' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Vault;
