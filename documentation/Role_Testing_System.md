# Role Testing System - ShareWise AI

## Overview

The ShareWise AI platform now includes a comprehensive role-based access control system with a dedicated Role Testing Panel for Super Admin and Support Team members. This system ensures proper permissions and provides tools for testing and monitoring user roles.

## User Roles

### 1. SUPER_ADMIN
- **Full administrative access**
- Can manage all users and system settings
- Access to advanced testing features
- Can view all system analytics and statistics
- Can perform database operations and system health checks

### 2. SUPPORT (Support Team)
- **Customer support access**
- Can view user analytics
- Can assist users with account issues
- Access to basic role testing features
- Cannot manage other admin users

### 3. SALES (Sales Team)
- **Sales and marketing access**
- Basic user management for sales purposes
- Limited analytics access
- No administrative privileges

### 4. USER (Regular User)
- **Standard trading platform access**
- Personal portfolio and trading features
- No administrative access
- Cannot access role testing panel

## Role Testing Panel Features

### Dashboard Integration
- **Conditional Tab Display**: Only Super Admin and Support Team members see the "Role Testing Panel" tab
- **Professional UI**: Sharp blue and white theme consistent with platform design
- **Real-time Information**: Live system statistics and role information

### Panel Components

#### 1. User Role Information Card
- Current user's role and permissions
- Visual permission indicators (checkmarks/X marks)
- Subscription tier information
- Role-based color coding

#### 2. System Overview Card
- Total users count
- Verified users statistics
- Role distribution (Super Admins, Support Team, etc.)
- Recent activity metrics (Super Admin only)

#### 3. Role Permission Testing
- **Basic Tests**: Authentication, role verification, access permissions
- **Advanced Tests**: Database access, system health, user statistics (Super Admin only)
- **Support Tests**: Support-specific functionality testing
- Real-time test execution with detailed results

## API Endpoints

### Authentication Endpoints
```
POST /api/users/login/          - Login with username or email
POST /api/users/register/       - User registration
POST /api/users/verify-email/   - Email verification with OTP
POST /api/users/resend-verification/ - Resend verification code
```

### Role Management Endpoints
```
GET  /api/users/roles/          - Get current user role and permissions
POST /api/users/roles/test/     - Run role permission tests (Staff only)
GET  /api/users/system/info/    - Get system information (Staff only)
```

## Test Users for Development

The system includes pre-created test users for development and testing:

```
Super Admin:    admin@sharewise.ai    / AdminPass123!
Support Team:   support@sharewise.ai  / SupportPass123!
Sales Team:     sales@sharewise.ai    / SalesPass123!
Regular User:   user@sharewise.ai     / UserPass123!
```

## Management Commands

### Create Test Users
```bash
python manage.py create_test_users
```

### Update User Role
```bash
python manage.py update_user_role user@example.com SUPER_ADMIN
```

## Frontend Components

### RoleTestingPanel Component
- **Location**: `frontend/src/components/admin/RoleTestingPanel.tsx`
- **Features**: 
  - Role information display
  - System statistics
  - Interactive permission testing
  - Professional Material-UI design

### Dashboard Integration
- **Conditional rendering** based on user role
- **Tab-based interface** for easy navigation
- **Real-time role checking** on component mount

## Security Features

### Access Control
- **Endpoint-level protection**: All admin endpoints check user roles
- **Frontend hiding**: Non-admin users don't see admin components
- **Token-based authentication**: JWT tokens with role information

### Permission Checks
```python
# Backend role methods
user.is_super_admin()      # Check if Super Admin
user.is_support_team()     # Check if Support Team
user.is_staff_member()     # Check if staff (Admin or Support)
user.has_admin_access()    # Check if has admin panel access
user.can_manage_users()    # Check if can manage other users
user.can_view_analytics()  # Check if can view system analytics
```

## Testing the System

### 1. Login as Super Admin
```bash
curl -X POST http://localhost:8001/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@sharewise.ai","password":"AdminPass123!"}'
```

### 2. Get Role Information
```bash
curl -X GET http://localhost:8001/api/users/roles/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Run Advanced Tests
```bash
curl -X POST http://localhost:8001/api/users/roles/test/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test_type":"advanced"}'
```

### 4. Get System Information
```bash
curl -X GET http://localhost:8001/api/users/system/info/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Access Control Matrix

| Feature | Regular User | Sales Team | Support Team | Super Admin |
|---------|-------------|------------|--------------|-------------|
| Trading Platform | ✅ | ✅ | ✅ | ✅ |
| Role Testing Panel | ❌ | ❌ | ✅ | ✅ |
| Basic Tests | ❌ | ❌ | ✅ | ✅ |
| Advanced Tests | ❌ | ❌ | ❌ | ✅ |
| System Analytics | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |
| Admin Panel | ❌ | ❌ | ❌ | ✅ |

## Implementation Benefits

1. **Security**: Proper role-based access control
2. **Testing**: Comprehensive permission testing tools
3. **Monitoring**: Real-time system statistics
4. **Debugging**: Easy role verification and testing
5. **Scalability**: Extensible role system
6. **User Experience**: Professional, intuitive interface

## Future Enhancements

1. **Audit Logging**: Track role changes and admin actions
2. **Role Hierarchies**: More granular permission levels
3. **Custom Permissions**: Fine-grained permission system
4. **Role Templates**: Predefined role configurations
5. **Activity Monitoring**: Real-time user activity tracking

---

*This documentation was generated for ShareWise AI Role Testing System v1.0*