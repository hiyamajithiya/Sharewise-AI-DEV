import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Typography,
  Box,
  Grid
} from '@mui/material';
import {
  Shield,
  Warning as AlertTriangle,
  CheckCircle,
  Schedule as Clock,
  Description as FileText,
  People as Users,
  TrendingUp,
  Error as AlertCircle,
  Download,
  Visibility as Eye,
  Refresh as RefreshCw
} from '@mui/icons-material';
import { 
  ComplianceDashboard as ComplianceDashboardType, 
  TradingAlert, 
  RegulatoryReport,
  ComplianceStatus
} from '../../types';
import StatCard from '../common/StatCard';
import LoadingSpinner from '../common/LoadingSpinner';

interface ComplianceDashboardProps {
  dashboardData: ComplianceDashboardType;
  alerts: TradingAlert[];
  reports: RegulatoryReport[];
  complianceStatus: ComplianceStatus;
  onRefresh: () => void;
  onDownloadReport: (reportId: string) => void;
  onViewReport: (reportId: string) => void;
  onResolveAlert: (alertId: string, resolution: string) => void;
  loading?: boolean;
}

export function ComplianceDashboard({
  dashboardData,
  alerts,
  reports,
  complianceStatus,
  onRefresh,
  onDownloadReport,
  onViewReport,
  onResolveAlert,
  loading = false
}: ComplianceDashboardProps) {
  const [selectedAlert, setSelectedAlert] = useState<TradingAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [activeTab, setActiveTab] = useState('alerts');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: string; index: string }) => {
    return (
      <div role="tabpanel" hidden={value !== index} style={{ paddingTop: 24 }}>
        {value === index && <Box>{children}</Box>}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLIANT':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'NON_COMPLIANT':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'UNDER_REVIEW':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUBMITTED':
        return 'text-green-600';
      case 'GENERATED':
        return 'text-blue-600';
      case 'DRAFT':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleResolveAlert = async (alert: TradingAlert) => {
    if (resolutionNotes.trim()) {
      await onResolveAlert(alert.id, resolutionNotes);
      setSelectedAlert(null);
      setResolutionNotes('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={60} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor SEBI compliance status and regulatory requirements
          </p>
        </div>
        <Button onClick={onRefresh} variant="outlined" size="small">
          <RefreshCw sx={{ mr: 1, fontSize: 16 }} />
          Refresh
        </Button>
      </div>

      {/* Overall Status Alert */}
      {complianceStatus && complianceStatus.overall_status !== 'COMPLIANT' && (
        <Alert severity={complianceStatus.overall_status === 'NON_COMPLIANT' ? 'error' : 'warning'}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AlertTriangle sx={{ fontSize: 16, mr: 1 }} />
            <Typography variant="h6">
              Compliance Status: {complianceStatus.overall_status.replace('_', ' ')}
            </Typography>
          </Box>
          <Typography variant="body2">
            {complianceStatus.issues_found.length > 0 && (
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                {complianceStatus.issues_found.slice(0, 3).map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            )}
          </Typography>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Compliance Score"
          value={`${dashboardData.overall_compliance.score}%`}
          subtitle="Overall SEBI compliance"
          icon={<Shield />}
          changeType={dashboardData.overall_compliance.score >= 90 ? 'positive' : 'negative'}
          change={dashboardData.overall_compliance.score >= 90 ? 'Excellent' : 'Needs Attention'}
        />
        
        <StatCard
          title="Active Alerts"
          value={dashboardData.alerts.active.toString()}
          subtitle={`${dashboardData.alerts.critical} critical, ${dashboardData.alerts.high} high`}
          icon={<AlertTriangle />}
          changeType={dashboardData.alerts.active > 0 ? 'negative' : 'positive'}
          change={dashboardData.alerts.active === 0 ? 'No issues' : 'Requires attention'}
        />
        
        <StatCard
          title="KYC Completion"
          value={`${dashboardData.kyc_status.completion_rate.toFixed(1)}%`}
          subtitle={`${dashboardData.kyc_status.verified}/${dashboardData.kyc_status.total_profiles} verified`}
          icon={<Users />}
          changeType={dashboardData.kyc_status.completion_rate >= 95 ? 'positive' : 'negative'}
          change={`${dashboardData.kyc_status.pending} pending`}
        />
        
        <StatCard
          title="Reports Submitted"
          value={dashboardData.reports.submitted.toString()}
          subtitle={`${dashboardData.reports.pending} pending submission`}
          icon={<FileText />}
          changeType="positive"
          change="On schedule"
        />
      </div>

      {/* Daily Checklist Progress */}
      <Card>
        <CardHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <CheckCircle sx={{ fontSize: 20 }} />
            <Typography variant="h6">
              Daily Compliance Checklist
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Today's compliance checklist completion status
          </Typography>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Completion Progress
              </span>
              <span className="text-sm text-muted-foreground">
                {dashboardData.daily_checklist.completion_percentage.toFixed(0)}% Complete
              </span>
            </div>
            <LinearProgress 
              variant="determinate"
              value={dashboardData.daily_checklist.completion_percentage} 
              sx={{ width: '100%', height: 8, borderRadius: 4 }}
            />
            <div className="flex items-center justify-between">
              <Chip 
                label={dashboardData.daily_checklist.signed_off ? 'Signed Off' : 'Pending Sign-off'}
                color={dashboardData.daily_checklist.signed_off ? 'success' : 'default'}
                variant={dashboardData.daily_checklist.signed_off ? 'filled' : 'outlined'}
              />
              {!dashboardData.daily_checklist.exists && (
                <Chip 
                  label="Checklist Not Created"
                  color="warning"
                  variant="outlined"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Tabs */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="compliance tabs">
            <Tab label="Active Alerts" value="alerts" />
            <Tab label="Reports" value="reports" />
            <Tab label="KYC Status" value="kyc" />
            <Tab label="Recommendations" value="recommendations" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index="alerts">
          <Card>
            <CardHeader>
              <Typography variant="h6">Active Compliance Alerts</Typography>
              <Typography variant="body2" color="text.secondary">
                Alerts requiring immediate attention
              </Typography>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">No Active Alerts</p>
                  <p className="text-muted-foreground">All compliance checks are passing</p>
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Alert Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Triggered</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alerts.slice(0, 10).map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">
                          {alert.alert_type.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={alert.severity}
                            color={alert.severity === 'CRITICAL' ? 'error' : alert.severity === 'HIGH' ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {alert.description}
                        </TableCell>
                        <TableCell>
                          {new Date(alert.triggered_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => onResolveAlert(alert.id, `Resolved via dashboard by user`)}
                          >
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index="reports">
          <Card>
            <CardHeader>
              <Typography variant="h6">Regulatory Reports</Typography>
              <Typography variant="body2" color="text.secondary">
                Recent regulatory reports and submissions
              </Typography>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Generated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.slice(0, 10).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.report_type.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        {new Date(report.report_period_start).toLocaleDateString()} - 
                        {new Date(report.report_period_end).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={report.status}
                          color={report.status === 'SUBMITTED' ? 'success' : report.status === 'GENERATED' ? 'info' : report.status === 'DRAFT' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {report.generated_at ? 
                          new Date(report.generated_at).toLocaleDateString() : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => onViewReport(report.id)}
                          >
                            <Eye sx={{ fontSize: 16 }} />
                          </Button>
                          {report.report_file && (
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => onDownloadReport(report.id)}
                            >
                              <Download sx={{ fontSize: 16 }} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index="kyc">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Typography variant="h6">KYC Overview</Typography>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Profiles:</span>
                  <span className="font-medium">{dashboardData.kyc_status.total_profiles}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verified:</span>
                  <span className="font-medium text-green-600">{dashboardData.kyc_status.verified}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-medium text-yellow-600">{dashboardData.kyc_status.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expired:</span>
                  <span className="font-medium text-red-600">{dashboardData.kyc_status.expired}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Completion Rate:</span>
                    <span className="font-bold">{dashboardData.kyc_status.completion_rate.toFixed(1)}%</span>
                  </div>
                  <LinearProgress 
                    variant="determinate"
                    value={dashboardData.kyc_status.completion_rate} 
                    sx={{ mt: 2, height: 8, borderRadius: 4 }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Typography variant="h6">Recent Activity</Typography>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Active Investors:</span>
                    <span className="font-medium">{dashboardData.quick_stats.active_investors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent Trades:</span>
                    <span className="font-medium">{dashboardData.quick_stats.recent_trades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Grievances:</span>
                    <span className="font-medium">{dashboardData.quick_stats.pending_grievances}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value={activeTab} index="recommendations">
          <Card>
            <CardHeader>
              <Typography variant="h6">Compliance Recommendations</Typography>
              <Typography variant="body2" color="text.secondary">
                System-generated recommendations for improving compliance
              </Typography>
            </CardHeader>
            <CardContent>
              {complianceStatus?.recommendations?.length > 0 ? (
                <div className="space-y-4">
                  {complianceStatus.recommendations.map((recommendation, index) => (
                    <Alert key={index} severity="info">
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AlertCircle sx={{ fontSize: 16, mr: 1 }} />
                        <Typography variant="h6">Recommendation {index + 1}</Typography>
                      </Box>
                      <Typography variant="body2">{recommendation}</Typography>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">No Recommendations</p>
                  <p className="text-muted-foreground">All compliance areas are operating optimally</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Box>
    </div>
  );
}