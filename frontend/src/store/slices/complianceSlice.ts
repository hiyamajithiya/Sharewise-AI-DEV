import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/api';
import { 
  ComplianceState,
  InvestorProfile,
  KYCDocument,
  TradingAlert,
  RiskManagement,
  InvestorGrievance,
  RegulatoryReport,
  ComplianceStatus,
  ComplianceDashboard,
  LegalDisclaimer
} from '../../types';

// Initial state
const initialState: ComplianceState = {
  investorProfile: null,
  kycDocuments: [],
  tradingAlerts: [],
  riskManagement: null,
  grievances: [],
  reports: [],
  complianceStatus: null,
  dashboard: null,
  legalDisclosures: {},
  loading: false,
  error: null,
};

// Async thunks
export const fetchComplianceDashboard = createAsyncThunk(
  'compliance/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiService.getComplianceDashboard();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch compliance dashboard');
    }
  }
);

export const fetchInvestorProfile = createAsyncThunk(
  'compliance/fetchInvestorProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiService.getInvestorProfile();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch investor profile');
    }
  }
);

export const updateInvestorProfile = createAsyncThunk(
  'compliance/updateInvestorProfile',
  async (profileData: Partial<InvestorProfile>, { rejectWithValue }) => {
    try {
      const data = await apiService.updateInvestorProfile(profileData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update investor profile');
    }
  }
);

export const fetchKYCDocuments = createAsyncThunk(
  'compliance/fetchKYCDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiService.getKYCDocuments();
      return data.results || data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch KYC documents');
    }
  }
);

export const uploadKYCDocument = createAsyncThunk(
  'compliance/uploadKYCDocument',
  async ({ documentType, file }: { documentType: string; file: File }, { rejectWithValue }) => {
    try {
      const data = await apiService.uploadKYCDocument(documentType, file);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to upload KYC document');
    }
  }
);

export const fetchTradingAlerts = createAsyncThunk(
  'compliance/fetchTradingAlerts',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const data = await apiService.getTradingAlerts(params);
      return data.results || data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch trading alerts');
    }
  }
);

export const resolveTradingAlert = createAsyncThunk(
  'compliance/resolveTradingAlert',
  async ({ alertId, resolution }: { alertId: string; resolution: string }, { rejectWithValue }) => {
    try {
      const data = await apiService.resolveTradingAlert(alertId, resolution);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to resolve trading alert');
    }
  }
);

export const fetchRegulatoryReports = createAsyncThunk(
  'compliance/fetchRegulatoryReports',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const data = await apiService.getRegulatoryReports(params);
      return data.results || data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch regulatory reports');
    }
  }
);

export const fetchRiskManagement = createAsyncThunk(
  'compliance/fetchRiskManagement',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiService.getRiskManagement();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch risk management');
    }
  }
);

export const updateRiskManagement = createAsyncThunk(
  'compliance/updateRiskManagement',
  async (riskData: Partial<RiskManagement>, { rejectWithValue }) => {
    try {
      const data = await apiService.updateRiskManagement(riskData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update risk management');
    }
  }
);

export const fetchGrievances = createAsyncThunk(
  'compliance/fetchGrievances',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const data = await apiService.getGrievances(params);
      return data.results || data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch grievances');
    }
  }
);

export const createGrievance = createAsyncThunk(
  'compliance/createGrievance',
  async (grievanceData: FormData, { rejectWithValue }) => {
    try {
      const data = await apiService.createGrievance(grievanceData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create grievance');
    }
  }
);

export const fetchComplianceStatus = createAsyncThunk(
  'compliance/fetchComplianceStatus',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiService.getComplianceStatus();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch compliance status');
    }
  }
);

export const fetchLegalDisclosures = createAsyncThunk(
  'compliance/fetchLegalDisclosures',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiService.getLegalDisclosures();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch legal disclosures');
    }
  }
);

export const acknowledgeDisclosure = createAsyncThunk(
  'compliance/acknowledgeDisclosure',
  async (disclosureType: string, { rejectWithValue }) => {
    try {
      const data = await apiService.acknowledgeDisclosure(disclosureType);
      return { disclosureType, data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to acknowledge disclosure');
    }
  }
);

// Slice
const complianceSlice = createSlice({
  name: 'compliance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    updateAlert: (state, action: PayloadAction<TradingAlert>) => {
      const index = state.tradingAlerts.findIndex(alert => alert.id === action.payload.id);
      if (index !== -1) {
        state.tradingAlerts[index] = action.payload;
      }
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      state.tradingAlerts = state.tradingAlerts.filter(alert => alert.id !== action.payload);
    },
    addGrievance: (state, action: PayloadAction<InvestorGrievance>) => {
      state.grievances.unshift(action.payload);
    },
    updateGrievance: (state, action: PayloadAction<InvestorGrievance>) => {
      const index = state.grievances.findIndex(grievance => grievance.id === action.payload.id);
      if (index !== -1) {
        state.grievances[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Compliance Dashboard
      .addCase(fetchComplianceDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplianceDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchComplianceDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Investor Profile
      .addCase(fetchInvestorProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvestorProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.investorProfile = action.payload;
      })
      .addCase(fetchInvestorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Investor Profile
      .addCase(updateInvestorProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInvestorProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.investorProfile = action.payload;
      })
      .addCase(updateInvestorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch KYC Documents
      .addCase(fetchKYCDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKYCDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.kycDocuments = action.payload;
      })
      .addCase(fetchKYCDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Upload KYC Document
      .addCase(uploadKYCDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadKYCDocument.fulfilled, (state, action) => {
        state.loading = false;
        // Add or update the document in the list
        const existingIndex = state.kycDocuments.findIndex(
          doc => doc.document_type === action.payload.document_type
        );
        if (existingIndex !== -1) {
          state.kycDocuments[existingIndex] = action.payload;
        } else {
          state.kycDocuments.push(action.payload);
        }
      })
      .addCase(uploadKYCDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Trading Alerts
      .addCase(fetchTradingAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTradingAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.tradingAlerts = action.payload;
      })
      .addCase(fetchTradingAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Resolve Trading Alert
      .addCase(resolveTradingAlert.fulfilled, (state, action) => {
        const index = state.tradingAlerts.findIndex(alert => alert.id === action.payload.id);
        if (index !== -1) {
          state.tradingAlerts[index] = action.payload;
        }
      })

      // Fetch Regulatory Reports
      .addCase(fetchRegulatoryReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRegulatoryReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchRegulatoryReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Risk Management
      .addCase(fetchRiskManagement.fulfilled, (state, action) => {
        state.riskManagement = action.payload;
      })

      // Update Risk Management
      .addCase(updateRiskManagement.fulfilled, (state, action) => {
        state.riskManagement = action.payload;
      })

      // Fetch Grievances
      .addCase(fetchGrievances.fulfilled, (state, action) => {
        state.grievances = action.payload;
      })

      // Create Grievance
      .addCase(createGrievance.fulfilled, (state, action) => {
        state.grievances.unshift(action.payload);
      })

      // Fetch Compliance Status
      .addCase(fetchComplianceStatus.fulfilled, (state, action) => {
        state.complianceStatus = action.payload;
      })

      // Fetch Legal Disclosures
      .addCase(fetchLegalDisclosures.fulfilled, (state, action) => {
        state.legalDisclosures = action.payload;
      })

      // Acknowledge Disclosure
      .addCase(acknowledgeDisclosure.fulfilled, (state, action) => {
        // Update disclosure acknowledgment status if needed
        const { disclosureType } = action.payload;
        if (state.legalDisclosures[disclosureType]) {
          // Mark as acknowledged (you might need to add this field to the type)
          // state.legalDisclosures[disclosureType].acknowledged = true;
        }
      });
  },
});

// Actions
export const {
  clearError,
  setLoading,
  updateAlert,
  removeAlert,
  addGrievance,
  updateGrievance,
} = complianceSlice.actions;

// Selectors
export const selectComplianceState = (state: { compliance: ComplianceState }) => state.compliance;
export const selectInvestorProfile = (state: { compliance: ComplianceState }) => state.compliance.investorProfile;
export const selectKYCDocuments = (state: { compliance: ComplianceState }) => state.compliance.kycDocuments;
export const selectTradingAlerts = (state: { compliance: ComplianceState }) => state.compliance.tradingAlerts;
export const selectRiskManagement = (state: { compliance: ComplianceState }) => state.compliance.riskManagement;
export const selectGrievances = (state: { compliance: ComplianceState }) => state.compliance.grievances;
export const selectRegulatoryReports = (state: { compliance: ComplianceState }) => state.compliance.reports;
export const selectComplianceStatus = (state: { compliance: ComplianceState }) => state.compliance.complianceStatus;
export const selectComplianceDashboard = (state: { compliance: ComplianceState }) => state.compliance.dashboard;
export const selectLegalDisclosures = (state: { compliance: ComplianceState }) => state.compliance.legalDisclosures;
export const selectComplianceLoading = (state: { compliance: ComplianceState }) => state.compliance.loading;
export const selectComplianceError = (state: { compliance: ComplianceState }) => state.compliance.error;

// Export reducer
export default complianceSlice.reducer;