import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

export default function ApkDownloadReportsScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ platform: '', role: '', startDate: '', endDate: '' });

  useEffect(() => {
    loadData();
  }, [pagination.page, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, downloadsRes] = await Promise.all([
        ApiService.getApkDownloadStats(),
        ApiService.getApkDownloadList({ ...filters, page: pagination.page, limit: pagination.limit })
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (downloadsRes.success) {
        setDownloads(downloadsRes.data.downloads);
        setPagination(prev => ({ ...prev, ...downloadsRes.data.pagination }));
      }
    } catch (error) {
      console.error('Error loading APK download data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value || 0}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const FilterButton = ({ label, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterBtn, active && styles.filterBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>APK Download Reports</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7B2CBF']} />}
      >
        {/* Statistics Grid */}
        <View style={styles.statsGrid}>
          <StatCard title="Total Downloads" value={stats?.totalDownloads} icon="download" color="#7B2CBF" />
          <StatCard title="Unique Users" value={stats?.uniqueUsers} icon="people" color="#9D4EDD" />
          <StatCard title="Android" value={stats?.androidDownloads} icon="logo-android" color="#3DDC84" />
          <StatCard title="iOS" value={stats?.iosDownloads} icon="logo-apple" color="#000" />
          <StatCard title="Today" value={stats?.downloadsToday} icon="today" color="#FF6B6B" />
          <StatCard title="This Week" value={stats?.downloadsThisWeek} icon="calendar" color="#4ECDC4" />
          <StatCard title="This Month" value={stats?.downloadsThisMonth} icon="stats-chart" color="#FFD93D" />
        </View>

        {/* Role Breakdown */}
        {stats?.roleBreakdown && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Downloads by Role</Text>
            <View style={styles.roleGrid}>
              {Object.entries(stats.roleBreakdown).map(([role, count]) => (
                <View key={role} style={styles.roleCard}>
                  <Text style={styles.roleCount}>{count}</Text>
                  <Text style={styles.roleLabel}>{role}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filters</Text>
          <View style={styles.filterRow}>
            <FilterButton
              label="All"
              active={!filters.platform}
              onPress={() => setFilters({ ...filters, platform: '', page: 1 })}
            />
            <FilterButton
              label="Android"
              active={filters.platform === 'android'}
              onPress={() => setFilters({ ...filters, platform: 'android', page: 1 })}
            />
            <FilterButton
              label="iOS"
              active={filters.platform === 'ios'}
              onPress={() => setFilters({ ...filters, platform: 'ios', page: 1 })}
            />
          </View>
          <View style={styles.filterRow}>
            <FilterButton
              label="All Roles"
              active={!filters.role}
              onPress={() => setFilters({ ...filters, role: '', page: 1 })}
            />
            <FilterButton
              label="Customer"
              active={filters.role === 'CUSTOMER'}
              onPress={() => setFilters({ ...filters, role: 'CUSTOMER', page: 1 })}
            />
            <FilterButton
              label="Organization"
              active={filters.role === 'ORGANIZATION'}
              onPress={() => setFilters({ ...filters, role: 'ORGANIZATION', page: 1 })}
            />
          </View>
        </View>

        {/* Download List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Downloads ({pagination.total})</Text>
          {downloads.map((download) => (
            <View key={download._id} style={styles.downloadCard}>
              <View style={styles.downloadHeader}>
                <View style={styles.downloadUser}>
                  <Ionicons name="person-circle" size={40} color="#7B2CBF" />
                  <View style={styles.downloadUserInfo}>
                    <Text style={styles.downloadName}>{download.fullName}</Text>
                    <Text style={styles.downloadEmail}>{download.email}</Text>
                  </View>
                </View>
                {download.isVerified && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </View>
              <View style={styles.downloadDetails}>
                <View style={styles.downloadBadge}>
                  <Ionicons
                    name={download.platform === 'android' ? 'logo-android' : 'logo-apple'}
                    size={16}
                    color="#FFF"
                  />
                  <Text style={styles.downloadBadgeText}>{download.platform.toUpperCase()}</Text>
                </View>
                <View style={[styles.downloadBadge, { backgroundColor: '#9D4EDD' }]}>
                  <Text style={styles.downloadBadgeText}>{download.userRole}</Text>
                </View>
                <Text style={styles.downloadDate}>
                  {new Date(download.downloadedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, pagination.page === 1 && styles.pageBtnDisabled]}
              onPress={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              <Ionicons name="chevron-back" size={20} color={pagination.page === 1 ? '#CCC' : '#7B2CBF'} />
            </TouchableOpacity>
            <Text style={styles.pageText}>
              Page {pagination.page} of {pagination.totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.pageBtn, pagination.page === pagination.totalPages && styles.pageBtnDisabled]}
              onPress={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
            >
              <Ionicons name="chevron-forward" size={20} color={pagination.page === pagination.totalPages ? '#CCC' : '#7B2CBF'} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  header: { backgroundColor: '#7B2CBF', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 5 },
  refreshButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', flex: 1, textAlign: 'center' },
  content: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
  statCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 10, padding: 15, margin: '1%', borderLeftWidth: 4, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 5 },
  statTitle: { fontSize: 12, color: '#666', marginTop: 5, textAlign: 'center' },
  section: { backgroundColor: '#FFF', marginTop: 10, padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  roleCard: { width: '48%', backgroundColor: '#F8F8F8', borderRadius: 8, padding: 15, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  roleCount: { fontSize: 24, fontWeight: 'bold', color: '#7B2CBF' },
  roleLabel: { fontSize: 12, color: '#666', marginTop: 5 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  filterBtn: { backgroundColor: '#F0F0F0', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  filterBtnActive: { backgroundColor: '#7B2CBF' },
  filterBtnText: { fontSize: 14, color: '#666' },
  filterBtnTextActive: { color: '#FFF', fontWeight: 'bold' },
  downloadCard: { backgroundColor: '#F8F8F8', borderRadius: 10, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  downloadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  downloadUser: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  downloadUserInfo: { marginLeft: 10, flex: 1 },
  downloadName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  downloadEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  downloadDetails: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  downloadBadge: { backgroundColor: '#7B2CBF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, marginRight: 8, flexDirection: 'row', alignItems: 'center' },
  downloadBadgeText: { fontSize: 11, color: '#FFF', fontWeight: 'bold', marginLeft: 4 },
  downloadDate: { fontSize: 12, color: '#999', marginLeft: 'auto' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20 },
  pageBtn: { padding: 10, backgroundColor: '#FFF', borderRadius: 8, marginHorizontal: 10, elevation: 2 },
  pageBtnDisabled: { opacity: 0.3 },
  pageText: { fontSize: 14, color: '#333', fontWeight: 'bold' }
});
