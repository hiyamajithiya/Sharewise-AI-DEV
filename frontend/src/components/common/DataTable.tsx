import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  MoreVert,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

export interface TableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string | React.ReactNode;
}

interface DataTableProps {
  title?: string;
  columns: TableColumn[];
  rows: any[];
  maxHeight?: number;
  onRowClick?: (row: any) => void;
  actions?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  rows,
  maxHeight = 400,
  onRowClick,
  actions = false,
}) => {
  const formatValue = (column: TableColumn, value: any) => {
    if (column.format) {
      return column.format(value);
    }

    // Default formatting for common data types
    if (typeof value === 'number') {
      if (column.id.includes('price') || column.id.includes('amount')) {
        return `₹${value.toLocaleString()}`;
      }
      if (column.id.includes('percent')) {
        const isPositive = value >= 0;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isPositive ? (
              <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            <Typography
              variant="body2"
              sx={{
                color: isPositive ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {isPositive ? '+' : ''}{value}%
            </Typography>
          </Box>
        );
      }
      return value.toLocaleString();
    }

    if (column.id.includes('status')) {
      const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
          case 'active':
          case 'completed':
          case 'success':
            return 'success';
          case 'pending':
          case 'processing':
            return 'warning';
          case 'failed':
          case 'rejected':
          case 'error':
            return 'error';
          default:
            return 'default';
        }
      };

      return (
        <Chip
          label={value}
          size="small"
          color={getStatusColor(value) as any}
          variant="filled"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            height: 24,
          }}
        />
      );
    }

    if (column.id === 'symbol' && typeof value === 'string') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #0052CC 0%, #1976D2 100%)',
            }}
          >
            {value.charAt(0)}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </Box>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <Chip
          label={value ? 'Yes' : 'No'}
          size="small"
          color={value ? 'success' : 'default'}
          variant="outlined"
          sx={{ fontSize: '0.75rem', height: 20 }}
        />
      );
    }

    return value;
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {title && (
        <Box sx={{ p: 2, borderBottom: '1px solid #E5E7EB' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
      )}
      
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    minWidth: column.minWidth,
                    backgroundColor: '#F9FAFB',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              {actions && (
                <TableCell
                  align="center"
                  sx={{
                    backgroundColor: '#F9FAFB',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '0.875rem',
                    width: 60,
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                hover
                key={index}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:hover': {
                    backgroundColor: '#F9FAFB',
                  },
                }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    sx={{
                      fontSize: '0.875rem',
                      py: 2,
                    }}
                  >
                    {formatValue(column, row[column.id])}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell align="center">
                    <Tooltip title="More actions">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle action menu
                        }}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {rows.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 6,
            color: 'text.secondary',
          }}
        >
          <Typography variant="body1">
            No data available
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DataTable;