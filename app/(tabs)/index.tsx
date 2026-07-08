import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import api from '@/api/axiosConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Screen = 'login' | 'register' | 'dashboard';

type User = {
  id: number;
  name: string;
  email: string;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  const [screen, setScreen] = useState<Screen>('login');
  const [loading, setLoading] = useState(false);

  // form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // dashboard state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // inline form feedback — Alert.alert does not show on web,
  // so errors must also be rendered in the UI
  const [formError, setFormError] = useState('');
  const [formNotice, setFormNotice] = useState('');

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
  };

  const switchScreen = (target: Screen) => {
    clearForm();
    setFormError('');
    setFormNotice('');
    setScreen(target);
  };

  const showError = (title: string, message: string) => {
    setFormError(message);
    Alert.alert(title, message);
  };

  // SIGN IN
  const handleLogin = async () => {
    setFormError('');
    setFormNotice('');
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      showError('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/login', {
        email: cleanEmail,
        password,
      });
      if (response.data.success) {
        setCurrentUser(response.data.user);
        clearForm();
        setScreen('dashboard');
      }
    } catch (error: any) {
      if (error.response) {
        showError(
          'Login Failed',
          error.response.data.error ?? 'Something went wrong. Please try again.'
        );
      } else {
        // network error — the axios interceptor already alerts on mobile
        setFormError(
          "Can't connect to the server. Make sure the API server is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // SIGN UP
  const handleRegister = async () => {
    setFormError('');
    setFormNotice('');
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password) {
      showError('Missing Fields', 'Please fill in all the fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      showError('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/register', {
        name: cleanName,
        email: cleanEmail,
        password,
      });
      if (response.data.success) {
        Alert.alert('Success', 'Account created! You can now log in.');
        clearForm();
        setFormNotice('Account created! You can now log in.');
        setScreen('login');
      }
    } catch (error: any) {
      if (error.response) {
        showError(
          'Registration Failed',
          error.response.data.error ?? 'Something went wrong. Please try again.'
        );
      } else {
        setFormError(
          "Can't connect to the server. Make sure the API server is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsers([]);
    switchScreen('login');
  };

  // LIVE: refresh the users list every 5 seconds while on the dashboard
  useEffect(() => {
    if (screen !== 'dashboard') return;

    const fetchUsers = async () => {
      try {
        const response = await api.get('/api/users');
        if (response.data.success) {
          setUsers(response.data.users);
        }
      } catch {
        // interceptor na ang bahala sa network errors
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, [screen]);

  // ---------- LOGIN SCREEN ----------
  if (screen === 'login') {
    return (
      <View style={styles.authContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>MySQL Sign In</Text>

          {formNotice ? (
            <Text style={styles.noticeText}>{formNotice}</Text>
          ) : null}
          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, styles.blueButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => switchScreen('register')}>
              <Text style={styles.link}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ---------- REGISTER SCREEN ----------
  if (screen === 'register') {
    return (
      <View style={styles.authContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Gumawa ng Account</Text>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, styles.greenButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>May account ka na? </Text>
            <TouchableOpacity onPress={() => switchScreen('login')}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ---------- DASHBOARD SCREEN ----------
  return (
    <View
      style={[
        styles.dashContainer,
        { paddingTop: insets.top + 10 },
        !isDark && styles.dashContainerLight,
      ]}
    >
      <View style={styles.dashHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.welcomeLabel, !isDark && styles.welcomeLabelLight]}>
            Welcome back,
          </Text>
          <Text style={[styles.welcomeName, !isDark && styles.welcomeNameLight]}>
            ✨ {currentUser?.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsBanner, isDark && styles.statsBannerDark]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.statsLabel}>Total Registered Members</Text>
          <Text style={styles.statsNumber}>{users.length}</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <Text style={[styles.directoryLabel, !isDark && styles.directoryLabelLight]}>
        System Directory
      </Text>

      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colId]}>ID</Text>
          <Text style={[styles.tableHeaderText, styles.colName]}>NAME</Text>
          <Text style={[styles.tableHeaderText, styles.colEmail]}>
            EMAIL ADDRESS
          </Text>
        </View>
        <ScrollView>
          {users.map((user, index) => (
            <View
              key={user.id}
              style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, styles.colId]}>{user.id}</Text>
              <Text style={[styles.tableCell, styles.colName]}>
                {user.name}
              </Text>
              <Text style={[styles.tableCell, styles.colEmail]}>
                {user.email}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // auth (login / register)
  authContainer: {
    flex: 1,
    backgroundColor: '#e9e9ef',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#f4f4f8',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 14,
  },
  errorText: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 14,
  },
  noticeText: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 14,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  blueButton: {
    backgroundColor: '#2563eb',
  },
  greenButton: {
    backgroundColor: '#22a447',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerText: {
    color: '#4b5563',
    fontSize: 14,
  },
  link: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },

  // dashboard
  dashContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
  },
  dashContainerLight: {
    backgroundColor: '#eef2f7',
  },
  dashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeLabel: {
    color: '#cbd5e1',
    fontSize: 16,
  },
  welcomeLabelLight: {
    color: '#475569',
  },
  welcomeName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  welcomeNameLight: {
    color: '#0f172a',
  },
  logoutButton: {
    backgroundColor: '#fecaca',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 14,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statsBannerDark: {
    backgroundColor: '#1e293b',
  },
  statsLabel: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  statsNumber: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    marginTop: 4,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22c55e',
    backgroundColor: '#052e16',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  liveText: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: 12,
  },
  directoryLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 10,
  },
  directoryLabelLight: {
    color: '#475569',
  },
  tableCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  tableRowAlt: {
    backgroundColor: '#fdeaea',
  },
  tableCell: {
    color: '#111827',
    fontSize: 13,
  },
  colId: {
    width: 40,
  },
  colName: {
    width: 90,
  },
  colEmail: {
    flex: 1,
    textAlign: 'right',
  },
});
