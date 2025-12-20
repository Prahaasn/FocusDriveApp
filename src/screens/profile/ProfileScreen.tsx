import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { COLORS, APP_CONFIG } from '../../constants';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/spacing';
import type { User, Vehicle } from '../../types';
import {
  BellIcon,
  LocationIcon,
  MoonIcon,
  HelpCircleIcon,
  ShieldIcon,
  FileTextIcon,
  LogOutIcon,
  ChevronRightIcon,
} from '../../components/icons/Icons';

// ============================================
// Types
// ============================================

interface SettingsState {
  notifications: boolean;
  location: boolean;
  darkMode: boolean;
}

interface EditProfileModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (data: { fullName: string; email: string }) => void;
}

interface EditVehicleModalProps {
  visible: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onSave: (data: Partial<Vehicle>) => void;
}

// ============================================
// Edit Profile Modal Component
// ============================================

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await onSave({ fullName: fullName.trim(), email: email.trim() });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Profile</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.background} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// Edit Vehicle Modal Component
// ============================================

const EditVehicleModal: React.FC<EditVehicleModalProps> = ({
  visible,
  vehicle,
  onClose,
  onSave,
}) => {
  const [make, setMake] = useState(vehicle?.make || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [year, setYear] = useState(vehicle?.year?.toString() || '');
  const [licensePlate, setLicensePlate] = useState(vehicle?.licensePlate || '');
  const [deviceId, setDeviceId] = useState(vehicle?.deviceId || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setMake(vehicle.make);
      setModel(vehicle.model);
      setYear(vehicle.year.toString());
      setLicensePlate(vehicle.licensePlate);
      setDeviceId(vehicle.deviceId);
    }
  }, [vehicle]);

  const handleSave = async () => {
    if (!make.trim() || !model.trim()) {
      Alert.alert('Error', 'Please enter vehicle make and model');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year, 10) || new Date().getFullYear(),
        licensePlate: licensePlate.trim(),
        deviceId: deviceId.trim(),
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {vehicle ? 'Edit Vehicle' : 'Add Vehicle'}
          </Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Make</Text>
              <TextInput
                style={styles.input}
                value={make}
                onChangeText={setMake}
                placeholder="Toyota"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Model</Text>
              <TextInput
                style={styles.input}
                value={model}
                onChangeText={setModel}
                placeholder="Prius"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Year</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                placeholder="2024"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>License Plate</Text>
              <TextInput
                style={styles.input}
                value={licensePlate}
                onChangeText={setLicensePlate}
                placeholder="ABC1234"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Device ID</Text>
            <TextInput
              style={styles.input}
              value={deviceId}
              onChangeText={setDeviceId}
              placeholder="rpi_12345abc"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="none"
            />
            <Text style={styles.inputHint}>
              Enter the Raspberry Pi device ID from your FocusDrive hardware
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.background} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// Profile Section Component
// ============================================

interface ProfileSectionProps {
  user: User | null;
  onEditPress: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user, onEditPress }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.profileSection}>
      <View style={styles.profileHeader}>
        {user?.profilePhotoUrl ? (
          <Image
            source={{ uri: user.profilePhotoUrl }}
            style={styles.profilePhoto}
          />
        ) : (
          <View style={styles.profilePhotoPlaceholder}>
            <Text style={styles.profileInitials}>
              {user ? getInitials(user.fullName) : 'U'}
            </Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user?.fullName || 'User Name'}
          </Text>
          <Text style={styles.profileEmail}>
            {user?.email || 'user@email.com'}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================
// Vehicle Section Component
// ============================================

interface VehicleSectionProps {
  vehicle: Vehicle | null;
  isConnected: boolean;
  onManagePress: () => void;
}

const VehicleSection: React.FC<VehicleSectionProps> = ({
  vehicle,
  isConnected,
  onManagePress,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vehicle Info</Text>
      <View style={styles.sectionContent}>
        {vehicle ? (
          <>
            <Text style={styles.vehicleName}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            <View style={styles.vehicleDetail}>
              <Text style={styles.vehicleLabel}>License:</Text>
              <Text style={styles.vehicleValue}>{vehicle.licensePlate}</Text>
            </View>
            <View style={styles.vehicleDetail}>
              <Text style={styles.vehicleLabel}>Device:</Text>
              <Text style={styles.vehicleValue}>{vehicle.deviceId}</Text>
            </View>
            <View style={styles.vehicleDetail}>
              <Text style={styles.vehicleLabel}>Status:</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isConnected ? COLORS.success : COLORS.danger },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isConnected ? COLORS.success : COLORS.danger },
                  ]}
                >
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.noVehicleText}>No vehicle configured</Text>
        )}
        <TouchableOpacity style={styles.manageButton} onPress={onManagePress}>
          <Text style={styles.manageButtonText}>
            {vehicle ? 'Manage Vehicle' : 'Add Vehicle'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================
// Settings Section Component
// ============================================

interface SettingsSectionProps {
  settings: SettingsState;
  onToggle: (key: keyof SettingsState) => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  settings,
  onToggle,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings</Text>
      <View style={styles.settingsContainer}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconContainer}>
              <BellIcon size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={() => onToggle('notifications')}
            trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary }}
            thumbColor={COLORS.textPrimary}
          />
        </View>

        <View style={styles.settingDivider} />

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconContainer}>
              <LocationIcon size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Location</Text>
          </View>
          <Switch
            value={settings.location}
            onValueChange={() => onToggle('location')}
            trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary }}
            thumbColor={COLORS.textPrimary}
          />
        </View>

        <View style={styles.settingDivider} />

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconContainer}>
              <MoonIcon size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Dark Mode</Text>
          </View>
          <View style={styles.lockedContainer}>
            <Text style={styles.lockedText}>Locked</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ============================================
// Link Item Component
// ============================================

interface LinkItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

const LinkItem: React.FC<LinkItemProps> = ({ icon, label, onPress, danger }) => {
  return (
    <TouchableOpacity style={styles.linkItem} onPress={onPress}>
      <View style={styles.linkIconContainer}>{icon}</View>
      <Text style={[styles.linkLabel, danger && styles.linkLabelDanger]}>
        {label}
      </Text>
      <View style={styles.linkChevron}>
        <ChevronRightIcon size={20} color={COLORS.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// Main ProfileScreen Component
// ============================================

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();

  // Local state for user (will be replaced with authStore when implemented)
  const [user, setUser] = useState<User | null>({
    id: 'user_123',
    email: 'prahaas@email.com',
    fullName: 'Prahaas Kumar',
    profilePhotoUrl: undefined,
    createdAt: new Date().toISOString(),
  });

  // Local state for vehicle (will be replaced with Supabase when implemented)
  const [vehicle, setVehicle] = useState<Vehicle | null>({
    id: 'vehicle_123',
    userId: 'user_123',
    make: 'Toyota',
    model: 'Prius',
    year: 2024,
    licensePlate: 'ABC1234',
    deviceId: 'rpi_12345abc',
  });

  // Device connection status (will be replaced with Firebase realtime when implemented)
  const [isDeviceConnected, setIsDeviceConnected] = useState(true);

  // Settings state
  const [settings, setSettings] = useState<SettingsState>({
    notifications: true,
    location: true,
    darkMode: true,
  });

  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);

  // TODO: Replace with actual authStore integration when AGENT_1 implements it
  // useEffect(() => {
  //   const unsubscribe = authStore.subscribe((state) => {
  //     setUser(state.user);
  //   });
  //   return unsubscribe;
  // }, []);

  // TODO: Replace with actual Firebase realtime subscription when AGENT_6 implements it
  // useEffect(() => {
  //   if (vehicle?.deviceId) {
  //     const unsubscribe = firebaseRealtimeService.subscribeToDeviceStatus(
  //       vehicle.deviceId,
  //       (status) => setIsDeviceConnected(status.connected)
  //     );
  //     return unsubscribe;
  //   }
  // }, [vehicle?.deviceId]);

  const handleToggleSetting = useCallback((key: keyof SettingsState) => {
    if (key === 'darkMode') {
      Alert.alert(
        'Dark Mode',
        'Dark mode is currently locked. The app is optimized for dark mode to reduce eye strain while driving.'
      );
      return;
    }

    setSettings((prev) => {
      const newValue = !prev[key];

      // TODO: Persist settings with AsyncStorage or Supabase
      // if (key === 'notifications') {
      //   // Request/revoke notification permissions
      // }
      // if (key === 'location') {
      //   // Request/revoke location permissions
      // }

      return { ...prev, [key]: newValue };
    });
  }, []);

  const handleEditProfile = useCallback(
    async (data: { fullName: string; email: string }) => {
      if (!user) return;

      // TODO: Replace with actual Supabase mutation when AGENT_6 implements it
      // await supabaseMutations.updateUserProfile(user.id, data);

      setUser((prev) =>
        prev ? { ...prev, fullName: data.fullName, email: data.email } : null
      );
    },
    [user]
  );

  const handleEditVehicle = useCallback(
    async (data: Partial<Vehicle>) => {
      // TODO: Replace with actual Supabase mutation when AGENT_6 implements it
      // if (vehicle) {
      //   await supabaseMutations.updateVehicle(vehicle.id, data);
      // } else {
      //   await supabaseMutations.createVehicle({ ...data, userId: user?.id });
      // }

      setVehicle((prev) =>
        prev
          ? { ...prev, ...data }
          : {
              id: `vehicle_${Date.now()}`,
              userId: user?.id || '',
              make: data.make || '',
              model: data.model || '',
              year: data.year || new Date().getFullYear(),
              licensePlate: data.licensePlate || '',
              deviceId: data.deviceId || '',
            }
      );
    },
    [user, vehicle]
  );

  const handleHelpPress = useCallback(() => {
    Alert.alert(
      'Help & Support',
      `For assistance, please contact us at:\n\n${APP_CONFIG.SUPPORT_EMAIL}`,
      [{ text: 'OK' }]
    );
  }, []);

  const handlePrivacyPress = useCallback(() => {
    Alert.alert(
      'Data & Privacy',
      'Your driving data is securely stored and only used to provide safety insights. We never share your data with third parties without your consent.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleTermsPress = useCallback(() => {
    Alert.alert(
      'Terms of Service',
      'By using FocusDrive, you agree to our terms of service. Please drive safely and keep your eyes on the road.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // TODO: Replace with actual authStore.signOut() when AGENT_1 implements it
              // await authStore.getState().signOut();

              // Navigate to Welcome screen
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' as never }],
                })
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <ProfileSection
          user={user}
          onEditPress={() => setShowEditProfile(true)}
        />

        {/* Vehicle Section */}
        <VehicleSection
          vehicle={vehicle}
          isConnected={isDeviceConnected}
          onManagePress={() => setShowEditVehicle(true)}
        />

        {/* Settings Section */}
        <SettingsSection settings={settings} onToggle={handleToggleSetting} />

        {/* Links Section */}
        <View style={styles.linksSection}>
          <LinkItem
            icon={<HelpCircleIcon size={20} color={COLORS.info} />}
            label="Help & Support"
            onPress={handleHelpPress}
          />
          <LinkItem
            icon={<ShieldIcon size={20} color={COLORS.info} />}
            label="Data & Privacy"
            onPress={handlePrivacyPress}
          />
          <LinkItem
            icon={<FileTextIcon size={20} color={COLORS.info} />}
            label="Terms of Service"
            onPress={handleTermsPress}
          />
          <LinkItem
            icon={<LogOutIcon size={20} color={COLORS.danger} />}
            label="Sign Out"
            onPress={handleSignOut}
            danger
          />
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>
          {APP_CONFIG.APP_NAME} v{APP_CONFIG.VERSION}
        </Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditProfile}
        user={user}
        onClose={() => setShowEditProfile(false)}
        onSave={handleEditProfile}
      />

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        visible={showEditVehicle}
        vehicle={vehicle}
        onClose={() => setShowEditVehicle(false)}
        onSave={handleEditVehicle}
      />
    </SafeAreaView>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Profile Section
  profileSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profilePhotoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.background,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  editButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Section Styles
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  sectionContent: {},

  // Vehicle Section
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  vehicleDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    width: 80,
  },
  vehicleValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noVehicleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  manageButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Settings Section
  settingsContainer: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryTransparent || COLORS.successTransparent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingLabel: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.textPrimary,
  },
  settingDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 46,
  },
  lockedContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  lockedText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },

  // Links Section
  linksSection: {
    marginTop: SPACING.lg,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  linkIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  linkLabel: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.textPrimary,
    flex: 1,
  },
  linkLabelDanger: {
    color: COLORS.danger,
  },
  linkChevron: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Version Text
  versionText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 24,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 6,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.surfaceLight,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
});

export default ProfileScreen;
