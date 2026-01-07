import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import ApiService from '../services/api';

const ExportUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getUsers(currentPage, 50);
      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.totalPages);
        setTotalUsers(response.data.total);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const allUsers = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await ApiService.getUsers(page, 100);
        if (response.success) {
          allUsers.push(...response.data.users);
          hasMore = page < response.data.pagination.totalPages;
          page++;
        } else {
          hasMore = false;
        }
      }
      return allUsers;
    } catch (error) {
      throw new Error('Failed to fetch all users');
    }
  };

  const exportToCSV = async () => {
    try {
      setExporting(true);
      const allUsers = await fetchAllUsers();
      
      const csvHeader = 'ID,Email,Full Name,First Name,Last Name,Phone Number,Custom User ID,Status,Role,Organization ID,Organization Name,Created At\n';
      const csvData = allUsers.map(user => 
        `"${user.id || ''}","${user.email || ''}","${user.fullName || ''}","${user.firstName || ''}","${user.lastName || ''}","${user.phoneNumber || ''}","${user.customUserId || ''}","${user.status || ''}","${user.role || ''}","${user.organizationId || ''}","${user.organizationName || ''}","${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}"`
      ).join('\n');
      
      const csvContent = csvHeader + csvData;
      const fileName = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Users CSV',
        });
        Alert.alert('Success', 'Users exported to CSV successfully');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.log('CSV Export Error:', error);
      Alert.alert('Error', `Failed to export users to CSV: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setExporting(true);
      const allUsers = await fetchAllUsers();
      
      const htmlContent = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #7C3AED; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
              th { background-color: #f2f2f2; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <h1>Users Export Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Total Users: ${allUsers.length}</p>
            <table>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Role</th>
                <th>Organization</th>
                <th>Created</th>
              </tr>
              ${allUsers.map(user => `
                <tr>
                  <td>${user.id || 'N/A'}</td>
                  <td>${user.email || 'N/A'}</td>
                  <td>${user.fullName || 'N/A'}</td>
                  <td>${user.phoneNumber || 'N/A'}</td>
                  <td>${user.status || 'N/A'}</td>
                  <td>${user.role || 'N/A'}</td>
                  <td>${user.organizationName || 'N/A'}</td>
                  <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Users PDF',
        });
        Alert.alert('Success', 'Users exported to PDF successfully');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.log('PDF Export Error:', error);
      Alert.alert('Error', `Failed to export users to PDF: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const renderUserTable = () => (
    <View style={styles.tableContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colId]}>ID</Text>
            <Text style={[styles.tableHeaderText, styles.colEmail]}>Email</Text>
            <Text style={[styles.tableHeaderText, styles.colName]}>Full Name</Text>
            <Text style={[styles.tableHeaderText, styles.colPhone]}>Phone</Text>
            <Text style={[styles.tableHeaderText, styles.colCustomId]}>Custom ID</Text>
            <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
            <Text style={[styles.tableHeaderText, styles.colRole]}>Role</Text>
            <Text style={[styles.tableHeaderText, styles.colOrg]}>Organization</Text>
            <Text style={[styles.tableHeaderText, styles.colDate]}>Created</Text>
          </View>
          {users.map((user, index) => (
            <View key={user.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
              <Text style={[styles.tableCellText, styles.colId]}>{user.id || 'N/A'}</Text>
              <Text style={[styles.tableCellText, styles.colEmail]}>{user.email || 'N/A'}</Text>
              <Text style={[styles.tableCellText, styles.colName]}>{user.fullName || 'N/A'}</Text>
              <Text style={[styles.tableCellText, styles.colPhone]}>{user.phoneNumber || 'N/A'}</Text>
              <Text style={[styles.tableCellText, styles.colCustomId]}>{user.customUserId || 'N/A'}</Text>
              <View style={[styles.colStatus, styles.statusContainer]}>
                <View style={[styles.statusBadge, { backgroundColor: user.status === 'active' ? '#10B981' : '#F59E0B' }]}>
                  <Text style={styles.statusText}>{user.status || 'N/A'}</Text>
                </View>
              </View>
              <Text style={[styles.tableCellText, styles.colRole]}>{user.role || 'N/A'}</Text>
              <Text style={[styles.tableCellText, styles.colOrg]}>{user.organizationName || 'N/A'}</Text>
              <Text style={[styles.tableCellText, styles.colDate]}>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Export Users</Text>
      </View>

      <View style={styles.exportSection}>
        <Text style={styles.sectionTitle}>Export Options</Text>
        <Text style={styles.sectionSubtitle}>Export all {totalUsers} users in your organization</Text>
        
        <View style={styles.exportButtons}>
          <TouchableOpacity 
            style={[styles.exportButton, styles.csvButton]} 
            onPress={exportToCSV}
            disabled={exporting}
          >
            <Ionicons name="document-text" size={24} color="#7C3AED" />
            <Text style={[styles.exportButtonText, { color: '#7C3AED' }]}>Export CSV</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.exportButton, styles.pdfButton]} 
            onPress={exportToPDF}
            disabled={exporting}
          >
            <Ionicons name="document" size={24} color="#EF4444" />
            <Text style={[styles.exportButtonText, { color: '#EF4444' }]}>Export PDF</Text>
          </TouchableOpacity>
        </View>
        
        {exporting && (
          <View style={styles.exportingIndicator}>
            <ActivityIndicator size="small" color="#7C3AED" />
            <Text style={styles.exportingText}>Exporting users...</Text>
          </View>
        )}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.sectionTitle}>Users Preview</Text>
        <Text style={styles.sectionSubtitle}>Page {currentPage} of {totalPages}</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
        ) : (
          renderUserTable()
        )}
        
        <View style={styles.pagination}>
          <TouchableOpacity 
            style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <Text style={styles.pageButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <Text style={styles.pageInfo}>{currentPage} / {totalPages}</Text>
          
          <TouchableOpacity 
            style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <Text style={styles.pageButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  exportSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    borderWidth: 2,
  },
  csvButton: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
  },
  pdfButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  exportingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  exportingText: {
    marginLeft: 8,
    color: '#7C3AED',
    fontSize: 14,
  },
  previewSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowEven: {
    backgroundColor: '#F9FAFB',
  },
  tableCellText: {
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
  },
  colId: { width: 120 },
  colEmail: { width: 180 },
  colName: { width: 150 },
  colPhone: { width: 140 },
  colCustomId: { width: 120 },
  colStatus: { width: 80 },
  colRole: { width: 120 },
  colOrg: { width: 180 },
  colDate: { width: 120 },
  statusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  pageButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 16,
    color: '#1F2937',
  },
  loader: {
    marginTop: 40,
  },
});

export default ExportUsersScreen;